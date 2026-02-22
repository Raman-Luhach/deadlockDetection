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

## CORS

Configured to allow requests from the frontend dev server at `http://localhost:5173`.
