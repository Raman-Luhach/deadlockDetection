import type { SystemConfig } from '../types/system'

export interface SampleScenario {
  label: string
  description: string
  config: SystemConfig
}

/**
 * Matches main.c scenario 1: classic Banker's safe state.
 * Expected safe sequence: P1 -> P3 -> P4 -> P0 -> P2
 */
const safeScenario: SampleScenario = {
  label: 'Load Safe Scenario',
  description: "Classic Banker's safe example — 5 processes, 3 resources",
  config: {
    numProcesses: 5,
    numResources: 3,
    available: [3, 3, 2],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ],
    maxNeed: [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ],
  },
}

/**
 * Matches main.c scenario 2: circular wait deadlock.
 * All available = 0, every process needs more than it has.
 */
const deadlockScenario: SampleScenario = {
  label: 'Load Deadlock Scenario',
  description: 'Circular wait deadlock — 4 processes, 3 resources, 0 available',
  config: {
    numProcesses: 4,
    numResources: 3,
    available: [0, 0, 0],
    allocation: [
      [1, 0, 1],
      [1, 1, 0],
      [0, 1, 1],
      [1, 0, 0],
    ],
    maxNeed: [
      [2, 1, 2],
      [2, 2, 1],
      [1, 2, 2],
      [2, 1, 1],
    ],
  },
}

export const sampleScenarios: SampleScenario[] = [safeScenario, deadlockScenario]
