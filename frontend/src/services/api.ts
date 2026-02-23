import type { SystemConfig } from '../types/system'
import type { DetectionResult, StepState, StepResponse, ResolveResponse } from '../types/detection'
import type { RagData } from '../types/rag'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MAX_P = 10
const MAX_R = 10

/** User-friendly message when the API is unreachable (network error). */
const NETWORK_ERROR_MSG = `Cannot reach the API at ${API_BASE}. Check that the server is running.`

/**
 * Performs a fetch and returns JSON on success. On 4xx/5xx, parses error body and throws
 * with a clear message. Use in all API calls for consistent error handling.
 */
async function apiRequest<T>(url: string, options: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, options)
  } catch (err) {
    const msg = err instanceof TypeError ? NETWORK_ERROR_MSG : (err instanceof Error ? err.message : 'Network error')
    throw new Error(msg)
  }
  const text = await res.text()
  if (!res.ok) {
    let errMsg: string
    try {
      const body = JSON.parse(text) as { error?: string }
      errMsg = body.error || res.statusText || `Request failed (${res.status})`
    } catch {
      errMsg = res.statusText || `Request failed (${res.status})`
    }
    throw new Error(errMsg)
  }
  try {
    return text ? (JSON.parse(text) as T) : ({} as T)
  } catch {
    throw new Error('Invalid response from API')
  }
}

export function configToPayload(config: SystemConfig) {
  return {
    num_processes: config.numProcesses,
    num_resources: config.numResources,
    available: config.available,
    allocation: config.allocation,
    max_need: config.maxNeed,
  }
}

/** Parses and validates imported JSON; returns SystemConfig or throws with message. */
export function parseAndValidateImportedState(json: string): SystemConfig {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Invalid JSON')
  }
  if (data === null || typeof data !== 'object') throw new Error('State must be an object')

  const o = data as Record<string, unknown>
  const np = numberField(o, 'num_processes', 'numProcesses', 1, MAX_P, 'num_processes/numProcesses')
  const nr = numberField(o, 'num_resources', 'numResources', 1, MAX_R, 'num_resources/numResources')

  const available = arrayField(o, 'available', nr, 'available')
  const allocation = matrixField(o, ['allocation'], np, nr, 'allocation')
  const maxNeed = matrixField(o, ['max_need', 'maxNeed'], np, nr, 'max_need/maxNeed')

  for (let i = 0; i < np; i++) {
    for (let j = 0; j < nr; j++) {
      if (allocation[i][j] > maxNeed[i][j]) {
        throw new Error(`Allocation[P${i}][R${j}] cannot exceed Max need`)
      }
    }
  }

  return {
    numProcesses: np,
    numResources: nr,
    available,
    allocation,
    maxNeed,
  }
}

function numberField(
  o: Record<string, unknown>,
  key1: string,
  key2: string,
  min: number,
  max: number,
  label: string
): number {
  const v = o[key1] ?? o[key2]
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}`)
  }
  return v
}

function arrayField(o: Record<string, unknown>, key: string, length: number, label: string): number[] {
  const arr = o[key]
  if (!Array.isArray(arr) || arr.length !== length) {
    throw new Error(`${label} must be an array of ${length} numbers`)
  }
  const out: number[] = []
  for (let j = 0; j < length; j++) {
    const v = arr[j]
    if (typeof v !== 'number' || v < 0 || !Number.isInteger(v)) {
      throw new Error(`${label}[${j}] must be a non-negative integer`)
    }
    out.push(v)
  }
  return out
}

function matrixField(
  o: Record<string, unknown>,
  keys: string[],
  rows: number,
  cols: number,
  label: string
): number[][] {
  const arr = keys.reduce<unknown>((acc, k) => acc ?? o[k], undefined)
  if (!Array.isArray(arr) || arr.length !== rows) {
    throw new Error(`${label} must be a ${rows}x${cols} matrix`)
  }
  const out: number[][] = []
  for (let i = 0; i < rows; i++) {
    const row = arr[i]
    if (!Array.isArray(row) || row.length !== cols) {
      throw new Error(`${label}[${i}] must be an array of ${cols} numbers`)
    }
    const rowOut: number[] = []
    for (let j = 0; j < cols; j++) {
      const v = row[j]
      if (typeof v !== 'number' || v < 0 || !Number.isInteger(v)) {
        throw new Error(`${label}[${i}][${j}] must be a non-negative integer`)
      }
      rowOut.push(v)
    }
    out.push(rowOut)
  }
  return out
}

export async function exportState(config: SystemConfig): Promise<string> {
  const state = await apiRequest<Record<string, unknown>>(`${API_BASE}/api/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configToPayload(config)),
  })
  return JSON.stringify(state, null, 2)
}

export async function detectDeadlock(config: SystemConfig): Promise<DetectionResult> {
  return apiRequest<DetectionResult>(`${API_BASE}/api/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configToPayload(config)),
  })
}

export async function detectDeadlockStep(
  config: SystemConfig,
  stepState: StepState | null
): Promise<StepResponse> {
  return apiRequest<StepResponse>(`${API_BASE}/api/detect/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...configToPayload(config),
      step_state: stepState,
    }),
  })
}

export async function resolveDeadlock(config: SystemConfig): Promise<ResolveResponse> {
  return apiRequest<ResolveResponse>(`${API_BASE}/api/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configToPayload(config)),
  })
}

export async function fetchRag(config: SystemConfig): Promise<RagData> {
  return apiRequest<RagData>(`${API_BASE}/api/rag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configToPayload(config)),
  })
}
