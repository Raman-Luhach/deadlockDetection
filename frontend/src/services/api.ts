import type { SystemConfig } from '../types/system'
import type { DetectionResult } from '../types/detection'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function detectDeadlock(config: SystemConfig): Promise<DetectionResult> {
  const res = await fetch(`${API_BASE}/api/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      num_processes: config.numProcesses,
      num_resources: config.numResources,
      available: config.available,
      allocation: config.allocation,
      max_need: config.maxNeed,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `API error: ${res.status}`)
  }

  return res.json()
}
