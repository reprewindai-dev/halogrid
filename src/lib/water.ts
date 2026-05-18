import type { Region, WaterSignal, WaterSignalSource } from '../types'
import { clamp } from './utils'

interface OpenMeteoForecastResponse {
  current?: {
    time?: string
    relative_humidity_2m?: number
    rain?: number
  }
  hourly?: {
    time?: string[]
    precipitation?: number[]
    precipitation_probability?: number[]
    rain?: number[]
    soil_moisture_0_to_1cm?: number[]
    soil_moisture_9_to_27cm?: number[]
    soil_moisture_27_to_81cm?: number[]
    evapotranspiration?: number[]
    et0_fao_evapotranspiration?: number[]
    shortwave_radiation?: number[]
    relative_humidity_2m?: number[]
  }
}

interface TomorrowRealtimeResponse {
  data?: {
    time?: string
    values?: Record<string, number | null | undefined>
  }
}

export interface LiveWaterMetrics {
  soilMoistureSurface: number | null
  soilMoistureRoot: number | null
  precipitationRate: number | null
  precipitationProbability: number | null
  evapotranspiration: number | null
  solarRadiation: number | null
  humidity: number | null
  observedAt: string | null
}

export interface AqueductBaselineRecord {
  regionId: string
  geography: string
  baselineWaterStress: number
}

function first(values?: number[]) {
  return Array.isArray(values) && values.length > 0 ? values[0] : null
}

function normalizeSoilMoisture(value: number | null) {
  if (value === null) return null
  return clamp(value, 0, 1)
}

function normalizeHumidity(value: number | null) {
  if (value === null) return null
  return clamp(value, 0, 100)
}

function normalizeProbability(value: number | null) {
  if (value === null) return null
  return clamp(value, 0, 100)
}

function normalizeRate(value: number | null) {
  if (value === null) return null
  return Math.max(0, value)
}

export function normalizeOpenMeteoWaterMetrics(payload: OpenMeteoForecastResponse): LiveWaterMetrics {
  const hourly = payload.hourly
  return {
    soilMoistureSurface: normalizeSoilMoisture(first(hourly?.soil_moisture_0_to_1cm)),
    soilMoistureRoot: normalizeSoilMoisture(
      averageDefined([first(hourly?.soil_moisture_9_to_27cm), first(hourly?.soil_moisture_27_to_81cm)]),
    ),
    precipitationRate: normalizeRate(first(hourly?.precipitation) ?? payload.current?.rain ?? null),
    precipitationProbability: normalizeProbability(first(hourly?.precipitation_probability)),
    evapotranspiration: normalizeRate(first(hourly?.et0_fao_evapotranspiration) ?? first(hourly?.evapotranspiration)),
    solarRadiation: normalizeRate(first(hourly?.shortwave_radiation)),
    humidity: normalizeHumidity(first(hourly?.relative_humidity_2m) ?? payload.current?.relative_humidity_2m ?? null),
    observedAt: payload.current?.time ?? hourly?.time?.[0] ?? null,
  }
}

export function normalizeTomorrowWaterMetrics(payload: TomorrowRealtimeResponse): LiveWaterMetrics {
  const values = payload.data?.values ?? {}
  return {
    soilMoistureSurface: normalizeSoilMoisture(numberOrNull(values.soilMoistureVolumetric0To10)),
    soilMoistureRoot: normalizeSoilMoisture(
      averageDefined([
        numberOrNull(values.soilMoistureVolumetric10To40),
        numberOrNull(values.soilMoistureVolumetric40To100),
      ]),
    ),
    precipitationRate: normalizeRate(numberOrNull(values.rainIntensity) ?? numberOrNull(values.precipitationIntensity)),
    precipitationProbability: normalizeProbability(numberOrNull(values.precipitationProbability)),
    evapotranspiration: normalizeRate(numberOrNull(values.evapotranspiration)),
    solarRadiation: normalizeRate(numberOrNull(values.solarGHI)),
    humidity: normalizeHumidity(numberOrNull(values.humidity)),
    observedAt: payload.data?.time ?? null,
  }
}

function averageDefined(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => value !== null)
  if (filtered.length === 0) return null
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length
}

function numberOrNull(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function soilWetnessFactor(value: number | null) {
  if (value === null) return null
  return clamp(value / 0.45, 0, 1)
}

function precipitationRelief(rate: number | null, probability: number | null) {
  const rateScore = rate === null ? null : clamp(rate / 5, 0, 1)
  const probabilityScore = probability === null ? null : clamp(probability / 100, 0, 1)
  return averageDefined([rateScore, probabilityScore])
}

function evapStress(evapotranspiration: number | null) {
  if (evapotranspiration === null) return null
  return clamp(evapotranspiration / 0.5, 0, 1)
}

function solarStress(solarRadiation: number | null) {
  if (solarRadiation === null) return null
  return clamp(solarRadiation / 900, 0, 1)
}

function drynessStress(humidity: number | null) {
  if (humidity === null) return null
  return clamp(1 - humidity / 100, 0, 1)
}

export function computeDynamicWaterStress(metrics: LiveWaterMetrics) {
  const dryness = averageDefined([
    invertDefined(soilWetnessFactor(metrics.soilMoistureSurface)),
    invertDefined(soilWetnessFactor(metrics.soilMoistureRoot)),
    drynessStress(metrics.humidity),
  ])
  const relief = precipitationRelief(metrics.precipitationRate, metrics.precipitationProbability)
  const stress = averageDefined([dryness, evapStress(metrics.evapotranspiration), solarStress(metrics.solarRadiation)])
  if (stress === null && relief === null) return null
  return clamp((stress ?? 0.5) * 0.8 - (relief ?? 0) * 0.25 + 0.1, 0, 1)
}

function invertDefined(value: number | null) {
  if (value === null) return null
  return clamp(1 - value, 0, 1)
}

export function buildWaterSignal(args: {
  regionId: string
  baselineWaterStress: number | null
  liveMetrics: LiveWaterMetrics | null
  source: WaterSignalSource
  now: number
}): WaterSignal {
  const dynamicStress = args.liveMetrics ? computeDynamicWaterStress(args.liveMetrics) : null
  const liveFreshness = args.liveMetrics?.observedAt ? computeFreshnessSeconds(args.liveMetrics.observedAt, args.now) : null
  const waterStress =
    args.baselineWaterStress !== null && dynamicStress !== null
      ? clamp(args.baselineWaterStress * 0.65 + dynamicStress * 0.35, 0, 1)
      : args.baselineWaterStress ?? dynamicStress ?? 0.5

  return {
    regionId: args.regionId,
    waterStress,
    soilMoistureSurface: args.liveMetrics?.soilMoistureSurface ?? null,
    soilMoistureRoot: args.liveMetrics?.soilMoistureRoot ?? null,
    precipitationRate: args.liveMetrics?.precipitationRate ?? null,
    precipitationProbability: args.liveMetrics?.precipitationProbability ?? null,
    evapotranspiration: args.liveMetrics?.evapotranspiration ?? null,
    solarRadiation: args.liveMetrics?.solarRadiation ?? null,
    humidity: args.liveMetrics?.humidity ?? null,
    source: args.source,
    freshnessSeconds: liveFreshness ?? (args.baselineWaterStress !== null ? 0 : 999),
  }
}

function computeFreshnessSeconds(observedAt: string, now: number) {
  const timestamp = Date.parse(observedAt)
  if (!Number.isFinite(timestamp)) return 0
  return Math.max(0, Math.round((now - timestamp) / 1000))
}

export function mergeRegionsWithWaterSignals(regions: Region[], signals: Record<string, WaterSignal>) {
  return regions.map((region) => {
    const signal = signals[region.id]
    if (!signal) return region
    return { ...region, waterStress: signal.waterStress }
  })
}
