/**
 * Resource Allocation Graph (RAG) builder (ported from C src/rag.c).
 * Used by POST /api/rag.
 */

export interface RagRequest {
  num_processes: number;
  num_resources: number;
  available: number[];
  allocation: number[][];
  max_need: number[][];
}

export interface RagNode {
  id: number;
  label: string;
  type: 'process' | 'resource';
}

export interface RagEdge {
  from: number;
  to: number;
  type: 'request' | 'assignment';
}

export interface RagResponse {
  nodes: RagNode[];
  edges: RagEdge[];
}

/**
 * Builds the Resource Allocation Graph from the system state.
 *
 * Nodes:
 *   - Process nodes: id 0 .. num_processes-1
 *   - Resource nodes: id num_processes .. num_processes+num_resources-1
 *
 * Edges:
 *   - Assignment: resource → process  (where allocation[i][j] > 0)
 *   - Request:    process → resource  (where need[i][j] > 0)
 */
export function buildRag(req: RagRequest): RagResponse {
  const { num_processes, num_resources, allocation, max_need } = req;

  // Compute need matrix
  const need: number[][] = [];
  for (let i = 0; i < num_processes; i++) {
    need[i] = [];
    for (let j = 0; j < num_resources; j++) {
      need[i][j] = max_need[i][j] - allocation[i][j];
    }
  }

  // Build nodes
  const nodes: RagNode[] = [];
  for (let i = 0; i < num_processes; i++) {
    nodes.push({ id: i, label: `P${i}`, type: 'process' });
  }
  for (let j = 0; j < num_resources; j++) {
    nodes.push({ id: num_processes + j, label: `R${j}`, type: 'resource' });
  }

  // Build edges
  const edges: RagEdge[] = [];
  for (let i = 0; i < num_processes; i++) {
    for (let j = 0; j < num_resources; j++) {
      // Assignment edge: resource → process (allocation > 0)
      if (allocation[i][j] > 0) {
        edges.push({
          from: num_processes + j,
          to: i,
          type: 'assignment',
        });
      }
      // Request edge: process → resource (need > 0)
      if (need[i][j] > 0) {
        edges.push({
          from: i,
          to: num_processes + j,
          type: 'request',
        });
      }
    }
  }

  return { nodes, edges };
}
