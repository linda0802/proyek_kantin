import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTransaksiContext } from '../../context/TransaksiContext'
import { useProduk } from '../../context/ProdukContext'
import { useTitipan } from '../../context/TitipanContext'
import { useHutang } from '../../context/HutangContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { SearchInput, Select } from '../../components/ui/Input'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatRupiah, formatNumber } from '../../utils/currency'
import { formatTanggalPendek, formatWaktu, formatTanggalWaktu } from '../../utils/date'
import TransaksiDetailModal from './TransaksiDetailModal'
import BatalTransaksiModal from './BatalTransaksiModal'

export default function TransaksiPage() {
  const { transaksiList, batalkanTransaksi, summary } = useTransaksiContext()
  const { kembalikanStokPembatalan } = useProduk()
  const { kembalikanStokTitipan } = useTitipan()
  const { batalkanHutangByTransaksi } = useHutang()
  const { user } = useAuth()
  const { addToast } = useToast()

  // State Filters
  const [search, setSearch] = useState('')
  const [filterWaktu, setFilterWaktu] = useState('semua') // 'hari-ini' | '7-hari' | '30-hari' | 'semua'
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'selesai' | 'batal'
  const [filterMetode, setFilterMetode] = useState('all') // 'all' | 'tunai' | 'non-tunai'
  const [sortBy, setSortBy] = useState('waktu-desc')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'

  // Modal State
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [transaksiToBatal, setTransaksiToBatal] = useState(null)

  // Filtered & Sorted Transactions
  const filteredTransaksi = useMemo(() => {
    const now = new Date()

    return transaksiList
      .filter(t => {
        // Search (No transaksi, nama kasir, atau nama item)
        const q = search.trim().toLowerCase()
        const matchSearch =
          !q ||
          t.id.toLowerCase().includes(q) ||
          t.kasir?.toLowerCase().includes(q) ||
          t.items?.some(i => i.nama.toLowerCase().includes(q))

        // Status
        const matchStatus =
          filterStatus === 'all' ||
          (filterStatus === 'selesai' && t.status === 'selesai') ||
          (filterStatus === 'batal' && t.status === 'batal')

        // Metode
        const matchMetode =
          filterMetode === 'all' || t.metodePembayaran === filterMetode

        // Filter Waktu
        let matchWaktu = true
        if (filterWaktu !== 'semua') {
          const tgl = new Date(t.tanggal)
          if (filterWaktu === 'hari-ini') {
            matchWaktu = tgl.toDateString() === now.toDateString()
          } else if (filterWaktu === '7-hari') {
            const sevenDaysAgo = new Date(now)
            sevenDaysAgo.setDate(now.getDate() - 7)
            matchWaktu = tgl >= sevenDaysAgo
          } else if (filterWaktu === '30-hari') {
            const thirtyDaysAgo = new Date(now)
            thirtyDaysAgo.setDate(now.getDate() - 30)
            matchWaktu = tgl >= thirtyDaysAgo
          }
        }

        return matchSearch && matchStatus && matchMetode && matchWaktu
      })
      .sort((a, b) => {
        const timeA = new Date(a.tanggal).getTime()
        const timeB = new Date(b.tanggal).getTime()
        switch (sortBy) {
          case 'waktu-desc':
            return timeB - timeA
          case 'waktu-asc':
            return timeA - timeB
          case 'nominal-desc':
            return b.total - a.total
          case 'nominal-asc':
            return a.total - b.total
          default:
            return 0
        }
      })
  }, [transaksiList, search, filterStatus, filterMetode, filterWaktu, sortBy])

  // Hitung summary metrik dari transaksi yang sedang difilter
  const filteredMetrics = useMemo(() => {
    const selesai = filteredTransaksi.filter(t => t.status === 'selesai')
    const batal = filteredTransaksi.filter(t => t.status === 'batal')
    const totalOmzet = selesai.reduce((s, t) => s + t.total, 0)
    const countSelesai = selesai.length
    const countBatal = batal.length
    const rataRata = countSelesai > 0 ? Math.round(totalOmzet / countSelesai) : 0

    return { totalOmzet, countSelesai, countBatal, rataRata }
  }, [filteredTransaksi])

  // Handlers
  const handleConfirmBatal = (id, alasan) => {
    const targetTrx = transaksiList.find(t => t.id === id)
    batalkanTransaksi(id, alasan)

    if (targetTrx?.items && Array.isArray(targetTrx.items)) {
      // 1. Kembalikan stok produk kantin & catat riwayat mutasi
      kembalikanStokPembatalan(targetTrx.items, targetTrx.id, user?.name, alasan)

      // 2. Kembalikan stok titipan jika pesanan mengandung produk titipan
      targetTrx.items.forEach(item => {
        const titipanId = item.titipanId || item.produk?.titipanId
        const isTitipan = item.isTitipan || item.produk?.isTitipan
        if (isTitipan && titipanId) {
          kembalikanStokTitipan(titipanId, item.jumlah || 1)
        }
      })
    }

    // 3. Batalkan catatan hutang jika metode pembayarannya kasbon
    if (targetTrx?.metodePembayaran === 'kasbon') {
      batalkanHutangByTransaksi(targetTrx.id)
    }

    addToast({
      type: 'warning',
      title: 'Transaksi Dibatalkan',
      message: `Transaksi ${id} telah dibatalkan & stok dikembalikan ke sistem.`,
    })
  }

  const handleResetFilter = () => {
    setSearch('')
    setFilterWaktu('semua')
    setFilterStatus('all')
    setFilterMetode('all')
    setSortBy('waktu-desc')
  }

  // Ekspor CSV
  const handleExportCSV = () => {
    if (filteredTransaksi.length === 0) {
      addToast({ type: 'info', title: 'Tidak ada data', message: 'Tidak ada transaksi untuk diekspor.' })
      return
    }

    const headers = ['Nomor Transaksi', 'Tanggal & Waktu', 'Kasir', 'Metode Pembayaran', 'Status', 'Total', 'Item Pesanan']
    const rows = filteredTransaksi.map(t => {
      const itemsStr = t.items?.map(i => `${i.nama} (${i.jumlah}x)`).join('; ') || ''
      return [
        t.id,
        `"${formatTanggalWaktu(t.tanggal)}"`,
        `"${t.kasir || 'Kasir'}"`,
        t.metodePembayaran,
        t.status,
        t.total,
        `"${itemsStr}"`,
      ].join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `transaksi_kantinku_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addToast({ type: 'success', title: 'Ekspor Berhasil', message: `${filteredTransaksi.length} transaksi diekspor.` })
  }

  return (
    <div className="transaksi-page" id="transaksi-page">
      {/* ── Page Header ── */}
      <div className="transaksi-header">
        <div>
          <div className="transaksi-header-title-row">
            <h1 className="page-title">Riwayat Transaksi</h1>
            <Badge variant="primary" dot>{filteredTransaksi.length} Data</Badge>
          </div>
          <p className="page-subtitle">
            Daftar seluruh transaksi kasir, rincian item pesanan, struk digital, dan pembatalan transaksi.
          </p>
        </div>

        <div className="transaksi-header-actions">
          <Button
            variant="secondary"
            id="btn-ekspor-transaksi"
            onClick={handleExportCSV}
          >
            <span aria-hidden="true">📥</span> Ekspor CSV
          </Button>
          <Link to="/kasir" style={{ textDecoration: 'none' }}>
            <Button variant="primary" id="btn-goto-kasir">
              <span aria-hidden="true">🛒</span> Buka Kasir
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="transaksi-stats-grid">
        <div className="transaksi-stat-card">
          <div className="transaksi-stat-icon stat-icon--success" aria-hidden="true">💵</div>
          <div className="transaksi-stat-content">
            <div className="transaksi-stat-label">Total Omzet (Selesai)</div>
            <div className="transaksi-stat-value" style={{ color: 'var(--color-success)' }}>
              {formatRupiah(filteredMetrics.totalOmzet)}
            </div>
            <div className="transaksi-stat-sub">Dari transaksi berhasil</div>
          </div>
        </div>

        <div className="transaksi-stat-card">
          <div className="transaksi-stat-icon stat-icon--primary" aria-hidden="true">✅</div>
          <div className="transaksi-stat-content">
            <div className="transaksi-stat-label">Transaksi Berhasil</div>
            <div className="transaksi-stat-value">{filteredMetrics.countSelesai}</div>
            <div className="transaksi-stat-sub">Struk dicetak & selesai</div>
          </div>
        </div>

        <div className="transaksi-stat-card">
          <div className="transaksi-stat-icon stat-icon--danger" aria-hidden="true">❌</div>
          <div className="transaksi-stat-content">
            <div className="transaksi-stat-label">Transaksi Batal</div>
            <div className="transaksi-stat-value" style={{ color: 'var(--color-danger)' }}>
              {filteredMetrics.countBatal}
            </div>
            <div className="transaksi-stat-sub">Dibatalkan oleh kasir</div>
          </div>
        </div>

        <div className="transaksi-stat-card">
          <div className="transaksi-stat-icon stat-icon--info" aria-hidden="true">📊</div>
          <div className="transaksi-stat-content">
            <div className="transaksi-stat-label">Rata-rata Transaksi</div>
            <div className="transaksi-stat-value" style={{ fontSize: 'var(--font-size-xl)' }}>
              {formatRupiah(filteredMetrics.rataRata)}
            </div>
            <div className="transaksi-stat-sub">Rata-rata per struk</div>
          </div>
        </div>
      </div>

      {/* ── Filter Controls Card ── */}
      <div className="transaksi-controls-card">
        <div className="controls-row-top">
          {/* Search Bar */}
          <div className="search-box-wrapper">
            <SearchInput
              id="search-transaksi"
              placeholder="Cari no. transaksi / kasir / item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Quick Status Tabs */}
          <div className="status-tabs" role="tablist">
            <button
              className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
              id="tab-status-semua"
            >
              Semua ({transaksiList.length})
            </button>
            <button
              className={`tab-btn ${filterStatus === 'selesai' ? 'active' : ''}`}
              onClick={() => setFilterStatus('selesai')}
              id="tab-status-selesai"
            >
              Selesai ({transaksiList.filter(t => t.status === 'selesai').length})
            </button>
            <button
              className={`tab-btn ${filterStatus === 'batal' ? 'active' : ''}`}
              onClick={() => setFilterStatus('batal')}
              id="tab-status-batal"
            >
              Batal ({transaksiList.filter(t => t.status === 'batal').length})
            </button>
          </div>

          {/* Sort & View Toggle */}
          <div className="sort-view-cluster">
            <div style={{ minWidth: '170px' }}>
              <Select
                id="select-sort-transaksi"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="waktu-desc">Waktu (Terbaru)</option>
                <option value="waktu-asc">Waktu (Terlama)</option>
                <option value="nominal-desc">Nominal Tertinggi</option>
                <option value="nominal-asc">Nominal Terendah</option>
              </Select>
            </div>

            <div className="view-toggle-btns" role="group" aria-label="Tampilan">
              <button
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Tampilan Tabel"
                id="view-toggle-table"
              >
                ☰
              </button>
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Tampilan Kartu"
                id="view-toggle-grid"
              >
                ⊞
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Filters: Waktu & Metode */}
        <div className="controls-row-bottom">
          <div className="filter-pill-group">
            <span className="filter-group-label">Periode:</span>
            {[
              { id: 'semua', label: 'Semua Waktu' },
              { id: 'hari-ini', label: 'Hari Ini' },
              { id: '7-hari', label: '7 Hari Terakhir' },
              { id: '30-hari', label: '30 Hari Terakhir' },
            ].map(w => (
              <button
                key={w.id}
                className={`filter-pill ${filterWaktu === w.id ? 'active' : ''}`}
                onClick={() => setFilterWaktu(w.id)}
                id={`filter-waktu-${w.id}`}
              >
                {w.label}
              </button>
            ))}
          </div>

          <div className="filter-pill-group">
            <span className="filter-group-label">Metode:</span>
            {[
              { id: 'all', label: 'Semua Metode' },
              { id: 'tunai', label: '💵 Tunai' },
              { id: 'non-tunai', label: '📱 Non-Tunai' },
              { id: 'kasbon', label: '📝 Kasbon' },
            ].map(m => (
              <button
                key={m.id}
                className={`filter-pill ${filterMetode === m.id ? 'active' : ''}`}
                onClick={() => setFilterMetode(m.id)}
                id={`filter-metode-${m.id}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content View ── */}
      {filteredTransaksi.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState
            icon="📋"
            title="Tidak ada riwayat transaksi"
            description={
              search || filterWaktu !== 'semua' || filterStatus !== 'all' || filterMetode !== 'all'
                ? 'Tidak ada transaksi yang cocok dengan filter atau kriteria pencarian yang aktif.'
                : 'Belum ada transaksi penjualan yang tercatat dalam sistem KantinKu.'
            }
            action={
              search || filterWaktu !== 'semua' || filterStatus !== 'all' || filterMetode !== 'all' ? (
                <Button variant="secondary" onClick={handleResetFilter} id="btn-reset-transaksi-filter">
                  🔄 Reset Filter
                </Button>
              ) : (
                <Link to="/kasir" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" id="btn-transaksi-ke-kasir">
                    🛒 Buka Kasir Sekarang
                  </Button>
                </Link>
              )
            }
          />
        </div>
      ) : viewMode === 'table' ? (
        /* ── TABLE VIEW ── */
        <div className="card table-card" id="transaksi-table-card">
          <div className="table-responsive">
            <table className="transaksi-table" id="transaksi-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>No. Transaksi</th>
                  <th>Tanggal & Jam</th>
                  <th>Kasir</th>
                  <th>Item Pesanan</th>
                  <th>Metode</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: '160px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransaksi.map((t, idx) => {
                  const isBatal = t.status === 'batal'
                  const totalItem = t.items?.reduce((s, i) => s + i.jumlah, 0) || 0
                  const previewItem = t.items?.map(i => `${i.jumlah}x ${i.nama}`).join(', ') || '—'

                  return (
                    <tr key={t.id} className={isBatal ? 'row-batal' : ''}>
                      <td className="col-muted">{idx + 1}</td>
                      <td>
                        <button
                          className="trx-id-btn"
                          onClick={() => setSelectedDetail(t)}
                          title="Klik untuk detail struk"
                          id={`btn-trx-id-${t.id}`}
                        >
                          <span className="trx-icon">🧾</span>
                          <strong>{t.id}</strong>
                        </button>
                      </td>
                      <td>
                        <div className="time-primary">{formatTanggalPendek(t.tanggal)}</div>
                        <div className="time-secondary">{formatWaktu(t.tanggal)} WIB</div>
                      </td>
                      <td>
                        <span className="kasir-name">👤 {t.kasir || 'Kasir'}</span>
                      </td>
                      <td>
                        <div className="items-summary-cell" title={previewItem}>
                          <span className="items-badge">{totalItem} item</span>
                          <span className="items-text">{previewItem}</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={t.metodePembayaran === 'tunai' ? 'primary' : t.metodePembayaran === 'kasbon' ? 'warning' : 'info'}>
                          {t.metodePembayaran === 'tunai' ? '💵 Tunai' : t.metodePembayaran === 'kasbon' ? `📝 Kasbon${t.pelanggan ? ` (${t.pelanggan})` : ''}` : '📱 Non-Tunai'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'var(--font-weight-bold)' }}>
                        <span className={isBatal ? 'text-strikethrough' : 'text-total-active'}>
                          {formatRupiah(t.total)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isBatal ? (
                          <Badge variant="danger" dot>Batal</Badge>
                        ) : (
                          <Badge variant="success" dot>Selesai</Badge>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="table-action-row">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedDetail(t)}
                            title="Lihat Struk Pembayaran"
                            id={`btn-detail-${t.id}`}
                          >
                            🧾 Struk
                          </Button>
                          {!isBatal && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon
                              className="btn-danger-ghost"
                              onClick={() => setTransaksiToBatal(t)}
                              title="Batalkan Transaksi"
                              id={`btn-batal-${t.id}`}
                            >
                              ⚠️
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
      ) : (
        /* ── GRID / CARD VIEW ── */
        <div className="transaksi-cards-grid" id="transaksi-cards-grid">
          {filteredTransaksi.map(t => {
            const isBatal = t.status === 'batal'
            const totalItem = t.items?.reduce((s, i) => s + i.jumlah, 0) || 0

            return (
              <div key={t.id} className={`trx-card ${isBatal ? 'trx-card-batal' : ''}`} id={`card-trx-${t.id}`}>
                <div className="trx-card-header">
                  <div>
                    <div className="trx-card-id">🧾 {t.id}</div>
                    <div className="trx-card-time">{formatTanggalWaktu(t.tanggal)}</div>
                  </div>
                  <div>
                    {isBatal ? (
                      <Badge variant="danger" dot>Batal</Badge>
                    ) : (
                      <Badge variant="success" dot>Selesai</Badge>
                    )}
                  </div>
                </div>

                <div className="trx-card-body">
                  <div className="trx-card-meta">
                    <span>Kasir: <strong>{t.kasir || 'Kasir'}</strong></span>
                    <Badge variant={t.metodePembayaran === 'tunai' ? 'primary' : t.metodePembayaran === 'kasbon' ? 'warning' : 'info'}>
                      {t.metodePembayaran === 'tunai' ? '💵 Tunai' : t.metodePembayaran === 'kasbon' ? `📝 Kasbon${t.pelanggan ? ` (${t.pelanggan})` : ''}` : '📱 Non-Tunai'}
                    </Badge>
                  </div>

                  <div className="trx-card-items-box">
                    <div className="items-box-title">{totalItem} Item Pesanan:</div>
                    <ul className="items-list">
                      {t.items?.map((item, i) => (
                        <li key={i}>
                          <span>{item.nama} x{item.jumlah}</span>
                          <span>{formatRupiah(item.subtotal || item.hargaJual * item.jumlah)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="trx-card-total-row">
                    <span>Total Pembayaran</span>
                    <span className={`card-total-value ${isBatal ? 'text-strikethrough' : ''}`}>
                      {formatRupiah(t.total)}
                    </span>
                  </div>

                  {isBatal && (
                    <div className="card-batal-note">
                      Alasan: {t.alasanBatal || 'Dibatalkan'}
                    </div>
                  )}
                </div>

                <div className="trx-card-footer">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => setSelectedDetail(t)}
                    id={`btn-card-detail-${t.id}`}
                  >
                    🧾 Lihat Struk
                  </Button>
                  {!isBatal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-danger-ghost"
                      onClick={() => setTransaksiToBatal(t)}
                      title="Batalkan Transaksi"
                      id={`btn-card-batal-${t.id}`}
                    >
                      ⚠️
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <TransaksiDetailModal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        transaksi={selectedDetail}
        onOpenBatal={(t) => setTransaksiToBatal(t)}
      />

      <BatalTransaksiModal
        isOpen={!!transaksiToBatal}
        onClose={() => setTransaksiToBatal(null)}
        transaksi={transaksiToBatal}
        onConfirm={handleConfirmBatal}
      />

      {/* ── Scoped Styling ── */}
      <style>{`
        .transaksi-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        /* Header */
        .transaksi-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .transaksi-header-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }
        .transaksi-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        /* KPI Cards */
        .transaksi-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-4);
        }
        .transaksi-stat-card {
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
        .transaksi-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .transaksi-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .stat-icon--success { background: #ecfdf5; color: #059669; }
        .stat-icon--primary { background: var(--color-primary-subtle); color: var(--color-primary); }
        .stat-icon--danger { background: #fef2f2; color: #dc2626; }
        .stat-icon--info { background: #eff6ff; color: #2563eb; }
        .transaksi-stat-content { flex: 1; min-width: 0; }
        .transaksi-stat-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .transaksi-stat-value {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          line-height: var(--line-height-tight);
        }
        .transaksi-stat-sub {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        /* Controls Card */
        .transaksi-controls-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-4) var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          box-shadow: var(--shadow-sm);
        }
        .controls-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .search-box-wrapper {
          flex: 1;
          min-width: 240px;
          max-width: 380px;
        }
        .status-tabs {
          display: flex;
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 3px;
          gap: 2px;
        }
        .tab-btn {
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
        .tab-btn:hover { color: var(--color-text-primary); }
        .tab-btn.active {
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

        /* Controls Bottom (Pills) */
        .controls-row-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border);
        }
        .filter-pill-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }
        .filter-group-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          margin-right: var(--space-1);
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

        /* Table View */
        .table-card {
          padding: 0;
          overflow: hidden;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .transaksi-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--font-size-sm);
        }
        .transaksi-table th {
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
        .transaksi-table td {
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
        }
        .transaksi-table tr:last-child td { border-bottom: none; }
        .transaksi-table tr:hover td { background: var(--color-surface-hover); }
        .row-batal {
          opacity: 0.65;
          background: #fafafa;
        }
        .col-muted {
          color: var(--color-text-muted);
          font-size: var(--font-size-xs);
        }

        .trx-id-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--color-primary);
          cursor: pointer;
          font-family: monospace;
          font-size: var(--font-size-sm);
          padding: 0;
          transition: color var(--transition-fast);
        }
        .trx-id-btn:hover {
          color: var(--color-primary-hover);
          text-decoration: underline;
        }
        .trx-icon { font-size: 1rem; }

        .time-primary {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }
        .time-secondary {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }
        .kasir-name {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .items-summary-cell {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          max-width: 280px;
        }
        .items-badge {
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          white-space: nowrap;
        }
        .items-text {
          font-size: var(--font-size-xs);
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .text-total-active {
          color: var(--color-text-primary);
        }
        .text-strikethrough {
          text-decoration: line-through;
          color: var(--color-text-muted);
        }

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

        /* Card / Grid View */
        .transaksi-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--space-4);
        }
        .trx-card {
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
        .trx-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .trx-card-batal {
          opacity: 0.75;
          border-color: #fca5a5;
        }
        .trx-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .trx-card-id {
          font-family: monospace;
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
          font-size: var(--font-size-base);
        }
        .trx-card-time {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: 2px;
        }
        .trx-card-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          flex: 1;
        }
        .trx-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }
        .trx-card-items-box {
          background: var(--color-surface-sunken);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          font-size: var(--font-size-xs);
        }
        .items-box-title {
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-1);
        }
        .items-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .items-list li {
          display: flex;
          justify-content: space-between;
          color: var(--color-text-muted);
        }
        .trx-card-total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          padding-top: var(--space-2);
          border-top: 1px dashed var(--color-border);
        }
        .card-total-value {
          font-size: var(--font-size-lg);
          color: var(--color-primary);
        }
        .card-batal-note {
          background: #fef2f2;
          color: #b91c1c;
          padding: var(--space-2);
          border-radius: var(--radius-sm);
          font-size: 11px;
        }
        .trx-card-footer {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border);
        }

        @media (max-width: 768px) {
          .transaksi-header {
            flex-direction: column;
            align-items: stretch;
          }
          .transaksi-header-actions {
            width: 100%;
          }
          .transaksi-header-actions button,
          .transaksi-header-actions a {
            flex: 1;
          }
          .controls-row-top {
            flex-direction: column;
            align-items: stretch;
          }
          .search-box-wrapper { max-width: 100%; }
          .status-tabs { justify-content: space-around; }
          .sort-view-cluster { justify-content: space-between; }
        }
      `}</style>
    </div>
  )
}
