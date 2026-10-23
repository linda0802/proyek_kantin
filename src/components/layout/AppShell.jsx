import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const openSidebar = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Overlay untuk mobile */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Main Area */}
      <div className="main-area">
        <Header onMenuClick={openSidebar} />
        <main className="page-content" id="main-content" role="main">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
