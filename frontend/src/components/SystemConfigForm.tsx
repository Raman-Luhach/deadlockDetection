import { useState, useCallback } from 'react'
import type { SystemConfig } from '../types/system'
import './SystemConfigForm.css'

interface Props {
  onSave: (config: SystemConfig) => void
  highlightedProcess?: number | null
  /** When set, form initializes from this config. Use a changing `key` to re-mount. */
  initialConfig?: SystemConfig | null
}

function SystemConfigForm({ onSave, highlightedProcess, initialConfig }: Props) {
  const [numProcesses, setNumProcesses] = useState(initialConfig?.numProcesses ?? 3)
  const [numResources, setNumResources] = useState(initialConfig?.numResources ?? 3)
  const [available, setAvailable] = useState<number[]>(
    initialConfig ? [...initialConfig.available] : [0, 0, 0]
  )
  const [allocation, setAllocation] = useState<number[][]>(
    initialConfig
      ? initialConfig.allocation.map((r) => [...r])
      : [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  )
  const [maxNeed, setMaxNeed] = useState<number[][]>(
    initialConfig
      ? initialConfig.maxNeed.map((r) => [...r])
      : [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  )
  const [errors, setErrors] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  const resizeDimensions = useCallback(
    (newProcesses: number, newResources: number) => {
      setAvailable((prev) => {
        const next = Array(newResources).fill(0)
        for (let i = 0; i < Math.min(prev.length, newResources); i++) {
          next[i] = prev[i]
        }
        return next
      })

      const resizeMatrix = (prev: number[][]) => {
        return Array.from({ length: newProcesses }, (_, r) =>
          Array.from({ length: newResources }, (_, c) =>
            r < prev.length && c < (prev[0]?.length ?? 0) ? prev[r][c] : 0
          )
        )
      }

      setAllocation((prev) => resizeMatrix(prev))
      setMaxNeed((prev) => resizeMatrix(prev))
    },
    []
  )

  const handleProcessChange = (val: string) => {
    const n = clampDimension(val)
    setNumProcesses(n)
    resizeDimensions(n, numResources)
    setSaved(false)
  }

  const handleResourceChange = (val: string) => {
    const n = clampDimension(val)
    setNumResources(n)
    resizeDimensions(numProcesses, n)
    setSaved(false)
  }

  const handleAvailableChange = (idx: number, val: string) => {
    const num = parseNonNeg(val)
    setAvailable((prev) => {
      const next = [...prev]
      next[idx] = num
      return next
    })
    setSaved(false)
  }

  const handleMatrixChange = (
    matrix: 'allocation' | 'maxNeed',
    row: number,
    col: number,
    val: string
  ) => {
    const num = parseNonNeg(val)
    const setter = matrix === 'allocation' ? setAllocation : setMaxNeed
    setter((prev) => {
      const next = prev.map((r) => [...r])
      next[row][col] = num
      return next
    })
    setSaved(false)
  }

  /**
   * Validation rules (same as API): dimensions 1–10, non-negative integers everywhere,
   * allocation[i][j] <= maxNeed[i][j] for every cell.
   */
  const validate = (): string[] => {
    const errs: string[] = []

    if (!Number.isInteger(numProcesses) || numProcesses < 1 || numProcesses > 10) {
      errs.push('Number of processes must be an integer between 1 and 10.')
    }
    if (!Number.isInteger(numResources) || numResources < 1 || numResources > 10) {
      errs.push('Number of resources must be an integer between 1 and 10.')
    }

    for (let j = 0; j < numResources; j++) {
      if (!Number.isInteger(available[j]) || available[j] < 0) {
        errs.push(`Available[R${j}] must be a non-negative integer.`)
      }
    }

    for (let i = 0; i < numProcesses; i++) {
      for (let j = 0; j < numResources; j++) {
        const alloc = allocation[i][j]
        const max = maxNeed[i][j]

        if (!Number.isInteger(alloc) || alloc < 0) {
          errs.push(`Allocation[P${i}][R${j}] must be a non-negative integer.`)
        }
        if (!Number.isInteger(max) || max < 0) {
          errs.push(`Max Need[P${i}][R${j}] must be a non-negative integer.`)
        }
        if (max < alloc) {
          errs.push(
            `Max Need[P${i}][R${j}] (${max}) cannot be less than Allocation[P${i}][R${j}] (${alloc}).`
          )
        }
      }
    }

    return errs
  }

  const handleSubmit = () => {
    const validationErrors = validate()
    setErrors(validationErrors)

    if (validationErrors.length > 0) {
      setSaved(false)
      return
    }

    const config: SystemConfig = {
      numProcesses,
      numResources,
      available: [...available],
      allocation: allocation.map((r) => [...r]),
      maxNeed: maxNeed.map((r) => [...r]),
    }

    onSave(config)
    setSaved(true)
  }

  const resourceLabels = Array.from({ length: numResources }, (_, i) => `R${i}`)
  const processLabels = Array.from({ length: numProcesses }, (_, i) => `P${i}`)

  return (
    <div className="config-form">
      <h2>System Configuration</h2>

      {/* Dimension inputs */}
      <div className="dimension-inputs">
        <div className="dimension-field">
          <label htmlFor="num-processes">Processes</label>
          <input
            id="num-processes"
            type="number"
            min={1}
            max={10}
            value={numProcesses}
            onChange={(e) => handleProcessChange(e.target.value)}
          />
        </div>
        <div className="dimension-field">
          <label htmlFor="num-resources">Resources</label>
          <input
            id="num-resources"
            type="number"
            min={1}
            max={10}
            value={numResources}
            onChange={(e) => handleResourceChange(e.target.value)}
          />
        </div>
      </div>

      {/* Available resources */}
      <div className="section-heading">Available Resources</div>
      <div className="available-row">
        {resourceLabels.map((label, j) => (
          <div className="available-cell" key={j}>
            <label>{label}</label>
            <input
              type="number"
              min={0}
              value={available[j]}
              onChange={(e) => handleAvailableChange(j, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Allocation matrix */}
      <div className="section-heading">Allocation Matrix</div>
      <div className="matrix-section">
        <MatrixGrid
          matrix={allocation}
          processLabels={processLabels}
          resourceLabels={resourceLabels}
          maxNeed={null}
          highlightedRow={highlightedProcess}
          onChange={(r, c, v) => handleMatrixChange('allocation', r, c, v)}
        />
      </div>

      {/* Max Need matrix */}
      <div className="section-heading">Maximum Need Matrix</div>
      <div className="matrix-section">
        <MatrixGrid
          matrix={maxNeed}
          processLabels={processLabels}
          resourceLabels={resourceLabels}
          maxNeed={null}
          highlightedRow={highlightedProcess}
          onChange={(r, c, v) => handleMatrixChange('maxNeed', r, c, v)}
        />
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="validation-errors">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {/* Submit */}
      <div className="submit-section">
        <button className="submit-btn" onClick={handleSubmit}>
          Save Configuration
        </button>
      </div>

      {saved && (
        <div className="success-message">Configuration saved successfully.</div>
      )}
    </div>
  )
}

/* ---------- helpers ---------- */

function clampDimension(val: string): number {
  const n = parseInt(val, 10)
  if (isNaN(n) || n < 1) return 1
  if (n > 10) return 10
  return n
}

function parseNonNeg(val: string): number {
  const n = parseInt(val, 10)
  if (isNaN(n) || n < 0) return 0
  return n
}

/* ---------- MatrixGrid sub-component ---------- */

interface MatrixGridProps {
  matrix: number[][]
  processLabels: string[]
  resourceLabels: string[]
  maxNeed: number[][] | null
  highlightedRow?: number | null
  readOnly?: boolean
  onChange?: (row: number, col: number, val: string) => void
}

function MatrixGrid({
  matrix,
  processLabels,
  resourceLabels,
  maxNeed,
  highlightedRow,
  readOnly,
  onChange,
}: MatrixGridProps) {
  return (
    <table className="matrix-table">
      <thead>
        <tr>
          <th></th>
          {resourceLabels.map((label) => (
            <th key={label}>{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {processLabels.map((pLabel, i) => {
          const isHighlighted = highlightedRow != null && highlightedRow === i
          return (
            <tr key={pLabel} className={isHighlighted ? 'row-highlighted' : ''}>
              <td className="row-label">{pLabel}</td>
              {resourceLabels.map((_, j) => {
                const hasError =
                  maxNeed !== null && maxNeed[i][j] < matrix[i][j]
                return (
                  <td key={j}>
                    {readOnly ? (
                      <span className="matrix-value">{matrix[i][j]}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={matrix[i][j]}
                        className={hasError ? 'input-error' : ''}
                        onChange={(e) => onChange?.(i, j, e.target.value)}
                      />
                    )}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export { MatrixGrid }

export default SystemConfigForm
