import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { RagData } from '../types/rag'
import type { SystemConfig } from '../types/system'
import { fetchRag } from '../services/api'
import './RagGraph.css'

interface Props {
  config: SystemConfig
}

function layoutNodes(ragData: RagData): Node[] {
  const processNodes = ragData.nodes.filter((n) => n.type === 'process')
  const resourceNodes = ragData.nodes.filter((n) => n.type === 'resource')

  const nodes: Node[] = []

  processNodes.forEach((n, i) => {
    nodes.push({
      id: String(n.id),
      position: { x: i * 140, y: 0 },
      data: { label: n.label },
      style: {
        background: '#1a237e',
        color: '#fff',
        border: '2px solid #7ec8e3',
        borderRadius: '50%',
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
      },
    })
  })

  resourceNodes.forEach((n, i) => {
    nodes.push({
      id: String(n.id),
      position: { x: i * 140, y: 180 },
      data: { label: n.label },
      style: {
        background: '#1b5e20',
        color: '#fff',
        border: '2px solid #66bb6a',
        borderRadius: 4,
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
      },
    })
  })

  return nodes
}

function buildEdges(ragData: RagData): Edge[] {
  return ragData.edges.map((e, i) => ({
    id: `e-${i}`,
    source: String(e.from),
    target: String(e.to),
    animated: e.type === 'request',
    style: {
      stroke: e.type === 'request' ? '#ff9800' : '#66bb6a',
      strokeWidth: 2,
      strokeDasharray: e.type === 'request' ? '6 3' : undefined,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: e.type === 'request' ? '#ff9800' : '#66bb6a',
    },
    label: e.type === 'request' ? 'request' : 'assign',
    labelStyle: { fontSize: 10, fill: '#aaa' },
  }))
}

function RagGraph({ config }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRag = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const ragData = await fetchRag(config)
      setNodes(layoutNodes(ragData))
      setEdges(buildEdges(ragData))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch RAG')
    } finally {
      setLoading(false)
    }
  }, [config, setNodes, setEdges])

  useEffect(() => {
    loadRag()
  }, [loadRag])

  return (
    <div className="rag-container">
      <h3>Resource Allocation Graph</h3>

      <div className="rag-legend">
        <span className="legend-item">
          <span className="legend-circle process-legend" /> Process
        </span>
        <span className="legend-item">
          <span className="legend-square resource-legend" /> Resource
        </span>
        <span className="legend-item">
          <span className="legend-line request-legend" /> Request
        </span>
        <span className="legend-item">
          <span className="legend-line assignment-legend" /> Assignment
        </span>
      </div>

      {loading && <p className="rag-loading">Loading graph...</p>}
      {error && <p className="rag-error">{error}</p>}

      {!loading && !error && (
        <div className="rag-flow-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      )}
    </div>
  )
}

export default RagGraph
