import { useState, useMemo } from 'react'
import { useProduk } from '../../context/ProdukContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { SearchInput, Select } from '../../components/ui/Input'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatRupiah, formatNumber } from '../../utils/currency'
import { formatTanggalPendek, formatWaktu, formatTanggalWaktu } from '../../utils/date'
import StokMasukModal from './StokMasukModal'
import PenyesuaianStokModal from './PenyesuaianStokModal'

export default function StokPage() {
  const {
    produkList,
    kategoriList,
    getNamaKategori,
    mutasiList,
    tambahStokMasuk,
    sesuaikanStok,
  } = useProduk()

  const { user } = useAuth()
  const { addToast } = useToast()

  // Main Active Tab
  const [activeTab, setActiveTab] = useState('status') // 'status' | 'mutasi'

  // State Filters — Tab Status Stok
  const [searchProduk, setSearchProduk] = useState('')
  const [filterLevel, setFilterLevel] = useState('all') // 'all' | 'aman' | 'menipis' | 'habis'
  const [filterKategori, setFilterKategori] = useState('all')
  const [sortProduk, setSortProduk] = useState('stok-asc')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'

  // State Filters — Tab Riwayat Mutasi
  const [searchMutasi, setSearchMutasi] = useState('')
  const [filterTipeMutasi, setFilterTipeMutasi] = useState('all') // 'all' | 'masuk' | 'keluar' | 'penyesuaian'
  const [sortMutasi, setSortMutasi] = useState('waktu-desc')

  // Modals
  const [isMasukOpen, setIsMasukOpen] = useState(false)
  const [isPenyesuaianOpen, setIsPenyesuaianOpen] = useState(false)
  const [targetProduk, setTargetProduk] = useState(null)

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalMacam = produkList.length
    const aman = produkList.filter(p => p.stok > 5 && p.status !== 'habis').length
    const menipis = produkList.filter(p => p.stok > 0 && p.stok <= 5 && p.status !== 'habis').length
    const habis = produkList.filter(p => p.stok === 0 || p.status === 'habis').length
    const totalUnit = produkList.reduce((sum, p) => sum + p.stok, 0)
    const totalNilaiAset = produkList.reduce((sum, p) => sum + p.stok * p.hargaModal, 0)

    return { totalMacam, aman, menipis, habis, totalUnit, totalNilaiAset }
  }, [produkList])

  // Filtered Products (Tab Status Stok)
  const filteredProduk = useMemo(() => {
    return produkList
      .filter(p => {
        const q = searchProduk.trim().toLowerCase()
        const matchSearch = !q || p.nama.toLowerCase().includes(q)
        const matchKategori = filterKategori === 'all' || p.kategoriId === Number(filterKategori)

        let matchLevel = true
        if (filterLevel === 'aman') matchLevel = p.stok > 5 && p.status !== 'habis'
        else if (filterLevel === 'menipis') matchLevel = p.stok > 0 && p.stok <= 5 && p.status !== 'habis'
        else if (filterLevel === 'habis') matchLevel = p.stok === 0 || p.status === 'habis'

        return matchSearch && matchKategori && matchLevel
      })
      .sort((a, b) => {
        switch (sortProduk) {
          case 'stok-asc':
            return a.stok - b.stok
          case 'stok-desc':
            return b.stok - a.stok
          case 'nama-asc':
            return a.nama.localeCompare(b.nama)
          case 'nilai-desc':
            return b.stok * b.hargaModal - a.stok * a.hargaModal
          default:
            return 0
        }
      })
  }, [produkList, searchProduk, filterKategori, filterLevel, sortProduk])

  // Filtered Mutations (Tab Mutasi)
  const filteredMutasi = useMemo(() => {
    return mutasiList
      .filter(m => {
        const q = searchMutasi.trim().toLowerCase()
        const matchSearch =
          !q ||
          m.id.toLowerCase().includes(q) ||
          m.namaProduk.toLowerCase().includes(q) ||
          m.keterangan?.toLowerCase().includes(q) ||
          m.petugas?.toLowerCase().includes(q)

        const matchTipe = filterTipeMutasi === 'all' || m.tipe === filterTipeMutasi

        return matchSearch && matchTipe
      })
      .sort((a, b) => {
        const timeA = new Date(a.tanggal).getTime()
        const timeB = new Date(b.tanggal).getTime()
        if (sortMutasi === 'waktu-desc') return timeB - timeA
        if (sortMutasi === 'waktu-asc') return timeA - timeB
        return 0
      })
  }, [mutasiList, searchMutasi, filterTipeMutasi, sortMutasi])

  // Handlers Modal
  const handleOpenStokMasuk = (p = null) => {
    setTargetProduk(p)
    setIsMasukOpen(true)
  }

  const handleOpenPenyesuaian = (p = null) => {
    setTargetProduk(p)
    setIsPenyesuaianOpen(true)
  }

  const handleSaveStokMasuk = (data) => {
    const res = tambahStokMasuk({ ...data, petugas: user?.name || 'Petugas' })
    if (res?.error) {
      addToast({ type: 'error', title: 'Gagal', message: res.error })
    } else {
      addToast({
        type: 'success',
        title: 'Stok Berhasil Ditambahkan',
        message: `+${data.jumlah} unit ditambahkan ke inventaris.`,
      })
    }
  }

  const handleSavePenyesuaian = (data) => {
    const res = sesuaikanStok({ ...data, petugas: user?.name || 'Petugas' })
    if (res?.error) {
      addToast({ type: 'error', title: 'Gagal', message: res.error })
    } else {
      addToast({
        type: 'info',
        title: 'Penyesuaian Disimpan',
        message: `Stok produk disesuaikan menjadi ${data.stokBaru} unit.`,
      })
    }
  }

  // Export CSV Mutasi
  const handleExportMutasiCSV = () => {
    if (filteredMutasi.length === 0) {
      addToast({ type: 'info', title: 'Tidak ada data', message: 'Tidak ada data mutasi untuk diekspor.' })
      return
    }

    const headers = ['ID Mutasi', 'Tanggal & Waktu', 'Produk', 'Tipe', 'Qty', 'Stok Sebelum', 'Stok Sesudah', 'Keterangan', 'Petugas']
    const rows = filteredMutasi.map(m => [
      m.id,
      `"${formatTanggalWaktu(m.tanggal)}"`,
      `"${m.namaProduk}"`,
      m.tipe,
      m.jumlah,
      m.stokSebelum,
      m.stokSesudah,
      `"${m.keterangan || ''}"`,
      `"${m.petugas || ''}"`,
    ].join(','))

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `mutasi_stok_kantinku_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addToast({ type: 'success', title: 'Ekspor Berhasil', message: `${filteredMutasi.length} mutasi stok diekspor.` })
  }

  return (
    <div className="stok-page" id="stok-page">
      {/* ── Page Header ── */}
      <div className="stok-header">
        <div>
          <div className="stok-header-title-row">
            <h1 className="page-title">Manajemen Stok & Mutasi</h1>
            <Badge variant="primary" dot>{metrics.totalMacam} Macam Produk</Badge>
          </div>
          <p className="page-subtitle">
            Pantau ketersediaan barang, lakukan restock barang masuk, dan lacak riwayat mutasi stok harian.
          </p>
        </div>

        <div className="stok-header-actions">
          <Button
            variant="secondary"
            id="btn-penyesuaian-top"
            onClick={() => handleOpenPenyesuaian()}
          >
            <span aria-hidden="true">⚖️</span> Penyesuaian (Opname)
          </Button>
          <Button
            variant="primary"
            id="btn-stok-masuk-top"
            onClick={() => handleOpenStokMasuk()}
          >
            <span aria-hidden="true">📥</span> Stok Masuk (Restock)
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="stok-stats-grid">
        <div className="stok-stat-card">
          <div className="stok-stat-icon stat-icon--primary" aria-hidden="true">📦</div>
          <div className="stok-stat-content">
            <div className="stok-stat-label">Total Unit Fisik</div>
            <div className="stok-stat-value">{formatNumber(metrics.totalUnit)}</div>
            <div className="stok-stat-sub">Dari {metrics.totalMacam} macam produk</div>
          </div>
        </div>

        <div className="stok-stat-card">
          <div className="stok-stat-icon stat-icon--success" aria-hidden="true">✅</div>
          <div className="stok-stat-content">
            <div className="stok-stat-label">Stok Aman (&gt;5)</div>
            <div className="stok-stat-value" style={{ color: 'var(--color-success)' }}>
              {metrics.aman}
            </div>
            <div className="stok-stat-sub">Kapasitas aman jual</div>
          </div>
        </div>

        <div className="stok-stat-card">
          <div className="stok-stat-icon stat-icon--warning" aria-hidden="true">⚠️</div>
          <div className="stok-stat-content">
            <div className="stok-stat-label">Stok Menipis (1-5)</div>
            <div className="stok-stat-value" style={{ color: 'var(--color-warning)' }}>
              {metrics.menipis}
            </div>
            <div className="stok-stat-sub">Perlu restock segera</div>
          </div>
        </div>

        <div className="stok-stat-card">
          <div className="stok-stat-icon stat-icon--danger" aria-hidden="true">❌</div>
          <div className="stok-stat-content">
            <div className="stok-stat-label">Stok Habis (0)</div>
            <div className="stok-stat-value" style={{ color: 'var(--color-danger)' }}>
              {metrics.habis}
            </div>
            <div className="stok-stat-sub">Tidak dapat dijual di POS</div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="stok-nav-tabs-wrapper">
        <div className="stok-nav-tabs" role="tablist">
          <button
            className={`nav-tab-item ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => setActiveTab('status')}
            id="tab-nav-status"
          >
            <span aria-hidden="true">📊</span> Status Stok Produk ({produkList.length})
          </button>
          <button
            className={`nav-tab-item ${activeTab === 'mutasi' ? 'active' : ''}`}
            onClick={() => setActiveTab('mutasi')}
            id="tab-nav-mutasi"
          >
            <span aria-hidden="true">📜</span> Riwayat Mutasi Stok ({mutasiList.length})
          </button>
        </div>
      </div>

      {/* ── TAB 1: STATUS STOK PRODUK ── */}
      {activeTab === 'status' && (
        <div className="stok-tab-pane">
          {/* Controls Card */}
          <div className="stok-controls-card">
            <div className="controls-row-top">
              {/* Search */}
              <div className="search-box-wrapper">
                <SearchInput
                  id="search-stok-produk"
                  placeholder="Cari nama produk..."
                  value={searchProduk}
                  onChange={e => setSearchProduk(e.target.value)}
                />
              </div>

              {/* Status Level Tabs */}
              <div className="level-tabs" role="tablist">
                <button
                  className={`level-btn ${filterLevel === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterLevel('all')}
                  id="level-tab-all"
                >
                  Semua ({produkList.length})
                </button>
                <button
                  className={`level-btn ${filterLevel === 'aman' ? 'active' : ''}`}
                  onClick={() => setFilterLevel('aman')}
                  id="level-tab-aman"
                >
                  Aman ({metrics.aman})
                </button>
                <button
                  className={`level-btn ${filterLevel === 'menipis' ? 'active' : ''}`}
                  onClick={() => setFilterLevel('menipis')}
                  id="level-tab-menipis"
                >
                  Menipis ({metrics.menipis})
                </button>
                <button
                  className={`level-btn ${filterLevel === 'habis' ? 'active' : ''}`}
                  onClick={() => setFilterLevel('habis')}
                  id="level-tab-habis"
                >
                  Habis ({metrics.habis})
                </button>
              </div>

              {/* Sort & View Toggle */}
              <div className="sort-view-cluster">
                <div style={{ minWidth: '180px' }}>
                  <Select
                    id="sort-stok-produk"
                    value={sortProduk}
                    onChange={e => setSortProduk(e.target.value)}
                  >
                    <option value="stok-asc">Stok Tersedikit (Prioritas)</option>
                    <option value="stok-desc">Stok Terbanyak</option>
                    <option value="nama-asc">Nama Produk (A-Z)</option>
                    <option value="nilai-desc">Nilai Aset Tertinggi</option>
                  </Select>
                </div>

                <div className="view-toggle-btns" role="group" aria-label="Tampilan">
                  <button
                    className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                    title="Tampilan Tabel"
                    id="stok-view-table"
                  >
                    ☰
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Tampilan Kartu"
                    id="stok-view-grid"
                  >
                    ⊞
                  </button>
                </div>
              </div>
            </div>

            {/* Kategori Pills */}
            <div className="kategori-pills-row">
              <button
                className={`filter-pill ${filterKategori === 'all' ? 'active' : ''}`}
                onClick={() => setFilterKategori('all')}
                id="stok-kategori-semua"
              >
                Semua Kategori
              </button>
              {kategoriList.map(k => (
                <button
                  key={k.id}
                  className={`filter-pill ${filterKategori === String(k.id) || filterKategori === k.id ? 'active' : ''}`}
                  onClick={() => setFilterKategori(k.id)}
                  id={`stok-kategori-${k.id}`}
                >
                  {k.nama}
                </button>
              ))}
            </div>
          </div>

          {/* Table or Cards */}
          {filteredProduk.length === 0 ? (
            <div className="card" style={{ padding: 0 }}>
              <EmptyState
                icon="📦"
                title="Produk tidak ditemukan"
                description="Tidak ada produk dengan kriteria pencarian dan filter stok saat ini."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchProduk('')
                      setFilterLevel('all')
                      setFilterKategori('all')
                    }}
                  >
                    🔄 Reset Filter
                  </Button>
                }
              />
            </div>
          ) : viewMode === 'table' ? (
            <div className="card table-card" id="stok-table-wrapper">
              <div className="table-responsive">
                <table className="stok-table" id="stok-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>No</th>
                      <th>Produk</th>
                      <th>Kategori</th>
                      <th style={{ textAlign: 'center' }}>Level Stok</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'right' }}>Nilai Aset</th>
                      <th style={{ textAlign: 'center', width: '220px' }}>Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProduk.map((p, idx) => {
                      const isHabis = p.stok === 0 || p.status === 'habis'
                      const isMenipis = !isHabis && p.stok <= 5
                      const nilaiAset = p.stok * p.hargaModal

                      return (
                        <tr key={p.id} className={isHabis ? 'row-habis' : ''}>
                          <td className="col-muted">{idx + 1}</td>
                          <td>
                            <div className="stok-product-cell">
                              <div className="stok-thumbnail" aria-hidden="true">
                                {p.kategoriId === 1 ? '🍽️' :
                                 p.kategoriId === 2 ? '🥤' :
                                 p.kategoriId === 3 ? '🍿' : '📦'}
                              </div>
                              <div>
                                <div className="stok-product-name">{p.nama}</div>
                                <div className="stok-product-sub">
                                  Modal: {formatRupiah(p.hargaModal)} • Jual: {formatRupiah(p.hargaJual)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="kategori-tag">{getNamaKategori(p.kategoriId)}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="stock-number-cell">
                              <span
                                className={`stock-big-num ${isHabis ? 'num-habis' : isMenipis ? 'num-menipis' : 'num-aman'}`}
                              >
                                {p.stok}
                              </span>
                              <span className="unit-label">unit</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isHabis ? (
                              <Badge variant="danger" dot>Stok Habis</Badge>
                            ) : isMenipis ? (
                              <Badge variant="warning" dot>Sisa {p.stok} (Kritis)</Badge>
                            ) : (
                              <Badge variant="success" dot>Aman</Badge>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'var(--font-weight-bold)' }}>
                            {formatRupiah(nilaiAset)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="table-actions-cluster">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenStokMasuk(p)}
                                title="Tambah Stok Masuk"
                                id={`btn-masuk-${p.id}`}
                              >
                                📥 Masuk
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenPenyesuaian(p)}
                                title="Koreksi Opname Fisik"
                                id={`btn-opname-${p.id}`}
                              >
                                ⚖️ Sesuaikan
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
            /* Cards View */
            <div className="stok-cards-grid" id="stok-cards-grid">
              {filteredProduk.map(p => {
                const isHabis = p.stok === 0 || p.status === 'habis'
                const isMenipis = !isHabis && p.stok <= 5

                return (
                  <div key={p.id} className={`stok-card ${isHabis ? 'card-habis' : ''}`}>
                    <div className="stok-card-top">
                      <div className="stok-thumbnail" aria-hidden="true">
                        {p.kategoriId === 1 ? '🍽️' :
                         p.kategoriId === 2 ? '🥤' :
                         p.kategoriId === 3 ? '🍿' : '📦'}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="kategori-tag">{getNamaKategori(p.kategoriId)}</span>
                        <div style={{ marginTop: '4px' }}>
                          {isHabis ? (
                            <Badge variant="danger" dot>Habis</Badge>
                          ) : isMenipis ? (
                            <Badge variant="warning" dot>Menipis</Badge>
                          ) : (
                            <Badge variant="success" dot>Aman</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <h3 className="stok-card-title">{p.nama}</h3>

                    <div className="stok-card-stock-box">
                      <div className="stock-box-label">Sisa Stok Fisik:</div>
                      <div className="stock-box-value">
                        <strong className={isHabis ? 'num-habis' : isMenipis ? 'num-menipis' : 'num-aman'}>
                          {p.stok}
                        </strong>{' '}
                        <span>unit</span>
                      </div>
                    </div>

                    <div className="stok-card-footer">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => handleOpenStokMasuk(p)}
                      >
                        📥 Stok Masuk
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        onClick={() => handleOpenPenyesuaian(p)}
                      >
                        ⚖️ Koreksi
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: RIWAYAT MUTASI STOK ── */}
      {activeTab === 'mutasi' && (
        <div className="stok-tab-pane">
          {/* Controls Card */}
          <div className="stok-controls-card">
            <div className="controls-row-top">
              {/* Search */}
              <div className="search-box-wrapper">
                <SearchInput
                  id="search-mutasi"
                  placeholder="Cari ID mutasi / produk / keterangan..."
                  value={searchMutasi}
                  onChange={e => setSearchMutasi(e.target.value)}
                />
              </div>

              {/* Tipe Tabs */}
              <div className="level-tabs" role="tablist">
                {[
                  { id: 'all', label: `Semua (${mutasiList.length})` },
                  { id: 'masuk', label: '📥 Masuk' },
                  { id: 'keluar', label: '📤 Keluar' },
                  { id: 'penyesuaian', label: '⚖️ Opname' },
                ].map(t => (
                  <button
                    key={t.id}
                    className={`level-btn ${filterTipeMutasi === t.id ? 'active' : ''}`}
                    onClick={() => setFilterTipeMutasi(t.id)}
                    id={`mutasi-tab-${t.id}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Actions & Export */}
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Button variant="secondary" onClick={handleExportMutasiCSV} id="btn-export-mutasi">
                  📥 Ekspor CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Table Mutasi */}
          {filteredMutasi.length === 0 ? (
            <div className="card" style={{ padding: 0 }}>
              <EmptyState
                icon="📜"
                title="Tidak ada riwayat mutasi stok"
                description="Belum ada riwayat mutasi barang masuk atau penyesuaian yang tercatat."
              />
            </div>
          ) : (
            <div className="card table-card" id="mutasi-table-wrapper">
              <div className="table-responsive">
                <table className="stok-table" id="mutasi-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>No</th>
                      <th>ID Mutasi</th>
                      <th>Waktu & Tanggal</th>
                      <th>Produk</th>
                      <th style={{ textAlign: 'center' }}>Tipe</th>
                      <th style={{ textAlign: 'center' }}>Qty Perubahan</th>
                      <th style={{ textAlign: 'center' }}>Level Stok (Lama ➔ Baru)</th>
                      <th>Keterangan / Sumber</th>
                      <th>Petugas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMutasi.map((m, idx) => {
                      const isMasuk = m.tipe === 'masuk'
                      const isKeluar = m.tipe === 'keluar'

                      return (
                        <tr key={m.id}>
                          <td className="col-muted">{idx + 1}</td>
                          <td>
                            <span className="font-mono" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                              {m.id}
                            </span>
                          </td>
                          <td>
                            <div className="time-primary">{formatTanggalPendek(m.tanggal)}</div>
                            <div className="time-secondary">{formatWaktu(m.tanggal)} WIB</div>
                          </td>
                          <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>{m.namaProduk}</td>
                          <td style={{ textAlign: 'center' }}>
                            <Badge
                              variant={isMasuk ? 'success' : isKeluar ? 'danger' : 'info'}
                              dot
                            >
                              {isMasuk ? '📥 Masuk' : isKeluar ? '📤 Keluar' : '⚖️ Penyesuaian'}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                fontWeight: 'var(--font-weight-extrabold)',
                                fontSize: 'var(--font-size-base)',
                                color: m.jumlah > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                              }}
                            >
                              {m.jumlah > 0 ? `+${m.jumlah}` : m.jumlah}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="mutasi-level-box">
                              <span>{m.stokSebelum}</span>
                              <span className="level-arrow">➔</span>
                              <strong>{m.stokSesudah}</strong>
                            </div>
                          </td>
                          <td>
                            <span className="keterangan-text">{m.keterangan || '—'}</span>
                          </td>
                          <td>
                            <span className="petugas-badge">👤 {m.petugas || 'Petugas'}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <StokMasukModal
        isOpen={isMasukOpen}
        onClose={() => setIsMasukOpen(false)}
        produkList={produkList}
        selectedProduk={targetProduk}
        onSave={handleSaveStokMasuk}
      />

      <PenyesuaianStokModal
        isOpen={isPenyesuaianOpen}
        onClose={() => setIsPenyesuaianOpen(false)}
        produkList={produkList}
        selectedProduk={targetProduk}
        onSave={handleSavePenyesuaian}
      />

      {/* ── Scoped Styling ── */}
      <style>{`
        .stok-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        /* Header */
        .stok-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .stok-header-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }
        .stok-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        /* KPI Cards */
        .stok-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-4);
        }
        .stok-stat-card {
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
        .stok-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .stok-stat-icon {
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
        .stat-icon--success { background: #ecfdf5; color: #059669; }
        .stat-icon--warning { background: #fffbeb; color: #d97706; }
        .stat-icon--danger { background: #fef2f2; color: #dc2626; }
        .stok-stat-content { flex: 1; min-width: 0; }
        .stok-stat-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .stok-stat-value {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          line-height: var(--line-height-tight);
        }
        .stok-stat-sub {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        /* Nav Tabs */
        .stok-nav-tabs-wrapper {
          border-bottom: 1px solid var(--color-border);
        }
        .stok-nav-tabs {
          display: flex;
          gap: var(--space-2);
        }
        .nav-tab-item {
          border: none;
          background: transparent;
          padding: var(--space-3) var(--space-5);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .nav-tab-item:hover { color: var(--color-text-primary); }
        .nav-tab-item.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        /* Controls Card */
        .stok-controls-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-4) var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--space-5);
        }
        .controls-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .search-box-wrapper { flex: 1; min-width: 240px; max-width: 360px; }

        .level-tabs {
          display: flex;
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 3px;
          gap: 2px;
        }
        .level-btn {
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
        .level-btn:hover { color: var(--color-text-primary); }
        .level-btn.active {
          background: var(--color-surface);
          color: var(--color-primary);
          font-weight: var(--font-weight-bold);
          box-shadow: var(--shadow-sm);
        }

        .sort-view-cluster {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .view-toggle-btns {
          display: flex;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-surface-sunken);
        }
        .view-btn {
          border: none;
          background: transparent;
          padding: var(--space-2) var(--space-3);
          font-size: 1.1rem;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: all var(--transition-fast);
        }
        .view-btn:hover { color: var(--color-text-primary); }
        .view-btn.active {
          background: var(--color-surface);
          color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        .kategori-pills-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          overflow-x: auto;
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border);
        }
        .filter-pill {
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-muted);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .filter-pill:hover {
          border-color: var(--color-primary-light);
          color: var(--color-text-primary);
        }
        .filter-pill.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #ffffff;
          font-weight: var(--font-weight-semibold);
        }

        /* Table */
        .table-card { padding: 0; overflow: hidden; }
        .table-responsive { overflow-x: auto; }
        .stok-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--font-size-sm);
        }
        .stok-table th {
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
        .stok-table td {
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
        }
        .stok-table tr:last-child td { border-bottom: none; }
        .stok-table tr:hover td { background: var(--color-surface-hover); }
        .row-habis { opacity: 0.75; background: #fafafa; }
        .col-muted { color: var(--color-text-muted); font-size: var(--font-size-xs); }

        .stok-product-cell {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .stok-thumbnail {
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
        .stok-product-name {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }
        .stok-product-sub {
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

        .stock-number-cell {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
        }
        .stock-big-num {
          font-size: 1.25rem;
          font-weight: var(--font-weight-extrabold);
        }
        .unit-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }
        .num-aman { color: var(--color-success); }
        .num-menipis { color: var(--color-warning); }
        .num-habis { color: var(--color-danger); }

        .table-actions-cluster {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
        }

        /* Cards Grid */
        .stok-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-4);
        }
        .stok-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          box-shadow: var(--shadow-sm);
        }
        .stok-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .stok-card-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin: 0;
        }
        .stok-card-stock-box {
          background: var(--color-surface-sunken);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stock-box-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
        .stock-box-value { font-size: 1.1rem; }
        .stok-card-footer {
          display: flex;
          gap: var(--space-2);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border);
        }

        /* Mutasi Specific */
        .font-mono { font-family: monospace; }
        .mutasi-level-box {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--color-surface-sunken);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
        }
        .level-arrow { color: var(--color-text-muted); }
        .keterangan-text { font-size: var(--font-size-xs); color: var(--color-text-muted); }
        .petugas-badge { font-size: var(--font-size-xs); color: var(--color-text-muted); }
        .time-primary { font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
        .time-secondary { font-size: var(--font-size-xs); color: var(--color-text-muted); }

        @media (max-width: 768px) {
          .stok-header { flex-direction: column; align-items: stretch; }
          .stok-header-actions { width: 100%; }
          .stok-header-actions button { flex: 1; }
          .controls-row-top { flex-direction: column; align-items: stretch; }
          .search-box-wrapper { max-width: 100%; }
          .level-tabs { justify-content: space-around; }
          .sort-view-cluster { justify-content: space-between; }
        }
      `}</style>
    </div>
  )
}
