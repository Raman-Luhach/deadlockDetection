# Deadlock Detection System

An Operating Systems mini project implementing **deadlock detection** using the Banker's Algorithm and Resource Allocation Graph (RAG) analysis.

## Features

- ✅ **Banker's Algorithm** for deadlock detection
- ✅ **Safe sequence computation** when no deadlock exists
- ✅ **Resource Allocation Graph** visualization with cycle detection
- ✅ **Deadlock resolution** via process termination
- ✅ Interactive console interface with sample scenarios

## Quick Start

```bash
# Build the project
make

# Run the program
./deadlock_detector
```

## Project Structure

```
osProject/
├── docs/
│   ├── proposal.md      # Project proposal
│   ├── srs.md           # Software Requirements Specification
│   ├── design.md        # Design document with flowcharts
│   └── report.md        # Final project report
├── src/
│   ├── main.c           # Main driver program
│   ├── deadlock_detector.c/.h  # Banker's Algorithm implementation
│   └── rag.c/.h         # Resource Allocation Graph
├── test/
│   ├── safe_state.txt   # Safe state test input
│   └── deadlock_state.txt  # Deadlock test input
├── Makefile
└── README.md
```

## Usage

### Menu Options

1. **Enter System Configuration** - Input processes, resources, and matrices
2. **Display Current State** - View all matrices (Allocation, Max, Need)
3. **Check for Deadlock** - Run Banker's Algorithm
4. **Display RAG** - Visualize Resource Allocation Graph
5. **Resolve Deadlock** - Terminate processes to break deadlock
6. **Sample Scenario (Safe)** - Load pre-configured safe state
7. **Sample Scenario (Deadlock)** - Load pre-configured deadlock state

### Sample Input Format

```
Number of processes: 5
Number of resources: 3
Available: 3 3 2

Allocation Matrix:
P0: 0 1 0
P1: 2 0 0
P2: 3 0 2
P3: 2 1 1
P4: 0 0 2

Maximum Matrix:
P0: 7 5 3
P1: 3 2 2
P2: 9 0 2
P3: 2 2 2
P4: 4 3 3
```

## OS Concepts Demonstrated

- **Deadlock Detection** - Identifying circular wait conditions
- **Resource Allocation** - Managing shared resources among processes
- **Safe State** - Computing execution sequences
- **Process Synchronization** - Handling concurrent resource requests

## Author

Raman Luhach  
Operating Systems Mini Project  
Academic Year: 2025-2026
# deadlockDetection
