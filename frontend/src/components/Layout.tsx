import { NavLink, Outlet } from 'react-router-dom'
import './Layout.css'

function Layout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1 className="app-title">Deadlock Detection System</h1>
        <nav className="app-nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/config">Config &amp; Detect</NavLink>
          <NavLink to="/rag">RAG</NavLink>
          <NavLink to="/step">Step-by-Step</NavLink>
          <NavLink to="/simulate">Simulate</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
