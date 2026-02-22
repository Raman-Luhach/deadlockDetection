/**
 * Deadlock detection using Banker's Algorithm (ported from C).
 * Used by POST /api/detect.
 */

export interface DetectRequest {
  num_processes: number;
  num_resources: number;
  available: number[];
  allocation: number[][];
  max_need: number[][];
}

export interface DetectResponse {
  is_deadlocked: boolean;
  deadlocked_processes: number[];
  safe_sequence: number[];
  safe_sequence_length: number;
}

const MAX_PROCESSES = 10;
const MAX_RESOURCES = 10;

function canSatisfy(need: number[], work: number[], numResources: number): boolean {
  for (let j = 0; j < numResources; j++) {
    if (need[j] > work[j]) return false;
  }
  return true;
}

/**
 * Banker's Algorithm: determines if the system state is safe or deadlocked.
 * Returns detection result with safe sequence or list of deadlocked process indices.
 */
export function detectDeadlock(req: DetectRequest): DetectResponse {
  const { num_processes, num_resources, available, allocation, max_need } = req;

  // Compute need matrix: need[i][j] = max_need[i][j] - allocation[i][j]
  const need: number[][] = [];
  for (let i = 0; i < num_processes; i++) {
    need[i] = [];
    for (let j = 0; j < num_resources; j++) {
      need[i][j] = max_need[i][j] - allocation[i][j];
    }
  }

  const work = [...available];
  const finish: boolean[] = new Array(num_processes).fill(false);
  const safeSequence: number[] = [];

  let found: boolean;
  do {
    found = false;
    for (let i = 0; i < num_processes; i++) {
      if (!finish[i] && canSatisfy(need[i], work, num_resources)) {
        for (let j = 0; j < num_resources; j++) {
          work[j] += allocation[i][j];
        }
        finish[i] = true;
        safeSequence.push(i);
        found = true;
      }
    }
  } while (found);

  const deadlockedProcesses: number[] = [];
  for (let i = 0; i < num_processes; i++) {
    if (!finish[i]) deadlockedProcesses.push(i);
  }

  return {
    is_deadlocked: deadlockedProcesses.length > 0,
    deadlocked_processes: deadlockedProcesses,
    safe_sequence: safeSequence,
    safe_sequence_length: safeSequence.length,
  };
}

/**
 * Validates request body for POST /api/detect.
 * Returns an error message or null if valid.
 */
export function validateDetectRequest(body: unknown): string | null {
  if (body === null || typeof body !== 'object') return 'Request body must be a JSON object';

  const b = body as Record<string, unknown>;
  if (typeof b.num_processes !== 'number' || b.num_processes < 1 || b.num_processes > MAX_PROCESSES) {
    return `num_processes must be a number between 1 and ${MAX_PROCESSES}`;
  }
  if (typeof b.num_resources !== 'number' || b.num_resources < 1 || b.num_resources > MAX_RESOURCES) {
    return `num_resources must be a number between 1 and ${MAX_RESOURCES}`;
  }

  const np = b.num_processes as number;
  const nr = b.num_resources as number;

  if (!Array.isArray(b.available) || b.available.length !== nr) {
    return `available must be an array of ${nr} numbers`;
  }
  for (let j = 0; j < nr; j++) {
    if (typeof b.available[j] !== 'number' || b.available[j] < 0) {
      return `available[${j}] must be a non-negative number`;
    }
  }

  if (!Array.isArray(b.allocation) || b.allocation.length !== np) {
    return `allocation must be a ${np}x${nr} matrix`;
  }
  for (let i = 0; i < np; i++) {
    if (!Array.isArray(b.allocation[i]) || b.allocation[i].length !== nr) {
      return `allocation[${i}] must be an array of ${nr} numbers`;
    }
    for (let j = 0; j < nr; j++) {
      const v = b.allocation[i][j];
      if (typeof v !== 'number' || v < 0) return `allocation[${i}][${j}] must be a non-negative number`;
    }
  }

  if (!Array.isArray(b.max_need) || b.max_need.length !== np) {
    return `max_need must be a ${np}x${nr} matrix`;
  }
  for (let i = 0; i < np; i++) {
    if (!Array.isArray(b.max_need[i]) || b.max_need[i].length !== nr) {
      return `max_need[${i}] must be an array of ${nr} numbers`;
    }
    for (let j = 0; j < nr; j++) {
      const v = b.max_need[i][j];
      if (typeof v !== 'number' || v < 0) return `max_need[${i}][${j}] must be a non-negative number`;
      if ((b.allocation as number[][])[i][j] > v) {
        return `allocation[${i}][${j}] cannot exceed max_need[${i}][${j}]`;
      }
    }
  }

  return null;
}
