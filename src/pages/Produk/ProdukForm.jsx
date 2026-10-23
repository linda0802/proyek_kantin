import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { validateForm, required, positiveNonZero, positiveNumber, minLength, maxLength } from '../../utils/validators'

const EMPTY_FORM = {
  nama: '',
  kategoriId: '',
  hargaJual: '',
  hargaModal: '',
  stok: '',
  status: 'tersedia',
  foto: null,
}

/**
 * ProdukForm — Modal tambah / edit produk
 */
export default function ProdukForm({ isOpen, onClose, onSave, produk, kategoriList }) {
  const isEdit = !!produk
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Isi form saat edit
  useEffect(() => {
    if (produk) {
      setForm({
        nama: produk.nama,
        kategoriId: String(produk.kategoriId),
        hargaJual: String(produk.hargaJual),
        hargaModal: String(produk.hargaModal),
        stok: String(produk.stok),
        status: produk.status,
        foto: produk.foto ?? null,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [produk, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => validateForm(form, {
    nama: [
      v => required(v, 'Nama produk'),
      v => minLength(v?.trim(), 2, 'Nama produk'),
      v => maxLength(v?.trim(), 100, 'Nama produk'),
    ],
    kategoriId: [v => required(v, 'Kategori')],
    hargaJual: [
      v => required(v, 'Harga jual'),
      v => positiveNonZero(v, 'Harga jual'),
    ],
    hargaModal: [
      v => required(v, 'Harga modal'),
      v => positiveNumber(v, 'Harga modal'),
    ],
    stok: [
      v => required(v, 'Stok'),
      v => positiveNumber(v, 'Stok'),
    ],
  })

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 400))
      onSave({
        nama: form.nama.trim(),
        kategoriId: parseInt(form.kategoriId, 10),
        hargaJual: parseInt(form.hargaJual, 10),
        hargaModal: parseInt(form.hargaModal, 10),
        stok: parseInt(form.stok, 10),
        status: form.status,
        foto: form.foto,
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
      title={isEdit ? '✏️ Edit Produk' : '➕ Tambah Produk'}
      size="lg"
      id="produk-form-modal"
      footer={
        <>
          <Button variant="secondary" id="produk-form-cancel-btn" onClick={onClose} disabled={saving}>Batal</Button>
          <Button variant="primary" id="produk-form-save-btn" onClick={handleSave} loading={saving}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </>
      }
    >
      <div className="produk-form" id="produk-form-fields">
        {/* ── Informasi Produk ── */}
        <div className="form-section">
          <div className="form-section-title">Informasi Produk</div>
          <Input
            label="Nama Produk"
            name="nama"
            id="produk-form-nama"
            placeholder="Contoh: Nasi Goreng Spesial"
            value={form.nama}
            onChange={handleChange}
            error={errors.nama}
            required
            maxLength={100}
          />
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Select
              label="Kategori"
              name="kategoriId"
              id="produk-form-kategori"
              value={form.kategoriId}
              onChange={handleChange}
              error={errors.kategoriId}
              required
            >
              <option value="">— Pilih Kategori —</option>
              {kategoriList.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* ── Harga ── */}
        <div className="form-section">
          <div className="form-section-title">Harga</div>
          <div className="form-row-2">
            <Input
              label="Harga Jual (Rp)"
              name="hargaJual"
              id="produk-form-harga-jual"
              type="number"
              placeholder="0"
              min={0}
              value={form.hargaJual}
              onChange={handleChange}
              error={errors.hargaJual}
              required
              hint="Harga yang ditampilkan ke pembeli"
            />
            <Input
              label="Harga Modal (Rp)"
              name="hargaModal"
              id="produk-form-harga-modal"
              type="number"
              placeholder="0"
              min={0}
              value={form.hargaModal}
              onChange={handleChange}
              error={errors.hargaModal}
              required
              hint="Untuk kalkulasi estimasi laba"
            />
          </div>
          {/* Estimasi laba per unit */}
          {form.hargaJual && form.hargaModal && !errors.hargaJual && !errors.hargaModal && (
            <div className="form-laba-preview" id="produk-form-laba-preview">
              <span>💡 Estimasi laba per unit:</span>
              <strong style={{ color: (parseInt(form.hargaJual) - parseInt(form.hargaModal)) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                Rp {(parseInt(form.hargaJual || 0) - parseInt(form.hargaModal || 0)).toLocaleString('id-ID')}
              </strong>
            </div>
          )}
        </div>

        {/* ── Stok & Status ── */}
        <div className="form-section">
          <div className="form-section-title">Stok & Status</div>
          <div className="form-row-2">
            <Input
              label="Stok Awal"
              name="stok"
              id="produk-form-stok"
              type="number"
              placeholder="0"
              min={0}
              value={form.stok}
              onChange={handleChange}
              error={errors.stok}
              required
            />
            <Select
              label="Status"
              name="status"
              id="produk-form-status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="tersedia">✅ Tersedia</option>
              <option value="habis">❌ Habis</option>
            </Select>
          </div>
        </div>

        {/* ── Foto (opsional) ── */}
        <div className="form-section">
          <div className="form-section-title">Foto Produk (Opsional)</div>
          <div className="produk-foto-placeholder" id="produk-form-foto-area">
            <span aria-hidden="true">🖼️</span>
            <p>Upload foto produk</p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Fitur upload foto akan tersedia setelah backend terhubung
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .produk-form { display: flex; flex-direction: column; gap: var(--space-5); }
        .form-section { display: flex; flex-direction: column; gap: var(--space-3); }
        .form-section-title {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-primary);
          padding-bottom: var(--space-2);
          border-bottom: 1px solid var(--color-border);
        }
        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }
        .form-laba-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2) var(--space-3);
          background: var(--color-primary-subtle);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }
        .produk-foto-placeholder {
          border: 2px dashed var(--color-border-input);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          text-align: center;
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }
        .produk-foto-placeholder span { font-size: 2rem; opacity: 0.4; }
        @media (max-width: 500px) {
          .form-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </Modal>
  )
}
