import type { DetectionResult } from '../types/detection'
import './DetectionResultView.css'

interface Props {
  result: DetectionResult
  onResolve?: () => void
  resolving?: boolean
  resolveMsg?: string | null
}

function DetectionResultView({ result, onResolve, resolving, resolveMsg }: Props) {
  return (
    <div className={`detection-result ${result.is_deadlocked ? 'deadlocked' : 'safe'}`}>
      <h3>{result.is_deadlocked ? 'Deadlock Detected' : 'System is Safe'}</h3>

      {!result.is_deadlocked && result.safe_sequence.length > 0 && (
        <div className="safe-sequence">
          <p>Safe sequence:</p>
          <div className="sequence">
            {result.safe_sequence.map((p, i) => (
              <span key={i}>
                <span className="process-badge">P{p}</span>
                {i < result.safe_sequence.length - 1 && <span className="arrow">&rarr;</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.is_deadlocked && result.deadlocked_processes.length > 0 && (
        <div className="deadlocked-list">
          <p>Deadlocked processes:</p>
          <div className="process-list">
            {result.deadlocked_processes.map((p) => (
              <span key={p} className="process-badge deadlocked-badge">P{p}</span>
            ))}
          </div>
          {result.safe_sequence.length > 0 && (
            <div className="partial-sequence">
              <p>Partial safe sequence before deadlock:</p>
              <div className="sequence">
                {result.safe_sequence.map((p, i) => (
                  <span key={i}>
                    <span className="process-badge">P{p}</span>
                    {i < result.safe_sequence.length - 1 && <span className="arrow">&rarr;</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {onResolve && (
            <div className="resolve-section">
              <button
                className="resolve-btn"
                onClick={onResolve}
                disabled={resolving}
              >
                {resolving ? 'Resolving...' : 'Resolve Deadlock'}
              </button>
            </div>
          )}
        </div>
      )}

      {resolveMsg && (
        <div className={`resolve-msg ${result.is_deadlocked ? 'still-deadlocked' : 'resolved'}`}>
          {resolveMsg}
        </div>
      )}
    </div>
  )
}

export default DetectionResultView
