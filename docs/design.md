# Design Document
## Deadlock Detection System

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MAIN PROGRAM                             │
│                         (main.c)                                │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  User Input   │  │    Menu      │  │   Result Display    │  │
│  │   Handler     │  │   System     │  │      Module         │  │
│  └───────┬───────┘  └──────┬───────┘  └──────────┬──────────┘  │
└──────────┼─────────────────┼─────────────────────┼──────────────┘
           │                 │                     │
           ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DEADLOCK DETECTOR MODULE                      │
│                    (deadlock_detector.c)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Need Matrix     │  │  Banker's       │  │  Deadlock      │  │
│  │ Calculator      │  │  Algorithm      │  │  Resolver      │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RAG MODULE                               │
│                          (rag.c)                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  Graph Builder  │  │ Cycle Detector  │  │  Graph Display │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Algorithm Description

### 2.1 Banker's Algorithm for Deadlock Detection

**Input:**
- `n` = Number of processes
- `m` = Number of resource types
- `Available[m]` = Available instances of each resource
- `Allocation[n][m]` = Currently allocated resources
- `Max[n][m]` = Maximum resource requirements

**Algorithm Steps:**

```
FUNCTION detect_deadlock():
    1. Calculate Need[n][m] = Max[n][m] - Allocation[n][m]
    
    2. Initialize:
       Work[m] = Available[m]
       Finish[n] = {false, false, ..., false}
       SafeSequence[] = empty
    
    3. REPEAT:
       a. Find index i such that:
          - Finish[i] == false
          - Need[i][j] <= Work[j] for all j = 0 to m-1
       
       b. IF such i exists:
          - Work[j] = Work[j] + Allocation[i][j] for all j
          - Finish[i] = true
          - Add i to SafeSequence
       
       c. ELSE:
          - Break loop
    
    4. IF all Finish[i] == true:
       - RETURN "No Deadlock - Safe Sequence found"
       
    5. ELSE:
       - Collect all i where Finish[i] == false
       - RETURN "DEADLOCK - Processes {i} are deadlocked"
```

### 2.2 Cycle Detection in RAG (DFS-based)

```
FUNCTION detect_cycle():
    1. Build adjacency list from:
       - Request edges: Process → Resource (process waiting for resource)
       - Assignment edges: Resource → Process (resource held by process)
    
    2. Initialize:
       visited[n+m] = {false}
       recStack[n+m] = {false}
    
    3. FOR each node v in graph:
       IF NOT visited[v]:
          IF dfs_cycle(v, visited, recStack):
             RETURN true  // Cycle found = Deadlock
    
    4. RETURN false  // No cycle

FUNCTION dfs_cycle(v, visited, recStack):
    visited[v] = true
    recStack[v] = true
    
    FOR each neighbor u of v:
       IF NOT visited[u] AND dfs_cycle(u, visited, recStack):
          RETURN true
       ELSE IF recStack[u]:
          RETURN true  // Back edge found = Cycle
    
    recStack[v] = false
    RETURN false
```

---

## 3. Flowchart

```
                    ┌─────────────┐
                    │    START    │
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
                    │ Display Menu│
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
                    │ Get Choice  │
                    └──────┬──────┘
                           ▼
              ┌────────────┴────────────┐
              │       Choice = ?        │
              └────────────┬────────────┘
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
    ┌─────────┐      ┌──────────┐      ┌──────────┐
    │ Input   │      │  Detect  │      │  Display │
    │ Config  │      │ Deadlock │      │   RAG    │
    └────┬────┘      └────┬─────┘      └────┬─────┘
         ▼                ▼                  ▼
    ┌─────────┐      ┌──────────┐      ┌──────────┐
    │ Store   │      │Calculate │      │Build Graph│
    │Matrices │      │Need Matrix│     │ from State│
    └────┬────┘      └────┬─────┘      └────┬─────┘
         │                ▼                  ▼
         │          ┌──────────┐      ┌──────────┐
         │          │ Run      │      │ ASCII    │
         │          │ Banker's │      │ Display  │
         │          └────┬─────┘      └────┬─────┘
         │                ▼                  │
         │          ┌──────────┐             │
         │          │Deadlock? │             │
         │          └────┬─────┘             │
         │         Yes/  │  \No              │
         │           ▼   │   ▼               │
         │     ┌──────┐  │  ┌─────────┐      │
         │     │Show  │  │  │Show Safe│      │
         │     │Procs │  │  │Sequence │      │
         │     └──┬───┘  │  └────┬────┘      │
         │        ▼      │       │           │
         │     ┌──────┐  │       │           │
         │     │Resolve│ │       │           │
         │     └──┬───┘  │       │           │
         │        │      │       │           │
         └────────┴──────┴───────┴───────────┘
                           ▼
                    ┌─────────────┐
                    │ Exit = 0?   │
                    └──────┬──────┘
                      No/  │  \Yes
                        ▼  │   ▼
                   Loop    │  ┌─────┐
                   Back    │  │ END │
                           │  └─────┘
```

---

## 4. Data Structures Used

### 4.1 System State Structure
```c
#define MAX_PROCESSES 10
#define MAX_RESOURCES 10

typedef struct {
    int num_processes;
    int num_resources;
    int available[MAX_RESOURCES];
    int allocation[MAX_PROCESSES][MAX_RESOURCES];
    int max_need[MAX_PROCESSES][MAX_RESOURCES];
    int need[MAX_PROCESSES][MAX_RESOURCES];
    char process_names[MAX_PROCESSES][10];
} SystemState;
```

### 4.2 Detection Result Structure
```c
typedef struct {
    int is_deadlocked;
    int deadlocked_processes[MAX_PROCESSES];
    int num_deadlocked;
    int safe_sequence[MAX_PROCESSES];
    int safe_sequence_length;
} DetectionResult;
```

### 4.3 RAG Edge Structure
```c
typedef enum { REQUEST, ASSIGNMENT } EdgeType;

typedef struct {
    int from;      // Source node
    int to;        // Destination node
    EdgeType type; // REQUEST or ASSIGNMENT
} Edge;

typedef struct {
    int num_nodes;
    int num_edges;
    Edge edges[MAX_PROCESSES * MAX_RESOURCES * 2];
    int adj_list[MAX_PROCESSES + MAX_RESOURCES][MAX_PROCESSES + MAX_RESOURCES];
} RAG;
```

### 4.4 Arrays Used

| Array | Type | Purpose |
|-------|------|---------|
| `Available[m]` | int[] | Available resource instances |
| `Allocation[n][m]` | int[][] | Current resource allocation |
| `Max[n][m]` | int[][] | Maximum resource needs |
| `Need[n][m]` | int[][] | Remaining needs (Max - Allocation) |
| `Work[m]` | int[] | Working copy of Available |
| `Finish[n]` | bool[] | Process completion status |
| `SafeSequence[n]` | int[] | Order of safe execution |

---

## 5. Module Interface

### 5.1 deadlock_detector.h
```c
// Initialize system state
void init_system_state(SystemState *state);

// Calculate need matrix
void calculate_need_matrix(SystemState *state);

// Detect deadlock using Banker's Algorithm
DetectionResult detect_deadlock(SystemState *state);

// Resolve deadlock by process termination
void resolve_deadlock(SystemState *state, DetectionResult *result);

// Display matrices
void display_state(SystemState *state);
```

### 5.2 rag.h
```c
// Build RAG from system state
void build_rag(SystemState *state, RAG *rag);

// Detect cycle in RAG
int detect_cycle_rag(RAG *rag);

// Display RAG in ASCII
void display_rag(RAG *rag, SystemState *state);
```
