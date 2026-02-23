import RagGraph from '../components/RagGraph'
import { useAppState } from '../context/AppContext'

function RagPage() {
  const { config, result, highlightedProcess } = useAppState()

  if (!config) {
    return (
      <div className="page-empty">
        <p>No configuration loaded. Go to <a href="/config">Config &amp; Detect</a> to set up the system state first.</p>
      </div>
    )
  }

  return (
    <RagGraph
      config={config}
      detectionResult={result}
      highlightedProcess={highlightedProcess}
    />
  )
}

export default RagPage
