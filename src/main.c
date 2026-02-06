/*
 * Deadlock Detection System
 * Main driver program with interactive console interface
 * 
 * Author: Raman Luhach
 * Course: Operating Systems Mini Project
 * Date: February 2026
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "deadlock_detector.h"
#include "rag.h"

// Function prototypes
void display_banner(void);
void display_menu(void);
void input_system_config(SystemState *state);
void run_sample_scenario(SystemState *state, int scenario);
void clear_screen(void);
void press_enter_to_continue(void);

// Clear screen (cross-platform)
void clear_screen(void) {
    #ifdef _WIN32
        system("cls");
    #else
        system("clear");
    #endif
}

// Wait for user input
void press_enter_to_continue(void) {
    printf("\n  Press Enter to continue...");
    while (getchar() != '\n');
    getchar();
}

// Display application banner
void display_banner(void) {
    printf("\n");
    printf("  ╔═══════════════════════════════════════════════════════════╗\n");
    printf("  ║                                                           ║\n");
    printf("  ║          ████  ████  █████  ████  █     ████  █████ █  █  ║\n");
    printf("  ║          █   █ █     █   █  █   █ █     █   █ █     █ █   ║\n");
    printf("  ║          █   █ ███   █████  █   █ █     █   █ █     ██    ║\n");
    printf("  ║          █   █ █     █   █  █   █ █     █   █ █     █ █   ║\n");
    printf("  ║          ████  ████  █   █  ████  ████  ████  █████ █  █  ║\n");
    printf("  ║                                                           ║\n");
    printf("  ║              D E T E C T I O N   S Y S T E M              ║\n");
    printf("  ║                                                           ║\n");
    printf("  ║         Using Banker's Algorithm & RAG Analysis           ║\n");
    printf("  ║                                                           ║\n");
    printf("  ╚═══════════════════════════════════════════════════════════╝\n");
    printf("\n");
    printf("  Operating Systems Mini Project | February 2026\n");
    printf("  ─────────────────────────────────────────────────────────────\n");
}

// Display main menu
void display_menu(void) {
    printf("\n");
    printf("  ┌─────────────────────────────────────────┐\n");
    printf("  │              MAIN MENU                  │\n");
    printf("  ├─────────────────────────────────────────┤\n");
    printf("  │  1. Enter System Configuration          │\n");
    printf("  │  2. Display Current State               │\n");
    printf("  │  3. Check for Deadlock                  │\n");
    printf("  │  4. Display Resource Allocation Graph   │\n");
    printf("  │  5. Resolve Deadlock                    │\n");
    printf("  │  6. Run Sample Scenario (Safe)          │\n");
    printf("  │  7. Run Sample Scenario (Deadlock)      │\n");
    printf("  │  0. Exit                                │\n");
    printf("  └─────────────────────────────────────────┘\n");
    printf("\n  Enter your choice: ");
}

// Input system configuration from user
void input_system_config(SystemState *state) {
    printf("\n  ┌─────────────────────────────────────────┐\n");
    printf("  │         SYSTEM CONFIGURATION            │\n");
    printf("  └─────────────────────────────────────────┘\n");
    
    // Number of processes
    printf("\n  Enter number of processes (1-%d): ", MAX_PROCESSES);
    scanf("%d", &state->num_processes);
    if (state->num_processes < 1 || state->num_processes > MAX_PROCESSES) {
        printf("  [ERROR] Invalid number of processes. Setting to 5.\n");
        state->num_processes = 5;
    }
    
    // Number of resources
    printf("  Enter number of resource types (1-%d): ", MAX_RESOURCES);
    scanf("%d", &state->num_resources);
    if (state->num_resources < 1 || state->num_resources > MAX_RESOURCES) {
        printf("  [ERROR] Invalid number of resources. Setting to 3.\n");
        state->num_resources = 3;
    }
    
    // Initialize names
    for (int i = 0; i < state->num_processes; i++) {
        sprintf(state->process_names[i], "P%d", i);
    }
    for (int j = 0; j < state->num_resources; j++) {
        sprintf(state->resource_names[j], "R%d", j);
    }
    
    // Available resources
    printf("\n  Enter Available resources (%d values):\n  ", state->num_resources);
    for (int j = 0; j < state->num_resources; j++) {
        scanf("%d", &state->available[j]);
    }
    
    // Allocation matrix
    printf("\n  Enter Allocation Matrix (%dx%d):\n", 
           state->num_processes, state->num_resources);
    for (int i = 0; i < state->num_processes; i++) {
        printf("  %s: ", state->process_names[i]);
        for (int j = 0; j < state->num_resources; j++) {
            scanf("%d", &state->allocation[i][j]);
        }
    }
    
    // Maximum need matrix
    printf("\n  Enter Maximum Need Matrix (%dx%d):\n", 
           state->num_processes, state->num_resources);
    for (int i = 0; i < state->num_processes; i++) {
        printf("  %s: ", state->process_names[i]);
        for (int j = 0; j < state->num_resources; j++) {
            scanf("%d", &state->max_need[i][j]);
        }
    }
    
    // Calculate need matrix
    calculate_need_matrix(state);
    
    printf("\n  [✓] System configuration saved successfully!\n");
}

// Run predefined sample scenarios
void run_sample_scenario(SystemState *state, int scenario) {
    init_system_state(state);
    
    if (scenario == 1) {
        // Safe state scenario (classic Banker's example)
        printf("\n  Loading Sample Scenario: SAFE STATE\n");
        printf("  ─────────────────────────────────────────\n");
        
        state->num_processes = 5;
        state->num_resources = 3;
        
        // Available resources
        state->available[0] = 3;
        state->available[1] = 3;
        state->available[2] = 2;
        
        // Allocation matrix
        int alloc[5][3] = {
            {0, 1, 0},
            {2, 0, 0},
            {3, 0, 2},
            {2, 1, 1},
            {0, 0, 2}
        };
        
        // Maximum need matrix
        int max[5][3] = {
            {7, 5, 3},
            {3, 2, 2},
            {9, 0, 2},
            {2, 2, 2},
            {4, 3, 3}
        };
        
        for (int i = 0; i < 5; i++) {
            for (int j = 0; j < 3; j++) {
                state->allocation[i][j] = alloc[i][j];
                state->max_need[i][j] = max[i][j];
            }
        }
        
        printf("  Description: Classic Banker's Algorithm example\n");
        printf("  Expected: Safe sequence exists (P1→P3→P4→P0→P2)\n");
        
    } else if (scenario == 2) {
        // Deadlock scenario
        printf("\n  Loading Sample Scenario: DEADLOCK STATE\n");
        printf("  ─────────────────────────────────────────\n");
        
        state->num_processes = 4;
        state->num_resources = 3;
        
        // Very limited available resources
        state->available[0] = 0;
        state->available[1] = 0;
        state->available[2] = 0;
        
        // Allocation matrix - processes hold resources
        int alloc[4][3] = {
            {1, 0, 1},
            {1, 1, 0},
            {0, 1, 1},
            {1, 0, 0}
        };
        
        // Maximum need - processes need more
        int max[4][3] = {
            {2, 1, 2},
            {2, 2, 1},
            {1, 2, 2},
            {2, 1, 1}
        };
        
        for (int i = 0; i < 4; i++) {
            for (int j = 0; j < 3; j++) {
                state->allocation[i][j] = alloc[i][j];
                state->max_need[i][j] = max[i][j];
            }
        }
        
        printf("  Description: Circular wait with no available resources\n");
        printf("  Expected: DEADLOCK detected\n");
    }
    
    calculate_need_matrix(state);
    printf("\n  [✓] Sample scenario loaded!\n");
}

// Main program
int main(void) {
    SystemState state;
    RAG rag;
    DetectionResult result;
    int choice;
    bool has_config = false;
    
    init_system_state(&state);
    
    clear_screen();
    display_banner();
    
    do {
        display_menu();
        scanf("%d", &choice);
        
        switch (choice) {
            case 1:
                input_system_config(&state);
                has_config = true;
                press_enter_to_continue();
                break;
                
            case 2:
                if (!has_config) {
                    printf("\n  [!] Please enter system configuration first (Option 1 or 6/7).\n");
                } else {
                    display_state(&state);
                }
                press_enter_to_continue();
                break;
                
            case 3:
                if (!has_config) {
                    printf("\n  [!] Please enter system configuration first (Option 1 or 6/7).\n");
                } else {
                    result = detect_deadlock(&state);
                    display_result(&result, &state);
                }
                press_enter_to_continue();
                break;
                
            case 4:
                if (!has_config) {
                    printf("\n  [!] Please enter system configuration first (Option 1 or 6/7).\n");
                } else {
                    calculate_need_matrix(&state);
                    build_rag(&state, &rag);
                    display_rag(&rag, &state);
                }
                press_enter_to_continue();
                break;
                
            case 5:
                if (!has_config) {
                    printf("\n  [!] Please enter system configuration first (Option 1 or 6/7).\n");
                } else {
                    result = detect_deadlock(&state);
                    if (result.is_deadlocked) {
                        resolve_deadlock(&state, &result);
                    } else {
                        printf("\n  [INFO] No deadlock exists. Resolution not needed.\n");
                    }
                }
                press_enter_to_continue();
                break;
                
            case 6:
                run_sample_scenario(&state, 1);
                has_config = true;
                press_enter_to_continue();
                break;
                
            case 7:
                run_sample_scenario(&state, 2);
                has_config = true;
                press_enter_to_continue();
                break;
                
            case 0:
                printf("\n  Thank you for using Deadlock Detection System!\n");
                printf("  Goodbye!\n\n");
                break;
                
            default:
                printf("\n  [ERROR] Invalid choice. Please try again.\n");
                press_enter_to_continue();
        }
        
        if (choice != 0) {
            clear_screen();
            display_banner();
        }
        
    } while (choice != 0);
    
    return 0;
}
