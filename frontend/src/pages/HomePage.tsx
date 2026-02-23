import { useState } from 'react'
import '../App.css'
import SystemConfigForm from '../components/SystemConfigForm'
import DetectionResultView from '../components/DetectionResultView'
import StepByStepView from '../components/StepByStepView'
import RagGraph from '../components/RagGraph'
import { detectDeadlock, resolveDeadlock } from '../services/api'
import type { SystemConfig } from '../types/system'
import type { DetectionResult } from '../types/detection'

function HomePage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightedProcess, setHighlightedProcess] = useState<number | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveMsg, setResolveMsg] = useState<string | null>(null)

  const handleDetect = async () => {
    if (!config) return
    setLoading(true)
    setError(null)
    setResult(null)
    setHighlightedProcess(null)
    setResolveMsg(null)
    try {
      const res = await detectDeadlock(config)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach the API')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!config) return
    setResolving(true)
    setError(null)
    setResolveMsg(null)
    try {
      const res = await resolveDeadlock(config)
      const updatedConfig: SystemConfig = {
        numProcesses: res.state.num_processes,
        numResources: res.state.num_resources,
        available: res.state.available,
        allocation: res.state.allocation,
        maxNeed: res.state.max_need,
      }
      setConfig(updatedConfig)
      setResult(res.result)
      setResolveMsg(
        `Terminated P${res.victim_process} — resources released. ` +
        (res.result.is_deadlocked
          ? 'System is still deadlocked.'
          : `System is now safe. Sequence: ${res.result.safe_sequence.map(p => `P${p}`).join(' → ')}`)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve deadlock')
    } finally {
      setResolving(false)
    }
  }

  const handleSave = (cfg: SystemConfig) => {
    setConfig(cfg)
    setResult(null)
    setError(null)
    setHighlightedProcess(null)
    setResolveMsg(null)
  }

  return (
    <div className="home">
      <h1>Deadlock Detection System</h1>
      <p className="subtitle">
        Visualize and analyze deadlocks using the Banker's Algorithm and Resource Allocation Graphs
      </p>

      <SystemConfigForm onSave={handleSave} highlightedProcess={highlightedProcess} />

      {config && (
        <>
          <div className="config-preview">
            <h3>Saved Configuration</h3>
            <p>
              {config.numProcesses} processes, {config.numResources} resources
            </p>
            <p>
              Available: [{config.available.join(', ')}]
            </p>
          </div>

          <div className="detect-section">
            <button
              className="detect-btn"
              onClick={handleDetect}
              disabled={loading}
            >
              {loading ? 'Detecting...' : 'Check for Deadlock'}
            </button>
            {error && <p className="detect-error">{error}</p>}
          </div>

          {result && (
            <DetectionResultView
              result={result}
              onResolve={result.is_deadlocked ? handleResolve : undefined}
              resolving={resolving}
              resolveMsg={resolveMsg}
            />
          )}

          <StepByStepView config={config} onHighlight={setHighlightedProcess} />

          <RagGraph config={config} detectionResult={result} highlightedProcess={highlightedProcess} />
        </>
      )}
    </div>
  )
}

export default HomePage
