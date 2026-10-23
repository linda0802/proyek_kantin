import { useState, useMemo, useRef, useEffect } from 'react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatRupiah, formatNumber } from '../../utils/currency'
import { formatTanggalPanjang, formatTanggalPendek, formatTanggalWaktu, formatWaktu } from '../../utils/date'
import { useToast } from '../../context/ToastContext'

const TITIPAN_STORAGE_KEY = 'kantinku_titipan'

const INITIAL_TITIPAN = [
  {
    id: 1,
    namaProduk: 'Risoles Mayo Daging',
    penitip: 'Bu Sri Rahayu',
    kontak: '0813-8899-7711',
    hargaJual: 4000,
    hargaSetor: 3000,
    jumlahTitip: 30,
    terjual: 26,
    retur: 4,
    statusBayar: 'belum', // 'belum' | 'lunas'
    tanggal: new Date().toISOString(),
  },
  {
    id: 2,
    namaProduk: 'Pastel Ayam Telur',
    penitip: 'Dapur Bu Dewi',
    kontak: '0812-7766-5544',
    hargaJual: 3500,
    hargaSetor: 2700,
    jumlahTitip: 25,
    terjual: 25,
    retur: 0,
    statusBayar: 'lunas',
    tanggal: new Date().toISOString(),
  },
  {
    id: 3,
    namaProduk: 'Lemper Ayam Bakar',
    penitip: 'Bu Sri Rahayu',
    kontak: '0813-8899-7711',
    hargaJual: 3500,
    hargaSetor: 2800,
    jumlahTitip: 20,
    terjual: 18,
    retur: 2,
    statusBayar: 'belum',
    tanggal: new Date().toISOString(),
  },
  {
    id: 4,
    namaProduk: 'Puding Coklat Vla',
    penitip: 'Mama Kiki (UMKM)',
    kontak: '0857-1122-3344',
    hargaJual: 5000,
    hargaSetor: 3800,
    jumlahTitip: 15,
    terjual: 12,
    retur: 3,
    statusBayar: 'belum',
    tanggal: new Date().toISOString(),
  },
]

export default function TitipanPage() {
  const { addToast } = useToast()

  // State List Titipan
  const [titipanList, setTitipanList] = useState(() => {
    try {
      const saved = localStorage.getItem(TITIPAN_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error('Error loading titipan:', e)
    }
    return INITIAL_TITIPAN
  })

  useEffect(() => {
    try {
      localStorage.setItem(TITIPAN_STORAGE_KEY, JSON.stringify(titipanList))
    } catch (e) {
      console.error('Error saving titipan:', e)
    }
  }, [titipanList])

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

  // Metrics KPI
  const metrics = useMemo(() => {
    let totalUnitTitip = 0
    let totalUnitTerjual = 0
    let totalUangSetoran = 0
    let totalKomisiKantin = 0

    titipanList.forEach(item => {
      totalUnitTitip += item.jumlahTitip
      totalUnitTerjual += item.terjual
      totalUangSetoran += item.terjual * item.hargaSetor
      totalKomisiKantin += item.terjual * (item.hargaJual - item.hargaSetor)
    })

    return {
      totalMacam: titipanList.length,
      totalUnitTitip,
      totalUnitTerjual,
      totalUangSetoran,
      totalKomisiKantin,
    }
  }, [titipanList])

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
    if (hargaSetor >= hargaJual) errs.hargaSetor = 'Harga setor harus lebih kecil dari harga jual agar kantin mendapat komisi'
    if (jumlahTitip <= 0) errs.jumlahTitip = 'Jumlah titip minimal 1 unit'

    if (Object.keys(errs).length > 0) {
      setErrorsTambah(errs)
      return
    }

    setSavingTambah(true)
    try {
      await new Promise(r => setTimeout(r, 400))
      const maxId = titipanList.reduce((m, t) => Math.max(m, t.id), 0)
      const newItem = {
        id: maxId + 1,
        namaProduk: formTambah.namaProduk.trim(),
        penitip: formTambah.penitip.trim(),
        kontak: formTambah.kontak.trim(),
        hargaJual,
        hargaSetor,
        jumlahTitip,
        terjual: 0,
        retur: 0,
        statusBayar: 'belum',
        tanggal: new Date().toISOString(),
      }

      setTitipanList(prev => [newItem, ...prev])
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
    const terjualNum = Math.max(0, selectedRekap.jumlahTitip - returNum)

    setTitipanList(prev =>
      prev.map(item =>
        item.id === selectedRekap.id
          ? {
              ...item,
              retur: returNum,
              terjual: terjualNum,
            }
          : item
      )
    )

    addToast({
      type: 'info',
      title: 'Rekap Diperbarui',
      message: `${selectedRekap.namaProduk}: ${terjualNum} terjual, ${returNum} retur.`,
    })
    setSelectedRekap(null)
  }

  // Toggle Status Bayar
  const handleToggleBayar = (id) => {
    setTitipanList(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              statusBayar: item.statusBayar === 'lunas' ? 'belum' : 'lunas',
            }
          : item
      )
    )
    addToast({ type: 'success', title: 'Status Setoran Diubah' })
  }

  // Hapus Titipan
  const handleHapusTitipan = (id) => {
    setTitipanList(prev => prev.filter(item => item.id !== id))
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
    const headers = ['Produk', 'Penitip', 'Kontak', 'Harga Jual', 'Harga Setor', 'Komisi Kantin', 'Titip Awal', 'Terjual', 'Retur Sisa', 'Total Setoran', 'Status Bayar']
    const rows = titipanList.map(t => {
      const komisi = t.hargaJual - t.hargaSetor
      const totalSetor = t.terjual * t.hargaSetor
      return [
        `"${t.namaProduk}"`,
        `"${t.penitip}"`,
        `"${t.kontak || ''}"`,
        t.hargaJual,
        t.hargaSetor,
        komisi,
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
            Manajemen makanan titipan dari vendor luar/ibu kantin, hitung bagi hasil komisi kantin, sisa retur, dan uang setoran.
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

        <div className="titipan-stat-card">
          <div className="titipan-stat-icon stat-icon--success" aria-hidden="true">💰</div>
          <div className="titipan-stat-content">
            <div className="titipan-stat-label">Laba Komisi Kantin</div>
            <div className="titipan-stat-value" style={{ color: 'var(--color-success)' }}>
              {formatRupiah(metrics.totalKomisiKantin)}
            </div>
            <div className="titipan-stat-sub">Keuntungan bersih kantin</div>
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
                  <th style={{ textAlign: 'right' }}>Komisi Kantin</th>
                  <th style={{ textAlign: 'center' }}>Titip Awal</th>
                  <th style={{ textAlign: 'center' }}>Terjual</th>
                  <th style={{ textAlign: 'center' }}>Retur</th>
                  <th style={{ textAlign: 'right' }}>Total Setoran</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: '160px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, idx) => {
                  const komisiUnit = item.hargaJual - item.hargaSetor
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
                      <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: 'bold' }}>
                        +{formatRupiah(komisiUnit)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.jumlahTitip}</td>
                      <td style={{ textAlign: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}>{item.terjual}</td>
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

          {/* Live Calculation Preview */}
          {formTambah.hargaJual && formTambah.hargaSetor && (
            <div className="titipan-preview-card">
              <div className="preview-line">
                <span>Komisi Kantin per Bungkus:</span>
                <strong style={{ color: 'var(--color-success)' }}>
                  +{formatRupiah((parseInt(formTambah.hargaJual, 10) || 0) - (parseInt(formTambah.hargaSetor, 10) || 0))}
                </strong>
              </div>
              {formTambah.jumlahTitip && (
                <div className="preview-line">
                  <span>Potensi Laba Maksimal Kantin:</span>
                  <strong>
                    {formatRupiah(
                      ((parseInt(formTambah.hargaJual, 10) || 0) - (parseInt(formTambah.hargaSetor, 10) || 0)) *
                      (parseInt(formTambah.jumlahTitip, 10) || 0)
                    )}
                  </strong>
                </div>
              )}
            </div>
          )}
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
              <div className="calc-row">
                <span>Laba Komisi Kantin:</span>
                <strong style={{ color: 'var(--color-success)' }}>
                  +{formatRupiah(Math.max(0, selectedRekap.jumlahTitip - (parseInt(returInput, 10) || 0)) * (selectedRekap.hargaJual - selectedRekap.hargaSetor))}
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
                <div className="slip-brand">KANTINKU SMAN 8</div>
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

      {/* ── Scoped Styling ── */}
      <style>{`
        .titipan-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        /* Header */
        .titipan-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .titipan-header-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }
        .titipan-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        /* KPI Cards */
        .titipan-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-4);
        }
        .titipan-stat-card {
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
        .titipan-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .titipan-stat-icon {
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
        .stat-icon--info { background: #eff6ff; color: #2563eb; }
        .stat-icon--warning { background: #fffbeb; color: #d97706; }
        .stat-icon--success { background: #ecfdf5; color: #059669; }
        .titipan-stat-content { flex: 1; min-width: 0; }
        .titipan-stat-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .titipan-stat-value {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          line-height: var(--line-height-tight);
        }
        .titipan-stat-sub {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        /* Table Card */
        .table-card { padding: 0; overflow: hidden; }
        .table-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--color-border);
          gap: var(--space-4);
          flex-wrap: wrap;
        }
        .status-tabs-row {
          display: flex;
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 2px;
        }
        .tab-btn-mini {
          border: none;
          background: transparent;
          padding: 4px 12px;
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-weight: var(--font-weight-medium);
          transition: all var(--transition-fast);
        }
        .tab-btn-mini.active {
          background: var(--color-surface);
          color: var(--color-primary);
          font-weight: bold;
          box-shadow: var(--shadow-sm);
        }

        .table-responsive { overflow-x: auto; }
        .titipan-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--font-size-sm);
        }
        .titipan-table th {
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
        .titipan-table td {
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
        }
        .titipan-table tr:last-child td { border-bottom: none; }
        .titipan-table tr:hover td { background: var(--color-surface-hover); }
        .col-muted { color: var(--color-text-muted); font-size: var(--font-size-xs); }

        .product-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .food-icon {
          font-size: 1.4rem;
          background: var(--color-surface-sunken);
          padding: 6px;
          border-radius: var(--radius-md);
        }
        .item-date-sub {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .penitip-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .penitip-name { font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
        .penitip-kontak { font-size: 11px; color: var(--color-text-muted); }

        .bayar-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: bold;
          border: 1px solid transparent;
          cursor: pointer;
        }
        .bayar-pill .dot { width: 6px; height: 6px; border-radius: 50%; }
        .bayar-lunas { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
        .bayar-lunas .dot { background: #10b981; }
        .bayar-belum { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .bayar-belum .dot { background: #f59e0b; }

        .table-action-btns {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
        }
        .btn-danger-ghost:hover {
          color: var(--color-danger) !important;
          background: #fef2f2 !important;
        }

        /* Form Modal */
        .titipan-modal-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }
        .form-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: var(--space-3);
        }
        .titipan-preview-card {
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-3) var(--space-4);
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: var(--font-size-sm);
        }
        .preview-line {
          display: flex;
          justify-content: space-between;
        }

        /* Rekap Modal */
        .rekap-modal-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .rekap-info-box {
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          font-size: var(--font-size-sm);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .rekap-calculation-box {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
        }
        .calc-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        @media (max-width: 768px) {
          .titipan-header { flex-direction: column; align-items: stretch; }
          .titipan-header-actions { width: 100%; }
          .titipan-header-actions button { flex: 1; }
          .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
