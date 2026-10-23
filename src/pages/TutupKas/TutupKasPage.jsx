import { useState, useMemo, useRef, useEffect } from 'react'
import { useTransaksiContext } from '../../context/TransaksiContext'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Input, Textarea } from '../../components/ui/Input'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatRupiah, formatNumber } from '../../utils/currency'
import { formatTanggalPanjang, formatTanggalPendek, formatTanggalWaktu, formatWaktu } from '../../utils/date'

const TUTUP_KAS_STORAGE = 'kantinku_tutup_kas'

const today = new Date()
const INITIAL_RIWAYAT_TUTUP = [
  {
    id: 'TK-20261022-01',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 16, 0).toISOString(),
    kasir: 'Siti Kasir',
    modalAwal: 100000,
    penjualanTunai: 145000,
    penjualanNonTunai: 85000,
    totalOmzet: 230000,
    kasSeharusnya: 245000,
    uangFisik: 245000,
    selisih: 0,
    catatan: 'Kas seimbang dan pas. Selesai shift.',
  },
  {
    id: 'TK-20261021-01',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 16, 15).toISOString(),
    kasir: 'Admin KantinKu',
    modalAwal: 100000,
    penjualanTunai: 210000,
    penjualanNonTunai: 120000,
    totalOmzet: 330000,
    kasSeharusnya: 310000,
    uangFisik: 312000,
    selisih: 2000,
    catatan: 'Lebih 2.000 (kembalian tidak diambil pembeli).',
  },
]

export default function TutupKasPage() {
  const { transaksiList } = useTransaksiContext()
  const { user } = useAuth()
  const { settings } = useSettings()
  const { addToast } = useToast()

  // Form Tutup Kas Hari Ini
  const [modalAwal, setModalAwal] = useState('100000')
  const [uangFisik, setUangFisik] = useState('')
  const [catatan, setCatatan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Riwayat Tutup Kas
  const [riwayatList, setRiwayatList] = useState(() => {
    try {
      const saved = localStorage.getItem(TUTUP_KAS_STORAGE)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error('Error loading riwayat tutup kas:', e)
    }
    return INITIAL_RIWAYAT_TUTUP
  })

  // Selected item for print
  const [selectedForPrint, setSelectedForPrint] = useState(null)
  const printSlipRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(TUTUP_KAS_STORAGE, JSON.stringify(riwayatList))
    } catch (e) {
      console.error('Error saving riwayat tutup kas:', e)
    }
  }, [riwayatList])

  // Hitung transaksi hari ini
  const shiftMetrics = useMemo(() => {
    const todayStr = new Date().toDateString()
    const trxHariIni = transaksiList.filter(
      t => t.status === 'selesai' && new Date(t.tanggal).toDateString() === todayStr
    )

    let penjualanTunai = 0
    let penjualanNonTunai = 0
    let totalTransaksi = trxHariIni.length

    trxHariIni.forEach(t => {
      if (t.metodePembayaran === 'tunai') {
        penjualanTunai += t.total
      } else {
        penjualanNonTunai += t.total
      }
    })

    const totalOmzet = penjualanTunai + penjualanNonTunai
    const modalAwalNum = parseInt(modalAwal, 10) || 0
    const kasSeharusnya = modalAwalNum + penjualanTunai

    const fisikNum = uangFisik !== '' ? parseInt(uangFisik, 10) : null
    const selisih = fisikNum !== null ? fisikNum - kasSeharusnya : null

    return {
      penjualanTunai,
      penjualanNonTunai,
      totalOmzet,
      modalAwalNum,
      kasSeharusnya,
      fisikNum,
      selisih,
      totalTransaksi,
    }
  }, [transaksiList, modalAwal, uangFisik])

  // Handle Simpan Tutup Kas
  const handleSimpanTutupKas = async () => {
    if (uangFisik === '') {
      addToast({ type: 'error', title: 'Input Diperlukan', message: 'Harap masukkan jumlah uang fisik di laci kas.' })
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise(r => setTimeout(r, 500))

      const newRecord = {
        id: `TK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(riwayatList.length + 1).padStart(2, '0')}`,
        tanggal: new Date().toISOString(),
        kasir: user?.name || 'Kasir',
        modalAwal: shiftMetrics.modalAwalNum,
        penjualanTunai: shiftMetrics.penjualanTunai,
        penjualanNonTunai: shiftMetrics.penjualanNonTunai,
        totalOmzet: shiftMetrics.totalOmzet,
        kasSeharusnya: shiftMetrics.kasSeharusnya,
        uangFisik: shiftMetrics.fisikNum,
        selisih: shiftMetrics.selisih,
        catatan: catatan.trim() || 'Tutup kas harian berhasil diselesaikan.',
      }

      setRiwayatList(prev => [newRecord, ...prev])
      setSelectedForPrint(newRecord)

      addToast({
        type: 'success',
        title: 'Tutup Kas Berhasil Disimpan',
        message: `Rekap kas ${newRecord.id} berhasil dicatat.`,
      })

      // Reset form
      setUangFisik('')
      setCatatan('')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Print Slip Tutup Kas
  const handlePrintSlip = (record) => {
    setSelectedForPrint(record)
    setTimeout(() => {
      const printContent = printSlipRef.current?.innerHTML
      if (!printContent) return

      const win = window.open('', '_blank', 'width=340,height=620')
      win.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Slip Tutup Kas — ${record.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 14px; color: #111; }
            .slip-divider { border-top: 1px dashed #555; margin: 8px 0; }
            .slip-center { text-align: center; }
            .slip-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .slip-brand { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            .slip-total { font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>${printContent}</body>
        </html>
      `)
      win.document.close()
      win.print()
      win.close()
    }, 150)
  }

  return (
    <div className="tutup-kas-page" id="tutup-kas-page">
      {/* ── Page Header ── */}
      <div className="tutup-kas-header">
        <div>
          <div className="tutup-kas-header-title-row">
            <h1 className="page-title">Rekap & Tutup Kas Harian</h1>
            <Badge variant="primary" dot>{formatTanggalPanjang(new Date())}</Badge>
          </div>
          <p className="page-subtitle">
            Pencocokan uang tunai fisik di laci kas dengan penjualan sistem kasir (End of Shift / Daily Closing).
          </p>
        </div>

        <div className="tutup-kas-header-actions">
          <Button
            variant="secondary"
            onClick={() => handlePrintSlip(riwayatList[0] || {
              id: 'TK-DRAFT',
              tanggal: new Date().toISOString(),
              kasir: user?.name || 'Kasir',
              modalAwal: shiftMetrics.modalAwalNum,
              penjualanTunai: shiftMetrics.penjualanTunai,
              penjualanNonTunai: shiftMetrics.penjualanNonTunai,
              totalOmzet: shiftMetrics.totalOmzet,
              kasSeharusnya: shiftMetrics.kasSeharusnya,
              uangFisik: shiftMetrics.fisikNum || shiftMetrics.kasSeharusnya,
              selisih: shiftMetrics.selisih || 0,
              catatan: 'Draft rekap tutup kas hari ini.',
            })}
            id="btn-print-slip-current"
          >
            <span aria-hidden="true">🖨️</span> Cetak Slip Tutup Kas
          </Button>
        </div>
      </div>

      {/* ── Shift Summary KPI Cards ── */}
      <div className="tutup-stats-grid">
        <div className="tutup-stat-card">
          <div className="tutup-stat-icon stat-icon--info" aria-hidden="true">🪙</div>
          <div className="tutup-stat-content">
            <div className="tutup-stat-label">Modal Awal Kas</div>
            <div className="tutup-stat-value">{formatRupiah(shiftMetrics.modalAwalNum)}</div>
            <div className="tutup-stat-sub">Uang kembalian awal</div>
          </div>
        </div>

        <div className="tutup-stat-card">
          <div className="tutup-stat-icon stat-icon--success" aria-hidden="true">💵</div>
          <div className="tutup-stat-content">
            <div className="tutup-stat-label">Penjualan Tunai</div>
            <div className="tutup-stat-value" style={{ color: 'var(--color-success)' }}>
              {formatRupiah(shiftMetrics.penjualanTunai)}
            </div>
            <div className="tutup-stat-sub">Masuk ke laci kas</div>
          </div>
        </div>

        <div className="tutup-stat-card">
          <div className="tutup-stat-icon stat-icon--primary" aria-hidden="true">📱</div>
          <div className="tutup-stat-content">
            <div className="tutup-stat-label">Penjualan Non-Tunai</div>
            <div className="tutup-stat-value" style={{ color: 'var(--color-primary)' }}>
              {formatRupiah(shiftMetrics.penjualanNonTunai)}
            </div>
            <div className="tutup-stat-sub">QRIS / Rekening bank</div>
          </div>
        </div>

        <div className="tutup-stat-card">
          <div className="tutup-stat-icon stat-icon--target" aria-hidden="true">🎯</div>
          <div className="tutup-stat-content">
            <div className="tutup-stat-label">Total Kas Seharusnya</div>
            <div className="tutup-stat-value" style={{ fontSize: 'var(--font-size-xl)' }}>
              {formatRupiah(shiftMetrics.kasSeharusnya)}
            </div>
            <div className="tutup-stat-sub">Modal + Penjualan Tunai</div>
          </div>
        </div>
      </div>

      {/* ── Main Form: Rekonsiliasi Tutup Kas ── */}
      <div className="card form-closing-card" id="form-closing-card">
        <h3 className="closing-card-title">📝 Form Rekonsiliasi Kas Shift Ini</h3>
        <p className="closing-card-desc">
          Hitung seluruh uang kertas dan koin yang ada di laci kasir saat ini, lalu masukkan totalnya di bawah.
        </p>

        <div className="closing-form-grid">
          {/* Left: Input Fields */}
          <div className="form-left-col">
            <div className="form-group">
              <Input
                label="Modal Awal Kasir (Rp)"
                type="number"
                min="0"
                value={modalAwal}
                onChange={e => setModalAwal(e.target.value)}
                hint="Uang kas awal di laci untuk modal kembalian"
                id="input-modal-awal"
              />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <Input
                label="Total Uang Fisik di Laci (Rp)"
                type="number"
                min="0"
                placeholder="Masukkan hasil hitungan fisik laci kas..."
                value={uangFisik}
                onChange={e => setUangFisik(e.target.value)}
                required
                id="input-uang-fisik"
                hint="Jumlah uang tunai aktual saat laci dibuka"
              />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <Textarea
                label="Catatan Kasir / Keterangan Selisih"
                placeholder="Tuliskan catatan penutupan shift jika ada selisih uang..."
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                rows={2}
                id="textarea-catatan-tutup-kas"
              />
            </div>
          </div>

          {/* Right: Live Reconciliation Result Box */}
          <div className="reconciliation-box">
            <div className="recon-header">
              <span className="recon-badge">Kalkulasi Sistem</span>
              <h4>Hasil Pencocokan Kas</h4>
            </div>

            <div className="recon-lines">
              <div className="recon-row">
                <span>Modal Awal:</span>
                <span>{formatRupiah(shiftMetrics.modalAwalNum)}</span>
              </div>
              <div className="recon-row">
                <span>Total Tunai Masuk:</span>
                <span>+{formatRupiah(shiftMetrics.penjualanTunai)}</span>
              </div>
              <div className="recon-row recon-subtotal">
                <span>Target Kas di Laci:</span>
                <strong>{formatRupiah(shiftMetrics.kasSeharusnya)}</strong>
              </div>
              <div className="recon-row">
                <span>Uang Fisik Dihitung:</span>
                <strong>{shiftMetrics.fisikNum !== null ? formatRupiah(shiftMetrics.fisikNum) : '— Belum diinput'}</strong>
              </div>
            </div>

            {/* Selisih Box */}
            <div
              className={`selisih-result-card ${
                shiftMetrics.selisih === null
                  ? 'selisih--neutral'
                  : shiftMetrics.selisih === 0
                  ? 'selisih--pas'
                  : shiftMetrics.selisih > 0
                  ? 'selisih--lebih'
                  : 'selisih--kurang'
              }`}
            >
              <div className="selisih-label">Status Selisih Kas:</div>
              <div className="selisih-status-text">
                {shiftMetrics.selisih === null ? (
                  'Menunggu input uang fisik'
                ) : shiftMetrics.selisih === 0 ? (
                  '✅ Kas Pas & Seimbang (Rp 0)'
                ) : shiftMetrics.selisih > 0 ? (
                  `📈 Surplus / Lebih Kas (+${formatRupiah(shiftMetrics.selisih)})`
                ) : (
                  `⚠️ Defisit / Kurang Kas (${formatRupiah(shiftMetrics.selisih)})`
                )}
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleSimpanTutupKas}
              loading={isSubmitting}
              id="btn-submit-tutup-kas"
              style={{ marginTop: 'var(--space-4)' }}
            >
              🔒 Simpan & Kunci Tutup Kas
            </Button>
          </div>
        </div>
      </div>

      {/* ── Riwayat Tutup Kas Sebelumnya ── */}
      <div className="riwayat-tutup-section">
        <h3 className="section-title">📜 Riwayat Tutup Kas Harian</h3>
        <p className="section-subtitle">Daftar rekonsiliasi kas harian yang telah dikunci dan disetujui sebelumnya.</p>

        {riwayatList.length === 0 ? (
          <div className="card" style={{ padding: 0 }}>
            <EmptyState icon="📜" title="Belum ada riwayat tutup kas" description="Belum ada shift kasir yang ditutup." />
          </div>
        ) : (
          <div className="card table-card">
            <div className="table-responsive">
              <table className="tutup-table" id="table-riwayat-tutup-kas">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>No</th>
                    <th>ID Rekap</th>
                    <th>Waktu & Tanggal</th>
                    <th>Kasir</th>
                    <th style={{ textAlign: 'right' }}>Modal Awal</th>
                    <th style={{ textAlign: 'right' }}>Penjualan Tunai</th>
                    <th style={{ textAlign: 'right' }}>Target Laci</th>
                    <th style={{ textAlign: 'right' }}>Uang Fisik</th>
                    <th style={{ textAlign: 'center' }}>Selisih</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Cetak</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatList.map((r, idx) => {
                    const isPas = r.selisih === 0
                    const isLebih = r.selisih > 0

                    return (
                      <tr key={r.id}>
                        <td className="col-muted">{idx + 1}</td>
                        <td>
                          <span className="font-mono font-bold text-primary">{r.id}</span>
                        </td>
                        <td>
                          <div className="time-primary">{formatTanggalPendek(r.tanggal)}</div>
                          <div className="time-secondary">{formatWaktu(r.tanggal)} WIB</div>
                        </td>
                        <td>
                          <span className="kasir-tag">👤 {r.kasir}</span>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
                          {formatRupiah(r.modalAwal)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 'bold' }}>
                          {formatRupiah(r.penjualanTunai)}
                        </td>
                        <td style={{ textAlign: 'right' }}>{formatRupiah(r.kasSeharusnya)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(r.uangFisik)}</td>
                        <td style={{ textAlign: 'center' }}>
                          {isPas ? (
                            <Badge variant="success" dot>Pas (Rp 0)</Badge>
                          ) : isLebih ? (
                            <Badge variant="primary">+{formatRupiah(r.selisih)}</Badge>
                          ) : (
                            <Badge variant="danger">{formatRupiah(r.selisih)}</Badge>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon
                            onClick={() => handlePrintSlip(r)}
                            title="Cetak Slip Rekap"
                            id={`btn-print-rekap-${r.id}`}
                          >
                            🖨️
                          </Button>
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

      {/* ── Hidden Printable Slip Tutup Kas ── */}
      <div style={{ display: 'none' }}>
        <div ref={printSlipRef}>
          {selectedForPrint && (
            <div>
              <div className="slip-center">
                <div className="slip-brand">KANTINKU SMAN 8</div>
                <div>Laporan Rekap Penutupan Kas</div>
                <div>ID: {selectedForPrint.id}</div>
              </div>
              <div className="slip-divider"></div>
              <div className="slip-row">
                <span>Tanggal:</span>
                <span>{formatTanggalWaktu(selectedForPrint.tanggal)}</span>
              </div>
              <div className="slip-row">
                <span>Kasir:</span>
                <span>{selectedForPrint.kasir}</span>
              </div>
              <div className="slip-divider"></div>
              <div className="slip-row">
                <span>Modal Awal Kas:</span>
                <span>Rp {selectedForPrint.modalAwal?.toLocaleString('id-ID')}</span>
              </div>
              <div className="slip-row">
                <span>Penjualan Tunai:</span>
                <span>Rp {selectedForPrint.penjualanTunai?.toLocaleString('id-ID')}</span>
              </div>
              <div className="slip-row">
                <span>Penjualan Non-Tunai:</span>
                <span>Rp {selectedForPrint.penjualanNonTunai?.toLocaleString('id-ID')}</span>
              </div>
              <div className="slip-row slip-total">
                <span>Total Omzet Shift:</span>
                <span>Rp {selectedForPrint.totalOmzet?.toLocaleString('id-ID')}</span>
              </div>
              <div className="slip-divider"></div>
              <div className="slip-row">
                <span>Kas Seharusnya:</span>
                <span>Rp {selectedForPrint.kasSeharusnya?.toLocaleString('id-ID')}</span>
              </div>
              <div className="slip-row">
                <span>Uang Fisik Laci:</span>
                <span>Rp {selectedForPrint.uangFisik?.toLocaleString('id-ID')}</span>
              </div>
              <div className="slip-row slip-total">
                <span>SELISIH:</span>
                <span>
                  {selectedForPrint.selisih === 0
                    ? 'PAS (Rp 0)'
                    : `Rp ${selectedForPrint.selisih?.toLocaleString('id-ID')}`}
                </span>
              </div>
              <div className="slip-divider"></div>
              <div style={{ fontSize: '11px', margin: '4px 0' }}>
                <strong>Catatan:</strong> {selectedForPrint.catatan || '—'}
              </div>
              <div className="slip-center" style={{ marginTop: '16px' }}>
                <p>Tanda Tangan Kasir</p>
                <div style={{ height: '36px' }}></div>
                <p>( {selectedForPrint.kasir} )</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Scoped Styling ── */}
      <style>{`
        .tutup-kas-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        /* Header */
        .tutup-kas-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .tutup-kas-header-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }
        .tutup-kas-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        /* KPI Cards */
        .tutup-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-4);
        }
        .tutup-stat-card {
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
        .tutup-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .tutup-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .stat-icon--info { background: #eff6ff; color: #2563eb; }
        .stat-icon--success { background: #ecfdf5; color: #059669; }
        .stat-icon--primary { background: var(--color-primary-subtle); color: var(--color-primary); }
        .stat-icon--target { background: #fdf4ff; color: #a855f7; }
        .tutup-stat-content { flex: 1; min-width: 0; }
        .tutup-stat-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .tutup-stat-value {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          line-height: var(--line-height-tight);
        }
        .tutup-stat-sub {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        /* Form Closing Card */
        .form-closing-card {
          padding: var(--space-6);
        }
        .closing-card-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }
        .closing-card-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-top: 2px;
          margin-bottom: var(--space-6);
        }
        .closing-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-8);
        }
        .form-left-col {
          display: flex;
          flex-direction: column;
        }

        /* Reconciliation Box */
        .reconciliation-box {
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .recon-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .recon-header h4 {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }
        .recon-badge {
          background: var(--color-primary-subtle);
          color: var(--color-primary);
          font-size: 11px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }
        .recon-lines {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
        }
        .recon-row {
          display: flex;
          justify-content: space-between;
          color: var(--color-text-muted);
        }
        .recon-subtotal {
          padding-top: var(--space-2);
          border-top: 1px dashed var(--color-border);
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
        }

        /* Selisih Result Card */
        .selisih-result-card {
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid transparent;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .selisih-label {
          font-size: 11px;
          text-transform: uppercase;
          font-weight: bold;
          letter-spacing: 0.05em;
        }
        .selisih-status-text {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-extrabold);
        }
        .selisih--neutral {
          background: #f1f5f9;
          color: #475569;
          border-color: #cbd5e1;
        }
        .selisih--pas {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }
        .selisih--lebih {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }
        .selisih--kurang {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        /* Riwayat Section */
        .riwayat-tutup-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .section-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }
        .section-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .table-card { padding: 0; overflow: hidden; }
        .table-responsive { overflow-x: auto; }
        .tutup-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--font-size-sm);
        }
        .tutup-table th {
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
        .tutup-table td {
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
        }
        .tutup-table tr:last-child td { border-bottom: none; }
        .tutup-table tr:hover td { background: var(--color-surface-hover); }

        .font-mono { font-family: monospace; }
        .font-bold { font-weight: bold; }
        .text-primary { color: var(--color-primary); }
        .kasir-tag { font-size: var(--font-size-xs); color: var(--color-text-muted); }

        @media (max-width: 820px) {
          .tutup-kas-header { flex-direction: column; align-items: stretch; }
          .tutup-kas-header-actions { width: 100%; }
          .tutup-kas-header-actions button { flex: 1; }
          .closing-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
