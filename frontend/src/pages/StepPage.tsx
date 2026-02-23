import StepByStepView from '../components/StepByStepView'
import { useAppState } from '../context/AppContext'

function StepPage() {
  const { config, setHighlightedProcess } = useAppState()

  if (!config) {
    return (
      <div className="page-empty">
        <p>No configuration loaded. Go to <a href="/config">Config &amp; Detect</a> to set up the system state first.</p>
      </div>
    )
  }

  return (
    <StepByStepView config={config} onHighlight={setHighlightedProcess} />
  )
}

export default StepPage
