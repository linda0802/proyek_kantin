import { useState, useMemo, useRef } from 'react'
import { useHutang } from '../../context/HutangContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import { Input, Textarea } from '../../components/ui/Input'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatRupiah } from '../../utils/currency'
import { formatTanggalPendek, formatTanggalWaktu, formatWaktu } from '../../utils/date'

export default function HutangPage() {
  const { hutangList, lunasiHutang, hapusHutang, metrics } = useHutang()
  const { isAdmin } = useAuth()
  const { addToast } = useToast()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'belum_lunas' | 'lunas'

  // Modal Detail
  const [selectedHutang, setSelectedHutang] = useState(null)

  // Modal Pelunasan
  const [lunasiTarget, setLunasiTarget] = useState(null)
  const [catatanPelunasan, setCatatanPelunasan] = useState('')

  // Confirm Hapus
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Print Ref
  const printSlipRef = useRef(null)
  const [itemToPrint, setItemToPrint] = useState(null)

  // Filter list
  const filteredList = useMemo(() => {
    return hutangList.filter(h => {
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        h.pelanggan.toLowerCase().includes(q) ||
        h.nomorHutang?.toLowerCase().includes(q) ||
        h.nomorTransaksi?.toLowerCase().includes(q)

      const matchStatus = filterStatus === 'all' || h.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [hutangList, search, filterStatus])

  // Handle Lunasi
  const handleConfirmLunasi = () => {
    if (!lunasiTarget) return
    lunasiHutang(lunasiTarget.id, catatanPelunasan)
    addToast({
      type: 'success',
      title: 'Hutang Dilunasi',
      message: `Hutang an. ${lunasiTarget.pelanggan} sebesar ${formatRupiah(lunasiTarget.nominal)} telah ditandai lunas.`,
    })
    setLunasiTarget(null)
    setCatatanPelunasan('')
  }

  // Handle Hapus
  const handleConfirmHapus = () => {
    if (!deleteTarget) return
    hapusHutang(deleteTarget.id)
    addToast({
      type: 'info',
      title: 'Catatan Hutang Dihapus',
      message: `Data hutang ${deleteTarget.nomorHutang} telah dihapus.`,
    })
    setDeleteTarget(null)
  }

  // Handle Cetak Bukti
  const handlePrintSlip = (item) => {
    setItemToPrint(item)
    setTimeout(() => {
      const content = printSlipRef.current?.innerHTML
      if (!content) return

      const win = window.open('', '_blank', 'width=360,height=600')
      win.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Bukti Kasbon — ${item.pelanggan}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 14px; color: #111; line-height: 1.5; }
            .slip-divider { border-top: 1px dashed #666; margin: 8px 0; }
            .slip-center { text-align: center; }
            .slip-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .slip-brand { font-size: 16px; font-weight: bold; }
            .slip-total { font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>${content}</body>
        </html>
      `)
      win.document.close()
      win.print()
      win.close()
    }, 150)
  }

  // Ekspor CSV
  const handleExportCSV = () => {
    if (hutangList.length === 0) return
    const headers = ['No Hutang', 'No Transaksi', 'Tanggal', 'Pelanggan', 'Kasir', 'Nominal', 'Status', 'Tanggal Lunas', 'Catatan']
    const rows = hutangList.map(h => [
      `"${h.nomorHutang}"`,
      `"${h.nomorTransaksi}"`,
      `"${formatTanggalPendek(h.tanggal)}"`,
      `"${h.pelanggan}"`,
      `"${h.kasir}"`,
      h.nominal,
      h.status === 'lunas' ? 'Lunas' : 'Belum Lunas',
      h.tanggalLunas ? `"${formatTanggalPendek(h.tanggalLunas)}"` : '""',
      `"${h.catatan || ''}"`,
    ].join(','))

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encoded = encodeURI(csvContent)
    const link = document.createElement('a')
    link.href = encoded
    link.download = `catatan_hutang_kantinku_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast({ type: 'success', title: 'Ekspor Berhasil', message: 'Data hutang berhasil diunduh.' })
  }

  return (
    <div className="hutang-page" id="hutang-page">
      {/* ── Page Header ── */}
      <div className="hutang-header">
        <div>
          <div className="hutang-header-title-row">
            <h1 className="page-title">Catatan Hutang / Kasbon</h1>
            <Badge variant="warning" dot>Fitur Opsional Aktif</Badge>
          </div>
          <p className="page-subtitle">
            Pencatatan kasbon pelanggan, guru, siswa, atau staf kantin sekolah yang belum lunas.
          </p>
        </div>

        <div className="hutang-header-actions">
          <Button variant="secondary" onClick={handleExportCSV} id="btn-export-hutang">
            <span aria-hidden="true">📥</span> Ekspor CSV
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="hutang-stats-grid">
        <div className="hutang-stat-card">
          <div className="hutang-stat-icon stat-icon--danger" aria-hidden="true">⏳</div>
          <div className="hutang-stat-content">
            <div className="hutang-stat-label">Hutang Belum Lunas</div>
            <div className="hutang-stat-value" style={{ color: 'var(--color-danger)' }}>
              {formatRupiah(metrics.totalHutangBelumLunas)}
            </div>
            <div className="hutang-stat-sub">{metrics.jumlahBelumLunas} orang / transaksi</div>
          </div>
        </div>

        <div className="hutang-stat-card">
          <div className="hutang-stat-icon stat-icon--success" aria-hidden="true">✅</div>
          <div className="hutang-stat-content">
            <div className="hutang-stat-label">Hutang Sudah Lunas</div>
            <div className="hutang-stat-value" style={{ color: 'var(--color-success)' }}>
              {formatRupiah(metrics.totalSudahLunas)}
            </div>
            <div className="hutang-stat-sub">{metrics.jumlahLunas} transaksi terlunasi</div>
          </div>
        </div>

        <div className="hutang-stat-card">
          <div className="hutang-stat-icon stat-icon--info" aria-hidden="true">📋</div>
          <div className="hutang-stat-content">
            <div className="hutang-stat-label">Total Catatan Kasbon</div>
            <div className="hutang-stat-value">{metrics.totalCatatan}</div>
            <div className="hutang-stat-sub">Semua riwayat kasbon</div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card table-card" id="hutang-table-card">
        {/* Table Top Controls */}
        <div className="table-top-bar">
          <div style={{ flex: 1, maxWidth: '320px' }}>
            <Input
              placeholder="Cari pelanggan / nomor hutang..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="search-hutang"
            />
          </div>

          <div className="status-tabs-row">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'belum_lunas', label: 'Belum Lunas' },
              { id: 'lunas', label: 'Sudah Lunas' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-btn-mini ${filterStatus === tab.id ? 'active' : ''}`}
                onClick={() => setFilterStatus(tab.id)}
                id={`filter-status-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredList.length === 0 ? (
          <EmptyState
            icon="📝"
            title="Tidak ada catatan kasbon"
            description="Belum ada transaksi kasbon yang tercatat sesuai filter saat ini."
          />
        ) : (
          <div className="table-responsive">
            <table className="hutang-table" id="table-hutang">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>ID Kasbon</th>
                  <th>Nama Pelanggan</th>
                  <th>Tanggal</th>
                  <th>Petugas Kasir</th>
                  <th style={{ textAlign: 'right' }}>Nominal Kasbon</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: '180px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, idx) => {
                  const isLunas = item.status === 'lunas'

                  return (
                    <tr key={item.id}>
                      <td className="col-muted">{idx + 1}</td>
                      <td>
                        <span className="font-mono font-bold text-primary">{item.nomorHutang}</span>
                        <div className="sub-trx-id">Ref: {item.nomorTransaksi}</div>
                      </td>
                      <td>
                        <strong style={{ fontSize: 'var(--font-size-sm)' }}>👤 {item.pelanggan}</strong>
                      </td>
                      <td>
                        <div className="time-primary">{formatTanggalPendek(item.tanggal)}</div>
                        <div className="time-secondary">{formatWaktu(item.tanggal)} WIB</div>
                      </td>
                      <td>
                        <span className="kasir-tag">{item.kasir}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 'var(--font-size-base)', color: isLunas ? 'var(--color-text-muted)' : 'var(--color-danger)' }}>
                        {formatRupiah(item.nominal)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isLunas ? (
                          <Badge variant="success" dot>Lunas</Badge>
                        ) : (
                          <Badge variant="danger" dot>Belum Lunas</Badge>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="table-action-btns">
                          {!isLunas && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setLunasiTarget(item)
                                setCatatanPelunasan('')
                              }}
                              title="Tandai Sudah Lunas"
                              id={`btn-lunasi-${item.id}`}
                            >
                              ✓ Lunasi
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedHutang(item)}
                            title="Lihat Detail Item"
                            id={`btn-detail-${item.id}`}
                          >
                            Detail
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon
                            onClick={() => handlePrintSlip(item)}
                            title="Cetak Bukti Kasbon"
                            id={`btn-print-${item.id}`}
                          >
                            🖨️
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon
                              className="btn-danger-ghost"
                              onClick={() => setDeleteTarget(item)}
                              title="Hapus Catatan"
                              id={`btn-hapus-hutang-${item.id}`}
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
        )}
      </div>

      {/* ── Modal Detail Kasbon ── */}
      {selectedHutang && (
        <Modal
          isOpen={!!selectedHutang}
          onClose={() => setSelectedHutang(null)}
          title={`Detail Kasbon: ${selectedHutang.nomorHutang}`}
          size="md"
          id="modal-detail-hutang"
          footer={
            <Button variant="secondary" onClick={() => setSelectedHutang(null)}>
              Tutup
            </Button>
          }
        >
          <div className="detail-modal-body">
            <div className="detail-info-grid">
              <div><strong>Pelanggan:</strong> {selectedHutang.pelanggan}</div>
              <div><strong>Kasir:</strong> {selectedHutang.kasir}</div>
              <div><strong>Waktu:</strong> {formatTanggalWaktu(selectedHutang.tanggal)}</div>
              <div>
                <strong>Status:</strong>{' '}
                {selectedHutang.status === 'lunas' ? (
                  <Badge variant="success">Lunas pada {formatTanggalWaktu(selectedHutang.tanggalLunas)}</Badge>
                ) : (
                  <Badge variant="danger">Belum Lunas</Badge>
                )}
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)' }}>
              <strong>Item Transaksi:</strong>
              <div className="detail-items-list" style={{ marginTop: 'var(--space-2)' }}>
                {selectedHutang.items?.map((item, idx) => (
                  <div key={idx} className="detail-item-row">
                    <span>{item.nama} × {item.jumlah}</span>
                    <span>{formatRupiah((item.hargaJual || 0) * item.jumlah)}</span>
                  </div>
                ))}
              </div>
              <div className="detail-total-row">
                <span>Total Nominal Kasbon:</span>
                <strong>{formatRupiah(selectedHutang.nominal)}</strong>
              </div>
            </div>

            {selectedHutang.catatan && (
              <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                <strong>Catatan:</strong> {selectedHutang.catatan}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Modal Pelunasan ── */}
      {lunasiTarget && (
        <Modal
          isOpen={!!lunasiTarget}
          onClose={() => setLunasiTarget(null)}
          title={`Konfirmasi Pelunasan Kasbon`}
          size="sm"
          id="modal-lunasi-hutang"
          footer={
            <>
              <Button variant="secondary" onClick={() => setLunasiTarget(null)}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleConfirmLunasi} id="btn-confirm-lunasi">
                Tandai Lunas
              </Button>
            </>
          }
        >
          <div>
            <p>
              Tandai kasbon atas nama <strong>{lunasiTarget.pelanggan}</strong> sebesar{' '}
              <strong style={{ color: 'var(--color-success)' }}>{formatRupiah(lunasiTarget.nominal)}</strong> sebagai telah lunas?
            </p>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Textarea
                label="Catatan Pelunasan (Opsional)"
                placeholder="Contoh: Dibayar tunai oleh siswa saat jam istirahat..."
                value={catatanPelunasan}
                onChange={e => setCatatanPelunasan(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmHapus}
        title="Hapus Catatan Kasbon"
        message={`Apakah Anda yakin ingin menghapus catatan kasbon ${deleteTarget?.nomorHutang} an. ${deleteTarget?.pelanggan}?`}
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
      />

      {/* ── Hidden Printable Slip Kasbon ── */}
      <div style={{ display: 'none' }}>
        <div ref={printSlipRef}>
          {itemToPrint && (
            <div>
              <div className="slip-center">
                <div className="slip-brand">KANTINKU</div>
                <div>BUKTI KASBON / HUTANG</div>
                <div>No: {itemToPrint.nomorHutang}</div>
                <div>Tanggal: {formatTanggalWaktu(itemToPrint.tanggal)}</div>
              </div>
              <div className="slip-divider"></div>
              <div className="slip-row">
                <span>Pelanggan:</span>
                <span><strong>{itemToPrint.pelanggan}</strong></span>
              </div>
              <div className="slip-row">
                <span>Kasir:</span>
                <span>{itemToPrint.kasir}</span>
              </div>
              <div className="slip-divider"></div>
              {itemToPrint.items?.map((it, idx) => (
                <div key={idx} className="slip-row">
                  <span>{it.nama} x{it.jumlah}</span>
                  <span>Rp {((it.hargaJual || 0) * it.jumlah).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className="slip-divider"></div>
              <div className="slip-row slip-total">
                <span>TOTAL KASBON:</span>
                <span>Rp {itemToPrint.nominal?.toLocaleString('id-ID')}</span>
              </div>
              <div className="slip-row">
                <span>Status:</span>
                <span>{itemToPrint.status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}</span>
              </div>
              <div className="slip-divider"></div>
              <div className="slip-center" style={{ marginTop: '16px' }}>
                <p>Tanda Tangan Pelanggan</p>
                <div style={{ height: '36px' }}></div>
                <p>( {itemToPrint.pelanggan} )</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .hutang-page { display: flex; flex-direction: column; gap: var(--space-6); }
        .hutang-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
        .hutang-header-title-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-1); }
        .hutang-header-actions { display: flex; align-items: center; gap: var(--space-3); }

        .hutang-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); }
        .hutang-stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          box-shadow: var(--shadow-sm);
        }
        .hutang-stat-icon {
          width: 48px; height: 48px;
          border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; flex-shrink: 0;
        }
        .stat-icon--danger { background: #fef2f2; color: #dc2626; }
        .stat-icon--success { background: var(--color-success-bg); color: var(--color-success); }
        .stat-icon--info { background: #eff6ff; color: #2563eb; }
        .hutang-stat-content { flex: 1; min-width: 0; }
        .hutang-stat-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: var(--font-weight-medium); }
        .hutang-stat-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-text-primary); }
        .hutang-stat-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }

        .table-top-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: var(--space-4); border-bottom: 1px solid var(--color-border);
          flex-wrap: wrap; gap: var(--space-3);
        }
        .status-tabs-row { display: flex; gap: 4px; background: var(--color-surface-sunken); padding: 3px; border-radius: var(--radius-md); }
        .tab-btn-mini {
          border: none; background: transparent; padding: var(--space-1) var(--space-3);
          font-size: var(--font-size-xs); font-weight: var(--font-weight-medium);
          color: var(--color-text-muted); border-radius: var(--radius-sm); cursor: pointer;
        }
        .tab-btn-mini.active { background: var(--color-surface); color: var(--color-primary); font-weight: bold; box-shadow: var(--shadow-sm); }

        .hutang-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
        .hutang-table th {
          background: var(--color-surface-sunken); color: var(--color-text-muted);
          font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
          text-transform: uppercase; letter-spacing: 0.05em;
          padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border);
          text-align: left;
        }
        .hutang-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
        .hutang-table tr:hover td { background: var(--color-surface-hover); }

        .col-muted { color: var(--color-text-muted); font-size: var(--font-size-xs); }
        .sub-trx-id { font-size: 10px; color: var(--color-text-muted); }
        .time-primary { font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); }
        .time-secondary { font-size: 10px; color: var(--color-text-muted); }
        .kasir-tag { font-size: var(--font-size-xs); color: var(--color-text-secondary); }

        .table-action-btns { display: flex; align-items: center; justify-content: center; gap: 4px; }
        .btn-danger-ghost:hover { color: var(--color-danger) !important; background: #fef2f2 !important; }

        .detail-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); font-size: var(--font-size-sm); }
        .detail-items-list { display: flex; flex-direction: column; gap: var(--space-1); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-2); }
        .detail-item-row { display: flex; justify-content: space-between; font-size: var(--font-size-xs); }
        .detail-total-row { display: flex; justify-content: space-between; padding-top: var(--space-2); font-size: var(--font-size-sm); margin-top: var(--space-2); border-top: 1px dashed var(--color-border); }
      `}</style>
    </div>
  )
}
