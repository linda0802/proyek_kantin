import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { formatNumber } from '../../utils/currency'

const ALASAN_OPNAME = [
  { value: 'Koreksi Hasil Stock Opname', label: 'Koreksi Hasil Stock Opname' },
  { value: 'Barang Rusak / Basi / Kedaluwarsa', label: 'Barang Rusak / Basi / Kedaluwarsa' },
  { value: 'Barang Hilang / Selisih Kasir', label: 'Barang Hilang / Selisih Kasir' },
  { value: 'Bonus / Sampling / Tester', label: 'Bonus / Sampling / Tester' },
  { value: 'Lainnya', label: 'Lainnya' },
]

export default function PenyesuaianStokModal({
  isOpen,
  onClose,
  produkList,
  selectedProduk,
  onSave,
}) {
  const [produkId, setProdukId] = useState('')
  const [stokFisik, setStokFisik] = useState('')
  const [alasan, setAlasan] = useState(ALASAN_OPNAME[0].value)
  const [catatan, setCatatan] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selectedProduk) {
      setProdukId(String(selectedProduk.id))
      setStokFisik(String(selectedProduk.stok))
    } else if (produkList.length > 0 && !produkId) {
      setProdukId(String(produkList[0].id))
      setStokFisik(String(produkList[0].stok))
    }
    setAlasan(ALASAN_OPNAME[0].value)
    setCatatan('')
    setErrors({})
  }, [selectedProduk, isOpen, produkList])

  const currentProduk = produkList.find(p => p.id === Number(produkId))
  const stokSistem = currentProduk?.stok || 0
  const stokAktual = parseInt(stokFisik, 10)
  const selisih = !isNaN(stokAktual) ? stokAktual - stokSistem : 0

  const handleSimpan = async () => {
    const errs = {}
    if (!produkId) errs.produkId = 'Pilih produk yang akan disesuaikan'
    if (stokFisik === '' || isNaN(stokAktual) || stokAktual < 0) {
      errs.stokFisik = 'Masukkan angka stok fisik yang valid (minimal 0)'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 400))
      onSave({
        produkId: Number(produkId),
        stokBaru: stokAktual,
        alasan,
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
      title="⚖️ Penyesuaian Stok (Stock Opname)"
      size="md"
      id="modal-penyesuaian-stok"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving} id="btn-cancel-penyesuaian">
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleSimpan}
            loading={saving}
            id="btn-save-penyesuaian"
          >
            Simpan Penyesuaian
          </Button>
        </>
      }
    >
      <div className="penyesuaian-form">
        {/* Pilih Produk */}
        <div className="form-group">
          <Select
            label="Pilih Produk"
            value={produkId}
            onChange={e => {
              const id = e.target.value
              setProdukId(id)
              const p = produkList.find(item => item.id === Number(id))
              if (p) setStokFisik(String(p.stok))
              if (errors.produkId) setErrors(prev => ({ ...prev, produkId: '' }))
            }}
            error={errors.produkId}
            required
            id="select-produk-penyesuaian"
          >
            <option value="">— Pilih Produk —</option>
            {produkList.map(p => (
              <option key={p.id} value={p.id}>
                {p.nama} (Stok Sistem: {p.stok} unit)
              </option>
            ))}
          </Select>
        </div>

        {/* Stok Fisik Aktual */}
        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
          <Input
            label="Stok Fisik Sebenarnya (Unit Aktual)"
            type="number"
            min="0"
            placeholder="0"
            value={stokFisik}
            onChange={e => {
              setStokFisik(e.target.value)
              if (errors.stokFisik) setErrors(prev => ({ ...prev, stokFisik: '' }))
            }}
            error={errors.stokFisik}
            required
            id="input-stok-fisik"
            hint="Hasil penghitungan fisik langsung di kantin"
          />
        </div>

        {/* Live Calculation Preview */}
        {currentProduk && !isNaN(stokAktual) && (
          <div className="stok-preview-box">
            <div className="preview-row">
              <span>Stok Tercatat di Sistem:</span>
              <strong>{formatNumber(stokSistem)} unit</strong>
            </div>
            <div className="preview-row">
              <span>Stok Fisik Baru:</span>
              <strong>{formatNumber(stokAktual)} unit</strong>
            </div>
            <div className="preview-row preview-result">
              <span>Selisih Penyesuaian:</span>
              <span
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-extrabold)',
                  color: selisih > 0 ? 'var(--color-success)' : selisih < 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                }}
              >
                {selisih > 0 ? `+${selisih}` : selisih} unit
              </span>
            </div>
          </div>
        )}

        {selisih < 0 && (
          <div className="alert-selisih-minus">
            ⚠️ Terjadi pengurangan stok sebesar {Math.abs(selisih)} unit. Pastikan alasan penyesuaian tercatat dengan benar.
          </div>
        )}

        {/* Alasan */}
        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
          <Select
            label="Alasan Penyesuaian"
            value={alasan}
            onChange={e => setAlasan(e.target.value)}
            id="select-alasan-penyesuaian"
            required
          >
            {ALASAN_OPNAME.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Catatan */}
        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
          <Textarea
            label="Keterangan / Berita Acara (Opsional)"
            placeholder="Rincian keterangan mengapa terjadi selisih..."
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            rows={2}
            id="textarea-catatan-penyesuaian"
          />
        </div>
      </div>

      <style>{`
        .penyesuaian-form {
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
        .alert-selisih-minus {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          margin-top: var(--space-2);
        }
      `}</style>
    </Modal>
  )
}
