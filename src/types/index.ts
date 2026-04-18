export type Tier = 'freeview' | 'core' | 'elite'
export type ViewMode = 'control' | 'blog'

export type RegionState = 'green' | 'yellow' | 'red'

export type RouterAction =
  | 'SHIFT_REGION'
  | 'DEFER_JOB'
  | 'THROTTLE'
  | 'HOLD'
  | 'PASS'

export interface Region {
  id:           string
  name:         string
  code:         string
  lat:          number
  lng:          number
  carbon:       number   // gCO2/kWh
  renewable:    number   // % 0-100
  load:         number   // % 0-100
  waterStress:  number   // 0-1
  state:        RegionState
  lastDecision: RouterAction
  trend:        'up' | 'down' | 'flat'
  provider:     string
}

export interface Decision {
  id:         string
  regionId:   string
  regionName: string
  action:     RouterAction
  reason:     string
  carbon:     number
  savings:    number
  timestamp:  number
  confidence: number
  proofHash:  string
}

export interface TraceFrame {
  id:         string
  regionName: string
  action:     RouterAction
  proofHash:  string
  timestamp:  number
}

export interface SystemMetrics {
  totalSavings:   number
  decisionsToday: number
  avgCarbon:       number
  uptimePct:       number
  activeRegions:  number
  alertCount:     number
}

export interface BackendBuildInfo {
  revision: string
  branch: string
  serviceId: string
  serviceName: string
  instanceId: string
  runtimeRoot: string
  nestedDuplicatePathDetected: boolean
}

export interface BackendWaterArtifactChecks {
  bundlePresent: boolean
  manifestPresent: boolean
  schemaCompatible: boolean
  regionCount: number
  sourceCount: number
  datasetHashesPresent: boolean
}

export interface BackendChecks {
  database: boolean
  redis: boolean
  waterArtifacts?: BackendWaterArtifactChecks
}

export interface BackendDependencies {
  database: boolean
  redis: boolean
}

export interface BackendHealth {
  status: string
  engine: string
  router: boolean
  fingrid: boolean
  providers: Record<string, boolean>
  providerModes?: Record<string, string>
  build: BackendBuildInfo
  timestamp: string
  checks: BackendChecks
  dependencies: BackendDependencies
  waterArtifactErrors: string[]
}

export type WaterSignalSource =
  | 'open-meteo'
  | 'tomorrow.io'
  | 'aqueduct'
  | 'composite'
  | 'fallback'

export interface WaterSignal {
  regionId: string
  waterStress: number
  soilMoistureSurface: number | null
  soilMoistureRoot: number | null
  precipitationRate: number | null
  precipitationProbability: number | null
  evapotranspiration: number | null
  solarRadiation: number | null
  humidity: number | null
  source: WaterSignalSource
  freshnessSeconds: number
}

export interface AqueductArtifactManifest {
  version: string
  dataset: string
  updatedAt: string
  source: string
  regionCount: number
}

export type AdvisorStatus = 'optimal' | 'recommend' | 'warning' | 'trace' | 'info'

export interface AdvisorSuggestion {
  id: string
  status: AdvisorStatus
  title: string
  summary: string
  reasons: string[]
}

export interface AdvisorPayload {
  headline: string
  status: AdvisorStatus | 'idle'
  suggestions: AdvisorSuggestion[]
}

export type BlogAssetKind = 'image' | 'video' | 'audio' | 'pdf'

export interface BlogAsset {
  kind: BlogAssetKind
  src: string
  poster?: string
  label: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  category: string
  tags: string[]
  hero: BlogAsset
  gallery?: BlogAsset[]
  paragraphs: string[]
}
