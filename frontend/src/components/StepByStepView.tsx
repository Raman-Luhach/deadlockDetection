import { useState } from 'react'
import './StepByStepView.css'
import { detectStep } from '../services/api'
import type { SystemConfig } from '../types/system'
import type { StepState, StepResponse } from '../types/detection'

interface Props {
  config: SystemConfig
}

interface StepEntry {
  stepNumber: number
  status: StepResponse['status']
  explanation: string
  selectedProcess: number | null
}

function StepByStepView({ config }: Props) {
  const [stepState, setStepState] = useState<StepState | null>(null)
  const [steps, setSteps] = useState<StepEntry[]>([])
  const [finished, setFinished] = useState(false)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [safeSequence, setSafeSequence] = useState<number[]>([])

  const runStep = async (currentState: StepState | null) => {
    setLoading(true)
    setError(null)
    try {
      const res = await detectStep(config, currentState)
      const entry: StepEntry = {
        stepNumber: steps.length + 1,
        status: res.status,
        explanation: res.explanation,
        selectedProcess: res.selected_process,
      }
      setSteps(prev => [...prev, entry])
      setStepState(res.step_state)
      setSafeSequence(res.step_state.safe_sequence)

      if (res.status === 'done' || res.status === 'deadlock') {
        setFinished(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach the API')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    setStarted(true)
    setSteps([])
    setStepState(null)
    setFinished(false)
    setSafeSequence([])
    setError(null)
    runStep(null)
  }

  const handleNext = () => {
    runStep(stepState)
  }

  const handleReset = () => {
    setStarted(false)
    setSteps([])
    setStepState(null)
    setFinished(false)
    setSafeSequence([])
    setError(null)
  }

  return (
    <div className="step-by-step">
      <h3>Step-by-Step Banker's Algorithm</h3>

      <div className="step-controls">
        <button
          className="step-btn start"
          onClick={handleStart}
          disabled={loading || (started && !finished)}
        >
          Start
        </button>
        <button
          className="step-btn next"
          onClick={handleNext}
          disabled={loading || !started || finished}
        >
          {loading ? 'Running...' : 'Next Step'}
        </button>
        <button
          className="step-btn reset"
          onClick={handleReset}
          disabled={loading || !started}
        >
          Reset
        </button>
      </div>

      {error && <p className="step-error">{error}</p>}

      {steps.length > 0 && (
        <div className="step-log">
          {steps.map((entry) => (
            <div
              key={entry.stepNumber}
              className={`step-entry ${entry.status}`}
            >
              <span className="step-number">Step {entry.stepNumber}:</span>
              {entry.explanation}
            </div>
          ))}
        </div>
      )}

      {safeSequence.length > 0 && (
        <div className="step-sequence">
          <p>Safe sequence so far:</p>
          <div className="sequence">
            {safeSequence.map((p, i) => (
              <span key={i}>
                {i > 0 && <span className="arrow">&rarr;</span>}
                <span className="process-badge">P{p}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StepByStepView
