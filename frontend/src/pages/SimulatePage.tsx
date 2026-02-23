import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../context/AppContext'
import { simulateResourceRequest } from '../services/api'
import type { SimulateResponse } from '../types/detection'
import './SimulatePage.css'

function SimulatePage() {
  const { config } = useAppState()

  const [processIndex, setProcessIndex] = useState(0)
  const [resourceIndex, setResourceIndex] = useState(0)
  const [amount, setAmount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SimulateResponse | null>(null)

  if (!config) {
    return (
      <div className="page-empty">
        <p>No configuration loaded. Go to <Link to="/config">Config &amp; Detect</Link> to set up the system state first.</p>
      </div>
    )
  }

  const handleSimulate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await simulateResourceRequest(config, processIndex, resourceIndex, amount)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="simulate-page">
      <h3>Simulate Resource Request</h3>
      <p className="simulate-desc">
        Test whether granting a resource request would leave the system in a safe state (deadlock avoidance).
      </p>

      <div className="simulate-form">
        <div className="simulate-field">
          <label htmlFor="sim-process">Process</label>
          <select
            id="sim-process"
            value={processIndex}
            onChange={(e) => setProcessIndex(Number(e.target.value))}
          >
            {Array.from({ length: config.numProcesses }, (_, i) => (
              <option key={i} value={i}>P{i}</option>
            ))}
          </select>
        </div>

        <div className="simulate-field">
          <label htmlFor="sim-resource">Resource</label>
          <select
            id="sim-resource"
            value={resourceIndex}
            onChange={(e) => setResourceIndex(Number(e.target.value))}
          >
            {Array.from({ length: config.numResources }, (_, i) => (
              <option key={i} value={i}>R{i}</option>
            ))}
          </select>
        </div>

        <div className="simulate-field">
          <label htmlFor="sim-amount">Amount</label>
          <input
            id="sim-amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <button
          className="simulate-btn"
          onClick={handleSimulate}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check if Safe'}
        </button>
      </div>

      {error && <p className="simulate-error">{error}</p>}

      {result && (
        <div className={`simulate-result ${result.granted ? 'granted' : 'blocked'}`}>
          <h4>{result.granted ? 'Would Grant: Safe' : 'Would Block: Unsafe'}</h4>
          <p>{result.message}</p>
        </div>
      )}
    </div>
  )
}

export default SimulatePage
