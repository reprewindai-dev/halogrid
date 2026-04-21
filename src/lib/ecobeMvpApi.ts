/**
 * Architecture contract: HaloGrid communicates exclusively with ecobe-mvp.
 * Direct calls to ecobe-engineclaude or any internal engine service are not permitted.
 */

import type { CreateEcobeMvpPolicyInput, EcobeMvpPolicy, EcobeMvpProofRecord } from '../types'

const DEFAULT_BASE_URL = '/api/ecobe-mvp'
const REQUEST_TIMEOUT_MS = 10_000

export const ECOBE_MVP_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_ECOBE_MVP_BASE_URL)

export class EcobeMvpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | null,
    public readonly reason: 'missing_infra' | 'credentials' | 'network' | 'parse' | 'degraded',
  ) {
    super(message)
    this.name = 'EcobeMvpError'
  }
}

function normalizeBaseUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_BASE_URL
  }

  const trimmed = value.trim()
  return trimmed.replace(/\/+$/, '') || DEFAULT_BASE_URL
}

function buildUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${ECOBE_MVP_BASE_URL}${suffix}`
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T | undefined> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const headers = new Headers(init.headers)
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(buildUrl(path), {
      credentials: 'include',
      ...init,
      headers,
      signal: controller.signal,
    })

    if (response.status === 401 || response.status === 403) {
      throw new EcobeMvpError('ecobe-mvp rejected the request', response.status, 'credentials')
    }

    if (!response.ok) {
      const reason = response.status >= 500 ? 'degraded' : 'missing_infra'
      throw new EcobeMvpError(`ecobe-mvp returned ${response.status}`, response.status, reason)
    }

    if (response.status === 204) {
      return undefined
    }

    const raw = await response.text()
    if (!raw.trim()) {
      return undefined
    }

    try {
      return JSON.parse(raw) as T
    } catch {
      throw new EcobeMvpError('ecobe-mvp returned invalid JSON', response.status, 'parse')
    }
  } catch (error) {
    if (error instanceof EcobeMvpError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new EcobeMvpError('ecobe-mvp request timed out', null, 'network')
    }

    throw new EcobeMvpError('ecobe-mvp request failed', null, 'network')
  } finally {
    window.clearTimeout(timeout)
  }
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function pickString(record: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = toString(record[key], '')
    if (value) {
      return value
    }
  }

  return fallback
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = toNumber(record[key])
    if (value !== null) {
      return value
    }
  }

  return null
}

function pickBoolean(record: Record<string, unknown>, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'boolean') {
      return value
    }
    if (typeof value === 'string') {
      if (value === 'true' || value === '1') return true
      if (value === 'false' || value === '0') return false
    }
  }

  return null
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>
  const keys = ['items', 'data', 'policies', 'proof_records', 'proofRecords', 'records', 'results']
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

function normalizePolicyRecord(item: unknown): EcobeMvpPolicy | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const name = pickString(record, ['name', 'policy_name', 'policyName', 'label'])
  const threshold = pickNumber(record, ['threshold', 'carbon_threshold', 'carbonThreshold'])
  const delaySeconds = pickNumber(record, ['delay_seconds', 'delaySeconds'])
  const id = pickString(record, ['id', 'policy_id', 'policyId'], name)
  const active = pickBoolean(record, ['active', 'is_active', 'isActive']) ?? true
  const createdAt = pickString(record, ['created_at', 'createdAt', 'timestamp', 'time', 'updated_at', 'updatedAt'])

  if (!name) {
    return null
  }

  return {
    id,
    name,
    threshold,
    delay_seconds: delaySeconds,
    active,
    created_at: createdAt || null,
    raw: record,
  }
}

function normalizeProofRecord(item: unknown): EcobeMvpProofRecord | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const id = pickString(record, ['id', 'proof_id', 'proofId'])
  const proofId = pickString(record, ['proof_id', 'proofId'], id)
  const jobId = pickString(record, ['job_id', 'jobId', 'job'])
  const action = pickString(record, ['action', 'decision', 'status'])
  const carbonValueRaw =
    record.carbon_value ??
    record.carbonValue ??
    record.carbon ??
    record.carbon_kg ??
    record.carbonKg ??
    null
  const policy = pickString(record, ['policy', 'policy_name', 'policyName'])
  const timestamp = pickString(record, ['timestamp', 'created_at', 'createdAt', 'time'])
  const delaySeconds = pickNumber(record, ['delay_seconds', 'delaySeconds'])

  if (!id && !proofId && !jobId && !action) {
    return null
  }

  return {
    id: id || proofId || `${jobId || action}-${timestamp || 'record'}`,
    proof_id: proofId || id || '',
    job_id: jobId,
    action,
    carbon_value: typeof carbonValueRaw === 'number' || typeof carbonValueRaw === 'string' ? carbonValueRaw : null,
    policy,
    timestamp: timestamp || null,
    delay_seconds: delaySeconds,
    raw: record,
  }
}

export async function fetchPolicies(): Promise<EcobeMvpPolicy[]> {
  const payload = await requestJson<unknown>('/policies')
  return extractArray(payload).map(normalizePolicyRecord).filter((item): item is EcobeMvpPolicy => item !== null)
}

export async function createPolicy(input: CreateEcobeMvpPolicyInput): Promise<EcobeMvpPolicy | null> {
  const payload = await requestJson<unknown>('/policies', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (!payload) {
    return null
  }

  const normalized = normalizePolicyRecord(payload)
  return normalized ?? null
}

async function fetchProofRecordsFrom(path: string): Promise<EcobeMvpProofRecord[]> {
  const payload = await requestJson<unknown>(path)
  return extractArray(payload).map(normalizeProofRecord).filter((item): item is EcobeMvpProofRecord => item !== null)
}

export async function fetchProofRecords(): Promise<EcobeMvpProofRecord[]> {
  const endpoints = ['/proof-records', '/proofs', '/decisions']

  let lastError: EcobeMvpError | null = null
  for (const endpoint of endpoints) {
    try {
      return await fetchProofRecordsFrom(endpoint)
    } catch (error) {
      if (error instanceof EcobeMvpError && error.reason === 'missing_infra') {
        lastError = error
        continue
      }

      throw error
    }
  }

  if (lastError) {
    throw lastError
  }

  return []
}

export function getEcobeMvpBaseUrl(): string {
  return ECOBE_MVP_BASE_URL
}
