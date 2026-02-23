import { useState } from 'react'
import type { SystemConfig } from '../types/system'
import type { StepState, StepResponse } from '../types/detection'
import { detectDeadlockStep } from '../services/api'
import { MatrixGrid } from './SystemConfigForm'
import './StepByStepView.css'

interface Props {
  config: SystemConfig
  onHighlight: (processIndex: number | null) => void
}

function StepByStepView({ config, onHighlight }: Props) {
  const [stepState, setStepState] = useState<StepState | null>(null)
  const [history, setHistory] = useState<StepResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)

  const needMatrix = config.allocation.map((row, i) =>
    row.map((val, j) => config.maxNeed[i][j] - val)
  )

  const processLabels = Array.from({ length: config.numProcesses }, (_, i) => `P${i}`)
  const resourceLabels = Array.from({ length: config.numResources }, (_, i) => `R${i}`)

  const handleNextStep = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await detectDeadlockStep(config, stepState)
      setStepState(res.step_state)
      setHistory((prev) => [...prev, res])
      onHighlight(res.selected_process)

      if (res.status === 'done' || res.status === 'deadlock') {
        setFinished(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Step failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStepState(null)
    setHistory([])
    setFinished(false)
    setError(null)
    onHighlight(null)
  }

  const lastStep = history.length > 0 ? history[history.length - 1] : null
  const currentWork = stepState?.work ?? config.available

  return (
    <div className="step-view">
      <h3>Step-by-Step Banker's Algorithm</h3>

      {/* Controls */}
      <div className="step-controls">
        <button
          className="step-btn next-btn"
          onClick={handleNextStep}
          disabled={loading || finished}
        >
          {loading ? 'Computing...' : history.length === 0 ? 'Start' : 'Next Step'}
        </button>
        <button
          className="step-btn reset-btn"
          onClick={handleReset}
          disabled={history.length === 0}
        >
          Reset
        </button>
        <span className="step-counter">
          Step {history.length}
        </span>
      </div>

      {error && <p className="step-error">{error}</p>}

      {/* Work vector */}
      <div className="work-panel">
        <div className="work-label">Work Vector</div>
        <div className="work-values">
          {resourceLabels.map((label, j) => (
            <div className="work-cell" key={j}>
              <span className="work-header">{label}</span>
              <span className="work-value">{currentWork[j]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Finish vector */}
      {stepState && (
        <div className="finish-panel">
          <div className="work-label">Finish</div>
          <div className="work-values">
            {processLabels.map((label, i) => (
              <div className="work-cell" key={i}>
                <span className="work-header">{label}</span>
                <span className={`finish-value ${stepState.finish[i] ? 'finished' : 'pending'}`}>
                  {stepState.finish[i] ? 'T' : 'F'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Need matrix */}
      <div className="step-matrix-section">
        <div className="step-section-heading">Need Matrix (Max - Allocation)</div>
        <div className="matrix-section">
          <MatrixGrid
            matrix={needMatrix}
            processLabels={processLabels}
            resourceLabels={resourceLabels}
            maxNeed={null}
            highlightedRow={lastStep?.selected_process}
            readOnly
          />
        </div>
      </div>

      {/* Safe sequence so far */}
      {stepState && stepState.safe_sequence.length > 0 && (
        <div className="step-sequence">
          <span className="step-sequence-label">Safe sequence so far:</span>
          {stepState.safe_sequence.map((p, i) => (
            <span key={i}>
              <span className="step-process-badge">P{p}</span>
              {i < stepState.safe_sequence.length - 1 && (
                <span className="step-arrow">&rarr;</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Step history / explanation log */}
      {history.length > 0 && (
        <div className="step-log">
          {history.map((step, i) => (
            <div
              key={i}
              className={`step-entry ${step.status === 'deadlock' ? 'step-deadlock' : step.status === 'done' ? 'step-done' : ''}`}
            >
              <span className="step-num">Step {i + 1}:</span> {step.explanation}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StepByStepView
