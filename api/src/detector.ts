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

/* ------------------------------------------------------------------ */
/*  Deadlock resolution (terminate one process)                        */
/* ------------------------------------------------------------------ */

export interface ResolveRequest extends DetectRequest {
  /** Optional. If omitted, a victim is chosen (min total allocation among deadlocked). */
  victim_process_index?: number;
}

export interface ResolveResponse {
  /** Updated system state after terminating the victim. */
  state: DetectRequest;
  /** Result of running detection on the new state. */
  result: DetectResponse;
  /** Process index that was terminated. */
  victim_process: number;
}

/**
 * Resolves deadlock by terminating one process (victim).
 * If no victim is provided, picks the deadlocked process with minimum total allocation.
 * Returns the new state and the detection result on that state.
 * @throws Error if the current state is not deadlocked
 */
export function resolveDeadlock(req: ResolveRequest): ResolveResponse {
  const detection = detectDeadlock(req);
  if (!detection.is_deadlocked || detection.deadlocked_processes.length === 0) {
    throw new Error('State is not deadlocked; resolution not applicable.');
  }

  const { num_processes, num_resources, available, allocation, max_need } = req;
  const deadlocked = detection.deadlocked_processes;

  let victim: number;
  if (req.victim_process_index !== undefined && req.victim_process_index !== null) {
    if (
      req.victim_process_index < 0 ||
      req.victim_process_index >= num_processes ||
      !deadlocked.includes(req.victim_process_index)
    ) {
      throw new Error(
        `victim_process_index must be a deadlocked process index (one of [${deadlocked.join(', ')}]).`
      );
    }
    victim = req.victim_process_index;
  } else {
    // Choose victim: minimum total allocation among deadlocked
    let minTotal = Infinity;
    victim = deadlocked[0];
    for (const i of deadlocked) {
      let total = 0;
      for (let j = 0; j < num_resources; j++) total += allocation[i][j];
      if (total < minTotal) {
        minTotal = total;
        victim = i;
      }
    }
  }

  // New state: add victim's allocation to available, zero victim's allocation and max_need
  const newAvailable = available.map((a, j) => a + allocation[victim][j]);
  const newAllocation = allocation.map((row, i) =>
    i === victim ? row.map(() => 0) : [...row]
  );
  const newMaxNeed = max_need.map((row, i) =>
    i === victim ? row.map(() => 0) : [...row]
  );

  const newState: DetectRequest = {
    num_processes,
    num_resources,
    available: newAvailable,
    allocation: newAllocation,
    max_need: newMaxNeed,
  };

  const newResult = detectDeadlock(newState);
  return {
    state: newState,
    result: newResult,
    victim_process: victim,
  };
}

/**
 * Validates request body for POST /api/resolve.
 * Same as detect + optional victim_process_index (number, 0..num_processes-1).
 */
export function validateResolveRequest(body: unknown): string | null {
  const baseError = validateDetectRequest(body);
  if (baseError) return baseError;

  const b = body as Record<string, unknown>;
  const np = b.num_processes as number;

  if (b.victim_process_index !== undefined && b.victim_process_index !== null) {
    const v = b.victim_process_index;
    if (typeof v !== 'number' || v < 0 || v >= np) {
      return `victim_process_index must be a number between 0 and ${np - 1}`;
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Step-by-step Banker's Algorithm                                    */
/* ------------------------------------------------------------------ */

export interface StepRequest {
  /** Full system state (always required so we can compute the need matrix). */
  num_processes: number;
  num_resources: number;
  available: number[];
  allocation: number[][];
  max_need: number[][];

  /**
   * Optional step state.  Omit (or set to null) to start from the beginning.
   * If provided, the algorithm resumes from this snapshot.
   */
  step_state?: {
    work: number[];
    finish: boolean[];
    safe_sequence: number[];
  } | null;
}

export interface StepResponse {
  /** "found" = a process was selected; "done" = all finished; "deadlock" = stuck. */
  status: 'found' | 'done' | 'deadlock';

  /** Index of the process selected in this step, or null if none. */
  selected_process: number | null;

  /** Human-readable explanation of what happened. */
  explanation: string;

  /** Updated step state to feed into the next call. */
  step_state: {
    work: number[];
    finish: boolean[];
    safe_sequence: number[];
  };

  /** Present only when status is "deadlock". */
  deadlocked_processes?: number[];
}

/**
 * Executes ONE iteration of the Banker's safety loop.
 *
 * Scans all processes (in index order) for the first unfinished process whose
 * Need ≤ Work.  If found, simulates releasing its resources.
 * If no such process exists, reports either completion or deadlock.
 */
export function detectDeadlockStep(req: StepRequest): StepResponse {
  const { num_processes, num_resources, allocation, max_need } = req;

  // Compute need matrix
  const need: number[][] = [];
  for (let i = 0; i < num_processes; i++) {
    need[i] = [];
    for (let j = 0; j < num_resources; j++) {
      need[i][j] = max_need[i][j] - allocation[i][j];
    }
  }

  // Initialise or restore step state
  const work: number[] = req.step_state
    ? [...req.step_state.work]
    : [...req.available];
  const finish: boolean[] = req.step_state
    ? [...req.step_state.finish]
    : new Array(num_processes).fill(false);
  const safeSeq: number[] = req.step_state
    ? [...req.step_state.safe_sequence]
    : [];

  // Try to find one satisfiable process
  for (let i = 0; i < num_processes; i++) {
    if (!finish[i] && canSatisfy(need[i], work, num_resources)) {
      // Simulate: release allocation[i] into work
      for (let j = 0; j < num_resources; j++) {
        work[j] += allocation[i][j];
      }
      finish[i] = true;
      safeSeq.push(i);

      const needStr = `[${need[i].join(', ')}]`;
      const workBefore = work.map((w, j) => w - allocation[i][j]);
      const workStr = `[${workBefore.join(', ')}]`;

      return {
        status: 'found',
        selected_process: i,
        explanation:
          `Selected P${i}: Need(P${i}) ${needStr} ≤ Work ${workStr}; ` +
          `allocate resources, then release → Work = [${work.join(', ')}]. ` +
          `Add P${i} to safe sequence.`,
        step_state: { work, finish, safe_sequence: safeSeq },
      };
    }
  }

  // No process was selected — check if we're done or deadlocked
  const unfinished: number[] = [];
  for (let i = 0; i < num_processes; i++) {
    if (!finish[i]) unfinished.push(i);
  }

  if (unfinished.length === 0) {
    return {
      status: 'done',
      selected_process: null,
      explanation:
        `All processes finished. Safe sequence: [${safeSeq.map((p) => `P${p}`).join(', ')}].`,
      step_state: { work, finish, safe_sequence: safeSeq },
    };
  }

  return {
    status: 'deadlock',
    selected_process: null,
    explanation:
      `No process can be satisfied. ` +
      `Deadlocked processes: [${unfinished.map((p) => `P${p}`).join(', ')}]. ` +
      `Work = [${work.join(', ')}].`,
    step_state: { work, finish, safe_sequence: safeSeq },
    deadlocked_processes: unfinished,
  };
}

/**
 * Validates the step_state portion of a StepRequest.
 * Returns an error message or null if valid.
 */
export function validateStepRequest(body: unknown): string | null {
  // First validate the base system state fields
  const baseError = validateDetectRequest(body);
  if (baseError) return baseError;

  const b = body as Record<string, unknown>;
  const np = b.num_processes as number;
  const nr = b.num_resources as number;

  // step_state is optional — if absent or null, that's fine (start from scratch)
  if (b.step_state === undefined || b.step_state === null) return null;

  if (typeof b.step_state !== 'object') {
    return 'step_state must be an object or null';
  }

  const ss = b.step_state as Record<string, unknown>;

  // work
  if (!Array.isArray(ss.work) || ss.work.length !== nr) {
    return `step_state.work must be an array of ${nr} numbers`;
  }
  for (let j = 0; j < nr; j++) {
    if (typeof ss.work[j] !== 'number' || ss.work[j] < 0) {
      return `step_state.work[${j}] must be a non-negative number`;
    }
  }

  // finish
  if (!Array.isArray(ss.finish) || ss.finish.length !== np) {
    return `step_state.finish must be an array of ${np} booleans`;
  }
  for (let i = 0; i < np; i++) {
    if (typeof ss.finish[i] !== 'boolean') {
      return `step_state.finish[${i}] must be a boolean`;
    }
  }

  // safe_sequence
  if (!Array.isArray(ss.safe_sequence)) {
    return 'step_state.safe_sequence must be an array of numbers';
  }
  for (let k = 0; k < ss.safe_sequence.length; k++) {
    const v = ss.safe_sequence[k];
    if (typeof v !== 'number' || v < 0 || v >= np) {
      return `step_state.safe_sequence[${k}] must be a process index (0..${np - 1})`;
    }
  }

  return null;
}

/**
 * Validates request body for POST /api/detect.
 * Returns an error message or null if valid.
 */
/**
 * Validates request body for POST /api/detect (and other state-accepting endpoints).
 * Rules: types correct, array lengths match dimensions, all values non-negative integers,
 * allocation[i][j] <= max_need[i][j]. Returns an error message or null if valid.
 */
export function validateDetectRequest(body: unknown): string | null {
  if (body === null || typeof body !== 'object') return 'Request body must be a JSON object';

  const b = body as Record<string, unknown>;
  if (typeof b.num_processes !== 'number' || !Number.isInteger(b.num_processes) || b.num_processes < 1 || b.num_processes > MAX_PROCESSES) {
    return `num_processes must be an integer between 1 and ${MAX_PROCESSES}`;
  }
  if (typeof b.num_resources !== 'number' || !Number.isInteger(b.num_resources) || b.num_resources < 1 || b.num_resources > MAX_RESOURCES) {
    return `num_resources must be an integer between 1 and ${MAX_RESOURCES}`;
  }

  const np = b.num_processes as number;
  const nr = b.num_resources as number;

  if (!Array.isArray(b.available) || b.available.length !== nr) {
    return `available must be an array of ${nr} numbers`;
  }
  for (let j = 0; j < nr; j++) {
    const v = b.available[j];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
      return `available[${j}] must be a non-negative integer`;
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
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
        return `allocation[${i}][${j}] must be a non-negative integer`;
      }
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
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
        return `max_need[${i}][${j}] must be a non-negative integer`;
      }
      if ((b.allocation as number[][])[i][j] > v) {
        return `allocation[${i}][${j}] cannot exceed max_need[${i}][${j}]`;
      }
    }
  }

  return null;
}
