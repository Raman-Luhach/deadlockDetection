import { Link } from 'react-router-dom'
import RagGraph from '../components/RagGraph'
import { useAppState } from '../context/AppContext'

function RagPage() {
  const { config, result, highlightedProcess } = useAppState()

  if (!config) {
    return (
      <div className="page-empty">
        <p>No configuration loaded. Go to <Link to="/config">Config &amp; Detect</Link> to set up the system state first.</p>
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
