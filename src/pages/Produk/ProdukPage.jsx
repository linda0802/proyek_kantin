import { useState, useMemo } from 'react'
import { useProduk } from '../../context/ProdukContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { SearchInput, Select } from '../../components/ui/Input'
import { ConfirmDialog } from '../../components/ui/Modal'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatRupiah, formatNumber } from '../../utils/currency'
import ProdukForm from './ProdukForm'
import KategoriModal from './KategoriModal'

export default function ProdukPage() {
  const {
    produkList,
    tambahProduk,
    editProduk,
    hapusProduk,
    toggleStatusProduk,
    kategoriList,
    tambahKategori,
    editKategori,
    hapusKategori,
    getNamaKategori,
  } = useProduk()

  const { addToast } = useToast()

  // State UI
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('all') // 'all' or kategoriId number
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'tersedia' | 'habis'
  const [sortBy, setSortBy] = useState('nama-asc')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduk, setEditingProduk] = useState(null)
  const [isKategoriOpen, setIsKategoriOpen] = useState(false)
  const [deletingProduk, setDeletingProduk] = useState(null)

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = produkList.length
    const tersedia = produkList.filter(p => p.status === 'tersedia' && p.stok > 0).length
    const habisAtauKritis = produkList.filter(p => p.status === 'habis' || p.stok <= 5).length
    const totalUnit = produkList.reduce((sum, p) => sum + p.stok, 0)
    return { total, tersedia, habisAtauKritis, totalUnit }
  }, [produkList])

  // Filtered & Sorted Products
  const filteredProduk = useMemo(() => {
    return produkList
      .filter(p => {
        // Search
        const q = search.trim().toLowerCase()
        const matchSearch = !q || p.nama.toLowerCase().includes(q)

        // Kategori
        const matchKategori = filterKategori === 'all' || p.kategoriId === Number(filterKategori)

        // Status
        const matchStatus =
          filterStatus === 'all' ||
          (filterStatus === 'tersedia' && p.status === 'tersedia') ||
          (filterStatus === 'habis' && p.status === 'habis')

        return matchSearch && matchKategori && matchStatus
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'nama-asc':
            return a.nama.localeCompare(b.nama)
          case 'nama-desc':
            return b.nama.localeCompare(a.nama)
          case 'harga-desc':
            return b.hargaJual - a.hargaJual
          case 'harga-asc':
            return a.hargaJual - b.hargaJual
          case 'stok-desc':
            return b.stok - a.stok
          case 'stok-asc':
            return a.stok - b.stok
          default:
            return 0
        }
      })
  }, [produkList, search, filterKategori, filterStatus, sortBy])

  // Handlers
  const handleOpenTambah = () => {
    setEditingProduk(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (p) => {
    setEditingProduk(p)
    setIsFormOpen(true)
  }

  const handleSaveProduk = (formData) => {
    if (editingProduk) {
      editProduk(editingProduk.id, formData)
      addToast({
        type: 'success',
        title: 'Produk Diperbarui',
        message: `${formData.nama} berhasil diperbarui.`,
      })
    } else {
      tambahProduk(formData)
      addToast({
        type: 'success',
        title: 'Produk Ditambahkan',
        message: `${formData.nama} berhasil ditambahkan ke katalog.`,
      })
    }
  }

  const handleConfirmHapus = () => {
    if (!deletingProduk) return
    hapusProduk(deletingProduk.id)
    addToast({
      type: 'success',
      title: 'Produk Dihapus',
      message: `${deletingProduk.nama} telah dihapus dari katalog.`,
    })
    setDeletingProduk(null)
  }

  const handleToggleStatus = (p) => {
    toggleStatusProduk(p.id)
    const newStatus = p.status === 'tersedia' ? 'habis' : 'tersedia'
    addToast({
      type: 'info',
      title: 'Status Diubah',
      message: `${p.nama} sekarang berstatus "${newStatus}".`,
    })
  }

  const handleResetFilters = () => {
    setSearch('')
    setFilterKategori('all')
    setFilterStatus('all')
    setSortBy('nama-asc')
  }

  return (
    <div className="produk-page" id="produk-page">
      {/* ── Page Header ── */}
      <div className="produk-header">
        <div>
          <div className="produk-header-title-row">
            <h1 className="page-title">Data Produk & Kategori</h1>
            <Badge variant="primary" dot>{metrics.total} Produk</Badge>
          </div>
          <p className="page-subtitle">
            Kelola katalog menu, harga jual, stok fisik, dan klasifikasi kategori kantin sekolah.
          </p>
        </div>

        <div className="produk-header-actions">
          <Button
            variant="secondary"
            id="btn-kelola-kategori"
            onClick={() => setIsKategoriOpen(true)}
          >
            <span aria-hidden="true">🏷️</span> Kelola Kategori
          </Button>
          <Button
            variant="primary"
            id="btn-tambah-produk"
            onClick={handleOpenTambah}
          >
            <span aria-hidden="true">➕</span> Tambah Produk
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="produk-stats-grid">
        <div className="produk-stat-card">
          <div className="produk-stat-icon produk-stat-icon--primary" aria-hidden="true">📦</div>
          <div className="produk-stat-content">
            <div className="produk-stat-label">Total Produk</div>
            <div className="produk-stat-value">{metrics.total}</div>
            <div className="produk-stat-sub">Terdaftar di katalog</div>
          </div>
        </div>

        <div className="produk-stat-card">
          <div className="produk-stat-icon produk-stat-icon--success" aria-hidden="true">✅</div>
          <div className="produk-stat-content">
            <div className="produk-stat-label">Produk Tersedia</div>
            <div className="produk-stat-value" style={{ color: 'var(--color-success)' }}>
              {metrics.tersedia}
            </div>
            <div className="produk-stat-sub">Siap dijual di POS</div>
          </div>
        </div>

        <div className="produk-stat-card">
          <div className="produk-stat-icon produk-stat-icon--warning" aria-hidden="true">⚠️</div>
          <div className="produk-stat-content">
            <div className="produk-stat-label">Stok Kritis / Habis</div>
            <div className="produk-stat-value" style={{ color: 'var(--color-warning)' }}>
              {metrics.habisAtauKritis}
            </div>
            <div className="produk-stat-sub">Perlu restock segera</div>
          </div>
        </div>

        <div className="produk-stat-card">
          <div className="produk-stat-icon produk-stat-icon--info" aria-hidden="true">📊</div>
          <div className="produk-stat-content">
            <div className="produk-stat-label">Total Stok Fisik</div>
            <div className="produk-stat-value" style={{ fontSize: 'var(--font-size-xl)' }}>
              {formatNumber(metrics.totalUnit)} Unit
            </div>
            <div className="produk-stat-sub">Stok keseluruhan produk</div>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Section ── */}
      <div className="produk-controls-card">
        <div className="produk-controls-top">
          {/* Search bar */}
          <div className="produk-search-wrapper">
            <SearchInput
              id="produk-search-input"
              placeholder="Cari nama produk..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Quick Status Tabs */}
          <div className="produk-status-tabs" role="tablist">
            <button
              className={`produk-tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
              id="filter-status-semua"
            >
              Semua ({produkList.length})
            </button>
            <button
              className={`produk-tab-btn ${filterStatus === 'tersedia' ? 'active' : ''}`}
              onClick={() => setFilterStatus('tersedia')}
              id="filter-status-tersedia"
            >
              Tersedia ({produkList.filter(p => p.status === 'tersedia').length})
            </button>
            <button
              className={`produk-tab-btn ${filterStatus === 'habis' ? 'active' : ''}`}
              onClick={() => setFilterStatus('habis')}
              id="filter-status-habis"
            >
              Habis ({produkList.filter(p => p.status === 'habis').length})
            </button>
          </div>

          {/* Sort & View Toggle */}
          <div className="produk-sort-view-row">
            <div className="produk-sort-select">
              <Select
                id="produk-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="nama-asc">Nama (A - Z)</option>
                <option value="nama-desc">Nama (Z - A)</option>
                <option value="harga-desc">Harga Tertinggi</option>
                <option value="harga-asc">Harga Terendah</option>
                <option value="laba-desc">Margin Laba Tertinggi</option>
                <option value="stok-desc">Stok Terbanyak</option>
                <option value="stok-asc">Stok Tersedikit</option>
              </Select>
            </div>

            <div className="produk-view-toggle" role="group" aria-label="Tampilan">
              <button
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Tampilan Tabel"
                id="toggle-view-table"
              >
                ☰
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Tampilan Kartu"
                id="toggle-view-grid"
              >
                ⊞
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="produk-kategori-pills" role="group" aria-label="Filter Kategori">
          <button
            className={`kategori-pill ${filterKategori === 'all' ? 'active' : ''}`}
            onClick={() => setFilterKategori('all')}
            id="filter-kategori-semua"
          >
            Semua Kategori
          </button>
          {kategoriList.map(k => {
            const count = produkList.filter(p => p.kategoriId === k.id).length
            return (
              <button
                key={k.id}
                className={`kategori-pill ${filterKategori === String(k.id) || filterKategori === k.id ? 'active' : ''}`}
                onClick={() => setFilterKategori(k.id)}
                id={`filter-kategori-${k.id}`}
              >
                {k.nama}
                <span className="kategori-pill-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content View ── */}
      {filteredProduk.length === 0 ? (
        <div className="produk-empty-container card">
          <EmptyState
            icon="📦"
            title="Tidak ada produk ditemukan"
            description={
              search || filterKategori !== 'all' || filterStatus !== 'all'
                ? 'Tidak ada produk yang cocok dengan kriteria pencarian dan filter aktif.'
                : 'Belum ada produk yang ditambahkan ke katalog KantinKu.'
            }
            action={
              search || filterKategori !== 'all' || filterStatus !== 'all' ? (
                <Button variant="secondary" onClick={handleResetFilters} id="btn-reset-filter">
                  🔄 Reset Filter
                </Button>
              ) : (
                <Button variant="primary" onClick={handleOpenTambah} id="btn-tambah-pertama">
                  ➕ Tambah Produk Pertama
                </Button>
              )
            }
          />
        </div>
      ) : viewMode === 'table' ? (
        /* ── TABLE VIEW ── */
        <div className="produk-table-container card" id="produk-table-wrapper">
          <div className="table-responsive">
            <table className="produk-table" id="produk-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th style={{ textAlign: 'right' }}>Harga Jual</th>
                  <th style={{ textAlign: 'right' }}>Harga Modal</th>
                  <th style={{ textAlign: 'right' }}>Est. Margin</th>
                  <th style={{ textAlign: 'center' }}>Stok</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProduk.map((p, index) => {
                  const kategoriNama = getNamaKategori(p.kategoriId)
                  const laba = p.hargaJual - p.hargaModal
                  const marginPct = p.hargaJual > 0 ? Math.round((laba / p.hargaJual) * 100) : 0
                  const isHabis = p.status === 'habis' || p.stok === 0
                  const isStokKritis = !isHabis && p.stok <= 5

                  return (
                    <tr key={p.id} className={isHabis ? 'row-habis' : ''}>
                      <td className="col-muted">{index + 1}</td>
                      <td>
                        <div className="produk-name-cell">
                          <div className="produk-thumbnail" aria-hidden="true">
                            {p.kategoriId === 1 ? '🍽️' :
                             p.kategoriId === 2 ? '🥤' :
                             p.kategoriId === 3 ? '🍿' : '📦'}
                          </div>
                          <div>
                            <div className="produk-title-text">{p.nama}</div>
                            <div className="produk-id-sub">ID: #{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="kategori-tag">{kategoriNama}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'var(--font-weight-bold)' }}>
                        {formatRupiah(p.hargaJual)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
                        {formatRupiah(p.hargaModal)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ color: laba >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 'var(--font-weight-semibold)' }}>
                          +{formatRupiah(laba)}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          {marginPct}% margin
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.stok === 0 ? (
                          <Badge variant="danger" dot>0 Unit</Badge>
                        ) : isStokKritis ? (
                          <Badge variant="warning" dot>{p.stok} Unit</Badge>
                        ) : (
                          <span className="stok-normal">{formatNumber(p.stok)} Unit</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className={`status-toggle-pill ${p.status === 'tersedia' ? 'status-tersedia' : 'status-habis'}`}
                          onClick={() => handleToggleStatus(p)}
                          title="Klik untuk ubah status"
                          id={`status-toggle-${p.id}`}
                        >
                          <span className="status-dot"></span>
                          {p.status === 'tersedia' ? 'Tersedia' : 'Habis'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="table-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Produk"
                            id={`btn-edit-produk-${p.id}`}
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon
                            className="btn-danger-ghost"
                            onClick={() => setDeletingProduk(p)}
                            title="Hapus Produk"
                            id={`btn-hapus-produk-${p.id}`}
                          >
                            🗑️
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── GRID / CARD VIEW ── */
        <div className="produk-cards-grid" id="produk-cards-grid">
          {filteredProduk.map(p => {
            const kategoriNama = getNamaKategori(p.kategoriId)
            const laba = p.hargaJual - p.hargaModal
            const marginPct = p.hargaJual > 0 ? Math.round((laba / p.hargaJual) * 100) : 0
            const isHabis = p.status === 'habis' || p.stok === 0
            const isStokKritis = !isHabis && p.stok <= 5

            return (
              <div key={p.id} className={`produk-card ${isHabis ? 'card-habis' : ''}`} id={`card-produk-${p.id}`}>
                <div className="produk-card-header">
                  <div className="produk-thumbnail-lg" aria-hidden="true">
                    {p.kategoriId === 1 ? '🍽️' :
                     p.kategoriId === 2 ? '🥤' :
                     p.kategoriId === 3 ? '🍿' : '📦'}
                  </div>
                  <div className="produk-card-meta">
                    <span className="kategori-tag">{kategoriNama}</span>
                    <button
                      className={`status-toggle-pill ${p.status === 'tersedia' ? 'status-tersedia' : 'status-habis'}`}
                      onClick={() => handleToggleStatus(p)}
                      title="Klik untuk ubah status"
                    >
                      <span className="status-dot"></span>
                      {p.status === 'tersedia' ? 'Tersedia' : 'Habis'}
                    </button>
                  </div>
                </div>

                <div className="produk-card-body">
                  <h3 className="produk-card-name">{p.nama}</h3>
                  <div className="produk-card-price-row">
                    <div>
                      <div className="produk-card-label">Harga Jual</div>
                      <div className="produk-card-price">{formatRupiah(p.hargaJual)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="produk-card-label">Modal / Laba</div>
                      <div className="produk-card-laba">
                        +{formatRupiah(laba)} <span className="margin-tag">({marginPct}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="produk-card-stock-row">
                    <span className="produk-card-label">Sisa Stok:</span>
                    {p.stok === 0 ? (
                      <Badge variant="danger" dot>Stok Habis</Badge>
                    ) : isStokKritis ? (
                      <Badge variant="warning" dot>Sisa {p.stok} unit</Badge>
                    ) : (
                      <Badge variant="neutral">{p.stok} unit</Badge>
                    )}
                  </div>
                </div>

                <div className="produk-card-footer">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => handleOpenEdit(p)}
                    id={`btn-card-edit-${p.id}`}
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-danger-ghost"
                    onClick={() => setDeletingProduk(p)}
                    title="Hapus Produk"
                    id={`btn-card-hapus-${p.id}`}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <ProdukForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveProduk}
        produk={editingProduk}
        kategoriList={kategoriList}
      />

      <KategoriModal
        isOpen={isKategoriOpen}
        onClose={() => setIsKategoriOpen(false)}
        kategoriList={kategoriList}
        onTambah={tambahKategori}
        onEdit={editKategori}
        onHapus={hapusKategori}
      />

      <ConfirmDialog
        isOpen={!!deletingProduk}
        onClose={() => setDeletingProduk(null)}
        onConfirm={handleConfirmHapus}
        title="Hapus Produk?"
        message={`Apakah Anda yakin ingin menghapus produk "${deletingProduk?.nama}"? Data yang dihapus tidak dapat dipulihkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />

      {/* ── Scoped Styling ── */}
      <style>{`
        .produk-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        /* Header */
        .produk-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .produk-header-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }
        .produk-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        /* KPI Cards */
        .produk-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-4);
        }
        .produk-stat-card {
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
        .produk-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .produk-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .produk-stat-icon--primary {
          background: var(--color-primary-subtle);
          color: var(--color-primary);
        }
        .produk-stat-icon--success {
          background: #ecfdf5;
          color: #059669;
        }
        .produk-stat-icon--warning {
          background: #fffbeb;
          color: #d97706;
        }
        .produk-stat-icon--info {
          background: #eff6ff;
          color: #2563eb;
        }
        .produk-stat-content {
          flex: 1;
          min-width: 0;
        }
        .produk-stat-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .produk-stat-value {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          line-height: var(--line-height-tight);
        }
        .produk-stat-sub {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        /* Controls Card */
        .produk-controls-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-4) var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          box-shadow: var(--shadow-sm);
        }
        .produk-controls-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .produk-search-wrapper {
          flex: 1;
          min-width: 240px;
          max-width: 380px;
        }

        /* Status Tabs */
        .produk-status-tabs {
          display: flex;
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 3px;
          gap: 2px;
        }
        .produk-tab-btn {
          border: none;
          background: transparent;
          padding: var(--space-2) var(--space-4);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-muted);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .produk-tab-btn:hover {
          color: var(--color-text-primary);
        }
        .produk-tab-btn.active {
          background: var(--color-surface);
          color: var(--color-primary);
          font-weight: var(--font-weight-bold);
          box-shadow: var(--shadow-sm);
        }

        .produk-sort-view-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .produk-sort-select {
          min-width: 190px;
        }
        .produk-view-toggle {
          display: flex;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-surface-sunken);
        }
        .view-toggle-btn {
          border: none;
          background: transparent;
          padding: var(--space-2) var(--space-3);
          font-size: 1.1rem;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: all var(--transition-fast);
        }
        .view-toggle-btn:hover {
          color: var(--color-text-primary);
        }
        .view-toggle-btn.active {
          background: var(--color-surface);
          color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        /* Kategori Pills Bar */
        .produk-kategori-pills {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .kategori-pill {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-muted);
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .kategori-pill:hover {
          border-color: var(--color-primary-light);
          color: var(--color-text-primary);
        }
        .kategori-pill.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #ffffff;
          font-weight: var(--font-weight-semibold);
        }
        .kategori-pill-count {
          background: rgba(0,0,0,0.08);
          padding: 1px 6px;
          border-radius: var(--radius-full);
          font-size: 10px;
        }
        .kategori-pill.active .kategori-pill-count {
          background: rgba(255,255,255,0.25);
          color: #ffffff;
        }

        /* Table View */
        .produk-table-container {
          padding: 0;
          overflow: hidden;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .produk-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--font-size-sm);
        }
        .produk-table th {
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
        .produk-table td {
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
        }
        .produk-table tr:last-child td {
          border-bottom: none;
        }
        .produk-table tr:hover td {
          background: var(--color-surface-hover);
        }
        .row-habis {
          opacity: 0.7;
          background: #fafafa;
        }
        .col-muted {
          color: var(--color-text-muted);
          font-size: var(--font-size-xs);
        }

        .produk-name-cell {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .produk-thumbnail {
          width: 40px;
          height: 40px;
          background: var(--color-primary-subtle);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
        }
        .produk-title-text {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }
        .produk-id-sub {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .kategori-tag {
          display: inline-block;
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 2px 8px;
        }

        .stok-normal {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        /* Status Toggle Pill */
        .status-toggle-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          border: 1px solid transparent;
          transition: all var(--transition-fast);
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .status-tersedia {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }
        .status-tersedia .status-dot {
          background: #10b981;
        }
        .status-tersedia:hover {
          background: #d1fae5;
        }
        .status-habis {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }
        .status-habis .status-dot {
          background: #ef4444;
        }
        .status-habis:hover {
          background: #fee2e2;
        }

        .table-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
        }
        .btn-danger-ghost:hover {
          color: var(--color-danger) !important;
          background: #fef2f2 !important;
        }

        /* Card / Grid View */
        .produk-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-4);
        }
        .produk-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .produk-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .card-habis {
          opacity: 0.75;
          border-color: #fca5a5;
        }
        .produk-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .produk-thumbnail-lg {
          width: 52px;
          height: 52px;
          background: var(--color-primary-subtle);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }
        .produk-card-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--space-1);
        }
        .produk-card-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          flex: 1;
        }
        .produk-card-name {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin: 0;
        }
        .produk-card-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--color-surface-sunken);
          border-radius: var(--radius-md);
          padding: var(--space-2) var(--space-3);
        }
        .produk-card-label {
          font-size: 11px;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }
        .produk-card-price {
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }
        .produk-card-laba {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-success);
        }
        .margin-tag {
          font-size: 10px;
          color: var(--color-text-muted);
        }
        .produk-card-stock-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--font-size-xs);
        }
        .produk-card-footer {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border);
        }

        @media (max-width: 768px) {
          .produk-header {
            flex-direction: column;
            align-items: stretch;
          }
          .produk-header-actions {
            width: 100%;
          }
          .produk-header-actions button {
            flex: 1;
          }
          .produk-controls-top {
            flex-direction: column;
            align-items: stretch;
          }
          .produk-search-wrapper {
            max-width: 100%;
          }
          .produk-status-tabs {
            justify-content: space-around;
          }
          .produk-sort-view-row {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  )
}
