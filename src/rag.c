/*
 * Deadlock Detection System
 * Resource Allocation Graph (RAG) implementation
 */

#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#include "rag.h"

// Build RAG from system state
void build_rag(SystemState *state, RAG *rag) {
    rag->num_processes = state->num_processes;
    rag->num_resources = state->num_resources;
    rag->num_edges = 0;
    
    int total_nodes = state->num_processes + state->num_resources;
    
    // Initialize adjacency matrix
    for (int i = 0; i < total_nodes; i++) {
        for (int j = 0; j < total_nodes; j++) {
            rag->adj_matrix[i][j] = 0;
        }
    }
    
    // Process nodes: 0 to num_processes-1
    // Resource nodes: num_processes to num_processes+num_resources-1
    
    for (int i = 0; i < state->num_processes; i++) {
        for (int j = 0; j < state->num_resources; j++) {
            int resource_node = state->num_processes + j;
            
            // Assignment edges: Resource → Process (allocation > 0)
            if (state->allocation[i][j] > 0) {
                rag->edges[rag->num_edges].from = resource_node;
                rag->edges[rag->num_edges].to = i;
                rag->edges[rag->num_edges].type = ASSIGNMENT;
                rag->adj_matrix[resource_node][i] = 2;  // Assignment
                rag->num_edges++;
            }
            
            // Request edges: Process → Resource (need > 0 and not fully allocated)
            if (state->need[i][j] > 0) {
                rag->edges[rag->num_edges].from = i;
                rag->edges[rag->num_edges].to = resource_node;
                rag->edges[rag->num_edges].type = REQUEST;
                rag->adj_matrix[i][resource_node] = 1;  // Request
                rag->num_edges++;
            }
        }
    }
}

// DFS helper for cycle detection
bool dfs_cycle(RAG *rag, int node, bool visited[], bool rec_stack[]) {
    visited[node] = true;
    rec_stack[node] = true;
    
    int total_nodes = rag->num_processes + rag->num_resources;
    
    for (int i = 0; i < total_nodes; i++) {
        if (rag->adj_matrix[node][i] != 0) {  // There's an edge
            if (!visited[i]) {
                if (dfs_cycle(rag, i, visited, rec_stack)) {
                    return true;
                }
            } else if (rec_stack[i]) {
                return true;  // Back edge found
            }
        }
    }
    
    rec_stack[node] = false;
    return false;
}

// Detect cycle in RAG
bool detect_cycle_rag(RAG *rag) {
    int total_nodes = rag->num_processes + rag->num_resources;
    bool visited[MAX_PROCESSES + MAX_RESOURCES] = {false};
    bool rec_stack[MAX_PROCESSES + MAX_RESOURCES] = {false};
    
    for (int i = 0; i < total_nodes; i++) {
        if (!visited[i]) {
            if (dfs_cycle(rag, i, visited, rec_stack)) {
                return true;
            }
        }
    }
    return false;
}

// Display RAG in ASCII format
void display_rag(RAG *rag, SystemState *state) {
    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║            RESOURCE ALLOCATION GRAPH (RAG)                ║\n");
    printf("╚═══════════════════════════════════════════════════════════╝\n");
    
    printf("\n  Legend:\n");
    printf("  ────────\n");
    printf("    [Px]     = Process node\n");
    printf("    (Rx)     = Resource node\n");
    printf("    ──────>  = Request edge (Process waits for Resource)\n");
    printf("    ─ ─ ─ >  = Assignment edge (Resource allocated to Process)\n");
    
    // Display processes
    printf("\n  Processes:  ");
    for (int i = 0; i < state->num_processes; i++) {
        printf("[%s] ", state->process_names[i]);
    }
    printf("\n");
    
    // Display resources
    printf("  Resources:  ");
    for (int j = 0; j < state->num_resources; j++) {
        printf("(%s) ", state->resource_names[j]);
    }
    printf("\n");
    
    // Display edges
    printf("\n  Edge List:\n");
    printf("  ──────────\n");
    
    int request_count = 0, assign_count = 0;
    
    for (int e = 0; e < rag->num_edges; e++) {
        Edge *edge = &rag->edges[e];
        if (edge->type == REQUEST) {
            printf("    [%s] ──────> (%s)   (Request)\n",
                   state->process_names[edge->from],
                   state->resource_names[edge->to - state->num_processes]);
            request_count++;
        } else {
            printf("    (%s) ─ ─ ─ > [%s]   (Assignment)\n",
                   state->resource_names[edge->from - state->num_processes],
                   state->process_names[edge->to]);
            assign_count++;
        }
    }
    
    printf("\n  Summary:\n");
    printf("  ─────────\n");
    printf("    Total Edges: %d\n", rag->num_edges);
    printf("    Request Edges: %d\n", request_count);
    printf("    Assignment Edges: %d\n", assign_count);
    
    // Cycle detection result
    printf("\n  Cycle Detection (DFS):\n");
    printf("  ───────────────────────\n");
    if (detect_cycle_rag(rag)) {
        printf("    ⚠  CYCLE DETECTED - Indicates potential deadlock!\n");
    } else {
        printf("    ✓  NO CYCLE - Graph is acyclic\n");
    }
    
    // Visual representation
    printf("\n  Visual Representation:\n");
    printf("  ───────────────────────\n\n");
    
    // Draw a simple graph representation
    printf("         ");
    for (int j = 0; j < state->num_resources; j++) {
        printf("   (%s)   ", state->resource_names[j]);
    }
    printf("\n");
    
    for (int i = 0; i < state->num_processes; i++) {
        printf("  [%s]", state->process_names[i]);
        for (int j = 0; j < state->num_resources; j++) {
            int rnode = state->num_processes + j;
            if (rag->adj_matrix[i][rnode] == 1 && rag->adj_matrix[rnode][i] == 2) {
                printf("  <──>   ");  // Both directions
            } else if (rag->adj_matrix[i][rnode] == 1) {
                printf("  ───>   ");  // Request
            } else if (rag->adj_matrix[rnode][i] == 2) {
                printf("  <───   ");  // Assignment
            } else {
                printf("         ");
            }
        }
        printf("\n");
    }
}
