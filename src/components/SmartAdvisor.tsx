import { useState } from 'react'
import type { AdvisorPayload, AdvisorStatus } from '../types'

function badgeLabel(status: AdvisorStatus | 'idle') {
  switch (status) {
    case 'optimal':
      return 'Optimal'
    case 'recommend':
      return 'Recommend'
    case 'warning':
      return 'Watch'
    case 'trace':
      return 'Trace'
    case 'info':
      return 'Info'
    default:
      return 'Idle'
  }
}

export default function SmartAdvisor({ advisor }: { advisor: AdvisorPayload }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div
      className="rounded-2xl px-3 py-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(56,189,248,0.08)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.22em]" style={{ color: 'rgba(56,189,248,0.75)' }}>
            SMARTADVISOR
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-100">Copilot recommendations</div>
        </div>
        <div className="smartadvisor-dot" aria-hidden="true" />
      </div>

      <div className="mt-3 text-[11px] leading-5 text-slate-300">{advisor.headline}</div>

      <div className="mt-3 space-y-2">
        {advisor.suggestions.length > 0 ? (
          advisor.suggestions.map((suggestion) => {
            const isOpen = openId === suggestion.id
            return (
              <article key={suggestion.id} className={`smartadvisor-card smartadvisor-${suggestion.status}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`smartadvisor-badge smartadvisor-badge-${suggestion.status}`}>
                    {badgeLabel(suggestion.status)}
                  </span>
                  <button
                    type="button"
                    className="text-[10px] font-mono tracking-[0.16em] text-slate-400 transition-colors hover:text-sky-300"
                    onClick={() => setOpenId(isOpen ? null : suggestion.id)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? 'HIDE' : 'WHY?'}
                  </button>
                </div>
                <div className="mt-3 text-[12px] font-semibold text-slate-100">{suggestion.title}</div>
                <div className="mt-1 text-[11px] leading-5 text-slate-400">{suggestion.summary}</div>
                {isOpen && suggestion.reasons.length > 0 && (
                  <ul className="mt-3 space-y-1 pl-4 text-[10px] leading-5 text-slate-500">
                    {suggestion.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
              </article>
            )
          })
        ) : (
          <div className="smartadvisor-card smartadvisor-info text-[11px] leading-5 text-slate-400">
            No recommendations right now. The advisor is monitoring for route quality changes.
          </div>
        )}
      </div>
    </div>
  )
}
