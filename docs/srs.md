# Software Requirements Specification (SRS)
## Deadlock Detection System

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for a **Deadlock Detection System** that simulates resource allocation in an operating system environment and detects/resolves deadlock conditions.

### 1.2 Scope
The system provides:
- Input interface for process and resource configurations
- Deadlock detection using Banker's Algorithm
- Resource Allocation Graph visualization
- Safe sequence computation and deadlock resolution

### 1.3 Definitions
| Term | Definition |
|------|------------|
| **Deadlock** | A state where processes wait indefinitely for resources held by each other |
| **Safe State** | A state where there exists at least one sequence to complete all processes |
| **RAG** | Resource Allocation Graph showing process-resource dependencies |

---

## 2. Functional Requirements

### FR-01: Process Input
- System shall accept the number of processes (1-10)
- System shall accept process names/IDs

### FR-02: Resource Input
- System shall accept the number of resource types (1-10)
- System shall accept available instances of each resource
- System shall accept allocation matrix (current resource holdings)
- System shall accept maximum need matrix

### FR-03: Deadlock Detection
- System shall compute the Need matrix (Max - Allocation)
- System shall implement Banker's Algorithm for detection
- System shall identify all deadlocked processes

### FR-04: Safe Sequence
- System shall compute safe execution sequence if no deadlock
- System shall display the sequence to the user

### FR-05: RAG Visualization
- System shall display Resource Allocation Graph in ASCII format
- System shall show request and assignment edges

### FR-06: Deadlock Resolution
- System shall suggest process termination to resolve deadlock
- System shall recalculate state after resolution

### FR-07: Result Display
- System shall clearly display detection results
- System shall show all matrices (Allocation, Max, Need, Available)

---

## 3. Non-Functional Requirements

### NFR-01: Usability
- User-friendly console interface with clear prompts
- Input validation with meaningful error messages
- Menu-driven navigation

### NFR-02: Performance
- Detection algorithm shall complete within 1 second for up to 10 processes
- Immediate response for user interactions

### NFR-03: Portability
- Platform independent (compiles on Linux, macOS, Windows with GCC)
- No external library dependencies

### NFR-04: Reliability
- Deterministic output for same input
- Graceful handling of invalid inputs
- No memory leaks or crashes

### NFR-05: Maintainability
- Modular code structure with separate header files
- Well-commented source code
- Consistent coding style

---

## 4. Constraints

| Constraint | Description |
|------------|-------------|
| Language | Must be implemented in C |
| Interface | Console-based only (no GUI) |
| Compiler | GCC compatible |
| Resources | Maximum 10 processes, 10 resource types |

---

## 5. Assumptions

1. User provides valid numerical input within specified ranges
2. Single system environment (no distributed resources)
3. Resources are reusable (not consumable)
4. Each resource type has at least one instance
5. Processes do not change their maximum requirements during execution

---

## 6. System Interface

### 6.1 Main Menu
```
====================================
   DEADLOCK DETECTION SYSTEM
====================================
1. Enter System Configuration
2. Display Current State
3. Check for Deadlock
4. Display Resource Allocation Graph
5. Resolve Deadlock
6. Run Sample Scenario
0. Exit
====================================
Enter choice:
```

### 6.2 Input Format
```
Enter number of processes: 5
Enter number of resource types: 3
Enter Available resources: 3 3 2

Enter Allocation Matrix (5x3):
P0: 0 1 0
P1: 2 0 0
...

Enter Maximum Matrix (5x3):
P0: 7 5 3
P1: 3 2 2
...
```

### 6.3 Output Format
```
=== DEADLOCK DETECTION RESULT ===
Status: NO DEADLOCK DETECTED
Safe Sequence: P1 -> P3 -> P4 -> P0 -> P2

Need Matrix:
    R0  R1  R2
P0   7   4   3
...
```
