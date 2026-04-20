import fs from 'node:fs'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { REGIONS } from './src/lib/simulation'
import {
  buildWaterSignal,
  normalizeOpenMeteoWaterMetrics,
  normalizeTomorrowWaterMetrics,
} from './src/lib/water'

function json(res: any, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function basicAuthHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

function loadAqueductArtifacts(rootDir: string) {
  const manifestPath = path.resolve(rootDir, 'data', 'aqueduct', 'manifest.json')
  const regionsPath = path.resolve(rootDir, 'data', 'aqueduct', 'regions.json')

  if (!fs.existsSync(manifestPath) || !fs.existsSync(regionsPath)) {
    return { manifest: null, regions: [] as Array<{ regionId: string; geography: string; baselineWaterStress: number }> }
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>
    const regions = JSON.parse(fs.readFileSync(regionsPath, 'utf8')) as Array<{
      regionId: string
      geography: string
      baselineWaterStress: number
    }>
    return { manifest, regions }
  } catch {
    return { manifest: null, regions: [] as Array<{ regionId: string; geography: string; baselineWaterStress: number }> }
  }
}

function providerProxyPlugin(env: Record<string, string | undefined>) {
  const tomorrowApiKey = env.TOMORROW_IO_API_KEY
  const emberApiKey = env.EMBER_API_KEY
  const gridStatusApiKey = env.GRIDSTATUS_API_KEY
  const wattTimeUsername = env.WATTTIME_USERNAME
  const wattTimePassword = env.WATTTIME_PASSWORD
  const aqueductArtifacts = loadAqueductArtifacts(process.cwd())
  const aqueductByRegion = new Map(aqueductArtifacts.regions.map((region) => [region.regionId, region]))
  const regionsById = new Map(REGIONS.map((region) => [region.id, region]))
  let wattTimeToken: string | null = null
  let wattTimeTokenExpiresAt = 0

  const providerConfig = {
    tomorrow: Boolean(tomorrowApiKey),
    ember: Boolean(emberApiKey),
    gridstatus: Boolean(gridStatusApiKey),
    watttime: Boolean(wattTimeUsername && wattTimePassword),
    openMeteo: true,
    aqueduct: Boolean(aqueductArtifacts.manifest && aqueductArtifacts.regions.length > 0),
  }

  async function getWattTimeToken() {
    if (wattTimeToken && Date.now() < wattTimeTokenExpiresAt) {
      return wattTimeToken
    }

    if (!wattTimeUsername || !wattTimePassword) {
      throw new Error('WATTTIME_USERNAME and WATTTIME_PASSWORD are not configured on the server')
    }

    const response = await fetch('https://api2.watttime.org/v2/login', {
      headers: {
        Authorization: basicAuthHeader(wattTimeUsername, wattTimePassword),
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`WattTime login failed with ${response.status}`)
    }

    const payload = (await response.json()) as { token?: string }
    if (!payload.token) {
      throw new Error('WattTime login did not return a token')
    }

    wattTimeToken = payload.token
    wattTimeTokenExpiresAt = Date.now() + 29 * 60 * 1000
    return wattTimeToken
  }

  function selectRegions(requestUrl: URL) {
    const regionIds = requestUrl.searchParams.get('regionIds')
    if (!regionIds) {
      return REGIONS
    }

    return regionIds
      .split(',')
      .map((regionId) => regionsById.get(regionId.trim()))
      .filter((region): region is (typeof REGIONS)[number] => Boolean(region))
  }

  async function sendUpstream(res: any, upstream: URL, headers: Record<string, string> = {}) {
    try {
      const response = await fetch(upstream.toString(), {
        headers: { Accept: 'application/json', ...headers },
      })
      const text = await response.text()
      res.statusCode = response.status
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json; charset=utf-8')
      res.end(text)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Provider proxy failed'
      json(res, 502, { error: message })
    }
  }

  async function fetchOpenMeteoMetrics(region: (typeof REGIONS)[number]) {
    const upstream = new URL('https://api.open-meteo.com/v1/forecast')
    upstream.searchParams.set('latitude', String(region.lat))
    upstream.searchParams.set('longitude', String(region.lng))
    upstream.searchParams.set(
      'hourly',
      [
        'precipitation',
        'precipitation_probability',
        'rain',
        'soil_moisture_0_to_1cm',
        'soil_moisture_9_to_27cm',
        'soil_moisture_27_to_81cm',
        'evapotranspiration',
        'et0_fao_evapotranspiration',
        'shortwave_radiation',
        'relative_humidity_2m',
      ].join(','),
    )
    upstream.searchParams.set('current', ['relative_humidity_2m', 'rain'].join(','))
    upstream.searchParams.set('forecast_hours', '1')
    upstream.searchParams.set('timezone', 'auto')

    const response = await fetch(upstream.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with ${response.status}`)
    }

    return normalizeOpenMeteoWaterMetrics((await response.json()) as Record<string, unknown>)
  }

  async function fetchTomorrowMetrics(region: (typeof REGIONS)[number]) {
    if (!tomorrowApiKey) {
      throw new Error('TOMORROW_IO_API_KEY is not configured on the server')
    }

    const upstream = new URL('https://api.tomorrow.io/v4/weather/realtime')
    upstream.searchParams.set('location', `${region.lat},${region.lng}`)
    upstream.searchParams.set('units', 'metric')
    upstream.searchParams.set('apikey', tomorrowApiKey)

    const response = await fetch(upstream.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Tomorrow.io request failed with ${response.status}`)
    }

    return normalizeTomorrowWaterMetrics((await response.json()) as Record<string, unknown>)
  }

  async function handleWaterSignals(res: any, requestUrl: URL) {
    const selectedRegions = selectRegions(requestUrl)
    const now = Date.now()

    const signals = await Promise.all(
      selectedRegions.map(async (region) => {
        const baseline = aqueductByRegion.get(region.id)?.baselineWaterStress ?? null
        let liveMetrics = null
        let source: 'open-meteo' | 'tomorrow.io' | 'aqueduct' | 'composite' | 'fallback' = baseline !== null ? 'aqueduct' : 'fallback'

        try {
          liveMetrics = await fetchOpenMeteoMetrics(region)
          source = baseline !== null ? 'composite' : 'open-meteo'
        } catch {
          if (tomorrowApiKey) {
            try {
              liveMetrics = await fetchTomorrowMetrics(region)
              source = baseline !== null ? 'composite' : 'tomorrow.io'
            } catch {
              liveMetrics = null
            }
          }
        }

        return buildWaterSignal({
          regionId: region.id,
          baselineWaterStress: baseline,
          liveMetrics,
          source,
          now,
        })
      }),
    )

    return json(res, 200, {
      manifest: aqueductArtifacts.manifest,
      signals,
    })
  }

  function middleware() {
    return async (req: any, res: any, next: () => void) => {
      const url = req.url ?? ''

      if (url === '/api/providers/config') {
        return json(res, 200, providerConfig)
      }

      if (url === '/api/tomorrow/config') {
        return json(res, 200, { configured: providerConfig.tomorrow })
      }

      if (!url.startsWith('/api/')) {
        return next()
      }

      if (req.method !== 'GET') {
        return json(res, 405, { error: 'Method not allowed' })
      }

      const requestUrl = new URL(url, 'http://localhost')

      if (requestUrl.pathname === '/api/water/baseline') {
        const baselines = selectRegions(requestUrl).map((region) => {
          const baseline = aqueductByRegion.get(region.id) ?? null
          return {
            regionId: region.id,
            geography: baseline?.geography ?? region.name,
            baselineWaterStress: baseline?.baselineWaterStress ?? null,
          }
        })

        return json(res, 200, {
          manifest: aqueductArtifacts.manifest,
          baselines,
        })
      }

      if (requestUrl.pathname === '/api/water/signals') {
        return handleWaterSignals(res, requestUrl)
      }

      if (requestUrl.pathname.startsWith('/api/open-meteo/')) {
        const upstreamPath = requestUrl.pathname.replace(/^\/api\/open-meteo\//, '')
        const upstream = new URL(`https://api.open-meteo.com/v1/${upstreamPath}`)
        requestUrl.searchParams.forEach((value, key) => {
          upstream.searchParams.set(key, value)
        })
        return sendUpstream(res, upstream)
      }

      if (requestUrl.pathname.startsWith('/api/tomorrow/')) {
        if (!tomorrowApiKey) {
          return json(res, 503, { error: 'TOMORROW_IO_API_KEY is not configured on the server' })
        }
        const upstreamPath = requestUrl.pathname.replace(/^\/api\/tomorrow\//, '')
        const upstream = new URL(`https://api.tomorrow.io/v4/${upstreamPath}`)
        requestUrl.searchParams.forEach((value, key) => {
          upstream.searchParams.set(key, value)
        })
        upstream.searchParams.set('apikey', tomorrowApiKey)
        return sendUpstream(res, upstream)
      }

      if (requestUrl.pathname.startsWith('/api/ember/')) {
        if (!emberApiKey) {
          return json(res, 503, { error: 'EMBER_API_KEY is not configured on the server' })
        }
        const upstreamPath = requestUrl.pathname.replace(/^\/api\/ember\//, '')
        const upstream = new URL(`https://api.ember-energy.org/v1/${upstreamPath}`)
        requestUrl.searchParams.forEach((value, key) => {
          upstream.searchParams.set(key, value)
        })
        upstream.searchParams.set('api_key', emberApiKey)
        return sendUpstream(res, upstream)
      }

      if (requestUrl.pathname.startsWith('/api/gridstatus/')) {
        if (!gridStatusApiKey) {
          return json(res, 503, { error: 'GRIDSTATUS_API_KEY is not configured on the server' })
        }
        const upstreamPath = requestUrl.pathname.replace(/^\/api\/gridstatus\//, '')
        const upstream = new URL(`https://api.gridstatus.io/v1/${upstreamPath}`)
        requestUrl.searchParams.forEach((value, key) => {
          upstream.searchParams.set(key, value)
        })
        return sendUpstream(res, upstream, { 'x-api-key': gridStatusApiKey })
      }

      if (requestUrl.pathname.startsWith('/api/watttime/')) {
        const upstreamPath = requestUrl.pathname.replace(/^\/api\/watttime\//, '')
        const upstream = new URL(`https://api2.watttime.org/v2/${upstreamPath}`)
        requestUrl.searchParams.forEach((value, key) => {
          upstream.searchParams.set(key, value)
        })
        try {
          const token = await getWattTimeToken()
          return sendUpstream(res, upstream, { Authorization: `Bearer ${token}` })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'WattTime proxy failed'
          return json(res, 503, { error: message })
        }
      }

      return next()
    }
  }

  return {
    name: 'provider-proxy',
    configureServer(server: any) {
      server.middlewares.use(middleware())
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(middleware())
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/',
    plugins: [react(), providerProxyPlugin(env)],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: { port: 5173 },
  }
})
