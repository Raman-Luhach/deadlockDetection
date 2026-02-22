import { useState } from 'react'
import '../App.css'
import SystemConfigForm from '../components/SystemConfigForm'
import type { SystemConfig } from '../types/system'

function HomePage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)

  return (
    <div className="home">
      <h1>Deadlock Detection System</h1>
      <p className="subtitle">
        Visualize and analyze deadlocks using the Banker's Algorithm and Resource Allocation Graphs
      </p>

      <SystemConfigForm onSave={setConfig} />

      {config && (
        <div className="config-preview">
          <h3>Saved Configuration</h3>
          <p>
            {config.numProcesses} processes, {config.numResources} resources
          </p>
          <p>
            Available: [{config.available.join(', ')}]
          </p>
        </div>
      )}
    </div>
  )
}

export default HomePage
