import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div className="landing">
      <p className="subtitle">
        Visualize and analyze deadlocks using the Banker's Algorithm and Resource Allocation Graphs
      </p>
      <div className="landing-links">
        <Link to="/config" className="landing-card">
          <h3>Configure &amp; Detect</h3>
          <p>Set up system state and run deadlock detection</p>
        </Link>
        <Link to="/rag" className="landing-card">
          <h3>Resource Allocation Graph</h3>
          <p>Visualize process-resource relationships</p>
        </Link>
        <Link to="/step" className="landing-card">
          <h3>Step-by-Step</h3>
          <p>Walk through Banker's Algorithm one step at a time</p>
        </Link>
        <Link to="/simulate" className="landing-card">
          <h3>Simulate Request</h3>
          <p>Test if granting a resource request is safe</p>
        </Link>
      </div>
    </div>
  )
}

export default LandingPage
