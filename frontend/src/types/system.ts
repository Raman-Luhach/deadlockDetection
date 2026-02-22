export interface SystemConfig {
  numProcesses: number
  numResources: number
  available: number[]
  allocation: number[][]
  maxNeed: number[][]
}

export function createEmptyConfig(
  numProcesses: number,
  numResources: number
): SystemConfig {
  return {
    numProcesses,
    numResources,
    available: Array(numResources).fill(0),
    allocation: Array.from({ length: numProcesses }, () =>
      Array(numResources).fill(0)
    ),
    maxNeed: Array.from({ length: numProcesses }, () =>
      Array(numResources).fill(0)
    ),
  }
}
