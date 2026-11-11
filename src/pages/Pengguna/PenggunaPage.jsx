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
  permissions: {
    hutang: true,
    titipan: true,
  },
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
      permissions: {
        hutang: u.role === 'admin' ? true : (u.permissions?.hutang ?? true),
        titipan: u.role === 'admin' ? true : (u.permissions?.titipan ?? true),
      },
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
      await new Promise(r => setTimeout(r, 300))

      if (editingUser) {
        const payload = {
          name: form.name,
          username: form.username,
          role: form.role,
          permissions: form.role === 'admin' ? { hutang: true, titipan: true } : form.permissions,
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

  // Toggle Quick Permission dari Tabel
  const handleQuickTogglePermission = (u, permKey) => {
    if (u.role === 'admin') return // Admin selalu full
    const currentVal = !!u.permissions?.[permKey]
    const nextVal = !currentVal
    const nextPerms = {
      hutang: u.permissions?.hutang ?? true,
      titipan: u.permissions?.titipan ?? true,
      [permKey]: nextVal,
    }

    editUser(u.id, { permissions: nextPerms })
    addToast({
      type: 'info',
      title: 'Izin Diperbarui',
      message: `Fitur ${permKey.toUpperCase()} untuk ${u.name} sekarang: ${nextVal ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}.`,
    })
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
            <h1 className="page-title">Manajemen Pengguna & Izin Akses</h1>
            <Badge variant="primary" dot>{metrics.total} Pengguna</Badge>
          </div>
          <p className="page-subtitle">
            Kelola akun petugas kasir, admin, dan tentukan izin fitur khusus (Hutang/Kasbon & Titipan) per pengguna.
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
                <th style={{ textAlign: 'center' }}>Izin Fitur (Per Akun)</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th>Terakhir Login</th>
                <th style={{ textAlign: 'center', width: '130px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => {
                const isCurrentUser = user?.id === u.id
                const isAktif = u.status === 'aktif'
                const isUserAdmin = u.role === 'admin'
                const hutangAktif = isUserAdmin || u.permissions?.hutang
                const titipanAktif = isUserAdmin || u.permissions?.titipan

                return (
                  <tr key={u.id}>
                    <td className="col-muted">{idx + 1}</td>
                    <td>
                      <div className="user-profile-cell">
                        <div className="user-avatar" aria-hidden="true">
                          {isUserAdmin ? '🛡️' : '👤'}
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
                      <Badge variant={isUserAdmin ? 'primary' : 'info'}>
                        {isUserAdmin ? '🛡️ Administrator' : '🛒 Kasir'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isUserAdmin ? (
                        <span className="perm-badge-admin" title="Admin memiliki akses penuh ke semua fitur">
                          ⭐ Akses Penuh
                        </span>
                      ) : (
                        <div className="perm-pills-row">
                          <button
                            type="button"
                            className={`perm-pill ${hutangAktif ? 'perm-on' : 'perm-off'}`}
                            onClick={() => handleQuickTogglePermission(u, 'hutang')}
                            title={`Klik untuk ubah izin Kasbon/Hutang (Saat ini: ${hutangAktif ? 'ON' : 'OFF'})`}
                          >
                            📝 Hutang: {hutangAktif ? 'ON' : 'OFF'}
                          </button>
                          <button
                            type="button"
                            className={`perm-pill ${titipanAktif ? 'perm-on' : 'perm-off'}`}
                            onClick={() => handleQuickTogglePermission(u, 'titipan')}
                            title={`Klik untuk ubah izin Barang Titipan (Saat ini: ${titipanAktif ? 'ON' : 'OFF'})`}
                          >
                            🤝 Titipan: {titipanAktif ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      )}
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
                          title="Edit Pengguna & Izin"
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

      {/* ── Modal Form Tambah / Edit Pengguna ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? '✏️ Edit Pengguna & Izin Akses' : '➕ Tambah Pengguna Baru'}
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
              <option value="kasir">🛒 Kasir (Dapat disesuaikan izin fitur)</option>
              <option value="admin">🛡️ Administrator (Akses Penuh Seluruh Modul)</option>
            </Select>
          </div>

          {/* ── Izin Fitur Opsional Per Pengguna ── */}
          <div className="form-perm-section">
            <label className="form-perm-title">Pengaturan Izin Fitur Opsional</label>
            <p className="form-perm-desc">
              Tentukan fitur yang diizinkan untuk akun kasir ini secara individual:
            </p>

            {form.role === 'admin' ? (
              <div className="admin-perm-notice">
                ℹ️ <strong>Administrator memiliki akses penuh</strong> ke seluruh fitur sistem termasuk Hutang/Kasbon dan Barang Titipan.
              </div>
            ) : (
              <div className="perm-toggle-list">
                <label className="perm-checkbox-item">
                  <input
                    type="checkbox"
                    checked={!!form.permissions?.hutang}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, hutang: e.target.checked },
                      }))
                    }
                  />
                  <div>
                    <div className="perm-item-name">📝 Fitur Hutang / Kasbon</div>
                    <div className="perm-item-desc">
                      Jika aktif (ON), kasir dapat memilih metode pembayaran Kasbon dan transaksi otomatis tercatat ke Catatan Hutang. Jika nonaktif (OFF), kasir hanya dapat memproses Tunai dan Non-Tunai.
                    </div>
                  </div>
                </label>

                <label className="perm-checkbox-item">
                  <input
                    type="checkbox"
                    checked={!!form.permissions?.titipan}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, titipan: e.target.checked },
                      }))
                    }
                  />
                  <div>
                    <div className="perm-item-name">🤝 Fitur Barang Titipan (Konsinyasi)</div>
                    <div className="perm-item-desc">
                      Jika aktif (ON), kasir dapat melihat dan menjual produk titipan di kasir POS serta mengakses menu Barang Titipan. Jika nonaktif (OFF), menu dan produk titipan disembunyikan dari akun ini.
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmHapus}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${deletingUser?.name}" (@${deletingUser?.username})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Pengguna"
        confirmVariant="danger"
      />

      <style>{`
        .pengguna-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }
        .pengguna-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-4);
        }
        .pengguna-header-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }

        /* Stats Grid */
        .pengguna-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }
        .pengguna-stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          box-shadow: var(--shadow-sm);
        }
        .pengguna-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        .stat-icon--primary { background: var(--color-primary-subtle); color: var(--color-primary); }
        .stat-icon--purple { background: #f5f3ff; color: #7c3aed; }
        .stat-icon--teal { background: #f0fdfa; color: #0d9488; }
        .stat-icon--success { background: var(--color-success-bg); color: var(--color-success); }

        .pengguna-stat-content { flex: 1; min-width: 0; }
        .pengguna-stat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          font-weight: var(--font-weight-medium);
        }
        .pengguna-stat-value {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          line-height: 1.2;
        }
        .pengguna-stat-sub {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        /* Table Card */
        .pengguna-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--font-size-sm);
        }
        .pengguna-table th {
          text-align: left;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          background: var(--color-surface-sunken);
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

        /* Permission Pills in Table */
        .perm-pills-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: center;
        }
        .perm-pill {
          border: none;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .perm-on {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }
        .perm-on:hover {
          background: #d1fae5;
        }
        .perm-off {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #cbd5e1;
        }
        .perm-off:hover {
          background: #e2e8f0;
        }
        .perm-badge-admin {
          display: inline-block;
          font-size: 11px;
          font-weight: var(--font-weight-semibold);
          color: #6d28d9;
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

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

        /* Form Permissions Section */
        .form-perm-section {
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border);
        }
        .form-perm-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          display: block;
          margin-bottom: 2px;
        }
        .form-perm-desc {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-bottom: var(--space-3);
        }
        .admin-perm-notice {
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          color: #5b21b6;
          border-radius: var(--radius-md);
          padding: var(--space-3);
          font-size: var(--font-size-xs);
        }
        .perm-toggle-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .perm-checkbox-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
        }
        .perm-checkbox-item input[type="checkbox"] {
          margin-top: 3px;
          cursor: pointer;
          width: 16px;
          height: 16px;
          accent-color: var(--color-primary);
        }
        .perm-item-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }
        .perm-item-desc {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 2px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}
