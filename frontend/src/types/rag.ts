export interface RagNode {
  id: number
  label: string
  type: 'process' | 'resource'
}

export interface RagEdge {
  from: number
  to: number
  type: 'request' | 'assignment'
}

export interface RagData {
  nodes: RagNode[]
  edges: RagEdge[]
}
