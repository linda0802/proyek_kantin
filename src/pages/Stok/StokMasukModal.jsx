import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { formatNumber } from '../../utils/currency'

export default function StokMasukModal({
  isOpen,
  onClose,
  produkList,
  selectedProduk,
  onSave,
}) {
  const [produkId, setProdukId] = useState('')
  const [jumlah, setJumlah] = useState('')
  const [supplier, setSupplier] = useState('')
  const [catatan, setCatatan] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selectedProduk) {
      setProdukId(String(selectedProduk.id))
    } else if (produkList.length > 0 && !produkId) {
      setProdukId(String(produkList[0].id))
    }
    setJumlah('')
    setSupplier('')
    setCatatan('')
    setErrors({})
  }, [selectedProduk, isOpen, produkList])

  const currentProduk = produkList.find(p => p.id === Number(produkId))
  const stokSekarang = currentProduk?.stok || 0
  const qtyMasuk = parseInt(jumlah, 10) || 0
  const stokSetelah = stokSekarang + qtyMasuk

  const handleSimpan = async () => {
    const errs = {}
    if (!produkId) errs.produkId = 'Pilih produk yang akan ditambah stoknya'
    if (!jumlah || qtyMasuk <= 0) errs.jumlah = 'Jumlah stok masuk harus lebih dari 0'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 400))
      onSave({
        produkId: Number(produkId),
        jumlah: qtyMasuk,
        supplier: supplier.trim(),
        catatan: catatan.trim(),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📥 Tambah Stok Masuk (Restock)"
      size="md"
      id="modal-stok-masuk"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving} id="btn-cancel-stok-masuk">
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleSimpan}
            loading={saving}
            id="btn-save-stok-masuk"
          >
            Simpan Stok Masuk
          </Button>
        </>
      }
    >
      <div className="stok-masuk-form">
        {/* Pilih Produk */}
        <div className="form-group">
          <Select
            label="Pilih Produk"
            value={produkId}
            onChange={e => {
              setProdukId(e.target.value)
              if (errors.produkId) setErrors(prev => ({ ...prev, produkId: '' }))
            }}
            error={errors.produkId}
            required
            id="select-produk-masuk"
          >
            <option value="">— Pilih Produk —</option>
            {produkList.map(p => (
              <option key={p.id} value={p.id}>
                {p.nama} (Stok Saat Ini: {p.stok} unit)
              </option>
            ))}
          </Select>
        </div>

        {/* Input Jumlah Masuk */}
        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
          <Input
            label="Jumlah Unit Masuk (+Qty)"
            type="number"
            min="1"
            placeholder="Contoh: 20"
            value={jumlah}
            onChange={e => {
              setJumlah(e.target.value)
              if (errors.jumlah) setErrors(prev => ({ ...prev, jumlah: '' }))
            }}
            error={errors.jumlah}
            required
            id="input-jumlah-masuk"
          />
        </div>

        {/* Kalkulasi Preview */}
        {currentProduk && (
          <div className="stok-preview-box">
            <div className="preview-row">
              <span>Stok Saat Ini:</span>
              <strong>{formatNumber(stokSekarang)} unit</strong>
            </div>
            <div className="preview-row">
              <span>Tambahan Masuk:</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
                +{formatNumber(qtyMasuk)} unit
              </span>
            </div>
            <div className="preview-row preview-result">
              <span>Total Stok Sesudah:</span>
              <span className="result-number">{formatNumber(stokSetelah)} unit</span>
            </div>
          </div>
        )}

        {/* Supplier / Sumber */}
        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
          <Input
            label="Sumber / Supplier (Opsional)"
            placeholder="Contoh: Toko Berkah Jaya / Dapur Utama"
            value={supplier}
            onChange={e => setSupplier(e.target.value)}
            id="input-supplier-masuk"
          />
        </div>

        {/* Catatan */}
        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
          <Textarea
            label="Catatan / No. Faktur (Opsional)"
            placeholder="Keterangan tambahan barang masuk..."
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            rows={2}
            id="textarea-catatan-masuk"
          />
        </div>
      </div>

      <style>{`
        .stok-masuk-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .stok-preview-box {
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-3) var(--space-4);
          margin-top: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
        }
        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--color-text-muted);
        }
        .preview-result {
          padding-top: var(--space-2);
          border-top: 1px dashed var(--color-border);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }
        .result-number {
          color: var(--color-primary);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-extrabold);
        }
      `}</style>
    </Modal>
  )
}
