import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/kasir': 'Kasir / Penjualan',
  '/transaksi': 'Riwayat Transaksi',
  '/produk': 'Data Produk',
  '/stok': 'Manajemen Stok',
  '/laporan': 'Laporan Penjualan',
  '/tutup-kas': 'Tutup Kas',
  '/pengguna': 'Pengguna',
  '/pengaturan': 'Pengaturan',
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { addToast } = useToast()

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'KantinKu'
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleLogout = () => {
    logout()
    addToast({ type: 'success', title: 'Berhasil keluar', message: 'Sampai jumpa!' })
  }

  return (
    <header className="header" role="banner">
      {/* Hamburger (mobile) */}
      <button
        className="header__menu-btn"
        id="header-menu-btn"
        onClick={onMenuClick}
        aria-label="Buka navigasi"
      >
        ☰
      </button>

      {/* Page title */}
      <h1 className="header__title">{pageTitle}</h1>

      {/* Actions */}
      <div className="header__actions">
        {/* Notifikasi */}
        <button
          className="header__icon-btn"
          id="header-notif-btn"
          aria-label="Notifikasi"
          title="Notifikasi"
        >
          🔔
          {/* Dot akan ditampilkan jika ada notifikasi baru */}
          {/* <span className="header__notif-dot" aria-hidden="true" /> */}
        </button>

        {/* Profil */}
        <div
          className="header__profile"
          id="header-profile-btn"
          role="button"
          tabIndex={0}
          aria-label="Menu profil"
          onKeyDown={e => e.key === 'Enter' && handleLogout()}
          onClick={handleLogout}
          title="Klik untuk keluar"
        >
          <div className="header__profile-avatar" aria-hidden="true">{initials}</div>
          <span className="header__profile-name">{user?.name ?? 'Pengguna'}</span>
        </div>
      </div>
    </header>
  )
}
