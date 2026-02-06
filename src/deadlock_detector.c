/*
 * Deadlock Detection System
 * Core implementation of Banker's Algorithm for deadlock detection
 */

#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#include "deadlock_detector.h"

// Initialize system state with default values
void init_system_state(SystemState *state) {
    state->num_processes = 0;
    state->num_resources = 0;
    
    for (int i = 0; i < MAX_RESOURCES; i++) {
        state->available[i] = 0;
    }
    
    for (int i = 0; i < MAX_PROCESSES; i++) {
        sprintf(state->process_names[i], "P%d", i);
        for (int j = 0; j < MAX_RESOURCES; j++) {
            state->allocation[i][j] = 0;
            state->max_need[i][j] = 0;
            state->need[i][j] = 0;
        }
    }
    
    for (int i = 0; i < MAX_RESOURCES; i++) {
        sprintf(state->resource_names[i], "R%d", i);
    }
}

// Calculate Need matrix (Need = Max - Allocation)
void calculate_need_matrix(SystemState *state) {
    for (int i = 0; i < state->num_processes; i++) {
        for (int j = 0; j < state->num_resources; j++) {
            state->need[i][j] = state->max_need[i][j] - state->allocation[i][j];
        }
    }
}

// Check if a process's needs can be satisfied with available work
bool can_satisfy(int need[], int work[], int num_resources) {
    for (int j = 0; j < num_resources; j++) {
        if (need[j] > work[j]) {
            return false;
        }
    }
    return true;
}

// Banker's Algorithm for Deadlock Detection
DetectionResult detect_deadlock(SystemState *state) {
    DetectionResult result;
    result.is_deadlocked = false;
    result.num_deadlocked = 0;
    result.safe_sequence_length = 0;
    
    // Calculate need matrix
    calculate_need_matrix(state);
    
    // Initialize Work = Available
    int work[MAX_RESOURCES];
    for (int j = 0; j < state->num_resources; j++) {
        work[j] = state->available[j];
    }
    
    // Initialize Finish array
    bool finish[MAX_PROCESSES];
    for (int i = 0; i < state->num_processes; i++) {
        finish[i] = false;
    }
    
    // Find safe sequence
    int count = 0;
    bool found;
    
    do {
        found = false;
        for (int i = 0; i < state->num_processes; i++) {
            if (!finish[i]) {
                // Check if process i's needs can be satisfied
                if (can_satisfy(state->need[i], work, state->num_resources)) {
                    // Release resources
                    for (int j = 0; j < state->num_resources; j++) {
                        work[j] += state->allocation[i][j];
                    }
                    finish[i] = true;
                    result.safe_sequence[count++] = i;
                    found = true;
                }
            }
        }
    } while (found);
    
    result.safe_sequence_length = count;
    
    // Check for deadlock
    for (int i = 0; i < state->num_processes; i++) {
        if (!finish[i]) {
            result.is_deadlocked = true;
            result.deadlocked_processes[result.num_deadlocked++] = i;
        }
    }
    
    return result;
}

// Resolve deadlock by terminating processes
void resolve_deadlock(SystemState *state, DetectionResult *result) {
    if (!result->is_deadlocked || result->num_deadlocked == 0) {
        printf("\n[INFO] No deadlock to resolve.\n");
        return;
    }
    
    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║              DEADLOCK RESOLUTION                          ║\n");
    printf("╚═══════════════════════════════════════════════════════════╝\n");
    
    // Find process with minimum allocated resources to terminate
    int min_resources = 0;
    int victim = result->deadlocked_processes[0];
    
    for (int i = 0; i < state->num_resources; i++) {
        min_resources += state->allocation[victim][i];
    }
    
    for (int i = 1; i < result->num_deadlocked; i++) {
        int proc = result->deadlocked_processes[i];
        int total = 0;
        for (int j = 0; j < state->num_resources; j++) {
            total += state->allocation[proc][j];
        }
        if (total < min_resources) {
            min_resources = total;
            victim = proc;
        }
    }
    
    printf("\n  Resolution Strategy: Process Termination\n");
    printf("  ─────────────────────────────────────────\n");
    printf("  Victim Selection Criteria: Minimum Resources Held\n");
    printf("\n  ▶ Selected Victim: %s (holding %d resource units)\n", 
           state->process_names[victim], min_resources);
    
    // Release victim's resources
    printf("\n  Resources Released:\n");
    for (int j = 0; j < state->num_resources; j++) {
        if (state->allocation[victim][j] > 0) {
            printf("    • %s: %d units\n", 
                   state->resource_names[j], state->allocation[victim][j]);
            state->available[j] += state->allocation[victim][j];
            state->allocation[victim][j] = 0;
            state->max_need[victim][j] = 0;
        }
    }
    
    printf("\n  Action: %s terminated and resources released.\n", 
           state->process_names[victim]);
    printf("\n  ▶ Re-running deadlock detection...\n");
    
    // Recalculate
    *result = detect_deadlock(state);
    
    if (result->is_deadlocked) {
        printf("\n  [!] Deadlock still exists. More processes need termination.\n");
    } else {
        printf("\n  [✓] Deadlock resolved successfully!\n");
        printf("  New Safe Sequence: ");
        for (int i = 0; i < result->safe_sequence_length; i++) {
            printf("%s", state->process_names[result->safe_sequence[i]]);
            if (i < result->safe_sequence_length - 1) printf(" → ");
        }
        printf("\n");
    }
}

// Display current system state
void display_state(SystemState *state) {
    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║                   CURRENT SYSTEM STATE                    ║\n");
    printf("╚═══════════════════════════════════════════════════════════╝\n");
    
    printf("\n  Processes: %d | Resources: %d\n", 
           state->num_processes, state->num_resources);
    
    // Available Resources
    printf("\n  ┌─────────────────────────────────────────┐\n");
    printf("  │          AVAILABLE RESOURCES            │\n");
    printf("  └─────────────────────────────────────────┘\n");
    printf("    ");
    for (int j = 0; j < state->num_resources; j++) {
        printf("%4s", state->resource_names[j]);
    }
    printf("\n    ");
    for (int j = 0; j < state->num_resources; j++) {
        printf("%4d", state->available[j]);
    }
    printf("\n");
    
    // Allocation Matrix
    printf("\n  ┌─────────────────────────────────────────┐\n");
    printf("  │          ALLOCATION MATRIX              │\n");
    printf("  └─────────────────────────────────────────┘\n");
    printf("         ");
    for (int j = 0; j < state->num_resources; j++) {
        printf("%4s", state->resource_names[j]);
    }
    printf("\n");
    for (int i = 0; i < state->num_processes; i++) {
        printf("    %4s:", state->process_names[i]);
        for (int j = 0; j < state->num_resources; j++) {
            printf("%4d", state->allocation[i][j]);
        }
        printf("\n");
    }
    
    // Maximum Need Matrix
    printf("\n  ┌─────────────────────────────────────────┐\n");
    printf("  │          MAXIMUM NEED MATRIX            │\n");
    printf("  └─────────────────────────────────────────┘\n");
    printf("         ");
    for (int j = 0; j < state->num_resources; j++) {
        printf("%4s", state->resource_names[j]);
    }
    printf("\n");
    for (int i = 0; i < state->num_processes; i++) {
        printf("    %4s:", state->process_names[i]);
        for (int j = 0; j < state->num_resources; j++) {
            printf("%4d", state->max_need[i][j]);
        }
        printf("\n");
    }
    
    // Need Matrix (calculated)
    calculate_need_matrix(state);
    printf("\n  ┌─────────────────────────────────────────┐\n");
    printf("  │         NEED MATRIX (Max - Alloc)       │\n");
    printf("  └─────────────────────────────────────────┘\n");
    printf("         ");
    for (int j = 0; j < state->num_resources; j++) {
        printf("%4s", state->resource_names[j]);
    }
    printf("\n");
    for (int i = 0; i < state->num_processes; i++) {
        printf("    %4s:", state->process_names[i]);
        for (int j = 0; j < state->num_resources; j++) {
            printf("%4d", state->need[i][j]);
        }
        printf("\n");
    }
}

// Display detection result
void display_result(DetectionResult *result, SystemState *state) {
    printf("\n╔═══════════════════════════════════════════════════════════╗\n");
    printf("║              DEADLOCK DETECTION RESULT                    ║\n");
    printf("╚═══════════════════════════════════════════════════════════╝\n");
    
    if (result->is_deadlocked) {
        printf("\n  ╭──────────────────────────────────────────╮\n");
        printf("  │  ⚠  STATUS: DEADLOCK DETECTED           │\n");
        printf("  ╰──────────────────────────────────────────╯\n");
        
        printf("\n  Deadlocked Processes (%d):\n", result->num_deadlocked);
        printf("  ");
        for (int i = 0; i < result->num_deadlocked; i++) {
            printf("%s", state->process_names[result->deadlocked_processes[i]]);
            if (i < result->num_deadlocked - 1) printf(", ");
        }
        printf("\n");
        
        printf("\n  Analysis:\n");
        printf("  • These processes are in circular wait\n");
        printf("  • Each waiting for resources held by others\n");
        printf("  • System cannot proceed without intervention\n");
        
        if (result->safe_sequence_length > 0) {
            printf("\n  Partial Safe Sequence (before deadlock):\n  ");
            for (int i = 0; i < result->safe_sequence_length; i++) {
                printf("%s", state->process_names[result->safe_sequence[i]]);
                if (i < result->safe_sequence_length - 1) printf(" → ");
            }
            printf("\n");
        }
    } else {
        printf("\n  ╭──────────────────────────────────────────╮\n");
        printf("  │  ✓  STATUS: NO DEADLOCK                  │\n");
        printf("  ╰──────────────────────────────────────────╯\n");
        
        printf("\n  System is in a SAFE state.\n");
        printf("\n  Safe Sequence:\n  ");
        for (int i = 0; i < result->safe_sequence_length; i++) {
            printf("%s", state->process_names[result->safe_sequence[i]]);
            if (i < result->safe_sequence_length - 1) printf(" → ");
        }
        printf("\n");
        
        printf("\n  Analysis:\n");
        printf("  • All processes can complete execution\n");
        printf("  • Resources will be released in order\n");
        printf("  • No circular wait condition exists\n");
    }
}
