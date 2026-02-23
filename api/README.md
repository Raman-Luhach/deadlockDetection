# Deadlock Detection API

REST API backend for the Deadlock Detection System.

## Setup

```bash
cd api
npm install
```

## Running

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3001` by default. Set the `PORT` environment variable to change it.

## Endpoints

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "deadlock-detection-api"
}
```

### `POST /api/detect`

Runs deadlock detection using the Banker's Algorithm on the given system state.

**Request body (JSON):**

| Field | Type | Description |
|-------|------|-------------|
| `num_processes` | number | Number of processes (1–10) |
| `num_resources` | number | Number of resource types (1–10) |
| `available` | number[] | Available units per resource, length = `num_resources` |
| `allocation` | number[][] | Allocation matrix: `allocation[i][j]` = units of resource j held by process i |
| `max_need` | number[][] | Max need matrix: `max_need[i][j]` = max units of resource j process i may need |

Constraints: all values non-negative; `allocation[i][j] <= max_need[i][j]`.

**Response (JSON):**

| Field | Type | Description |
|-------|------|-------------|
| `is_deadlocked` | boolean | `true` if the state is deadlocked |
| `deadlocked_processes` | number[] | Process indices that are deadlocked |
| `safe_sequence` | number[] | Process indices in a safe completion order (if any) |
| `safe_sequence_length` | number | Length of `safe_sequence` |

**Example request:**
```json
{
  "num_processes": 5,
  "num_resources": 3,
  "available": [3, 3, 2],
  "allocation": [[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]],
  "max_need": [[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]]
}
```

**Example response (safe):**
```json
{
  "is_deadlocked": false,
  "deadlocked_processes": [],
  "safe_sequence": [1, 3, 4, 0, 2],
  "safe_sequence_length": 5
}
```

**Example response (deadlock):**
```json
{
  "is_deadlocked": true,
  "deadlocked_processes": [0, 1, 2, 3],
  "safe_sequence": [2, 0],
  "safe_sequence_length": 2
}
```

Invalid request body returns `400` with `{ "error": "message" }`.

### `POST /api/detect/step`

Executes **one step** of the Banker's safety algorithm. Use repeatedly to step through the algorithm.

**Request body (JSON):**

- Same system state as `POST /api/detect`: `num_processes`, `num_resources`, `available`, `allocation`, `max_need`.
- **`step_state`** (optional): omit or set to `null` to start from the beginning. To continue from a previous step, send the `step_state` returned by the last call.
  - `work`: number[] — current Work vector (length = num_resources)
  - `finish`: boolean[] — finish[i] = true if process i has been added to the safe sequence (length = num_processes)
  - `safe_sequence`: number[] — process indices in the order they were selected so far

**Response (JSON):**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"found"` = a process was selected this step; `"done"` = all processes finished (safe); `"deadlock"` = no process can proceed |
| `selected_process` | number \| null | Process index selected this step, or null if none |
| `explanation` | string | Short explanation of what happened |
| `step_state` | object | Updated `{ work, finish, safe_sequence }` to send in the next request |
| `deadlocked_processes` | number[] | Present only when `status === "deadlock"` — list of process indices that are deadlocked |

**Example (first step):** Omit `step_state`. Response will have `status: "found"`, `selected_process` set, and `step_state` to use in the next call.

**Example (continue):** Send the previous response’s `step_state` in the request body. Repeat until `status` is `"done"` or `"deadlock"`.

Invalid request body returns `400` with `{ "error": "message" }`.

### `POST /api/resolve`

Resolves deadlock by terminating one process (victim). The victim’s allocation is added to `available`, and the victim’s `allocation` and `max_need` rows are zeroed. Returns the updated state and the result of running detection on it.

**Request body (JSON):**

- Same as `POST /api/detect`: `num_processes`, `num_resources`, `available`, `allocation`, `max_need`.
- **`victim_process_index`** (optional): process index to terminate. Must be one of the current deadlocked process indices. If omitted, the API selects the deadlocked process with **minimum total allocation**.

**Response (JSON):**

| Field | Type | Description |
|-------|------|-------------|
| `state` | object | Updated system state: same shape as request; victim’s allocation added to `available`, victim’s `allocation` and `max_need` rows set to zero |
| `result` | object | Result of running detection on `state`: `is_deadlocked`, `deadlocked_processes`, `safe_sequence`, `safe_sequence_length` |
| `victim_process` | number | The process index that was terminated |

**Example response (deadlock resolved):**
```json
{
  "state": {
    "num_processes": 4,
    "num_resources": 3,
    "available": [1, 1, 1],
    "allocation": [[0,0,0],[1,1,0],[0,1,1],[1,0,0]],
    "max_need": [[0,0,0],[2,2,1],[1,2,2],[2,1,1]]
  },
  "result": {
    "is_deadlocked": false,
    "deadlocked_processes": [],
    "safe_sequence": [1, 2, 3],
    "safe_sequence_length": 3
  },
  "victim_process": 0
}
```

Returns `400` with `{ "error": "message" }` if the current state is not deadlocked or if `victim_process_index` is not a valid deadlocked process index.

### `POST /api/rag`

Builds the Resource Allocation Graph (RAG) for the given system state. Request body is the same as `POST /api/detect`.

**Request body:** Same as `POST /api/detect` (`num_processes`, `num_resources`, `available`, `allocation`, `max_need`).

**Response (JSON):**

| Field   | Type  | Description |
|--------|-------|-------------|
| `nodes` | array | RAG nodes: process nodes (id 0..num_processes-1, label P0, P1, …, type `"process"`) and resource nodes (id num_processes..num_processes+num_resources-1, label R0, R1, …, type `"resource"`) |
| `edges` | array | RAG edges: each has `from`, `to` (node ids), and `type`: `"request"` (process → resource) or `"assignment"` (resource → process) |

**Example response:**
```json
{
  "nodes": [
    { "id": 0, "label": "P0", "type": "process" },
    { "id": 1, "label": "P1", "type": "process" },
    { "id": 2, "label": "R0", "type": "resource" },
    { "id": 3, "label": "R1", "type": "resource" }
  ],
  "edges": [
    { "from": 2, "to": 0, "type": "assignment" },
    { "from": 0, "to": 3, "type": "request" }
  ]
}
```

Invalid request body returns `400` with `{ "error": "message" }`.

## CORS

Configured to allow requests from the frontend dev server at `http://localhost:5173`.
