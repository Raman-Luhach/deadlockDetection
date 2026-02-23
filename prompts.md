# Deadlock Detection System — 21-Iteration Build Prompts

This document contains one **overall system prompt** (use once per conversation to give context) and **21 iteration-specific prompts** (use one per iteration). Each iteration = one significant change = one git commit. **Each team member has exactly 7 commits** (Harshal 7, Rachit 7, Raman 7). The order is varied so the history looks natural: frontend work is mostly Harshal, API + integration is mixed (Rachit, Raman), with some same-author runs (e.g. two frontend commits in a row). **Commit 1 (Harshal — frontend init) is already done;** use iterations 2–21 for the remaining commits.

---

## How to Use

1. **Start of a new iteration:** Paste the **Overall System Prompt** (below) into the AI/system so it understands the project.
2. **Then append** the **Specific Prompt** for the iteration you are on (e.g. Iteration 5). *Commit 1 (Harshal) is already done — start from Iteration 2 for the next commit.*
3. **After the work is done:** Commit with the **Commit message** given for that iteration, then push. Use the assignee for that iteration so the commit history shows a natural mix (Harshal frontend-heavy, Rachit/Raman API and integration).

---

## Overall System Prompt (paste this first, then add the specific prompt)

```
Project context: This is a Deadlock Detection System (Operating Systems mini project). The existing codebase is in C:

- **Location:** Repository root is osProject. C source lives in `src/`.
- **Core logic:** 
  - `src/deadlock_detector.c` / `deadlock_detector.h`: Banker's Algorithm for deadlock detection. Data structures: SystemState (num_processes, num_resources, available[], allocation[][], max_need[][], need[][], process_names, resource_names) and DetectionResult (is_deadlocked, deadlocked_processes[], safe_sequence[], etc.). Functions: init_system_state, calculate_need_matrix, detect_deadlock, resolve_deadlock, display_state, display_result, can_satisfy.
  - `src/rag.c` / `rag.h`: Resource Allocation Graph. Builds RAG from SystemState (assignment edges: resource→process where allocation>0; request edges: process→resource where need>0). Has build_rag, detect_cycle_rag, display_rag, dfs_cycle. Nodes: processes 0..num_processes-1, resources num_processes..num_processes+num_resources-1.
  - `src/main.c`: Console menu driver (config input, run sample scenarios 1=safe / 2=deadlock, display state, check deadlock, display RAG, resolve). Sample scenario 1: 5 processes, 3 resources, classic safe state. Sample scenario 2: 4 processes, 3 resources, 0 available, deadlock.
- **Build:** `make` produces `deadlock_detector`; run with `./deadlock_detector`.

We are extending this into a full stack: a **REST API** (backend) that can run detection and RAG logic (by calling the C binary or a ported implementation), and a **web frontend** (React) that:
- Lets users enter or load system configuration (processes, resources, available, allocation, max need).
- Calls the API to detect deadlock and get results (safe/deadlock, safe sequence, deadlocked process list).
- Displays matrices (Allocation, Max Need, Need, Available) and the Resource Allocation Graph (process and resource nodes; request and assignment edges).
- Supports step-by-step Banker's algorithm, deadlock resolution (victim selection), export/import of state, sample scenarios, and optionally request simulation (avoidance).

Keep the C project intact and runnable. Add new code (API, frontend) in separate directories (e.g. `api/`, `frontend/`) at the repo root. Follow the iteration prompts for what to build in each step.
```

After pasting the above, add the **Specific Prompt** for your current iteration (e.g. "Iteration 3 — Raman: ...").

---

## Iteration 1 — Harshal

**What to do:** Set up the frontend project. Create a new directory `frontend/` at the repository root. Initialize a React app (use Vite + React + TypeScript). Set up the folder structure: e.g. `src/components`, `src/pages`, `src/services`, `src/types`, `src/hooks`. Add a minimal home page that shows the project title "Deadlock Detection System" and a short subtitle. Ensure the app runs with `npm run dev` (or equivalent). Do not add backend or API calls yet.

**Commit message:** `feat(frontend): init React app with Vite and project structure`

---

## Iteration 2 — Rachit

**What to do:** Set up the backend API. Create a new directory `api/` at the repository root. Initialize a Node.js project (e.g. Express with TypeScript or JavaScript). Add a single health check endpoint, e.g. `GET /health`, that returns `{ "status": "ok", "service": "deadlock-detection-api" }`. Configure CORS to allow requests from the frontend origin (e.g. `http://localhost:5173`). Add a README or comment in `api/` explaining how to run the API (e.g. `npm run dev` or `node server.js`). The API should not call the C program yet.

**Commit message:** `feat(api): add Express server with health check and CORS`

---

## Iteration 3 — Raman

**What to do:** Add an API endpoint that runs deadlock detection. Define a JSON schema for the request body: `num_processes`, `num_resources`, `available` (array), `allocation` (2D array), `max_need` (2D array). The API should either: (a) invoke the existing C binary `./deadlock_detector` with this input (e.g. via stdin or a temp file) and parse its output, or (b) spawn a helper script that runs the C program and returns JSON. Response JSON must include: `is_deadlocked` (boolean), `deadlocked_processes` (array of indices), `safe_sequence` (array of process indices), `safe_sequence_length`. Document the endpoint (e.g. `POST /api/detect`) and the request/response shape in a comment or in the API README.

**Commit message:** `feat(api): add POST /api/detect to run C deadlock detector and return JSON`

---

## Iteration 4 — Harshal

**What to do:** Build the system configuration input UI in the frontend. Create a page or section where the user can enter: number of processes (1–10), number of resources (1–10), available resources (one input per resource type), allocation matrix (grid: rows = processes, columns = resources), and maximum need matrix (same grid). Use controlled components and local state (or a single state object). Validate inputs (positive integers, dimensions consistent with num_processes and num_resources). Show process labels (P0, P1, …) and resource labels (R0, R1, …). Include a "Submit" or "Save configuration" button that stores the config in frontend state (no API call yet). Layout should be clear and usable.

**Commit message:** `feat(frontend): add system configuration form with matrices and validation`

---

## Iteration 5 — Rachit

**What to do:** Connect the configuration to the detection API. When the user has entered (or loaded) a valid configuration, add a "Check for deadlock" (or "Detect") button. On click, send the current state (num_processes, num_resources, available, allocation, max_need) to `POST /api/detect`. Parse the response and display: (1) status — "Safe" or "Deadlock detected"; (2) if safe, the safe sequence as a list (e.g. P1 → P3 → P4 → P0 → P2); (3) if deadlock, the list of deadlocked process names/indices. Show loading state during the request and a simple error message if the API call fails. Use the existing API base URL (e.g. from an env variable or constant).

**Commit message:** `feat(frontend): call detection API and display safe/deadlock result and sequence`

---

## Iteration 6 — Harshal

**What to do:** Add a "Current state" or "Matrices" view in the frontend. After the user has configuration (and optionally after detection), display four tables: Available resources (one row with values per resource), Allocation matrix (processes × resources), Maximum need matrix (same dimensions), Need matrix (Max − Allocation, computed in frontend or from API if you add it later). Use the same process and resource labels (P0…, R0…). Tables should be readable (headers, alignment). This view can be on the same page as the result or a separate section/tab; ensure it updates when configuration or detection result changes.

**Commit message:** `feat(frontend): display Allocation, Max Need, Need, and Available matrices`

---

## Iteration 7 — Raman

**What to do:** Expose RAG data from the backend. Add an API endpoint (e.g. `POST /api/rag` or include RAG in the detect response) that accepts the same state JSON (num_processes, num_resources, available, allocation, max_need). The server must compute the need matrix and build the RAG: list of nodes (process nodes and resource nodes with ids and labels) and list of edges (from, to, type: "request" | "assignment"). Process nodes: id 0 to num_processes-1; resource nodes: id num_processes to num_processes+num_resources-1. Assignment edge: resource → process (allocation > 0); request edge: process → resource (need > 0). Return JSON: `{ "nodes": [...], "edges": [...] }`. You may implement this by calling the C code (e.g. a small C program that outputs RAG as JSON) or by porting the RAG build logic to Node.

**Commit message:** `feat(api): add RAG endpoint returning nodes and edges as JSON`

---

## Iteration 8 — Rachit

**What to do:** Render the Resource Allocation Graph in the frontend. Use a graph library (e.g. React Flow, or D3/Cytoscape if preferred). Fetch RAG data from the API (using current state). Draw nodes: process nodes (e.g. labeled P0, P1, …) and resource nodes (R0, R1, …). Draw edges: request (process → resource) and assignment (resource → process), with distinct styling (e.g. solid vs dashed, or different colors). Include a legend explaining "Process", "Resource", "Request", "Assignment". Layout can be automatic (dagre/layout) or a simple grid. Ensure the graph updates when the user changes configuration or runs detection again.

**Commit message:** `feat(frontend): render RAG with React Flow (or chosen library) and legend`

---

## Iteration 9 — Harshal

**What to do:** Enhance the RAG view with deadlock highlighting. When the detection result indicates deadlock, visually highlight the deadlocked process nodes (e.g. red border or fill). Optionally highlight the cycle (edges that form the cycle) if the API provides cycle info. Update the legend to explain "Deadlocked process". Ensure that when the state is safe, no nodes are highlighted as deadlocked. Keep existing request/assignment edge styling.

**Commit message:** `feat(frontend): highlight deadlocked processes and optional cycle in RAG`

---

## Iteration 10 — Raman

**What to do:** Add step-by-step Banker's algorithm to the API. Create an endpoint (e.g. `POST /api/detect/step`) that accepts the current state plus a "step state" (e.g. current Work array, Finish array, safe_sequence_so_far). Return the next step: which process was selected (index or null if none/done), updated Work, updated Finish, updated safe_sequence, and a short explanation string (e.g. "Selected P3: Need(P3) ≤ Work; add P3 to sequence"). If no process can be selected and not all finished, return deadlock and list of unfinished process indices. Implement this by porting one step of the Banker's loop to Node or by invoking C with step state. Document request/response format.

**Commit message:** `feat(api): add step-by-step Banker's endpoint with Work, Finish, and explanation`

---

## Iteration 11 — Rachit

**What to do:** Add step-by-step controls in the frontend. Add a "Step-by-step" mode or page. Buttons: "Start", "Next step", "Reset". When "Start", call the API to get the first step (or initialize step state and get first step). Display the current step number, the explanation text, and the current safe sequence so far. On "Next step", send current Work/Finish/sequence to the API and show the next step; when done or deadlock, disable "Next step" and show final result. "Reset" clears step state and allows starting again. Reuse the same state (config) as the main detection view.

**Commit message:** `feat(frontend): add step-by-step Banker's controls and step explanation display`

---

## Iteration 12 — Harshal

**What to do:** Sync step-by-step view with matrices and graph. When the user is in step-by-step mode and clicks "Next step", highlight the currently selected process in the Allocation/Max Need/Need tables (e.g. highlight the row for that process). Optionally show the current Work vector (e.g. as an extra row or a small panel). In the RAG view (if shown on the same page), highlight the process node that was just selected in that step. Use consistent colors (e.g. one color for "current step process"). Ensure highlighting updates on every "Next step" and clears on "Reset".

**Commit message:** `feat(frontend): highlight current process in matrices and RAG during step-by-step`

---

## Iteration 13 — Raman

**What to do:** Add deadlock resolution to the API. Create an endpoint (e.g. `POST /api/resolve`) that accepts the current state and optionally a victim process index. If no victim is provided, compute one (e.g. minimum total allocation among deadlocked processes). Return the new state after "terminating" the victim: update available (add victim's allocation), zero out victim's allocation and max_need, and return the updated state plus the result of running detection on the new state (is_deadlocked, safe_sequence, etc.). If the state is not deadlocked, return an error or no-op. Document the endpoint and response (new state + detection result).

**Commit message:** `feat(api): add resolve endpoint to terminate victim and return new state and result`

---

## Iteration 14 — Rachit

**What to do:** Add deadlock resolution to the frontend. When the detection result is "Deadlock", show a "Resolve deadlock" button. On click, call `POST /api/resolve` (with current state; victim can be auto-selected by API). Display which process was chosen as victim and that it was terminated. Refresh the displayed state (matrices, available) with the response. Re-run or display the new detection result (safe sequence or still deadlocked). If still deadlocked, allow the user to click "Resolve" again. Optionally show a short message like "Resources released from P2" and the new safe sequence when resolved.

**Commit message:** `feat(frontend): resolve deadlock button and refresh state with victim and new result`

---

## Iteration 15 — Raman

**What to do:** Add export and import of system state. In the API, add `GET /api/export` (or include in another flow) that returns the current state as JSON (num_processes, num_resources, available, allocation, max_need). In the frontend, add "Export state" (download a JSON file) and "Import state" (file picker, parse JSON, validate, and load into the configuration form). Validate imported data (dimensions, non-negative numbers, need = max - allocation consistent if you store need). After import, user can run detection or step-by-step as usual.

**Commit message:** `feat(api+frontend): export and import system state as JSON`

---

## Iteration 16 — Harshal

**What to do:** Add predefined sample scenarios in the frontend. Provide two buttons or dropdown options: "Load safe scenario" and "Load deadlock scenario". Use the same numbers as the C program: Safe = 5 processes, 3 resources, available [3,3,2], allocation and max_need as in main.c scenario 1; Deadlock = 4 processes, 3 resources, available [0,0,0], allocation and max_need as in main.c scenario 2. On selection, populate the configuration (and matrices view) with this data so the user can immediately run "Check for deadlock" or "Step-by-step" without typing. Optionally show a short label like "Classic Banker's safe example" / "Circular wait deadlock".

**Commit message:** `feat(frontend): load predefined safe and deadlock sample scenarios`

---

## Iteration 17 — Rachit

**What to do:** Add simple routing and a consistent layout. Use React Router (or similar). Define routes, e.g.: `/` (home), `/config` (configuration and detection), `/rag` (RAG view), `/step` (step-by-step mode). Add a small navigation (links or tabs) so the user can switch between Config, RAG, and Step-by-step without losing state (lift state to a parent or use a shared store/context). Ensure the layout (header with project title, nav, main content area) is consistent across pages. The home page can summarize the app and link to Config.

**Commit message:** `feat(frontend): add React Router and shared layout with navigation`

---

## Iteration 18 — Raman

**What to do:** Improve error handling and validation. In the API: validate request body (types, array lengths, non-negative values, allocation ≤ max_need). Return 400 with a clear message for invalid input. In the frontend: validate forms before submit (e.g. allocation ≤ max_need per cell), show inline or toast errors. On API errors (network or 4xx/5xx), show a user-friendly message and do not leave the UI in a broken state. Optionally add a simple loading spinner or disabled buttons during requests. Document validation rules in a short comment or README.

**Commit message:** `chore(api+frontend): validation and user-friendly error handling`

---

## Iteration 19 — Raman

**What to do:** Add request simulation (deadlock avoidance) to the API. Create an endpoint (e.g. `POST /api/simulate-request`) that accepts current state plus a request: process index, resource index, and amount. Simulate granting the request: subtract amount from available[resource], add to allocation[process]. Run the Banker's safety algorithm on this temporary state. Return: `granted` (boolean), `is_safe` (boolean), and optionally a message (e.g. "Granting would lead to unsafe state"). Do not modify the stored state; this is a dry run. Revert the temporary state after the check.

**Commit message:** `feat(api): add simulate-request endpoint for deadlock avoidance check`

---

## Iteration 20 — Rachit

**What to do:** Add request simulation to the frontend. In the config or a dedicated section, add "Simulate request": inputs for process (dropdown or index), resource (dropdown or index), and amount. A "Check if safe" (or "Simulate") button calls `POST /api/simulate-request`. Display the result: "Would grant: safe" or "Would block: unsafe" (or similar), with the API message. Optionally disable the button when the current state is already deadlocked. Keep the UI clear so the user understands this does not change the actual state.

**Commit message:** `feat(frontend): simulate request UI and display grant/block result`

---

## Iteration 21 — Harshal

**What to do:** Final polish and documentation. (1) Frontend: small UI improvements (spacing, responsive layout if needed, tooltips or a short glossary for terms: Allocation, Max Need, Need, Safe sequence, RAG, Request/Assignment). (2) Root README: describe the project; how to build and run the C program (`make`, `./deadlock_detector`); how to run the API (`cd api && npm install && npm run dev`); how to run the frontend (`cd frontend && npm install && npm run dev`); and that the system was built in 21 iterations with prompts. Optionally list the 21 commit titles. Do not change core behavior; focus on clarity and completeness for submission.

**Commit message:** `docs: README and frontend polish, glossary and 21-iteration summary`

---

## Quick reference: assignee and commit per iteration

Commit order is varied so the history looks natural (frontend clusters, backend clusters, mixed integration). Each person has 7 commits.

| Iteration | Assignee | Commit message |
|-----------|----------|-----------------|
| 1 | Harshal ✓ (done) | `feat(frontend): init React app with Vite and project structure` |
| 2 | Rachit | `feat(api): add Express server with health check and CORS` |
| 3 | Raman | `feat(api): add POST /api/detect to run C deadlock detector and return JSON` |
| 4 | Harshal | `feat(frontend): add system configuration form with matrices and validation` |
| 5 | Rachit | `feat(frontend): call detection API and display safe/deadlock result and sequence` |
| 6 | Harshal | `feat(frontend): display Allocation, Max Need, Need, and Available matrices` |
| 7 | Raman | `feat(api): add RAG endpoint returning nodes and edges as JSON` |
| 8 | Rachit | `feat(frontend): render RAG with React Flow (or chosen library) and legend` |
| 9 | Harshal | `feat(frontend): highlight deadlocked processes and optional cycle in RAG` |
| 10 | Raman | `feat(api): add step-by-step Banker's endpoint with Work, Finish, and explanation` |
| 11 | Rachit | `feat(frontend): add step-by-step Banker's controls and step explanation display` |
| 12 | Harshal | `feat(frontend): highlight current process in matrices and RAG during step-by-step` |
| 13 | Raman | `feat(api): add resolve endpoint to terminate victim and return new state and result` |
| 14 | Rachit | `feat(frontend): resolve deadlock button and refresh state with victim and new result` |
| 15 | Raman | `feat(api+frontend): export and import system state as JSON` |
| 16 | Harshal | `feat(frontend): load predefined safe and deadlock sample scenarios` |
| 17 | Rachit | `feat(frontend): add React Router and shared layout with navigation` |
| 18 | Raman | `chore(api+frontend): validation and user-friendly error handling` |
| 19 | Raman | `feat(api): add simulate-request endpoint for deadlock avoidance check` |
| 20 | Rachit | `feat(frontend): simulate request UI and display grant/block result` |
| 21 | Harshal | `docs: README and frontend polish, glossary and 21-iteration summary` |

**Summary by person (7 each):**  
- **Harshal:** 1, 4, 6, 9, 12, 16, 21 (frontend init, config, matrices, RAG highlight, step highlight, samples, polish)  
- **Rachit:** 2, 5, 8, 11, 14, 17, 20 (API skeleton, detect UI, RAG graph, step UI, resolve UI, router, simulate UI)  
- **Raman:** 3, 7, 10, 13, 15, 18, 19 (detect API, RAG API, step API, resolve API, export/import, validation, simulate API)
