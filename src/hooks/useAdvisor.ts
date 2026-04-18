import { useMemo } from 'react'
import type { AdvisorPayload, AdvisorSuggestion, BackendHealth, Decision, Region, SystemMetrics } from '../types'

function statePenalty(region: Region) {
  if (region.state === 'red') return 22
  if (region.state === 'yellow') return 10
  return 0
}

function routeScore(region: Region) {
  const cleanCarbon = Math.max(0, 100 - region.carbon / 6.5)
  const renewables = region.renewable * 0.7
  const water = (1 - region.waterStress) * 100 * 0.6
  const load = (100 - region.load) * 0.35
  return Math.round(cleanCarbon + renewables + water + load - statePenalty(region))
}

function sortBestRegions(regions: Region[]) {
  return [...regions].sort((a, b) => {
    const scoreDelta = routeScore(b) - routeScore(a)
    if (scoreDelta !== 0) return scoreDelta
    return a.carbon - b.carbon
  })
}

function makeSuggestion(input: AdvisorSuggestion): AdvisorSuggestion {
  return input
}

interface UseAdvisorArgs {
  regions: Region[]
  selectedRegion: Region | null
  decisions: Decision[]
  metrics: SystemMetrics
  backendHealth: BackendHealth | null
}

export function useAdvisor({
  regions,
  selectedRegion,
  decisions,
  metrics,
  backendHealth,
}: UseAdvisorArgs): AdvisorPayload {
  return useMemo(() => {
    if (!regions.length) {
      return {
        headline: 'No routing intelligence available',
        status: 'idle',
        suggestions: [],
      }
    }

    const ranked = sortBestRegions(regions)
    const best = ranked[0]
    const active = selectedRegion ?? best
    const fallback = ranked.find((region) => region.id !== best.id) ?? null
    const activeScore = routeScore(active)
    const bestScore = routeScore(best)
    const recentDecision = decisions[0] ?? null
    const suggestions: AdvisorSuggestion[] = []
    const scoreDelta = bestScore - activeScore
    const carbonDelta = active.carbon - best.carbon

    if (best.id === active.id && activeScore >= 120) {
      suggestions.push(
        makeSuggestion({
          id: 'already-optimal',
          status: 'optimal',
          title: `${active.code} is already the cleanest route`,
          summary: 'No operator action needed. The current route is the strongest option in the active routing mesh.',
          reasons: [
            `${active.name} is ranked first across carbon, renewable mix, load, and water posture.`,
            `Current route score is ${activeScore}, which is the strongest score in the current region set.`,
          ],
        }),
      )
    }

    if (best.id !== active.id && (scoreDelta >= 8 || carbonDelta >= 25)) {
      suggestions.push(
        makeSuggestion({
          id: 'reroute-best',
          status: 'recommend',
          title: `Prefer ${best.code} over ${active.code}`,
          summary: `${best.name} is currently the cleaner routing target with a stronger overall route score.`,
          reasons: [
            `${best.name} scores ${bestScore} versus ${activeScore} for ${active.name}.`,
            `Carbon intensity improves from ${active.carbon} to ${best.carbon} gCO2/kWh.`,
            `Water stress shifts from ${Math.round(active.waterStress * 100)}% to ${Math.round(best.waterStress * 100)}%.`,
          ],
        }),
      )
    }

    if (active.state === 'red' || active.carbon >= 400 || active.waterStress >= 0.65) {
      suggestions.push(
        makeSuggestion({
          id: 'active-warning',
          status: 'warning',
          title: `${active.code} is in a stressed operating window`,
          summary: 'The current route is showing elevated carbon or water pressure and should be watched closely.',
          reasons: [
            `Current carbon intensity is ${active.carbon} gCO2/kWh with load at ${active.load}%.`,
            `Water stress is ${Math.round(active.waterStress * 100)}%, which raises routing risk.`,
          ],
        }),
      )
    }

    if (fallback) {
      suggestions.push(
        makeSuggestion({
          id: 'fallback-ready',
          status: 'info',
          title: `Fallback route ready: ${fallback.code}`,
          summary: `${fallback.name} is the next-best route if the top option degrades.`,
          reasons: [
            `${fallback.name} is currently ranked immediately behind ${best.name}.`,
            `Fallback route score is ${routeScore(fallback)} with carbon at ${fallback.carbon} gCO2/kWh.`,
          ],
        }),
      )
    }

    if (recentDecision) {
      suggestions.push(
        makeSuggestion({
          id: 'recent-decision',
          status: 'trace',
          title: 'Latest routing decision recorded',
          summary: recentDecision.reason,
          reasons: [
            `Most recent action: ${recentDecision.action}.`,
            `Confidence was ${recentDecision.confidence}% with ${recentDecision.savings} kg savings recorded.`,
          ],
        }),
      )
    }

    if (backendHealth) {
      suggestions.push(
        makeSuggestion({
          id: 'live-health-sim-decisions',
          status: 'info',
          title: 'Backend health is live, routing stream is simulated',
          summary: 'This surface is receiving deployed Render health, but decisions and traces are still generated locally in this runtime.',
          reasons: [
            `${Object.values(backendHealth.providers).filter(Boolean).length}/${Object.keys(backendHealth.providers).length} backend providers are online.`,
            'No deployed decision or trace feed is exposed to this frontend runtime.',
          ],
        }),
      )
    } else {
      suggestions.push(
        makeSuggestion({
          id: 'simulation-mode',
          status: 'info',
          title: 'Advisor is operating in simulation mode',
          summary: 'Recommendations are being generated from the local region state because no deployed backend health response is available.',
          reasons: [`Active regions: ${metrics.activeRegions}. Alerts: ${metrics.alertCount}.`],
        }),
      )
    }

    return {
      headline: suggestions[0]?.title ?? `Monitoring ${active.name} for routing changes`,
      status: suggestions[0]?.status ?? 'info',
      suggestions,
    }
  }, [backendHealth, decisions, metrics.activeRegions, metrics.alertCount, regions, selectedRegion])
}
