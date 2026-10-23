import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { formatTanggalWaktu } from '../../utils/date'

const EMPTY_FORM = {
  name: '',
  username: '',
  password: '',
  role: 'kasir',
}

export default function PenggunaPage() {
  const { user, usersList, tambahUser, editUser, hapusUser, toggleStatusUser } = useAuth()
  const { addToast } = useToast()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Confirm Delete
  const [deletingUser, setDeletingUser] = useState(null)

  // Search Filter
  const [search, setSearch] = useState('')

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = usersList.length
    const adminCount = usersList.filter(u => u.role === 'admin').length
    const kasirCount = usersList.filter(u => u.role === 'kasir').length
    const aktifCount = usersList.filter(u => u.status === 'aktif').length

    return { total, adminCount, kasirCount, aktifCount }
  }, [usersList])

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return usersList.filter(u =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  }, [usersList, search])

  // Open Tambah
  const handleOpenTambah = () => {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setIsModalOpen(true)
  }

  // Open Edit
  const handleOpenEdit = (u) => {
    setEditingUser(u)
    setForm({
      name: u.name,
      username: u.username,
      password: '', // Kosongkan agar tidak wajib diubah
      role: u.role,
    })
    setErrors({})
    setIsModalOpen(true)
  }

  // Save (Tambah / Edit)
  const handleSave = async () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nama lengkap tidak boleh kosong'
    if (!form.username.trim()) errs.username = 'Username tidak boleh kosong'
    else if (/\s/.test(form.username.trim())) errs.username = 'Username tidak boleh mengandung spasi'

    if (!editingUser) {
      if (!form.password) errs.password = 'Password wajib diisi untuk pengguna baru'
      else if (form.password.length < 4) errs.password = 'Password minimal 4 karakter'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 400))

      if (editingUser) {
        const payload = {
          name: form.name,
          username: form.username,
          role: form.role,
        }
        if (form.password.trim()) payload.password = form.password.trim()

        const res = editUser(editingUser.id, payload)
        if (res?.error) {
          setErrors({ general: res.error })
          return
        }
        addToast({ type: 'success', title: 'Pengguna Diperbarui', message: `Data akun ${form.name} berhasil disimpan.` })
      } else {
        const res = tambahUser(form)
        if (res?.error) {
          setErrors({ general: res.error })
          return
        }
        addToast({ type: 'success', title: 'Pengguna Ditambahkan', message: `Akun baru ${form.name} berhasil dibuat.` })
      }

      setIsModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  // Toggle Status
  const handleToggleStatus = (u) => {
    const res = toggleStatusUser(u.id)
    if (res?.error) {
      addToast({ type: 'error', title: 'Aksi Ditolak', message: res.error })
    } else {
      const newStatus = u.status === 'aktif' ? 'nonaktif' : 'aktif'
      addToast({ type: 'info', title: 'Status Diubah', message: `Akun ${u.name} sekarang ${newStatus}.` })
    }
  }

  // Confirm Hapus
  const handleConfirmHapus = () => {
    if (!deletingUser) return
    const res = hapusUser(deletingUser.id)
    if (res?.error) {
      addToast({ type: 'error', title: 'Tidak Dapat Dihapus', message: res.error })
    } else {
      addToast({ type: 'success', title: 'Pengguna Dihapus', message: `Akun ${deletingUser.name} telah dihapus.` })
    }
    setDeletingUser(null)
  }

  return (
    <div className="pengguna-page" id="pengguna-page">
      {/* ── Page Header ── */}
      <div className="pengguna-header">
        <div>
          <div className="pengguna-header-title-row">
            <h1 className="page-title">Manajemen Pengguna</h1>
            <Badge variant="primary" dot>{metrics.total} Pengguna</Badge>
          </div>
          <p className="page-subtitle">
            Kelola akun petugas kasir dan administrator sistem kasir kantin.
          </p>
        </div>

        <div className="pengguna-header-actions">
          <Button variant="primary" onClick={handleOpenTambah} id="btn-tambah-user">
            <span aria-hidden="true">➕</span> Tambah Pengguna Baru
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="pengguna-stats-grid">
        <div className="pengguna-stat-card">
          <div className="pengguna-stat-icon stat-icon--primary" aria-hidden="true">👥</div>
          <div className="pengguna-stat-content">
            <div className="pengguna-stat-label">Total Akun Terdaftar</div>
            <div className="pengguna-stat-value">{metrics.total}</div>
            <div className="pengguna-stat-sub">Admin & Kasir</div>
          </div>
        </div>

        <div className="pengguna-stat-card">
          <div className="pengguna-stat-icon stat-icon--purple" aria-hidden="true">🛡️</div>
          <div className="pengguna-stat-content">
            <div className="pengguna-stat-label">Administrator</div>
            <div className="pengguna-stat-value" style={{ color: '#7c3aed' }}>{metrics.adminCount}</div>
            <div className="pengguna-stat-sub">Hak akses penuh sistem</div>
          </div>
        </div>

        <div className="pengguna-stat-card">
          <div className="pengguna-stat-icon stat-icon--teal" aria-hidden="true">🛒</div>
          <div className="pengguna-stat-content">
            <div className="pengguna-stat-label">Petugas Kasir</div>
            <div className="pengguna-stat-value" style={{ color: '#0d9488' }}>{metrics.kasirCount}</div>
            <div className="pengguna-stat-sub">Akses transaksi penjualan</div>
          </div>
        </div>

        <div className="pengguna-stat-card">
          <div className="pengguna-stat-icon stat-icon--success" aria-hidden="true">✅</div>
          <div className="pengguna-stat-content">
            <div className="pengguna-stat-label">Pengguna Aktif</div>
            <div className="pengguna-stat-value" style={{ color: 'var(--color-success)' }}>{metrics.aktifCount}</div>
            <div className="pengguna-stat-sub">Dapat login ke sistem</div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card table-card" id="pengguna-table-card">
        <div className="table-responsive">
          <table className="pengguna-table" id="table-pengguna">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No</th>
                <th>Pengguna</th>
                <th>Username</th>
                <th style={{ textAlign: 'center' }}>Role / Hak Akses</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th>Terakhir Login</th>
                <th style={{ textAlign: 'center', width: '150px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => {
                const isCurrentUser = user?.id === u.id
                const isAktif = u.status === 'aktif'

                return (
                  <tr key={u.id}>
                    <td className="col-muted">{idx + 1}</td>
                    <td>
                      <div className="user-profile-cell">
                        <div className="user-avatar" aria-hidden="true">
                          {u.role === 'admin' ? '🛡️' : '👤'}
                        </div>
                        <div>
                          <div className="user-name">
                            {u.name} {isCurrentUser && <span className="you-badge">(Anda)</span>}
                          </div>
                          <div className="user-id-sub">ID: #{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="username-text">@{u.username}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={u.role === 'admin' ? 'primary' : 'info'}>
                        {u.role === 'admin' ? '🛡️ Administrator' : '🛒 Kasir'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`status-pill ${isAktif ? 'status-active' : 'status-inactive'}`}
                        onClick={() => handleToggleStatus(u)}
                        title={isCurrentUser ? 'Akun aktif saat ini' : 'Klik untuk ubah status'}
                        disabled={isCurrentUser}
                        id={`toggle-user-status-${u.id}`}
                      >
                        <span className="dot"></span>
                        {isAktif ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td>
                      <span className="time-sub">
                        {u.terakhirLogin ? formatTanggalWaktu(u.terakhirLogin) : 'Belum pernah login'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="table-action-row">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Pengguna"
                          id={`btn-edit-user-${u.id}`}
                        >
                          ✏️
                        </Button>
                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon
                            className="btn-danger-ghost"
                            onClick={() => setDeletingUser(u)}
                            title="Hapus Pengguna"
                            id={`btn-delete-user-${u.id}`}
                          >
                            🗑️
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Tambah / Edit ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `✏️ Edit Pengguna: ${editingUser.name}` : '➕ Tambah Pengguna Baru'}
        size="md"
        id="modal-pengguna-form"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving} id="btn-save-pengguna">
              {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
            </Button>
          </>
        }
      >
        <div className="pengguna-form">
          {errors.general && (
            <div className="error-alert-banner">⚠️ {errors.general}</div>
          )}

          <div className="form-group">
            <Input
              label="Nama Lengkap"
              placeholder="Contoh: Siti Rahmawati"
              value={form.name}
              onChange={e => {
                setForm(prev => ({ ...prev, name: e.target.value }))
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
              }}
              error={errors.name}
              required
              id="input-user-name"
            />
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
            <Input
              label="Username"
              placeholder="Contoh: siti"
              value={form.username}
              onChange={e => {
                setForm(prev => ({ ...prev, username: e.target.value }))
                if (errors.username) setErrors(prev => ({ ...prev, username: '' }))
              }}
              error={errors.username}
              required
              hint="Digunakan untuk login ke sistem (tanpa spasi)"
              id="input-user-username"
            />
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
            <Input
              label={editingUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
              type="password"
              placeholder="Minimal 4 karakter"
              value={form.password}
              onChange={e => {
                setForm(prev => ({ ...prev, password: e.target.value }))
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
              }}
              error={errors.password}
              required={!editingUser}
              id="input-user-password"
            />
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
            <Select
              label="Peran / Hak Akses (Role)"
              value={form.role}
              onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
              id="select-user-role"
            >
              <option value="kasir">🛒 Kasir (Hanya Akses POS, Produk & Transaksi)</option>
              <option value="admin">🛡️ Administrator (Akses Penuh Seluruh Modul & Pengaturan)</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmHapus}
        title="Hapus Pengguna?"
        message={`Apakah Anda yakin ingin menghapus akun pengguna "${deletingUser?.name}" (@${deletingUser?.username})? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Pengguna"
        cancelText="Batal"
        variant="danger"
      />

      {/* ── Scoped Styling ── */}
      <style>{`
        .pengguna-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        /* Header */
        .pengguna-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .pengguna-header-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }
        .pengguna-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        /* KPI Cards */
        .pengguna-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-4);
        }
        .pengguna-stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .pengguna-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .pengguna-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .stat-icon--primary { background: var(--color-primary-subtle); color: var(--color-primary); }
        .stat-icon--purple { background: #f5f3ff; color: #7c3aed; }
        .stat-icon--teal { background: #f0fdfa; color: #0d9488; }
        .stat-icon--success { background: #ecfdf5; color: #059669; }
        .pengguna-stat-content { flex: 1; min-width: 0; }
        .pengguna-stat-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .pengguna-stat-value {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          line-height: var(--line-height-tight);
        }
        .pengguna-stat-sub {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        /* Table Card */
        .table-card { padding: 0; overflow: hidden; }
        .table-responsive { overflow-x: auto; }
        .pengguna-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--font-size-sm);
        }
        .pengguna-table th {
          background: var(--color-surface-sunken);
          color: var(--color-text-muted);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .pengguna-table td {
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
        }
        .pengguna-table tr:last-child td { border-bottom: none; }
        .pengguna-table tr:hover td { background: var(--color-surface-hover); }
        .col-muted { color: var(--color-text-muted); font-size: var(--font-size-xs); }

        .user-profile-cell {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .user-name {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }
        .you-badge {
          font-size: 11px;
          font-weight: normal;
          color: var(--color-primary);
          margin-left: 4px;
        }
        .user-id-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }
        .username-text { font-family: monospace; color: var(--color-text-primary); }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          border: 1px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .status-pill .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .status-active {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }
        .status-active .dot { background: #10b981; }
        .status-inactive {
          background: #f1f5f9;
          color: #64748b;
          border-color: #cbd5e1;
        }
        .status-inactive .dot { background: #94a3b8; }

        .time-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }

        .table-action-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
        }
        .btn-danger-ghost:hover {
          color: var(--color-danger) !important;
          background: #fef2f2 !important;
        }

        .error-alert-banner {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          margin-bottom: var(--space-3);
        }
      `}</style>
    </div>
  )
}
