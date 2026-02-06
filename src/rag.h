/*
 * Deadlock Detection System
 * Resource Allocation Graph (RAG) header file
 */

#ifndef RAG_H
#define RAG_H

#include <stdbool.h>
#include "deadlock_detector.h"

// Edge types in RAG
typedef enum {
    REQUEST,    // Process → Resource (process is waiting)
    ASSIGNMENT  // Resource → Process (resource is assigned)
} EdgeType;

// Edge structure
typedef struct {
    int from;
    int to;
    EdgeType type;
} Edge;

// Resource Allocation Graph structure
typedef struct {
    int num_processes;
    int num_resources;
    int num_edges;
    Edge edges[MAX_PROCESSES * MAX_RESOURCES * 2];
    // Adjacency matrix: 0 = no edge, 1 = request, 2 = assignment
    int adj_matrix[MAX_PROCESSES + MAX_RESOURCES][MAX_PROCESSES + MAX_RESOURCES];
} RAG;

// Function Prototypes

/**
 * Build RAG from system state
 * @param state Pointer to SystemState
 * @param rag Pointer to RAG structure
 */
void build_rag(SystemState *state, RAG *rag);

/**
 * Detect cycle in RAG using DFS
 * @param rag Pointer to RAG structure
 * @return true if cycle exists (deadlock)
 */
bool detect_cycle_rag(RAG *rag);

/**
 * Display RAG in ASCII format
 * @param rag Pointer to RAG structure
 * @param state Pointer to SystemState for names
 */
void display_rag(RAG *rag, SystemState *state);

/**
 * Helper DFS function for cycle detection
 */
bool dfs_cycle(RAG *rag, int node, bool visited[], bool rec_stack[]);

#endif // RAG_H
