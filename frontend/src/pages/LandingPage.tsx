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

      <div className="glossary">
        <h3>Glossary</h3>
        <dl>
          <dt>Allocation Matrix</dt>
          <dd>Resources currently held by each process.</dd>
          <dt>Max Need Matrix</dt>
          <dd>Maximum resources each process may ever need to complete.</dd>
          <dt>Need Matrix</dt>
          <dd>Remaining resources each process still needs (Max Need &minus; Allocation).</dd>
          <dt>Available Vector</dt>
          <dd>Number of instances of each resource type currently unallocated.</dd>
          <dt>Safe Sequence</dt>
          <dd>An order in which all processes can finish without deadlock.</dd>
          <dt>RAG (Resource Allocation Graph)</dt>
          <dd>A directed graph showing which processes hold or request resources.</dd>
          <dt>Request Edge (P &rarr; R)</dt>
          <dd>Process P is waiting for resource R.</dd>
          <dt>Assignment Edge (R &rarr; P)</dt>
          <dd>Resource R is currently allocated to process P.</dd>
        </dl>
      </div>
    </div>
  )
}

export default LandingPage
