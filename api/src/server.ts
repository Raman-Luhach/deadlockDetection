import express from 'express';
import cors from 'cors';
import {
  detectDeadlock,
  validateDetectRequest,
  validateStepRequest,
  validateResolveRequest,
  validateSimulateRequest,
  detectDeadlockStep,
  resolveDeadlock,
  simulateRequest,
  type DetectRequest,
  type StepRequest,
  type ResolveRequest,
  type SimulateRequest,
} from './detector';
import { buildRag, type RagRequest } from './rag';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: allow requests from the Vite frontend dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ strict: true }));

// Invalid JSON body → 400 with clear message
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }
  next(err);
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'deadlock-detection-api',
  });
});

/**
 * POST /api/detect
 * Runs deadlock detection (Banker's Algorithm) on the given system state.
 *
 * Request body (JSON):
 *   - num_processes: number (1..10)
 *   - num_resources: number (1..10)
 *   - available: number[] (length = num_resources, non-negative)
 *   - allocation: number[][] (num_processes x num_resources, non-negative, allocation[i][j] <= max_need[i][j])
 *   - max_need: number[][] (num_processes x num_resources, non-negative)
 *
 * Response (JSON):
 *   - is_deadlocked: boolean
 *   - deadlocked_processes: number[] (process indices in deadlock)
 *   - safe_sequence: number[] (process indices in safe order, if any)
 *   - safe_sequence_length: number
 */
app.post('/api/detect', (req, res) => {
  const validationError = validateDetectRequest(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  const result = detectDeadlock(req.body as DetectRequest);
  res.json(result);
});

/**
 * POST /api/export
 * Validates the given system state and returns it as JSON (for use when exporting state to a file).
 * Request body: same as /api/detect (num_processes, num_resources, available, allocation, max_need).
 * Response: the same state object (validated). Client can use this as the contents of an exported file.
 */
app.post('/api/export', (req, res) => {
  const validationError = validateDetectRequest(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  res.json(req.body);
});

/**
 * POST /api/detect/step
 * Executes one step of the Banker's safety algorithm.
 *
 * Request body (JSON):
 *   - num_processes, num_resources, available, allocation, max_need: same as /api/detect
 *   - step_state (optional, omit or null to start):
 *       - work: number[]            current Work vector
 *       - finish: boolean[]         which processes have finished
 *       - safe_sequence: number[]   processes added to the safe sequence so far
 *
 * Response (JSON):
 *   - status: "found" | "done" | "deadlock"
 *   - selected_process: number | null
 *   - explanation: string
 *   - step_state: { work, finish, safe_sequence }   (pass back in the next call)
 *   - deadlocked_processes?: number[]                (only when status = "deadlock")
 */
app.post('/api/detect/step', (req, res) => {
  const validationError = validateStepRequest(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  const result = detectDeadlockStep(req.body as StepRequest);
  res.json(result);
});

/**
 * POST /api/resolve
 * Resolves deadlock by terminating one process (victim). Returns updated state and detection result.
 *
 * Request body (JSON):
 *   - Same as /api/detect (num_processes, num_resources, available, allocation, max_need)
 *   - victim_process_index (optional): process index to terminate; must be one of the deadlocked processes.
 *     If omitted, the API picks the deadlocked process with minimum total allocation.
 *
 * Response (JSON):
 *   - state: updated system state (victim's allocation added to available, victim's allocation and max_need zeroed)
 *   - result: result of running detection on the new state (is_deadlocked, safe_sequence, etc.)
 *   - victim_process: the process index that was terminated
 *
 * Returns 400 if the current state is not deadlocked or victim_process_index is invalid.
 */
app.post('/api/resolve', (req, res) => {
  const validationError = validateResolveRequest(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  try {
    const result = resolveDeadlock(req.body as ResolveRequest);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Resolution failed';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/simulate-request
 * Deadlock avoidance: simulates granting a resource request without changing state.
 * Request body: same as /api/detect plus process_index, resource_index, amount.
 * Response: granted, is_safe, message. Dry run only.
 */
app.post('/api/simulate-request', (req, res) => {
  const validationError = validateSimulateRequest(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  const result = simulateRequest(req.body as SimulateRequest);
  res.json(result);
});

/**
 * POST /api/rag
 * Builds the Resource Allocation Graph from the given system state.
 *
 * Request body: same as /api/detect.
 *
 * Response (JSON):
 *   - nodes: { id, label, type: "process"|"resource" }[]
 *   - edges: { from, to, type: "request"|"assignment" }[]
 */
app.post('/api/rag', (req, res) => {
  const validationError = validateDetectRequest(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  const result = buildRag(req.body as RagRequest);
  res.json(result);
});

// Catch-all error handler: 500 with consistent { error } shape
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Deadlock Detection API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
