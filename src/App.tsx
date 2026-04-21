import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  AlertCircle,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import type { CreateEcobeMvpPolicyInput, EcobeMvpPolicy, EcobeMvpProofRecord } from './types'
import { createPolicy, ECOBE_MVP_BASE_URL, fetchPolicies, fetchProofRecords, getEcobeMvpBaseUrl } from './lib/ecobeMvpApi'
import './styles/globals.css'

type PageKey = 'dashboard' | 'policies' | 'logs'

const PROOF_POLL_INTERVAL_MS = 12_000
const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const initialPolicyForm = {
  name: '',
  threshold: '',
  delaySeconds: '',
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return TIMESTAMP_FORMATTER.format(date)
}

function formatValue(value: string | number | null): string {
  if (value === null || value === undefined) return 'not available'
  if (typeof value === 'number') return Number.isInteger(value) ? `${value}` : value.toFixed(2)
  return value
}

function pageLabel(page: PageKey): string {
  switch (page) {
    case 'dashboard':
      return 'Dashboard'
    case 'policies':
      return 'Policies'
    case 'logs':
      return 'Logs'
  }
}

function sortByTimestampDesc<T extends { timestamp: string | null }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    const leftValue = left.timestamp ? Date.parse(left.timestamp) : 0
    const rightValue = right.timestamp ? Date.parse(right.timestamp) : 0
    return rightValue - leftValue
  })
}

function sortPolicies(rows: EcobeMvpPolicy[]): EcobeMvpPolicy[] {
  return [...rows].sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1
    }

    const leftValue = left.created_at ? Date.parse(left.created_at) : 0
    const rightValue = right.created_at ? Date.parse(right.created_at) : 0
    return rightValue - leftValue
  })
}

function Banner({
  title,
  message,
  tone = 'neutral',
}: {
  title: string
  message: string
  tone?: 'neutral' | 'warning' | 'danger'
}) {
  const styles: Record<typeof tone, string> = {
    neutral: 'border-white/10 bg-white/[0.03] text-slate-200',
    warning: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
    danger: 'border-red-400/20 bg-red-400/8 text-red-100',
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[tone]}`}>
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-slate-300">{message}</div>
    </div>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-slate-400">{message}</div>
    </div>
  )
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-sm leading-relaxed text-slate-400">{note}</div>
    </div>
  )
}

function SectionHeader({
  title,
  eyebrow,
  description,
  action,
}: {
  title: string
  eyebrow: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/8 pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-sky-300/70">{eyebrow}</div>
        <h2 className="mt-2 text-xl font-semibold text-slate-50">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

function LoadingLine({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
      <Loader2 size={12} className="animate-spin" />
      <span>{label}</span>
    </div>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const [proofRecords, setProofRecords] = useState<EcobeMvpProofRecord[]>([])
  const [proofLoading, setProofLoading] = useState(true)
  const [proofRefreshing, setProofRefreshing] = useState(false)
  const [proofError, setProofError] = useState<string | null>(null)
  const [policies, setPolicies] = useState<EcobeMvpPolicy[]>([])
  const [policiesLoading, setPoliciesLoading] = useState(true)
  const [policiesRefreshing, setPoliciesRefreshing] = useState(false)
  const [policiesError, setPoliciesError] = useState<string | null>(null)
  const [policyForm, setPolicyForm] = useState(initialPolicyForm)
  const [policyFormError, setPolicyFormError] = useState<string | null>(null)
  const [policySubmitting, setPolicySubmitting] = useState(false)
  const [clock, setClock] = useState(() => Date.now())
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  const backendBaseUrl = ECOBE_MVP_BASE_URL

  const recentDecisions = useMemo(() => sortByTimestampDesc(proofRecords).slice(0, 8), [proofRecords])
  const sortedPolicies = useMemo(() => sortPolicies(policies), [policies])

  useEffect(() => {
    let mounted = true

    const loadProofRecords = async (background = false) => {
      if (background) {
        setProofRefreshing(true)
      } else {
        setProofLoading(true)
      }
      setProofError(null)

      try {
        const records = await fetchProofRecords()
        if (!mounted) return
        setProofRecords(records)
        setLastSyncedAt(new Date().toISOString())
      } catch (error) {
        if (!mounted) return
        setProofError(error instanceof Error ? error.message : 'Failed to load proof records')
      } finally {
        if (!mounted) return
        setProofLoading(false)
        setProofRefreshing(false)
      }
    }

    const loadPolicies = async (background = false) => {
      if (background) {
        setPoliciesRefreshing(true)
      } else {
        setPoliciesLoading(true)
      }
      setPoliciesError(null)

      try {
        const items = await fetchPolicies()
        if (!mounted) return
        setPolicies(items)
      } catch (error) {
        if (!mounted) return
        setPoliciesError(error instanceof Error ? error.message : 'Failed to load policies')
      } finally {
        if (!mounted) return
        setPoliciesLoading(false)
        setPoliciesRefreshing(false)
      }
    }

    void loadProofRecords()
    void loadPolicies()

    const proofTimer = window.setInterval(() => {
      void loadProofRecords(true)
    }, PROOF_POLL_INTERVAL_MS)

    const clockTimer = window.setInterval(() => {
      setClock(Date.now())
    }, 1_000)

    return () => {
      mounted = false
      window.clearInterval(proofTimer)
      window.clearInterval(clockTimer)
    }
  }, [])

  const refreshProofRecords = () => {
    setProofRefreshing(true)
    setProofError(null)
    void fetchProofRecords()
      .then((records) => {
        setProofRecords(records)
        setLastSyncedAt(new Date().toISOString())
      })
      .catch((error) => {
        setProofError(error instanceof Error ? error.message : 'Failed to load proof records')
      })
      .finally(() => {
        setProofLoading(false)
        setProofRefreshing(false)
      })
  }

  const refreshPolicies = () => {
    setPoliciesRefreshing(true)
    setPoliciesError(null)
    void fetchPolicies()
      .then((items) => {
        setPolicies(items)
      })
      .catch((error) => {
        setPoliciesError(error instanceof Error ? error.message : 'Failed to load policies')
      })
      .finally(() => {
        setPoliciesLoading(false)
        setPoliciesRefreshing(false)
      })
  }

  const submitPolicy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPolicyFormError(null)

    const name = policyForm.name.trim()
    const threshold = Number(policyForm.threshold)
    const delaySeconds = Number(policyForm.delaySeconds)

    if (!name) {
      setPolicyFormError('Policy name is required.')
      return
    }

    if (!Number.isFinite(threshold) || threshold < 0) {
      setPolicyFormError('Threshold must be a non-negative number.')
      return
    }

    if (!Number.isInteger(delaySeconds) || delaySeconds < 0) {
      setPolicyFormError('Delay seconds must be a non-negative whole number.')
      return
    }

    setPolicySubmitting(true)
    try {
      const input: CreateEcobeMvpPolicyInput = {
        name,
        threshold,
        delay_seconds: delaySeconds,
      }
      await createPolicy(input)
      setPolicyForm(initialPolicyForm)
      refreshPolicies()
    } catch (error) {
      setPolicyFormError(error instanceof Error ? error.message : 'Failed to create policy')
    } finally {
      setPolicySubmitting(false)
    }
  }

  const currentTime = new Date(clock)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-200">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-sky-300/70">HaloGrid</div>
              <div className="mt-1 text-lg font-semibold text-slate-50">CO2 Router control plane</div>
              <div className="text-sm text-slate-400">
                View layer only. HaloGrid talks to ecobe-mvp and does not call the engine directly.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{getEcobeMvpBaseUrl()}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">API base {backendBaseUrl}</span>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-100">Control plane active</span>
            <button
              type="button"
              onClick={refreshProofRecords}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-slate-200 transition-colors hover:bg-white/[0.06]"
            >
              {proofRefreshing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
              Refresh logs
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-2">
          {(['dashboard', 'policies', 'logs'] as const).map((page) => {
            const active = activePage === page
            const icon =
              page === 'dashboard' ? <LayoutDashboard size={14} /> : page === 'policies' ? <SlidersHorizontal size={14} /> : <FileText size={14} />

            return (
              <button
                key={page}
                type="button"
                onClick={() => setActivePage(page)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm transition-colors ${
                  active
                    ? 'bg-slate-100 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                {icon}
                {pageLabel(page)}
              </button>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Proof records"
            value={proofLoading ? 'Loading' : `${proofRecords.length}`}
            note="Recent decision and proof history from ecobe-mvp."
          />
          <StatCard
            label="Policies"
            value={policiesLoading ? 'Loading' : `${policies.length}`}
            note="Active or latest policy definitions from the control plane."
          />
          <StatCard
            label="Last sync"
            value={lastSyncedAt ? formatTimestamp(lastSyncedAt) : 'Pending'}
            note="Proof records refresh on a fixed interval."
          />
          <StatCard
            label="Clock"
            value={currentTime.toLocaleTimeString('en-CA', { hour12: false })}
            note="Local operator time for log correlation."
          />
        </div>

        {activePage === 'dashboard' ? (
          <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <SectionHeader
              eyebrow="Dashboard"
              title="Recent decision activity"
              description="This view is derived from ecobe-mvp proof records. It shows the latest available decision data and refreshes on a polling interval."
              action={proofRefreshing ? <LoadingLine label="Refreshing proof records" /> : null}
            />

            <div className="mt-4 space-y-4">
              {proofError ? <Banner tone="danger" title="Proof records unavailable" message={proofError} /> : null}
              {proofLoading ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Loader2 size={16} className="animate-spin" />
                    Loading recent decision activity from ecobe-mvp.
                  </div>
                </div>
              ) : recentDecisions.length > 0 ? (
                <div className="overflow-x-auto rounded-3xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-left">
                    <thead className="bg-white/[0.03] text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Job ID</th>
                        <th className="px-4 py-3">Carbon value</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Delay seconds</th>
                        <th className="px-4 py-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/8 bg-white/[0.015]">
                      {recentDecisions.map((record) => (
                        <tr key={record.id} className="transition-colors hover:bg-white/[0.04]">
                          <td className="px-4 py-3 text-sm text-slate-100">{record.job_id || 'not available'}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{formatValue(record.carbon_value)}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{record.action || 'not available'}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{record.delay_seconds === null ? 'not available' : `${record.delay_seconds}`}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{formatTimestamp(record.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No proof records yet"
                  message="ecobe-mvp has not returned any proof records. When records arrive, the latest decision activity will appear here automatically."
                />
              )}
            </div>
          </section>
        ) : null}

        {activePage === 'policies' ? (
          <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <SectionHeader
                eyebrow="Policies"
                title="Create policy"
                description="Policies are created through ecobe-mvp only. HaloGrid stores no local policy logic."
                action={policiesRefreshing ? <LoadingLine label="Refreshing policies" /> : null}
              />

              <form className="mt-4 space-y-4" onSubmit={submitPolicy}>
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Name</span>
                  <input
                    value={policyForm.name}
                    onChange={(event) => setPolicyForm((current) => ({ ...current, name: event.target.value }))}
                    type="text"
                    autoComplete="off"
                    placeholder="Example: high-carbon-delay"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-400/40"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Threshold</span>
                  <input
                    value={policyForm.threshold}
                    onChange={(event) => setPolicyForm((current) => ({ ...current, threshold: event.target.value }))}
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-400/40"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Delay seconds</span>
                  <input
                    value={policyForm.delaySeconds}
                    onChange={(event) => setPolicyForm((current) => ({ ...current, delaySeconds: event.target.value }))}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-400/40"
                  />
                </label>

                {policyFormError ? <Banner tone="warning" title="Form validation" message={policyFormError} /> : null}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={policySubmitting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {policySubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Create policy
                  </button>

                  <button
                    type="button"
                    onClick={refreshPolicies}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/[0.06]"
                  >
                    {policiesRefreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                    Refresh
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <SectionHeader
                eyebrow="Policies"
                title="Latest policies"
                description="The list reflects the current policy set returned by ecobe-mvp. No policy state is stored locally."
              />

              <div className="mt-4 space-y-4">
                {policiesError ? <Banner tone="danger" title="Policy list unavailable" message={policiesError} /> : null}
                {policiesLoading ? (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Loader2 size={16} className="animate-spin" />
                      Loading policies from ecobe-mvp.
                    </div>
                  </div>
                ) : sortedPolicies.length > 0 ? (
                  <div className="overflow-x-auto rounded-3xl border border-white/10">
                    <table className="min-w-full divide-y divide-white/10 text-left">
                      <thead className="bg-white/[0.03] text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Threshold</th>
                          <th className="px-4 py-3">Delay seconds</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/8 bg-white/[0.015]">
                        {sortedPolicies.map((policy) => (
                          <tr key={policy.id} className="transition-colors hover:bg-white/[0.04]">
                            <td className="px-4 py-3 text-sm text-slate-100">{policy.name}</td>
                            <td className="px-4 py-3 text-sm text-slate-300">{policy.threshold === null ? 'not available' : `${policy.threshold}`}</td>
                            <td className="px-4 py-3 text-sm text-slate-300">{policy.delay_seconds === null ? 'not available' : `${policy.delay_seconds}`}</td>
                            <td className="px-4 py-3 text-sm text-slate-300">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${
                                  policy.active
                                    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
                                    : 'border-white/10 bg-white/[0.03] text-slate-300'
                                }`}
                              >
                                {policy.active ? 'active' : 'latest'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-400">{formatTimestamp(policy.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="No policies returned"
                    message="ecobe-mvp did not return any policies. Once the backend exposes policy records, they will appear here."
                  />
                )}
              </div>
            </div>
          </section>
        ) : null}

        {activePage === 'logs' ? (
          <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <SectionHeader
              eyebrow="Logs"
              title="Proof records"
              description="This page displays proof records from ecobe-mvp and is the same source used to populate the dashboard."
              action={proofRefreshing ? <LoadingLine label="Refreshing proof records" /> : null}
            />

            <div className="mt-4 space-y-4">
              {proofError ? <Banner tone="danger" title="Proof record stream unavailable" message={proofError} /> : null}
              {proofLoading ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Loader2 size={16} className="animate-spin" />
                    Loading proof records from ecobe-mvp.
                  </div>
                </div>
              ) : proofRecords.length > 0 ? (
                <div className="overflow-x-auto rounded-3xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-left">
                    <thead className="bg-white/[0.03] text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Proof ID</th>
                        <th className="px-4 py-3">Job ID</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Carbon value</th>
                        <th className="px-4 py-3">Policy</th>
                        <th className="px-4 py-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/8 bg-white/[0.015]">
                      {sortByTimestampDesc(proofRecords).map((record) => (
                        <tr key={record.id} className="transition-colors hover:bg-white/[0.04]">
                          <td className="px-4 py-3 text-sm text-slate-100">{record.proof_id || record.id}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{record.job_id || 'not available'}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{record.action || 'not available'}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{formatValue(record.carbon_value)}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{record.policy || 'not available'}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{formatTimestamp(record.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No proof records returned"
                  message="ecobe-mvp has not exposed proof records yet. This page will populate automatically once the backend returns them."
                />
              )}
            </div>
          </section>
        ) : null}

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-300" />
              <span>HaloGrid is a control/view layer only. All API calls remain pinned to ecobe-mvp.</span>
            </div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
              <span>{pageLabel(activePage)}</span>
              <ChevronRight size={12} />
              <span>{formatTimestamp(lastSyncedAt)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
