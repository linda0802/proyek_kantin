import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function BottomNav() {
  const { isAdmin } = useAuth()

  const navItems = useMemo(() => [
    { to: '/', label: 'Dashboard', icon: '📊', exact: true },
    { to: '/kasir', label: 'Kasir', icon: '🛒' },
    { to: '/transaksi', label: 'Transaksi', icon: '📋' },
    { to: '/produk', label: 'Produk', icon: '📦' },
    isAdmin
      ? { to: '/pengaturan', label: 'Pengaturan', icon: '⚙️' }
      : { to: '/tutup-kas', label: 'Tutup Kas', icon: '💰' },
  ], [isAdmin])

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navigasi bawah">
      <div className="bottom-nav__items">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `bottom-nav__item${isActive ? ' active' : ''}`
            }
            id={`bottom-nav-${item.to.replace(/\//g, '-').replace(/^-/, '') || 'home'}`}
            aria-label={item.label}
          >
            <span className="bottom-nav__icon" aria-hidden="true">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
