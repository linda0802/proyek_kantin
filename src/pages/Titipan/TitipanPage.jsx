import { useState, useMemo, useRef } from 'react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatRupiah } from '../../utils/currency'
import { formatTanggalPendek, formatTanggalWaktu } from '../../utils/date'
import { useToast } from '../../context/ToastContext'
import { useTitipan } from '../../context/TitipanContext'

export default function TitipanPage() {
  const { addToast } = useToast()
  const {
    titipanList,
    tambahTitipan,
    updateRekap,
    toggleStatusBayar,
    hapusTitipan,
    metrics,
  } = useTitipan()

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatusBayar, setFilterStatusBayar] = useState('all') // 'all' | 'belum' | 'lunas'

  // Modal Tambah
  const [isTambahOpen, setIsTambahOpen] = useState(false)
  const [formTambah, setFormTambah] = useState({
    namaProduk: '',
    penitip: '',
    kontak: '',
    hargaJual: '',
    hargaSetor: '',
    jumlahTitip: '',
  })
  const [errorsTambah, setErrorsTambah] = useState({})
  const [savingTambah, setSavingTambah] = useState(false)

  // Modal Rekap & Retur
  const [selectedRekap, setSelectedRekap] = useState(null)
  const [returInput, setReturInput] = useState('')

  // Print ref
  const printSlipRef = useRef(null)
  const [itemToPrint, setItemToPrint] = useState(null)

  // Filtered List
  const filteredList = useMemo(() => {
    return titipanList.filter(item => {
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        item.namaProduk.toLowerCase().includes(q) ||
        item.penitip.toLowerCase().includes(q)

      const matchStatus =
        filterStatusBayar === 'all' || item.statusBayar === filterStatusBayar

      return matchSearch && matchStatus
    })
  }, [titipanList, search, filterStatusBayar])

  // Handle Simpan Tambah Titipan
  const handleSimpanTambah = async () => {
    const errs = {}
    if (!formTambah.namaProduk.trim()) errs.namaProduk = 'Nama makanan titipan wajib diisi'
    if (!formTambah.penitip.trim()) errs.penitip = 'Nama penitip / vendor wajib diisi'

    const hargaJual = parseInt(formTambah.hargaJual, 10) || 0
    const hargaSetor = parseInt(formTambah.hargaSetor, 10) || 0
    const jumlahTitip = parseInt(formTambah.jumlahTitip, 10) || 0

    if (hargaJual <= 0) errs.hargaJual = 'Harga jual harus lebih dari 0'
    if (hargaSetor <= 0) errs.hargaSetor = 'Harga setor harus lebih dari 0'
    if (hargaSetor >= hargaJual) errs.hargaSetor = 'Harga setor harus lebih kecil dari harga jual'
    if (jumlahTitip <= 0) errs.jumlahTitip = 'Jumlah titip minimal 1 unit'

    if (Object.keys(errs).length > 0) {
      setErrorsTambah(errs)
      return
    }

    setSavingTambah(true)
    try {
      await new Promise(r => setTimeout(r, 300))
      const newItem = tambahTitipan(formTambah)
      setIsTambahOpen(false)
      addToast({
        type: 'success',
        title: 'Barang Titipan Ditambahkan',
        message: `${newItem.namaProduk} dari ${newItem.penitip} berhasil dicatat.`,
      })
    } finally {
      setSavingTambah(false)
    }
  }

  // Handle Simpan Rekap Retur
  const handleSimpanRekap = () => {
    if (!selectedRekap) return
    const returNum = Math.max(0, parseInt(returInput, 10) || 0)
    updateRekap(selectedRekap.id, returNum)
    addToast({
      type: 'info',
      title: 'Rekap Diperbarui',
      message: `${selectedRekap.namaProduk}: sisa retur ${returNum} unit.`,
    })
    setSelectedRekap(null)
  }

  // Toggle Status Bayar
  const handleToggleBayar = (id) => {
    toggleStatusBayar(id)
    addToast({ type: 'success', title: 'Status Setoran Diubah' })
  }

  // Hapus Titipan
  const handleHapusTitipan = (id) => {
    hapusTitipan(id)
    addToast({ type: 'info', title: 'Barang titipan dihapus' })
  }

  // Print Slip Setoran
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
          <title>Bukti Setoran — ${item.penitip}</title>
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
    if (titipanList.length === 0) return
    const headers = ['Produk', 'Penitip', 'Kontak', 'Harga Jual', 'Harga Setor', 'Titip Awal', 'Terjual', 'Retur Sisa', 'Total Setoran', 'Status Bayar']
    const rows = titipanList.map(t => {
      const totalSetor = t.terjual * t.hargaSetor
      return [
        `"${t.namaProduk}"`,
        `"${t.penitip}"`,
        `"${t.kontak || ''}"`,
        t.hargaJual,
        t.hargaSetor,
        t.jumlahTitip,
        t.terjual,
        t.retur,
        totalSetor,
        t.statusBayar,
      ].join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encoded = encodeURI(csvContent)
    const link = document.createElement('a')
    link.href = encoded
    link.download = `rekap_titipan_kantinku_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast({ type: 'success', title: 'Ekspor Berhasil', message: 'Data titipan berhasil diunduh.' })
  }

  return (
    <div className="titipan-page" id="titipan-page">
      {/* ── Page Header ── */}
      <div className="titipan-header">
        <div>
          <div className="titipan-header-title-row">
            <h1 className="page-title">Barang Titipan (Konsinyasi)</h1>
            <Badge variant="primary" dot>Fitur Opsional Aktif</Badge>
          </div>
          <p className="page-subtitle">
            Pencatatan makanan/minuman titipan mitra kantin. Produk otomatis tampil di Kasir jika fitur Titipan aktif.
          </p>
        </div>

        <div className="titipan-header-actions">
          <Button variant="secondary" onClick={handleExportCSV} id="btn-export-titipan">
            <span aria-hidden="true">📥</span> Ekspor CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setFormTambah({
                namaProduk: '',
                penitip: '',
                kontak: '',
                hargaJual: '',
                hargaSetor: '',
                jumlahTitip: '',
              })
              setErrorsTambah({})
              setIsTambahOpen(true)
            }}
            id="btn-tambah-titipan"
          >
            <span aria-hidden="true">➕</span> Titip Makanan Baru
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="titipan-stats-grid">
        <div className="titipan-stat-card">
          <div className="titipan-stat-icon stat-icon--primary" aria-hidden="true">🤝</div>
          <div className="titipan-stat-content">
            <div className="titipan-stat-label">Total Macam Titipan</div>
            <div className="titipan-stat-value">{metrics.totalMacam} Produk</div>
            <div className="titipan-stat-sub">Dari berbagai mitra vendor</div>
          </div>
        </div>

        <div className="titipan-stat-card">
          <div className="titipan-stat-icon stat-icon--info" aria-hidden="true">📦</div>
          <div className="titipan-stat-content">
            <div className="titipan-stat-label">Unit Terjual / Masuk</div>
            <div className="titipan-stat-value">
              {metrics.totalUnitTerjual} <small style={{ fontSize: '13px', color: '#64748b' }}>/ {metrics.totalUnitTitip} unit</small>
            </div>
            <div className="titipan-stat-sub">Persentase terjual: {metrics.totalUnitTitip > 0 ? Math.round((metrics.totalUnitTerjual / metrics.totalUnitTitip) * 100) : 0}%</div>
          </div>
        </div>

        <div className="titipan-stat-card">
          <div className="titipan-stat-icon stat-icon--warning" aria-hidden="true">💸</div>
          <div className="titipan-stat-content">
            <div className="titipan-stat-label">Uang Setoran ke Penitip</div>
            <div className="titipan-stat-value" style={{ color: '#d97706' }}>
              {formatRupiah(metrics.totalUangSetoran)}
            </div>
            <div className="titipan-stat-sub">Hak uang milik vendor/penitip</div>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card table-card" id="titipan-table-card">
        {/* Table Top Controls */}
        <div className="table-top-bar">
          <div style={{ flex: 1, maxWidth: '320px' }}>
            <Input
              placeholder="Cari makanan / nama penitip..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="search-titipan"
            />
          </div>

          <div className="status-tabs-row">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'belum', label: 'Belum Disetor' },
              { id: 'lunas', label: 'Sudah Lunas' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-btn-mini ${filterStatusBayar === tab.id ? 'active' : ''}`}
                onClick={() => setFilterStatusBayar(tab.id)}
                id={`filter-bayar-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredList.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="Tidak ada barang titipan"
            description="Belum ada data barang titipan yang cocok dengan filter saat ini."
          />
        ) : (
          <div className="table-responsive">
            <table className="titipan-table" id="table-titipan">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Produk Makanan Titipan</th>
                  <th>Penitip / Mitra</th>
                  <th style={{ textAlign: 'right' }}>Harga Jual</th>
                  <th style={{ textAlign: 'right' }}>Harga Setor</th>
                  <th style={{ textAlign: 'center' }}>Titip Awal</th>
                  <th style={{ textAlign: 'center' }}>Terjual</th>
                  <th style={{ textAlign: 'center' }}>Sisa Stok</th>
                  <th style={{ textAlign: 'center' }}>Retur</th>
                  <th style={{ textAlign: 'right' }}>Total Setoran</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: '160px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, idx) => {
                  const sisaStok = Math.max(0, item.jumlahTitip - item.terjual - item.retur)
                  const totalSetoran = item.terjual * item.hargaSetor
                  const isLunas = item.statusBayar === 'lunas'

                  return (
                    <tr key={item.id}>
                      <td className="col-muted">{idx + 1}</td>
                      <td>
                        <div className="product-title-row">
                          <span className="food-icon">🍱</span>
                          <div>
                            <strong>{item.namaProduk}</strong>
                            <div className="item-date-sub">{formatTanggalPendek(item.tanggal)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="penitip-cell">
                          <span className="penitip-name">👤 {item.penitip}</span>
                          {item.kontak && <span className="penitip-kontak">📞 {item.kontak}</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(item.hargaJual)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{formatRupiah(item.hargaSetor)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.jumlahTitip}</td>
                      <td style={{ textAlign: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}>{item.terjual}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: sisaStok === 0 ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                        {sisaStok}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {item.retur > 0 ? (
                          <Badge variant="warning">{item.retur}</Badge>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>0</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'extrabold', color: '#b45309' }}>
                        {formatRupiah(totalSetoran)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className={`bayar-pill ${isLunas ? 'bayar-lunas' : 'bayar-belum'}`}
                          onClick={() => handleToggleBayar(item.id)}
                          title="Klik untuk ubah status setoran"
                          id={`toggle-bayar-${item.id}`}
                        >
                          <span className="dot"></span>
                          {isLunas ? 'Lunas' : 'Belum Setor'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="table-action-btns">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedRekap(item)
                              setReturInput(String(item.retur))
                            }}
                            title="Update Sisa Retur"
                            id={`btn-retur-${item.id}`}
                          >
                            🔄 Retur
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon
                            onClick={() => handlePrintSlip(item)}
                            title="Cetak Bukti Setoran"
                            id={`btn-print-slip-${item.id}`}
                          >
                            🖨️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon
                            className="btn-danger-ghost"
                            onClick={() => handleHapusTitipan(item.id)}
                            title="Hapus"
                            id={`btn-hapus-${item.id}`}
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
        )}
      </div>

      {/* ── Modal Tambah Titipan ── */}
      <Modal
        isOpen={isTambahOpen}
        onClose={() => setIsTambahOpen(false)}
        title="➕ Tambah Makanan Titipan (Konsinyasi)"
        size="md"
        id="modal-tambah-titipan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsTambahOpen(false)} disabled={savingTambah}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSimpanTambah} loading={savingTambah} id="btn-submit-tambah-titipan">
              Simpan Barang Titipan
            </Button>
          </>
        }
      >
        <div className="titipan-modal-form">
          <div className="form-group">
            <Input
              label="Nama Makanan / Minuman Titipan"
              placeholder="Contoh: Risoles Mayo Spesial / Lemper Bakar"
              value={formTambah.namaProduk}
              onChange={e => setFormTambah(prev => ({ ...prev, namaProduk: e.target.value }))}
              error={errorsTambah.namaProduk}
              required
              id="input-titipan-nama"
            />
          </div>

          <div className="form-row-2">
            <Input
              label="Nama Penitip / Vendor"
              placeholder="Contoh: Bu Sri / Dapur Berkah"
              value={formTambah.penitip}
              onChange={e => setFormTambah(prev => ({ ...prev, penitip: e.target.value }))}
              error={errorsTambah.penitip}
              required
              id="input-titipan-penitip"
            />
            <Input
              label="No. HP / WA Penitip"
              placeholder="Contoh: 0812-xxxx-xxxx"
              value={formTambah.kontak}
              onChange={e => setFormTambah(prev => ({ ...prev, kontak: e.target.value }))}
              id="input-titipan-kontak"
            />
          </div>

          <div className="form-row-3">
            <Input
              label="Jumlah Titip (Unit)"
              type="number"
              min="1"
              placeholder="0"
              value={formTambah.jumlahTitip}
              onChange={e => setFormTambah(prev => ({ ...prev, jumlahTitip: e.target.value }))}
              error={errorsTambah.jumlahTitip}
              required
              id="input-titipan-qty"
            />
            <Input
              label="Harga Jual Siswa (Rp)"
              type="number"
              min="0"
              placeholder="0"
              value={formTambah.hargaJual}
              onChange={e => setFormTambah(prev => ({ ...prev, hargaJual: e.target.value }))}
              error={errorsTambah.hargaJual}
              required
              id="input-titipan-jual"
            />
            <Input
              label="Harga Setor Vendor (Rp)"
              type="number"
              min="0"
              placeholder="0"
              value={formTambah.hargaSetor}
              onChange={e => setFormTambah(prev => ({ ...prev, hargaSetor: e.target.value }))}
              error={errorsTambah.hargaSetor}
              required
              id="input-titipan-setor"
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal Rekap & Retur ── */}
      {selectedRekap && (
        <Modal
          isOpen={!!selectedRekap}
          onClose={() => setSelectedRekap(null)}
          title={`🔄 Rekap Penjualan & Retur: ${selectedRekap.namaProduk}`}
          size="md"
          id="modal-rekap-retur"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedRekap(null)}>Batal</Button>
              <Button variant="primary" onClick={handleSimpanRekap} id="btn-save-rekap-retur">
                Simpan Rekap Penjualan
              </Button>
            </>
          }
        >
          <div className="rekap-modal-body">
            <div className="rekap-info-box">
              <p><strong>Penitip:</strong> {selectedRekap.penitip}</p>
              <p><strong>Jumlah Titip Awal:</strong> {selectedRekap.jumlahTitip} unit</p>
              <p><strong>Harga Setor Vendor:</strong> {formatRupiah(selectedRekap.hargaSetor)} / unit</p>
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <Input
                label="Jumlah Sisa / Retur (Barang yang Tidak Laku)"
                type="number"
                min="0"
                max={selectedRekap.jumlahTitip}
                value={returInput}
                onChange={e => setReturInput(e.target.value)}
                hint={`Maksimal retur: ${selectedRekap.jumlahTitip} unit`}
                id="input-rekap-retur"
                required
              />
            </div>

            {/* Live Calculation */}
            <div className="rekap-calculation-box">
              <div className="calc-row">
                <span>Unit Laku Terjual:</span>
                <strong>{Math.max(0, selectedRekap.jumlahTitip - (parseInt(returInput, 10) || 0))} unit</strong>
              </div>
              <div className="calc-row">
                <span>Total Setoran ke {selectedRekap.penitip}:</span>
                <strong style={{ color: '#b45309', fontSize: 'var(--font-size-base)' }}>
                  {formatRupiah(Math.max(0, selectedRekap.jumlahTitip - (parseInt(returInput, 10) || 0)) * selectedRekap.hargaSetor)}
                </strong>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Hidden Printable Slip Setoran ── */}
      <div style={{ display: 'none' }}>
        <div ref={printSlipRef}>
          {itemToPrint && (
            <div>
              <div className="slip-center">
                <div className="slip-brand">KANTINKU</div>
                <div>Bukti Setoran Barang Titipan</div>
                <div>Tanggal: {formatTanggalWaktu(new Date())}</div>
              </div>
              <div className="slip-divider"></div>
              <div className="slip-row">
                <span>Penitip:</span>
                <span><strong>{itemToPrint.penitip}</strong></span>
              </div>
              <div className="slip-row">
                <span>Makanan:</span>
                <span>{itemToPrint.namaProduk}</span>
              </div>
              <div className="slip-divider"></div>
              <div className="slip-row">
                <span>Titip Awal:</span>
                <span>{itemToPrint.jumlahTitip} unit</span>
              </div>
              <div className="slip-row">
                <span>Retur (Sisa):</span>
                <span>{itemToPrint.retur} unit</span>
              </div>
              <div className="slip-row">
                <span>Laku Terjual:</span>
                <span><strong>{itemToPrint.terjual} unit</strong></span>
              </div>
              <div className="slip-row">
                <span>Harga Setor:</span>
                <span>Rp {itemToPrint.hargaSetor?.toLocaleString('id-ID')}</span>
              </div>
              <div className="slip-divider"></div>
              <div className="slip-row slip-total">
                <span>TOTAL SETORAN:</span>
                <span>Rp {(itemToPrint.terjual * itemToPrint.hargaSetor).toLocaleString('id-ID')}</span>
              </div>
              <div className="slip-divider"></div>
              <div className="slip-center" style={{ marginTop: '16px' }}>
                <p>Tanda Terima Penitip</p>
                <div style={{ height: '36px' }}></div>
                <p>( {itemToPrint.penitip} )</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .titipan-page { display: flex; flex-direction: column; gap: var(--space-6); }
        .titipan-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
        .titipan-header-title-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-1); }
        .titipan-header-actions { display: flex; align-items: center; gap: var(--space-3); }

        .titipan-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); }
        .titipan-stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          display: flex; align-items: center; gap: var(--space-4);
          box-shadow: var(--shadow-sm);
        }
        .titipan-stat-icon {
          width: 48px; height: 48px; border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; flex-shrink: 0;
        }
        .stat-icon--primary { background: var(--color-primary-subtle); color: var(--color-primary); }
        .stat-icon--info { background: #eff6ff; color: #2563eb; }
        .stat-icon--warning { background: #fef3c7; color: #d97706; }
        .titipan-stat-content { flex: 1; min-width: 0; }
        .titipan-stat-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: var(--font-weight-medium); }
        .titipan-stat-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-text-primary); }
        .titipan-stat-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }

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

        .titipan-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
        .titipan-table th {
          background: var(--color-surface-sunken); color: var(--color-text-muted);
          font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
          text-transform: uppercase; letter-spacing: 0.05em;
          padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border);
          text-align: left;
        }
        .titipan-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
        .titipan-table tr:hover td { background: var(--color-surface-hover); }

        .col-muted { color: var(--color-text-muted); font-size: var(--font-size-xs); }
        .product-title-row { display: flex; align-items: center; gap: var(--space-2); }
        .food-icon { font-size: 1.3rem; }
        .item-date-sub { font-size: 10px; color: var(--color-text-muted); }
        .penitip-cell { display: flex; flex-direction: column; }
        .penitip-name { font-weight: var(--font-weight-medium); }
        .penitip-kontak { font-size: 10px; color: var(--color-text-muted); }

        .bayar-pill {
          display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px;
          border-radius: var(--radius-full); font-size: 11px; font-weight: bold;
          border: 1px solid transparent; cursor: pointer;
        }
        .bayar-pill .dot { width: 6px; height: 6px; border-radius: 50%; }
        .bayar-lunas { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
        .bayar-lunas .dot { background: #10b981; }
        .bayar-belum { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
        .bayar-belum .dot { background: #ef4444; }

        .table-action-btns { display: flex; align-items: center; justify-content: center; gap: 4px; }
        .btn-danger-ghost:hover { color: var(--color-danger) !important; background: #fef2f2 !important; }

        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-3); }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-3); margin-top: var(--space-3); }

        .rekap-info-box { background: var(--color-surface-sunken); padding: var(--space-3); border-radius: var(--radius-md); font-size: var(--font-size-sm); }
        .rekap-calculation-box {
          margin-top: var(--space-4); padding: var(--space-3); border: 1px dashed var(--color-border);
          border-radius: var(--radius-md); display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--font-size-sm);
        }
        .calc-row { display: flex; justify-content: space-between; }
      `}</style>
    </div>
  )
}
