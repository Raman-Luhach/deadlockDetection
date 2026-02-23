import express from 'express';
import cors from 'cors';
import {
  detectDeadlock,
  validateDetectRequest,
  validateStepRequest,
  detectDeadlockStep,
  type DetectRequest,
  type StepRequest,
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

app.use(express.json());

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
 * POST /api/rag
 * Builds a Resource Allocation Graph from the given system state.
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

app.listen(PORT, () => {
  console.log(`Deadlock Detection API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
