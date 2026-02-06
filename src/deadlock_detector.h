/*
 * Deadlock Detection System
 * Header file for deadlock detection using Banker's Algorithm
 */

#ifndef DEADLOCK_DETECTOR_H
#define DEADLOCK_DETECTOR_H

#include <stdbool.h>

// System constraints
#define MAX_PROCESSES 10
#define MAX_RESOURCES 10

// System State Structure
typedef struct {
    int num_processes;
    int num_resources;
    int available[MAX_RESOURCES];
    int allocation[MAX_PROCESSES][MAX_RESOURCES];
    int max_need[MAX_PROCESSES][MAX_RESOURCES];
    int need[MAX_PROCESSES][MAX_RESOURCES];
    char process_names[MAX_PROCESSES][10];
    char resource_names[MAX_RESOURCES][10];
} SystemState;

// Detection Result Structure
typedef struct {
    bool is_deadlocked;
    int deadlocked_processes[MAX_PROCESSES];
    int num_deadlocked;
    int safe_sequence[MAX_PROCESSES];
    int safe_sequence_length;
} DetectionResult;

// Function Prototypes

/**
 * Initialize system state with default values
 * @param state Pointer to SystemState structure
 */
void init_system_state(SystemState *state);

/**
 * Calculate Need matrix (Need = Max - Allocation)
 * @param state Pointer to SystemState structure
 */
void calculate_need_matrix(SystemState *state);

/**
 * Detect deadlock using Banker's Algorithm
 * @param state Pointer to SystemState structure
 * @return DetectionResult containing deadlock status and safe sequence
 */
DetectionResult detect_deadlock(SystemState *state);

/**
 * Resolve deadlock by terminating processes
 * @param state Pointer to SystemState structure
 * @param result Pointer to DetectionResult
 */
void resolve_deadlock(SystemState *state, DetectionResult *result);

/**
 * Display current system state (all matrices)
 * @param state Pointer to SystemState structure
 */
void display_state(SystemState *state);

/**
 * Display detection result
 * @param result Pointer to DetectionResult
 * @param state Pointer to SystemState for process names
 */
void display_result(DetectionResult *result, SystemState *state);

/**
 * Check if request can be granted (Need <= Work)
 * @param need Need array for a process
 * @param work Work array
 * @param num_resources Number of resources
 * @return true if request can be granted
 */
bool can_satisfy(int need[], int work[], int num_resources);

#endif // DEADLOCK_DETECTOR_H
