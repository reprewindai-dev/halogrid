import type { Region, Decision, RouterAction, SystemMetrics, TraceFrame } from '../types'
import { randomBetween, randomInt, uuid, hashLike, clamp } from './utils'

export const REGIONS: Region[] = [
  { id:'us-east-1',   name:'US East (N. Virginia)',   code:'IAD', lat:38.9,  lng:-77.0,  carbon:320, renewable:42, load:67, waterStress:0.3, state:'yellow', lastDecision:'PASS',        trend:'flat', provider:'AWS'   },
  { id:'us-west-2',   name:'US West (Oregon)',        code:'PDX', lat:45.5,  lng:-122.6, carbon:85,  renewable:91, load:44, waterStress:0.2, state:'green',  lastDecision:'SHIFT_REGION', trend:'down', provider:'AWS'   },
  { id:'eu-west-1',   name:'Europe (Ireland)',        code:'DUB', lat:53.3,  lng:-6.3,   carbon:185, renewable:72, load:55, waterStress:0.1, state:'green',  lastDecision:'PASS',         trend:'down', provider:'AWS'   },
  { id:'eu-central-1',name:'Europe (Frankfurt)',      code:'FRA', lat:50.1,  lng:8.7,    carbon:290, renewable:55, load:71, waterStress:0.4, state:'yellow', lastDecision:'DEFER_JOB',    trend:'up',   provider:'AWS'   },
  { id:'ap-southeast-1',name:'Asia Pacific (Singapore)',code:'SIN',lat:1.35, lng:103.8,  carbon:480, renewable:12, load:82, waterStress:0.7, state:'red',    lastDecision:'HOLD',         trend:'up',   provider:'AWS'   },
  { id:'ap-northeast-1',name:'Asia Pacific (Tokyo)',  code:'NRT', lat:35.7,  lng:139.7,  carbon:390, renewable:28, load:75, waterStress:0.5, state:'red',    lastDecision:'THROTTLE',     trend:'up',   provider:'AWS'   },
  { id:'ca-central-1',name:'Canada (Central)',        code:'YUL', lat:45.5,  lng:-73.6,  carbon:28,  renewable:97, load:38, waterStress:0.1, state:'green',  lastDecision:'SHIFT_REGION', trend:'down', provider:'AWS'   },
  { id:'sa-east-1',   name:'South America (São Paulo)',code:'GRU',lat:-23.5, lng:-46.6,  carbon:62,  renewable:88, load:49, waterStress:0.6, state:'green',  lastDecision:'PASS',         trend:'flat', provider:'AWS'   },
  { id:'af-south-1',  name:'Africa (Cape Town)',      code:'CPT', lat:-33.9, lng:18.4,   carbon:610, renewable:8,  load:88, waterStress:0.8, state:'red',    lastDecision:'HOLD',         trend:'up',   provider:'AWS'   },
  { id:'me-south-1',  name:'Middle East (Bahrain)',   code:'BAH', lat:26.2,  lng:50.6,   carbon:520, renewable:6,  load:79, waterStress:0.9, state:'red',    lastDecision:'THROTTLE',     trend:'up',   provider:'AWS'   },
]

export const SIGNAL_PROVIDERS = [
  { name:'Electricity Maps', type:'carbon', status:'healthy', mode:'live',    authority:'Grid operator feed', freshness:42  },
  { name:'WattTime',         type:'carbon', status:'healthy', mode:'live',    authority:'Marginal emissions',  freshness:18  },
  { name:'Tomorrow.io',      type:'carbon', status:'degraded',mode:'cached',  authority:'Weather forecast',    freshness:310 },
  { name:'Water.org API',    type:'water',  status:'healthy', mode:'live',    authority:'Basin stress index',  freshness:91  },
  { name:'USGS StreamStats', type:'water',  status:'offline', mode:'offline', authority:'US watershed data',   freshness:999 },
]

const REASONS: string[] = [
  'Carbon intensity 2.4× above threshold — routing to low-carbon region',
  'Renewable availability >90% detected — opportunistic shift',
  'Marginal emissions rate elevated — deferring non-urgent batch job',
  'Water stress index critical — throttling GPU cluster',
  'Carbon signal stale >5min — holding decision pending refresh',
  'Load spike + high carbon — emergency throttle applied',
  'Grid green window opened — scheduling deferred jobs now',
  'Cross-region latency acceptable — shifting to ca-central-1',
  'Peak demand forecast — pre-emptive defer to off-peak slot',
  'Proof-of-carbon generated — decision logged to trace ledger',
]

const ACTIONS: RouterAction[] = ['SHIFT_REGION','DEFER_JOB','THROTTLE','HOLD','PASS','PASS','PASS']

export const tickRegions = (regions: Region[]): Region[] =>
  regions.map(r => {
    const dCarbon = randomBetween(-18, 18)
    const carbon  = clamp(r.carbon + dCarbon, 18, 640)
    const load    = clamp(r.load + randomBetween(-4, 4), 12, 98)
    const state   = carbon < 200 ? 'green' : carbon < 400 ? 'yellow' : 'red'
    const action: RouterAction = state === 'green' ? (Math.random() > 0.7 ? 'SHIFT_REGION' : 'PASS')
                               : state === 'yellow' ? (Math.random() > 0.5 ? 'DEFER_JOB' : 'THROTTLE')
                               : (Math.random() > 0.5 ? 'HOLD' : 'THROTTLE')
    return { ...r, carbon: Math.round(carbon), load: Math.round(load), state, lastDecision: action,
             trend: dCarbon > 2 ? 'up' : dCarbon < -2 ? 'down' : 'flat' }
  })

export const makeDecision = (region: Region): Decision => ({
  id:         uuid(),
  regionId:   region.id,
  regionName: region.name,
  action:     region.lastDecision,
  reason:     REASONS[randomInt(0, REASONS.length - 1)],
  carbon:     region.carbon,
  savings:    Math.round(randomBetween(0.4, 18.2) * 10) / 10,
  timestamp:  Date.now(),
  confidence: Math.round(randomBetween(72, 99)),
  proofHash:  hashLike(),
})

export const makeTrace = (d: Decision): TraceFrame => ({
  id:         uuid(),
  regionName: d.regionName,
  action:     d.action,
  proofHash:  d.proofHash,
  timestamp:  d.timestamp,
})

export const calcMetrics = (regions: Region[], decisions: Decision[]): SystemMetrics => ({
  totalSavings:   Math.round(decisions.reduce((s,d) => s + d.savings, 0) * 10) / 10,
  decisionsToday: decisions.length,
  avgCarbon:       Math.round(regions.reduce((s,r) => s + r.carbon, 0) / regions.length),
  uptimePct:       99.94,
  activeRegions:  regions.filter(r => r.state !== 'red').length,
  alertCount:     regions.filter(r => r.state === 'red').length,
})

export { ACTIONS }
