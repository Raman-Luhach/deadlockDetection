import { useCallback, useEffect, useMemo, useState } from 'react'
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
import type { DetectionResult } from '../types/detection'
import { fetchRag } from '../services/api'
import './RagGraph.css'

interface Props {
  config: SystemConfig
  /** When present and is_deadlocked, process nodes in deadlocked_processes are highlighted. */
  detectionResult?: DetectionResult | null
}

const deadlockedNodeStyle = {
  background: '#b71c1c',
  color: '#fff',
  border: '3px solid #ff5252',
  borderRadius: '50%',
  width: 60,
  height: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
}

const normalProcessNodeStyle = {
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
}

function layoutNodes(ragData: RagData, deadlockedSet: Set<number>): Node[] {
  const processNodes = ragData.nodes.filter((n) => n.type === 'process')
  const resourceNodes = ragData.nodes.filter((n) => n.type === 'resource')

  const nodes: Node[] = []

  processNodes.forEach((n, i) => {
    const isDeadlocked = deadlockedSet.has(n.id)
    nodes.push({
      id: String(n.id),
      position: { x: i * 140, y: 0 },
      data: { label: n.label },
      style: isDeadlocked ? deadlockedNodeStyle : normalProcessNodeStyle,
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

function RagGraph({ config, detectionResult }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deadlockedSet = useMemo(
    () =>
      new Set<number>(
        detectionResult?.is_deadlocked ? detectionResult.deadlocked_processes : []
      ),
    [detectionResult]
  )

  const loadRag = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const ragData = await fetchRag(config)
      setNodes(layoutNodes(ragData, deadlockedSet))
      setEdges(buildEdges(ragData))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch RAG')
    } finally {
      setLoading(false)
    }
  }, [config, setNodes, setEdges, deadlockedSet])

  useEffect(() => {
    loadRag()
  }, [loadRag])

  return (
    <div className="rag-container">
      <h3>Resource Allocation Graph</h3>

      <div className="rag-legend" role="img" aria-label="Legend">
        <span className="legend-item" title="Process node">
          <span className="legend-circle process-legend" /> Process
        </span>
        <span className="legend-item" title="Resource node">
          <span className="legend-square resource-legend" /> Resource
        </span>
        <span className="legend-item" title="Process in deadlock (cannot be satisfied)">
          <span className="legend-circle deadlocked-legend" /> Deadlocked process
        </span>
        <span className="legend-item" title="Process waits for resource">
          <span className="legend-line request-legend" /> Request (P → R)
        </span>
        <span className="legend-item" title="Resource allocated to process">
          <span className="legend-line assignment-legend" /> Assignment (R → P)
        </span>
      </div>

      {loading && <p className="rag-loading">Loading graph...</p>}
      {error && <p className="rag-error">{error}</p>}

      {!loading && !error && (
        <div className="rag-flow-wrapper">
          <ReactFlow
            key={JSON.stringify(config)}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
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
