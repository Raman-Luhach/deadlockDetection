/**
 * Runs the C api_worker binary for detect, RAG, resolve, and simulate.
 * Uses stdin text protocol and parses one JSON line from stdout.
 * If the binary is missing or fails, callers should fall back to TypeScript implementation.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const WORKER_TIMEOUT_MS = 10000;

/** Path to api_worker binary (project root when running from api/). */
function getWorkerPath(): string {
  const fromApi = path.resolve(process.cwd(), '..', 'api_worker');
  const fromRoot = path.resolve(process.cwd(), 'api_worker');
  if (fs.existsSync(fromApi)) return fromApi;
  if (fs.existsSync(fromRoot)) return fromRoot;
  return fromApi; // prefer relative to api/
}

/** Check if the C worker binary is available. */
export function isCWorkerAvailable(): boolean {
  const p = getWorkerPath();
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

interface StateLike {
  num_processes: number;
  num_resources: number;
  available: number[];
  allocation: number[][];
  max_need: number[][];
}

function stateToStdin(state: StateLike): string {
  const { num_processes: np, num_resources: nr, available, allocation, max_need } = state;
  const lines: string[] = [];
  lines.push(`${np} ${nr}`);
  lines.push(available.join(' '));
  for (let i = 0; i < np; i++) lines.push(allocation[i].join(' '));
  for (let i = 0; i < np; i++) lines.push(max_need[i].join(' '));
  return lines.join('\n');
}

function runWorker(stdin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const bin = getWorkerPath();
    if (!fs.existsSync(bin)) {
      reject(new Error('api_worker binary not found. Run: make api_worker'));
      return;
    }
    const proc = spawn(bin, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');
    proc.stdout.on('data', (chunk: string) => { out += chunk; });
    proc.stderr.on('data', (chunk: string) => { err += chunk; });
    proc.on('error', (e) => reject(e));
    const t = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('api_worker timed out'));
    }, WORKER_TIMEOUT_MS);

    proc.on('close', (code) => {
      clearTimeout(t);
      if (code !== 0) {
        reject(new Error(err || `api_worker exited with code ${code}`));
        return;
      }
      const line = out.trim().split('\n')[0] || '';
      if (!line) {
        reject(new Error('api_worker produced no output'));
        return;
      }
      resolve(line);
    });
    proc.stdin.write(stdin, () => proc.stdin.end());
  });
}

export interface DetectResponse {
  is_deadlocked: boolean;
  deadlocked_processes: number[];
  safe_sequence: number[];
  safe_sequence_length: number;
}

export async function runDetect(state: StateLike): Promise<DetectResponse> {
  const stdin = `DETECT\n${stateToStdin(state)}`;
  const line = await runWorker(stdin);
  const obj = JSON.parse(line) as DetectResponse & { error?: string };
  if ('error' in obj && obj.error) throw new Error(obj.error);
  return obj;
}

export interface RagResponse {
  nodes: { id: number; label: string; type: string }[];
  edges: { from: number; to: number; type: string }[];
}

export async function runRag(state: StateLike): Promise<RagResponse> {
  const stdin = `RAG\n${stateToStdin(state)}`;
  const line = await runWorker(stdin);
  return JSON.parse(line) as RagResponse;
}

export interface ResolveResponse {
  state: StateLike;
  result: DetectResponse;
  victim_process: number;
}

export async function runResolve(
  state: StateLike & { victim_process_index?: number }
): Promise<ResolveResponse> {
  const victim = state.victim_process_index ?? -1;
  const stdin = `RESOLVE\n${stateToStdin(state)}\n${victim}`;
  const line = await runWorker(stdin);
  const obj = JSON.parse(line) as ResolveResponse | { error: string };
  if ('error' in obj && obj.error) throw new Error(obj.error);
  return obj as ResolveResponse;
}

export interface SimulateResponse {
  granted: boolean;
  is_safe: boolean;
  message: string;
}

export async function runSimulate(
  state: StateLike & { process_index: number; resource_index: number; amount: number }
): Promise<SimulateResponse> {
  const { process_index: pi, resource_index: rj, amount } = state;
  const stdin = `SIMULATE\n${stateToStdin(state)}\n${pi} ${rj} ${amount}`;
  const line = await runWorker(stdin);
  return JSON.parse(line) as SimulateResponse;
}
