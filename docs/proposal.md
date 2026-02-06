# Operating Systems Mini Project – Proposal

## Project Title
**Deadlock Detection System**

## Student Name(s)
Raman Luhach
Rachit Kumar
Harshal Nerpagar

## Roll No(s)
230107
230128
230076


## Academic Year
2026

---

## 1. Problem Statement
In multi-programming operating systems, processes compete for limited resources, which can lead to a **deadlock** – a state where a set of processes are blocked indefinitely, each waiting for resources held by others. This project implements a system to **detect deadlock conditions** using the Banker's Algorithm and **resolve them** through process termination, demonstrating critical OS concepts in process synchronization.

---

## 2. Objectives

1. **Implement the Banker's Algorithm** for deadlock detection to identify unsafe states in resource allocation
2. **Visualize Resource Allocation Graph (RAG)** to demonstrate resource dependencies and circular wait conditions
3. **Provide deadlock resolution strategies** by identifying and terminating the minimum number of processes to break circular wait

---

## 3. Operating System Concepts Used

| Concept | Application in Project |
|---------|----------------------|
| **Deadlock** | Core focus – detection and resolution |
| **Process Synchronization** | Managing concurrent resource requests |
| **Resource Allocation** | Tracking allocation and maximum need matrices |
| **Mutual Exclusion** | Single-instance resource handling |
| **Circular Wait Detection** | Cycle detection in RAG |

---

## 4. Algorithms / Techniques

### 4.1 Banker's Algorithm (Deadlock Detection Variant)
- Uses Available, Allocation, and Need matrices
- Iteratively finds processes whose needs can be satisfied
- Marks remaining processes as deadlocked

### 4.2 Resource Allocation Graph (RAG) with Cycle Detection
- Represents processes and resources as graph nodes
- Request and assignment edges show dependencies
- DFS-based cycle detection identifies deadlock

### 4.3 Deadlock Resolution
- Process termination (victim selection based on priority)
- Resource preemption simulation

---

## 5. Tools & Technologies

| Component | Tool/Technology |
|-----------|-----------------|
| Language | C |
| Compiler | GCC |
| Platform | Console-based (Cross-platform) |
| Build System | Makefile |

---

## 6. Expected Outcome

The project will demonstrate:
- ✅ Accurate detection of deadlock conditions in a simulated multi-process environment
- ✅ Visual representation of the system state (matrices and RAG)
- ✅ Safe sequence computation when no deadlock exists
- ✅ Identification of deadlocked processes and resolution strategies
- ✅ Interactive console interface for user input and result display

---

**Guide Approval Signature:** ____________

**Date:** ____________
