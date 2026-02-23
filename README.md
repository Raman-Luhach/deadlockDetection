# Deadlock Detection System

An Operating Systems mini project implementing **deadlock detection** using the Banker's Algorithm and Resource Allocation Graph (RAG) analysis. The project has three layers: a C core program, an Express/TypeScript REST API, and a React/TypeScript frontend.

## Features

- **Banker's Algorithm** for deadlock detection and safe sequence computation
- **Resource Allocation Graph** visualization with cycle detection
- **Step-by-step mode** to walk through the algorithm one iteration at a time
- **Deadlock resolution** via process termination (lowest-index victim)
- **Simulate request** to test if granting a resource request is safe
- **Export/import** system state as JSON
- **Predefined sample scenarios** (safe and deadlock) matching the C program

## Project Structure

```
deadlockDetection/
├── src/                        # C core program
│   ├── main.c                  # Interactive console driver
│   ├── deadlock_detector.c/.h  # Banker's Algorithm implementation
│   └── rag.c/.h                # Resource Allocation Graph (text)
├── test/
│   ├── safe_state.txt          # Safe state test input
│   └── deadlock_state.txt      # Deadlock test input
├── docs/                       # Project documentation
│   ├── proposal.md
│   ├── srs.md
│   ├── design.md
│   └── report.md
├── api/                        # Express REST API (TypeScript)
│   └── src/
│       ├── server.ts           # Routes: detect, step, rag, resolve, simulate, export
│       ├── detector.ts         # Banker's Algorithm + step + resolve + simulate
│       └── rag.ts              # Build RAG nodes and edges from system state
├── frontend/                   # React + Vite frontend (TypeScript)
│   └── src/
│       ├── App.tsx             # React Router setup
│       ├── context/AppContext.tsx  # Shared state (config, result, highlight)
│       ├── types/              # SystemConfig, DetectionResult, StepState
│       ├── services/api.ts     # API client functions
│       ├── data/sampleScenarios.ts  # Predefined safe & deadlock configs
│       ├── components/
│       │   ├── Layout.tsx      # Navigation header + Outlet
│       │   ├── SystemConfigForm.tsx  # Matrix inputs with validation
│       │   ├── RagGraph.tsx    # React Flow graph visualization
│       │   └── StepByStepView.tsx   # Step-by-step Banker's controls
│       └── pages/
│           ├── LandingPage.tsx # Home with glossary
│           ├── HomePage.tsx    # Configure & Detect (config, result, RAG)
│           ├── RagPage.tsx     # Standalone RAG view
│           ├── StepPage.tsx    # Step-by-step walkthrough
│           └── SimulatePage.tsx  # Simulate a resource request
├── Makefile
└── README.md
```

## Quick Start

### C Program

```bash
make
./deadlock_detector
```

The console offers menu options to enter system configuration, display matrices, run deadlock detection, view the RAG, resolve deadlocks, and load sample scenarios.

### API Server

```bash
cd api
npm install
npm run dev
```

Starts on `http://localhost:3001`. Endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/detect` | Run Banker's Algorithm, return safe/deadlock result |
| POST | `/api/detect/step` | Execute one step of Banker's Algorithm |
| POST | `/api/rag` | Build RAG nodes and edges from system state |
| POST | `/api/resolve` | Terminate victim process and return new state |
| POST | `/api/simulate` | Check if granting a resource request is safe |
| POST | `/api/export` | Return system state as JSON |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. Pages:

- **Home** -- glossary of OS terms
- **Configure & Detect** -- enter matrices, run detection, view RAG, export/import
- **Resource Allocation Graph** -- standalone interactive graph
- **Step-by-Step** -- walk through Banker's Algorithm one iteration at a time
- **Simulate Request** -- test if a resource request would be safe to grant

## Sample Input

```
Processes: 5    Resources: 3    Available: [3, 3, 2]

Allocation:          Max Need:
P0: 0 1 0            P0: 7 5 3
P1: 2 0 0            P1: 3 2 2
P2: 3 0 2            P2: 9 0 2
P3: 2 1 1            P3: 2 2 2
P4: 0 0 2            P4: 4 3 3

Result: Safe -- sequence P1 -> P3 -> P4 -> P0 -> P2
```

## OS Concepts Demonstrated

- **Deadlock Detection** -- identifying circular wait conditions
- **Banker's Algorithm** -- checking if the system is in a safe state
- **Resource Allocation Graph** -- directed graph of process-resource relationships
- **Safe Sequence** -- an execution order where every process can finish
- **Deadlock Resolution** -- breaking deadlock by terminating a process

## Build History

This system was built iteratively in 21 commits:

1. `first commit` -- initial C deadlock detector
2. `init React app with Vite and project structure`
3. `feat(api): add Express server with health check and CORS`
4. `add POST /api/detect to run C deadlock detector and return JSON`
5. `add system configuration form with matrices and validation`
6. `feat(frontend): call detection API and display safe/deadlock result and sequence`
7. `add RAG endpoint returning nodes and edges as JSON`
8. `feat(frontend): render RAG with React Flow and legend`
9. `add step-by-step Banker's endpoint with Work, Finish, and explanation`
10. `feat(frontend): add step-by-step Banker's controls and step explanation display`
11. `highlight current process in matrices and RAG during step-by-step`
12. `add resolve endpoint to terminate victim and return new state and result`
13. `feat(frontend): resolve deadlock button and refresh state with victim and new result`
14. `export and import system state as JSON`
15. `load predefined safe and deadlock sample scenarios`
16. `feat(frontend): add React Router and shared layout with navigation`
17. `validation and user-friendly error handling`
18. `add simulate-request endpoint for deadlock avoidance check`
19. `feat(frontend): simulate request UI and display grant/block result`

## Author

Raman Luhach
Operating Systems Mini Project
Academic Year: 2025-2026
