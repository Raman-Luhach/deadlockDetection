/*
 * Deadlock Detection System - API worker (non-interactive).
 * Reads a simple text protocol from stdin, outputs one JSON line to stdout.
 * Uses existing deadlock_detector and rag logic. Does not modify original .c files.
 *
 * Protocol:
 *   Line 1: DETECT | RAG | RESOLVE | SIMULATE
 *   Line 2: num_processes num_resources
 *   Line 3: available[0] ... available[nr-1]
 *   Next num_processes lines: allocation[i][0] ... allocation[i][nr-1]
 *   Next num_processes lines: max_need[i][0] ... max_need[i][nr-1]
 *   RESOLVE: next line = victim_process_index (-1 for auto)
 *   SIMULATE: next line = process_index resource_index amount
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include "deadlock_detector.h"
#include "rag.h"

#define MAX_LINE 2048
#define CMD_DETECT   "DETECT"
#define CMD_RAG      "RAG"
#define CMD_RESOLVE  "RESOLVE"
#define CMD_SIMULATE "SIMULATE"

static void read_state(SystemState *state) {
    int np, nr;
    if (scanf("%d %d", &np, &nr) != 2 || np < 1 || nr < 1 ||
        np > MAX_PROCESSES || nr > MAX_RESOURCES) {
        fprintf(stderr, "invalid dimensions\n");
        exit(1);
    }
    state->num_processes = np;
    state->num_resources = nr;

    for (int j = 0; j < nr; j++) {
        if (scanf("%d", &state->available[j]) != 1) exit(1);
    }
    for (int i = 0; i < np; i++) {
        for (int j = 0; j < nr; j++) {
            if (scanf("%d", &state->allocation[i][j]) != 1) exit(1);
        }
    }
    for (int i = 0; i < np; i++) {
        for (int j = 0; j < nr; j++) {
            if (scanf("%d", &state->max_need[i][j]) != 1) exit(1);
        }
    }
}

/* Print detection result as JSON fragment (no newline; for embedding). */
static void output_detect_inline(const DetectionResult *res) {
    printf("{\"is_deadlocked\":%s,\"deadlocked_processes\":[",
           res->is_deadlocked ? "true" : "false");
    for (int i = 0; i < res->num_deadlocked; i++) {
        if (i) printf(",");
        printf("%d", res->deadlocked_processes[i]);
    }
    printf("],\"safe_sequence\":[");
    for (int i = 0; i < res->safe_sequence_length; i++) {
        if (i) printf(",");
        printf("%d", res->safe_sequence[i]);
    }
    printf("],\"safe_sequence_length\":%d}", res->safe_sequence_length);
}

/* Print detection result as full JSON line (with newline). */
static void output_detect(const DetectionResult *res) {
    output_detect_inline(res);
    printf("\n");
}

static void cmd_detect(SystemState *state) {
    (void)state;
    calculate_need_matrix(state);
    DetectionResult res = detect_deadlock(state);
    output_detect(&res);
}

static void cmd_rag(SystemState *state) {
    calculate_need_matrix(state);
    RAG rag;
    build_rag(state, &rag);

    printf("{\"nodes\":[");
    int first = 1;
    for (int i = 0; i < state->num_processes; i++) {
        if (!first) printf(",");
        printf("{\"id\":%d,\"label\":\"P%d\",\"type\":\"process\"}", i, i);
        first = 0;
    }
    for (int j = 0; j < state->num_resources; j++) {
        if (!first) printf(",");
        printf("{\"id\":%d,\"label\":\"R%d\",\"type\":\"resource\"}",
               state->num_processes + j, j);
        first = 0;
    }
    printf("],\"edges\":[");
    first = 1;
    for (int e = 0; e < rag.num_edges; e++) {
        if (!first) printf(",");
        printf("{\"from\":%d,\"to\":%d,\"type\":\"%s\"}",
               rag.edges[e].from, rag.edges[e].to,
               rag.edges[e].type == REQUEST ? "request" : "assignment");
        first = 0;
    }
    printf("]}\n");
}

static int pick_victim(const SystemState *state, const DetectionResult *res) {
    int victim = res->deadlocked_processes[0];
    int min_total = 0;
    for (int j = 0; j < state->num_resources; j++)
        min_total += state->allocation[victim][j];

    for (int i = 1; i < res->num_deadlocked; i++) {
        int p = res->deadlocked_processes[i];
        int total = 0;
        for (int j = 0; j < state->num_resources; j++)
            total += state->allocation[p][j];
        if (total < min_total) {
            min_total = total;
            victim = p;
        }
    }
    return victim;
}

static void apply_victim(SystemState *state, int victim) {
    for (int j = 0; j < state->num_resources; j++) {
        state->available[j] += state->allocation[victim][j];
        state->allocation[victim][j] = 0;
        state->max_need[victim][j] = 0;
    }
}

static void output_state(const SystemState *state) {
    printf("\"num_processes\":%d,\"num_resources\":%d,\"available\":[",
           state->num_processes, state->num_resources);
    for (int j = 0; j < state->num_resources; j++) {
        if (j) printf(",");
        printf("%d", state->available[j]);
    }
    printf("],\"allocation\":[");
    for (int i = 0; i < state->num_processes; i++) {
        if (i) printf(",");
        printf("[");
        for (int j = 0; j < state->num_resources; j++) {
            if (j) printf(",");
            printf("%d", state->allocation[i][j]);
        }
        printf("]");
    }
    printf("],\"max_need\":[");
    for (int i = 0; i < state->num_processes; i++) {
        if (i) printf(",");
        printf("[");
        for (int j = 0; j < state->num_resources; j++) {
            if (j) printf(",");
            printf("%d", state->max_need[i][j]);
        }
        printf("]");
    }
    printf("]");
}

static void cmd_resolve(SystemState *state, int victim_override) {
    calculate_need_matrix(state);
    DetectionResult res = detect_deadlock(state);
    if (!res.is_deadlocked || res.num_deadlocked == 0) {
        printf("{\"error\":\"State is not deadlocked; resolution not applicable.\"}\n");
        return;
    }
    int victim = victim_override;
    if (victim < 0) {
        victim = pick_victim(state, &res);
    } else {
        bool ok = false;
        for (int i = 0; i < res.num_deadlocked; i++) {
            if (res.deadlocked_processes[i] == victim) { ok = true; break; }
        }
        if (!ok || victim < 0 || victim >= state->num_processes) {
            printf("{\"error\":\"Invalid or non-deadlocked victim_process_index.\"}\n");
            return;
        }
    }
    apply_victim(state, victim);
    DetectionResult new_res = detect_deadlock(state);

    printf("{\"state\":{");
    output_state(state);
    printf("},\"result\":");
    output_detect_inline(&new_res);
    printf(",\"victim_process\":%d}\n", victim);
}

static void cmd_simulate(SystemState *state, int pi, int rj, int amount) {
    if (amount <= 0 || pi < 0 || pi >= state->num_processes ||
        rj < 0 || rj >= state->num_resources) {
        printf("{\"granted\":false,\"is_safe\":false,\"message\":\"Invalid process_index, resource_index, or amount.\"}\n");
        return;
    }
    if ((unsigned)amount > (unsigned)state->available[rj]) {
        printf("{\"granted\":false,\"is_safe\":false,\"message\":\"Request exceeds available resources.\"}\n");
        return;
    }
    calculate_need_matrix(state);
    int need_val = state->need[pi][rj];
    if (amount > need_val) {
        printf("{\"granted\":false,\"is_safe\":false,\"message\":\"Request exceeds remaining need.\"}\n");
        return;
    }
    state->available[rj] -= amount;
    state->allocation[pi][rj] += amount;
    calculate_need_matrix(state);
    DetectionResult res = detect_deadlock(state);
    state->available[rj] += amount;
    state->allocation[pi][rj] -= amount;

    bool safe = !res.is_deadlocked;
    if (safe) {
        printf("{\"granted\":true,\"is_safe\":true,\"message\":\"Granting would keep the system safe.\"}\n");
    } else {
        printf("{\"granted\":false,\"is_safe\":false,\"message\":\"Granting would lead to unsafe state.\"}\n");
    }
}

int main(void) {
    char cmd[32];
    if (scanf("%31s", cmd) != 1) {
        fprintf(stderr, "missing command\n");
        return 1;
    }

    SystemState state;
    init_system_state(&state);
    read_state(&state);

    if (strcmp(cmd, CMD_DETECT) == 0) {
        cmd_detect(&state);
        return 0;
    }
    if (strcmp(cmd, CMD_RAG) == 0) {
        cmd_rag(&state);
        return 0;
    }
    if (strcmp(cmd, CMD_RESOLVE) == 0) {
        int victim = -1;
        if (scanf("%d", &victim) != 1) victim = -1;
        cmd_resolve(&state, victim);
        return 0;
    }
    if (strcmp(cmd, CMD_SIMULATE) == 0) {
        int pi, rj, amount;
        if (scanf("%d %d %d", &pi, &rj, &amount) != 3) {
            printf("{\"granted\":false,\"is_safe\":false,\"message\":\"Missing process_index resource_index amount.\"}\n");
            return 0;
        }
        cmd_simulate(&state, pi, rj, amount);
        return 0;
    }

    fprintf(stderr, "unknown command: %s\n", cmd);
    return 1;
}
