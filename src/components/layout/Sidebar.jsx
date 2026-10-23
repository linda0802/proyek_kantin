import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'

const NAV_ITEMS = [
  {
    section: 'Utama',
    items: [
      { to: '/', label: 'Dashboard', icon: '📊', exact: true },
      { to: '/kasir', label: 'Kasir / Penjualan', icon: '🛒' },
      { to: '/transaksi', label: 'Riwayat Transaksi', icon: '📋' },
    ],
  },
  {
    section: 'Manajemen',
    items: [
      { to: '/produk', label: 'Data Produk', icon: '📦' },
      { to: '/stok', label: 'Manajemen Stok', icon: '🗂️' },
      { to: '/laporan', label: 'Laporan Penjualan', icon: '📈' },
      { to: '/tutup-kas', label: 'Tutup Kas', icon: '💰' },
    ],
  },
  {
    section: 'Sistem',
    adminOnly: true,
    items: [
      { to: '/pengguna', label: 'Pengguna', icon: '👥', adminOnly: true },
      { to: '/pengaturan', label: 'Pengaturan', icon: '⚙️' },
    ],
  },
]

const OPTIONAL_ITEMS = [
  { key: 'barangTitipan', to: '/titipan', label: 'Barang Titipan', icon: '🤝' },
  { key: 'rekapIstirahat', to: '/laporan/istirahat', label: 'Rekap Istirahat', icon: '⏰' },
  { key: 'makananTerbuang', to: '/stok/terbuang', label: 'Makanan Terbuang', icon: '🗑️' },
  { key: 'catatanUtang', to: '/utang', label: 'Catatan Utang', icon: '📝' },
  { key: 'manajemenPemasok', to: '/pemasok', label: 'Pemasok', icon: '🚚' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const { settings } = useSettings()
  const location = useLocation()

  const isAdmin = user?.role === 'admin'
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  // Optional nav items yang aktif
  const activeOptional = OPTIONAL_ITEMS.filter(item => settings?.optionalFeatures?.[item.key])

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} role="navigation" aria-label="Navigasi utama">
      {/* Brand */}
      <div className="sidebar__header">
        <div className="sidebar__logo" aria-hidden="true">🍽️</div>
        <div className="sidebar__brand">Kantin<span>Ku</span></div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map(section => {
          // Sembunyikan section admin-only jika bukan admin
          if (section.adminOnly && !isAdmin) return null
          const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin)
          if (visibleItems.length === 0) return null

          return (
            <div key={section.section}>
              <div className="sidebar__nav-section">
                <span className="sidebar__nav-section-label">{section.section}</span>
              </div>
              {visibleItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `sidebar__nav-item${isActive ? ' active' : ''}`
                  }
                  onClick={onClose}
                  id={`nav-${item.to.replace(/\//g, '-').replace(/^-/, '')}`}
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )
        })}

        {/* Fitur Opsional */}
        {activeOptional.length > 0 && (
          <div>
            <div className="sidebar__nav-section">
              <span className="sidebar__nav-section-label">Opsional</span>
            </div>
            {activeOptional.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar__nav-item${isActive ? ' active' : ''}`
                }
                onClick={onClose}
                id={`nav-optional-${item.key}`}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__user" role="button" tabIndex={0} aria-label="Menu profil pengguna">
          <div className="sidebar__avatar" aria-hidden="true">{initials}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name truncate">{user?.name ?? 'Pengguna'}</div>
            <div className="sidebar__user-role">
              {user?.role === 'admin' ? '👑 Admin' : '🧑‍💼 Kasir'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
