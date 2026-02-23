import { useState } from 'react'
import '../App.css'
import SystemConfigForm from '../components/SystemConfigForm'
import DetectionResultView from '../components/DetectionResultView'
import {
  detectDeadlock,
  resolveDeadlock,
  exportState,
  parseAndValidateImportedState,
} from '../services/api'
import type { SystemConfig } from '../types/system'
import { sampleScenarios } from '../data/sampleScenarios'
import { useAppState } from '../context/AppContext'

function HomePage() {
  const {
    config,
    setConfig,
    result,
    setResult,
    highlightedProcess,
    setHighlightedProcess,
    formKey,
    bumpFormKey,
    fileInputRef,
  } = useAppState()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveMsg, setResolveMsg] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

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
      bumpFormKey()
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
    bumpFormKey()
  }

  const handleExport = async () => {
    if (!config) return
    setExporting(true)
    setError(null)
    try {
      const json = await exportState(config)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'deadlock-state.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        const imported = parseAndValidateImportedState(text)
        setConfig(imported)
        bumpFormKey()
        setResult(null)
        setHighlightedProcess(null)
        setResolveMsg(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid state file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="home">
      <div className="sample-scenarios">
        {sampleScenarios.map((s, i) => (
          <button
            key={i}
            type="button"
            className="sample-btn"
            title={s.description}
            onClick={() => handleSave(s.config)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <SystemConfigForm
        key={formKey}
        onSave={handleSave}
        highlightedProcess={highlightedProcess}
        initialConfig={config}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="file-input-hidden"
        aria-hidden
        onChange={handleImport}
      />

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
            <div className="export-import-row">
              <button
                type="button"
                className="export-btn"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? 'Exporting...' : 'Export state'}
              </button>
              <button
                type="button"
                className="import-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Import state
              </button>
            </div>
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
        </>
      )}
    </div>
  )
}

export default HomePage
