import { useState } from 'react'
import '../App.css'
import SystemConfigForm from '../components/SystemConfigForm'
import DetectionResultView from '../components/DetectionResultView'
import RagGraph from '../components/RagGraph'
import StepByStepView from '../components/StepByStepView'
import { detectDeadlock } from '../services/api'
import type { SystemConfig } from '../types/system'
import type { DetectionResult } from '../types/detection'

function HomePage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDetect = async () => {
    if (!config) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await detectDeadlock(config)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach the API')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (cfg: SystemConfig) => {
    setConfig(cfg)
    setResult(null)
    setError(null)
  }

  return (
    <div className="home">
      <h1>Deadlock Detection System</h1>
      <p className="subtitle">
        Visualize and analyze deadlocks using the Banker's Algorithm and Resource Allocation Graphs
      </p>

      <SystemConfigForm onSave={handleSave} />

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

          {result && <DetectionResultView result={result} />}

          <StepByStepView config={config} />

          <RagGraph config={config} />
        </>
      )}
    </div>
  )
}

export default HomePage
