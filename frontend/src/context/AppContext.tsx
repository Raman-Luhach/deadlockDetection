import { createContext, useContext, useState, useRef } from 'react'
import type { SystemConfig } from '../types/system'
import type { DetectionResult } from '../types/detection'

interface AppState {
  config: SystemConfig | null
  setConfig: (c: SystemConfig | null) => void
  result: DetectionResult | null
  setResult: (r: DetectionResult | null) => void
  highlightedProcess: number | null
  setHighlightedProcess: (p: number | null) => void
  formKey: number
  bumpFormKey: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [highlightedProcess, setHighlightedProcess] = useState<number | null>(null)
  const [formKey, setFormKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const bumpFormKey = () => setFormKey((k) => k + 1)

  return (
    <AppContext.Provider
      value={{
        config,
        setConfig,
        result,
        setResult,
        highlightedProcess,
        setHighlightedProcess,
        formKey,
        bumpFormKey,
        fileInputRef,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
