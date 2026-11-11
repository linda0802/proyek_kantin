import { useState, useMemo, useRef } from 'react'
import { useTransaksiContext } from '../../context/TransaksiContext'
import { useProduk } from '../../context/ProdukContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Select, Input } from '../../components/ui/Input'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatRupiah, formatNumber } from '../../utils/currency'
import { formatTanggalPendek, formatTanggalPanjang, formatWaktu } from '../../utils/date'

export default function LaporanPage() {
  const { transaksiList } = useTransaksiContext()
  const { kategoriList, getNamaKategori } = useProduk()
  const { addToast } = useToast()

  // State Tabs — 'Performa Produk' sudah dihapus sesuai instruksi
  const [activeTab, setActiveTab] = useState('ringkasan') // 'ringkasan' | 'kategori' | 'metode'

  // State Filter Periode
  const [periodeType, setPeriodeType] = useState('hari-ini') // 'hari-ini' | '7-hari' | '30-hari' | 'custom'
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [filterKasir, setFilterKasir] = useState('all')

  const printAreaRef = useRef(null)

  // Ambil daftar kasir unik
  const daftarKasir = useMemo(() => {
    const kasirSet = new Set()
    transaksiList.forEach(t => { if (t.kasir) kasirSet.add(t.kasir) })
    return Array.from(kasirSet)
  }, [transaksiList])

  // Filter transaksi berdasarkan periode & kasir (Hanya transaksi 'selesai')
  const filteredTransaksi = useMemo(() => {
    const now = new Date()

    return transaksiList.filter(t => {
      if (t.status !== 'selesai') return false

      // Filter Kasir
      if (filterKasir !== 'all' && t.kasir !== filterKasir) return false

      // Filter Tanggal
      const tgl = new Date(t.tanggal)
      if (periodeType === 'hari-ini') {
        return tgl.toDateString() === now.toDateString()
      } else if (periodeType === '7-hari') {
        const d = new Date(now)
        d.setDate(now.getDate() - 7)
        return tgl >= d
      } else if (periodeType === '30-hari') {
        const d = new Date(now)
        d.setDate(now.getDate() - 30)
        return tgl >= d
      } else if (periodeType === 'custom') {
        const start = new Date(customStartDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999)
        return tgl >= start && tgl <= end
      }
      return true
    })
  }, [transaksiList, periodeType, customStartDate, customEndDate, filterKasir])

  // Kalkulasi KPI Penjualan
  const kpi = useMemo(() => {
    let totalOmzet = 0
    let totalItemTerjual = 0

    filteredTransaksi.forEach(t => {
      totalOmzet += t.total || 0
      t.items?.forEach(i => {
        totalItemTerjual += i.jumlah || 0
      })
    })

    const totalTrx = filteredTransaksi.length
    const aov = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0

    return {
      totalOmzet,
      totalTrx,
      totalItemTerjual,
      aov,
    }
  }, [filteredTransaksi])

  // Agregasi Penjualan Per Kategori
  const kategoriReport = useMemo(() => {
    const map = {}
    kategoriList.forEach(k => {
      map[k.id] = { id: k.id, nama: k.nama, terjual: 0, omzet: 0 }
    })

    filteredTransaksi.forEach(t => {
      t.items?.forEach(i => {
        const katId = i.kategoriId || 1
        if (map[katId]) {
          map[katId].terjual += i.jumlah || 0
          map[katId].omzet += (i.hargaJual || 0) * (i.jumlah || 0)
        } else {
          const fallbackId = 99
          if (!map[fallbackId]) map[fallbackId] = { id: fallbackId, nama: 'Lainnya', terjual: 0, omzet: 0 }
          map[fallbackId].terjual += i.jumlah || 0
          map[fallbackId].omzet += (i.hargaJual || 0) * (i.jumlah || 0)
        }
      })
    })

    const totalAllOmzet = kpi.totalOmzet || 1

    return Object.values(map)
      .map(k => ({
        ...k,
        persentase: Math.round((k.omzet / totalAllOmzet) * 100),
      }))
      .sort((a, b) => b.omzet - a.omzet)
  }, [filteredTransaksi, kategoriList, kpi.totalOmzet])

  // Agregasi Metode Pembayaran
  const metodeReport = useMemo(() => {
    let tunaiOmzet = 0
    let tunaiTrx = 0
    let nonTunaiOmzet = 0
    let nonTunaiTrx = 0
    let kasbonOmzet = 0
    let kasbonTrx = 0

    filteredTransaksi.forEach(t => {
      if (t.metodePembayaran === 'tunai') {
        tunaiOmzet += t.total || 0
        tunaiTrx += 1
      } else if (t.metodePembayaran === 'kasbon') {
        kasbonOmzet += t.total || 0
        kasbonTrx += 1
      } else {
        nonTunaiOmzet += t.total || 0
        nonTunaiTrx += 1
      }
    })

    const totalAll = kpi.totalOmzet || 1
    return {
      tunai: {
        omzet: tunaiOmzet,
        trx: tunaiTrx,
        persen: Math.round((tunaiOmzet / totalAll) * 100),
      },
      nonTunai: {
        omzet: nonTunaiOmzet,
        trx: nonTunaiTrx,
        persen: Math.round((nonTunaiOmzet / totalAll) * 100),
      },
      kasbon: {
        omzet: kasbonOmzet,
        trx: kasbonTrx,
        persen: Math.round((kasbonOmzet / totalAll) * 100),
      },
    }
  }, [filteredTransaksi, kpi.totalOmzet])

  // Data Tren Grafik Penjualan (Harian atau Per Jam)
  const chartData = useMemo(() => {
    if (periodeType === 'hari-ini') {
      const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
      const dataMap = {}
      hours.forEach(h => { dataMap[h] = 0 })

      filteredTransaksi.forEach(t => {
        const hour = new Date(t.tanggal).getHours()
        const key = `${String(hour).padStart(2, '0')}:00`
        if (dataMap[key] !== undefined) {
          dataMap[key] += t.total || 0
        }
      })

      const maxVal = Math.max(...Object.values(dataMap), 10000)
      return hours.map(h => ({
        label: h,
        value: dataMap[h],
        pct: Math.round((dataMap[h] / maxVal) * 100),
      }))
    } else {
      const daysMap = {}
      filteredTransaksi.forEach(t => {
        const d = new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        daysMap[d] = (daysMap[d] || 0) + (t.total || 0)
      })

      const entries = Object.entries(daysMap)
      if (entries.length === 0) return []
      const maxVal = Math.max(...entries.map(e => e[1]), 10000)
      return entries.map(([d, val]) => ({
        label: d,
        value: val,
        pct: Math.round((val / maxVal) * 100),
      }))
    }
  }, [filteredTransaksi, periodeType])

  // Cetak Dokumen Laporan Formal via Browser Print
  const handlePrintLaporan = () => {
    const printContent = printAreaRef.current?.innerHTML
    if (!printContent) return

    const win = window.open('', '_blank', 'width=800,height=900')
    win.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan Penjualan — KantinKu</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11pt; padding: 24px; color: #111; line-height: 1.4; }
          .header-kop { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; text-align: center; }
          .header-kop h2 { font-size: 18pt; margin-bottom: 4px; }
          .header-kop p { font-size: 10pt; color: #555; }
          .meta-info { margin-bottom: 16px; font-size: 10pt; }
          .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .kpi-table th, .kpi-table td { border: 1px solid #999; padding: 8px 12px; text-align: left; }
          .kpi-table th { background: #f2f2f2; font-weight: bold; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
          .data-table th, .data-table td { border: 1px solid #ccc; padding: 6px 10px; }
          .data-table th { background: #eee; font-weight: bold; text-align: left; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .ttd-section { margin-top: 40px; display: flex; justify-content: space-between; }
          .ttd-box { width: 220px; text-align: center; }
          .ttd-space { height: 60px; }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `)
    win.document.close()
    win.print()
    win.close()
  }

  // Ekspor CSV Laporan Transaksi
  const handleExportCSV = () => {
    if (filteredTransaksi.length === 0) {
      addToast({ type: 'info', title: 'Tidak ada data', message: 'Tidak ada data penjualan untuk diekspor.' })
      return
    }

    const headers = ['No Transaksi', 'Tanggal', 'Kasir', 'Metode Pembayaran', 'Pelanggan', 'Total Omzet']
    const rows = filteredTransaksi.map(t => [
      `"${t.id}"`,
      `"${formatTanggalPendek(t.tanggal)}"`,
      `"${t.kasir}"`,
      `"${t.metodePembayaran}"`,
      `"${t.pelanggan || '-'}"`,
      t.total,
    ].join(','))

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `laporan_penjualan_${periodeType}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addToast({ type: 'success', title: 'Ekspor Berhasil', message: 'Laporan penjualan berhasil diunduh.' })
  }

  const periodeLabel = {
    'hari-ini': 'Hari Ini',
    '7-hari': '7 Hari Terakhir',
    '30-hari': '30 Hari Terakhir',
    'custom': `Periode ${customStartDate} s/d ${customEndDate}`,
  }[periodeType]

  return (
    <div className="laporan-page" id="laporan-page">
      {/* ── Page Header ── */}
      <div className="laporan-header">
        <div>
          <div className="laporan-header-title-row">
            <h1 className="page-title">Laporan Penjualan</h1>
            <Badge variant="primary" dot>{periodeLabel}</Badge>
          </div>
          <p className="page-subtitle">
            Rekap omzet, volume transaksi harian, dan analisa metode pembayaran kantin sekolah.
          </p>
        </div>

        <div className="laporan-header-actions">
          <Button variant="secondary" onClick={handleExportCSV} id="btn-export-laporan-csv">
            <span aria-hidden="true">📥</span> Ekspor CSV
          </Button>
          <Button variant="primary" onClick={handlePrintLaporan} id="btn-print-laporan-formal">
            <span aria-hidden="true">🖨️</span> Cetak Laporan Resmi
          </Button>
        </div>
      </div>

      {/* ── Filter Controls Bar ── */}
      <div className="laporan-controls-card">
        <div className="controls-row">
          {/* Quick Period Buttons */}
          <div className="period-pill-group" role="group" aria-label="Periode">
            {[
              { id: 'hari-ini', label: 'Hari Ini' },
              { id: '7-hari', label: '7 Hari Terakhir' },
              { id: '30-hari', label: '30 Hari Terakhir' },
              { id: 'custom', label: '🗓️ Kustom' },
            ].map(p => (
              <button
                key={p.id}
                className={`period-btn ${periodeType === p.id ? 'active' : ''}`}
                onClick={() => setPeriodeType(p.id)}
                id={`periode-${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {periodeType === 'custom' && (
            <div className="custom-date-inputs">
              <Input
                type="date"
                label="Dari"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                id="custom-start-date"
              />
              <Input
                type="date"
                label="Sampai"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                id="custom-end-date"
              />
            </div>
          )}

          {/* Kasir Filter */}
          <div style={{ minWidth: '180px' }}>
            <Select
              label="Filter Kasir"
              value={filterKasir}
              onChange={e => setFilterKasir(e.target.value)}
              id="select-filter-kasir"
            >
              <option value="all">Semua Kasir ({daftarKasir.length})</option>
              {daftarKasir.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards (Fokus pada Penjualan, tanpa estimasi laba kotor) ── */}
      <div className="laporan-stats-grid">
        <div className="laporan-stat-card">
          <div className="laporan-stat-icon stat-icon--success" aria-hidden="true">💵</div>
          <div className="laporan-stat-content">
            <div className="laporan-stat-label">Total Omzet Penjualan</div>
            <div className="laporan-stat-value" style={{ color: 'var(--color-success)' }}>
              {formatRupiah(kpi.totalOmzet)}
            </div>
            <div className="laporan-stat-sub">Dari {kpi.totalTrx} transaksi selesai</div>
          </div>
        </div>

        <div className="laporan-stat-card">
          <div className="laporan-stat-icon stat-icon--primary" aria-hidden="true">🛒</div>
          <div className="laporan-stat-content">
            <div className="laporan-stat-label">Total Transaksi</div>
            <div className="laporan-stat-value" style={{ color: 'var(--color-primary)' }}>
              {kpi.totalTrx}
            </div>
            <div className="laporan-stat-sub">Struk belanja selesai</div>
          </div>
        </div>

        <div className="laporan-stat-card">
          <div className="laporan-stat-icon stat-icon--info" aria-hidden="true">🧾</div>
          <div className="laporan-stat-content">
            <div className="laporan-stat-label">Total Item Terjual</div>
            <div className="laporan-stat-value">{formatNumber(kpi.totalItemTerjual)}</div>
            <div className="laporan-stat-sub">Produk kantin & titipan</div>
          </div>
        </div>

        <div className="laporan-stat-card">
          <div className="laporan-stat-icon stat-icon--warning" aria-hidden="true">🏷️</div>
          <div className="laporan-stat-content">
            <div className="laporan-stat-label">Rata-Rata per Transaksi</div>
            <div className="laporan-stat-value" style={{ fontSize: 'var(--font-size-xl)' }}>
              {formatRupiah(kpi.aov)}
            </div>
            <div className="laporan-stat-sub">Rata-rata belanja per struk</div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="laporan-tabs-wrapper">
        <div className="laporan-tabs" role="tablist">
          <button
            className={`tab-btn ${activeTab === 'ringkasan' ? 'active' : ''}`}
            onClick={() => setActiveTab('ringkasan')}
            id="tab-ringkasan"
          >
            📊 Tren & Grafik
          </button>
          <button
            className={`tab-btn ${activeTab === 'kategori' ? 'active' : ''}`}
            onClick={() => setActiveTab('kategori')}
            id="tab-kategori"
          >
            🏷️ Penjualan Kategori
          </button>
          <button
            className={`tab-btn ${activeTab === 'metode' ? 'active' : ''}`}
            onClick={() => setActiveTab('metode')}
            id="tab-metode"
          >
            💳 Metode Pembayaran
          </button>
        </div>
      </div>

      {/* ── TAB 1: TREN & GRAFIK ── */}
      {activeTab === 'ringkasan' && (
        <div className="tab-pane">
          <div className="card chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Grafik Tren Omzet Penjualan</h3>
                <p className="chart-sub">
                  Distribusi omzet penjualan {periodeType === 'hari-ini' ? 'per jam' : 'harian'} dalam periode terpilih
                </p>
              </div>
              <div className="chart-legend">
                <span className="legend-dot"></span>
                <span>Omzet (Rp)</span>
              </div>
            </div>

            {chartData.length === 0 ? (
              <EmptyState icon="📈" title="Belum ada data grafik" description="Tidak ada transaksi pada periode ini." />
            ) : (
              <div className="chart-bars-container">
                {chartData.map((d, i) => (
                  <div key={i} className="bar-column">
                    <div className="bar-wrapper" title={`${d.label}: ${formatRupiah(d.value)}`}>
                      <div className="bar-fill" style={{ height: `${Math.max(d.pct, 4)}%` }}>
                        {d.value > 0 && <span className="bar-tooltip">{formatRupiah(d.value)}</span>}
                      </div>
                    </div>
                    <span className="bar-label">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: PENJUALAN KATEGORI ── */}
      {activeTab === 'kategori' && (
        <div className="tab-pane">
          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <h3 className="section-title">Kontribusi Omzet per Kategori Menu</h3>
            <div className="kategori-progress-list">
              {kategoriReport.map(k => (
                <div key={k.id} className="kategori-progress-item">
                  <div className="progress-label-row">
                    <span className="cat-name">{k.nama}</span>
                    <div className="cat-stats">
                      <strong>{formatRupiah(k.omzet)}</strong>
                      <span className="cat-sub">({k.terjual} unit • {k.persentase}%)</span>
                    </div>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${k.persentase}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: METODE PEMBAYARAN ── */}
      {activeTab === 'metode' && (
        <div className="tab-pane">
          <div className="metode-cards-grid">
            <div className="card metode-card">
              <div className="metode-card-top">
                <span className="metode-icon">💵</span>
                <div>
                  <h4 className="metode-title">Uang Tunai (Cash)</h4>
                  <span className="metode-trx-count">{metodeReport.tunai.trx} Transaksi Selesai</span>
                </div>
              </div>
              <div className="metode-amount">{formatRupiah(metodeReport.tunai.omzet)}</div>
              <div className="metode-progress-box">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${metodeReport.tunai.persen}%` }}></div>
                </div>
                <div className="metode-share-text">Pangsa Metode: {metodeReport.tunai.persen}%</div>
              </div>
            </div>

            <div className="card metode-card">
              <div className="metode-card-top">
                <span className="metode-icon">📱</span>
                <div>
                  <h4 className="metode-title">Non-Tunai (QRIS / Transfer)</h4>
                  <span className="metode-trx-count">{metodeReport.nonTunai.trx} Transaksi Selesai</span>
                </div>
              </div>
              <div className="metode-amount">{formatRupiah(metodeReport.nonTunai.omzet)}</div>
              <div className="metode-progress-box">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill fill--blue" style={{ width: `${metodeReport.nonTunai.persen}%` }}></div>
                </div>
                <div className="metode-share-text">Pangsa Metode: {metodeReport.nonTunai.persen}%</div>
              </div>
            </div>

            <div className="card metode-card">
              <div className="metode-card-top">
                <span className="metode-icon">📝</span>
                <div>
                  <h4 className="metode-title">Kasbon / Hutang</h4>
                  <span className="metode-trx-count">{metodeReport.kasbon.trx} Transaksi Selesai</span>
                </div>
              </div>
              <div className="metode-amount">{formatRupiah(metodeReport.kasbon.omzet)}</div>
              <div className="metode-progress-box">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill fill--amber" style={{ width: `${metodeReport.kasbon.persen}%` }}></div>
                </div>
                <div className="metode-share-text">Pangsa Metode: {metodeReport.kasbon.persen}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HIDDEN PRINTABLE FORMAL REPORT TEMPLATE ── */}
      <div style={{ display: 'none' }}>
        <div ref={printAreaRef}>
          <div className="header-kop">
            <h2>KANTINKU — KANTIN SEKOLAH</h2>
            <p>Kabupaten Bogor • Sistem Informasi Penjualan Kantin</p>
            <h3 style={{ marginTop: '10px', textTransform: 'uppercase' }}>Laporan Resmi Penjualan Kantin</h3>
          </div>

          <div className="meta-info">
            <p><strong>Periode Laporan:</strong> {periodeLabel}</p>
            <p><strong>Tanggal Cetak:</strong> {formatTanggalPanjang(new Date())}, {formatWaktu(new Date())} WIB</p>
            <p><strong>Filter Petugas:</strong> {filterKasir === 'all' ? 'Semua Kasir' : filterKasir}</p>
          </div>

          <h4 style={{ marginBottom: '8px' }}>I. Ringkasan Finansial Penjualan</h4>
          <table className="kpi-table">
            <thead>
              <tr>
                <th>Total Omzet Penjualan</th>
                <th>Total Transaksi Selesai</th>
                <th>Total Item Terjual</th>
                <th>Rata-Rata per Struk</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>{formatRupiah(kpi.totalOmzet)}</strong></td>
                <td>{kpi.totalTrx} Struk</td>
                <td>{kpi.totalItemTerjual} Unit</td>
                <td>{formatRupiah(kpi.aov)}</td>
              </tr>
            </tbody>
          </table>

          <div className="ttd-section">
            <div className="ttd-box">
              <p>Mengetahui,</p>
              <p><strong>Pengelola Kantin</strong></p>
              <div className="ttd-space"></div>
              <p>( _______________________ )</p>
            </div>
            <div className="ttd-box">
              <p>Kabupaten Bogor, {formatTanggalPendek(new Date())}</p>
              <p><strong>Kasir / Petugas</strong></p>
              <div className="ttd-space"></div>
              <p>( _______________________ )</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .laporan-page { display: flex; flex-direction: column; gap: var(--space-6); }
        .laporan-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
        .laporan-header-title-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-1); }
        .laporan-header-actions { display: flex; align-items: center; gap: var(--space-3); }

        .laporan-controls-card {
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-xl); padding: var(--space-4) var(--space-5);
          box-shadow: var(--shadow-sm);
        }
        .controls-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
        .period-pill-group {
          display: flex; background: var(--color-surface-sunken); border: 1px solid var(--color-border);
          border-radius: var(--radius-lg); padding: 3px; gap: 2px;
        }
        .period-btn {
          border: none; background: transparent; padding: var(--space-2) var(--space-4);
          font-size: var(--font-size-xs); font-weight: var(--font-weight-medium);
          color: var(--color-text-muted); border-radius: var(--radius-md); cursor: pointer;
        }
        .period-btn.active {
          background: var(--color-surface); color: var(--color-primary);
          font-weight: var(--font-weight-bold); box-shadow: var(--shadow-sm);
        }
        .custom-date-inputs { display: flex; gap: var(--space-3); align-items: center; }

        .laporan-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); }
        .laporan-stat-card {
          background: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-xl); padding: var(--space-5);
          display: flex; align-items: center; gap: var(--space-4); box-shadow: var(--shadow-sm);
        }
        .laporan-stat-icon {
          width: 48px; height: 48px; border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; flex-shrink: 0;
        }
        .stat-icon--success { background: #ecfdf5; color: #059669; }
        .stat-icon--primary { background: var(--color-primary-subtle); color: var(--color-primary); }
        .stat-icon--info { background: #eff6ff; color: #2563eb; }
        .stat-icon--warning { background: #fef3c7; color: #d97706; }
        .laporan-stat-content { flex: 1; min-width: 0; }
        .laporan-stat-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
        .laporan-stat-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-text-primary); }
        .laporan-stat-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px; }

        .laporan-tabs-wrapper { border-bottom: 1px solid var(--color-border); }
        .laporan-tabs { display: flex; gap: var(--space-4); }
        .tab-btn {
          border: none; background: transparent; padding: var(--space-3) var(--space-2);
          font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
          color: var(--color-text-muted); cursor: pointer; border-bottom: 2px solid transparent;
        }
        .tab-btn.active { color: var(--color-primary); font-weight: var(--font-weight-bold); border-bottom-color: var(--color-primary); }

        .chart-card { padding: var(--space-6); }
        .chart-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-2); }
        .chart-title { font-size: var(--font-size-base); font-weight: var(--font-weight-bold); }
        .chart-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }
        .chart-legend { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-xs); color: var(--color-text-muted); }
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); }

        .chart-bars-container {
          display: flex; align-items: flex-end; justify-content: space-between;
          height: 220px; gap: var(--space-3); padding-top: var(--space-4);
        }
        .bar-column { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
        .bar-wrapper { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
        .bar-fill {
          width: 70%; max-width: 36px; background: linear-gradient(to top, var(--color-primary), #4ade80);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0; position: relative;
          transition: height 0.4s ease; min-height: 4px;
        }
        .bar-tooltip {
          position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
          font-size: 9px; font-weight: bold; color: var(--color-primary); white-space: nowrap;
        }
        .bar-label { font-size: 10px; color: var(--color-text-muted); margin-top: var(--space-2); white-space: nowrap; }

        .kategori-progress-list { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
        .progress-label-row { display: flex; justify-content: space-between; font-size: var(--font-size-sm); margin-bottom: var(--space-1); }
        .progress-bar-track { height: 8px; background: var(--color-surface-sunken); border-radius: var(--radius-full); overflow: hidden; }
        .progress-bar-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); }
        .fill--blue { background: #2563eb !important; }
        .fill--amber { background: #d97706 !important; }

        .metode-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-4); }
        .metode-card { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
        .metode-card-top { display: flex; align-items: center; gap: var(--space-3); }
        .metode-icon { font-size: 1.8rem; }
        .metode-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); }
        .metode-trx-count { font-size: var(--font-size-xs); color: var(--color-text-muted); }
        .metode-amount { font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-text-primary); }
        .metode-progress-box { display: flex; flex-direction: column; gap: var(--space-1); }
        .metode-share-text { font-size: var(--font-size-xs); color: var(--color-text-muted); text-align: right; }
      `}</style>
    </div>
  )
}
