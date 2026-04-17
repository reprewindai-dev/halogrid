export type Tier = 'freeview' | 'core' | 'elite'

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
