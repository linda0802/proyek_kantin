import { useState, useEffect } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Input, Select, Textarea } from '../../components/ui/Input'

export default function PengaturanPage() {
  const { settings, updateSettings, toggleFeature } = useSettings()
  const { addToast } = useToast()

  // Local Form State
  const [formData, setFormData] = useState({
    namaToko: settings.namaToko || 'KantinKu — Kantin Sekolah',
    alamat: settings.alamat || 'Kabupaten Bogor, Jawa Barat',
    telepon: settings.telepon || '0812-3456-7890',
    pesanKakiStruk: settings.pesanKakiStruk || 'Terima kasih atas kunjungan Anda! Makanan sehat, belajar semangat.',
    mataPembayaranDefault: settings.mataPembayaranDefault || 'tunai',
    modalAwalDefault: settings.modalAwalDefault || 0,
    stokMinimumDefault: settings.stokMinimumDefault || 5,
    autoPrintReceipt: settings.autoPrintReceipt ?? true,
    showKasirOnReceipt: settings.showKasirOnReceipt ?? true,
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFormData({
      namaToko: settings.namaToko || 'KantinKu — Kantin Sekolah',
      alamat: settings.alamat || 'Kabupaten Bogor, Jawa Barat',
      telepon: settings.telepon || '0812-3456-7890',
      pesanKakiStruk: settings.pesanKakiStruk || 'Terima kasih atas kunjungan Anda! Makanan sehat, belajar semangat.',
      mataPembayaranDefault: settings.mataPembayaranDefault || 'tunai',
      modalAwalDefault: settings.modalAwalDefault || 0,
      stokMinimumDefault: settings.stokMinimumDefault || 5,
      autoPrintReceipt: settings.autoPrintReceipt ?? true,
      showKasirOnReceipt: settings.showKasirOnReceipt ?? true,
    })
  }, [settings])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 400))
      updateSettings({
        ...formData,
        modalAwalDefault: parseInt(formData.modalAwalDefault, 10) || 100000,
        stokMinimumDefault: parseInt(formData.stokMinimumDefault, 10) || 5,
      })
      addToast({
        type: 'success',
        title: 'Pengaturan Disimpan',
        message: 'Konfigurasi sistem KantinKu berhasil diperbarui.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    const defaultData = {
      namaToko: 'KantinKu SMAN 8',
      alamat: 'Jl. Pendidikan No. 8, Jakarta Selatan',
      telepon: '0812-3456-7890',
      pesanKakiStruk: 'Terima kasih atas kunjungan Anda! Makanan sehat, belajar semangat.',
      mataPembayaranDefault: 'tunai',
      modalAwalDefault: 100000,
      stokMinimumDefault: 5,
      autoPrintReceipt: true,
      showKasirOnReceipt: true,
    }
    setFormData(defaultData)
    updateSettings(defaultData)
    addToast({ type: 'info', title: 'Reset Selesai', message: 'Pengaturan dikembalikan ke setelan pabrik.' })
  }

  return (
    <div className="pengaturan-page" id="pengaturan-page">
      {/* ── Page Header ── */}
      <div className="pengaturan-header">
        <div>
          <div className="pengaturan-header-title-row">
            <h1 className="page-title">Pengaturan Sistem</h1>
            <Badge variant="primary" dot>Versi 1.0.0 (Production SOT)</Badge>
          </div>
          <p className="page-subtitle">
            Konfigurasi identitas kantin, profil struk kasir, batasan stok, serta aktivasi fitur opsional.
          </p>
        </div>

        <div className="pengaturan-header-actions">
          <Button variant="secondary" onClick={handleReset} id="btn-reset-settings">
            🔄 Setelan Standar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            id="btn-save-settings"
          >
            💾 Simpan Perubahan
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="pengaturan-form-layout">
        {/* Section 1: Identitas Kantin & Struk */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <span className="card-icon">🏫</span>
            <div>
              <h3 className="card-title">Identitas Kantin & Profil Struk</h3>
              <p className="card-desc">Informasi yang tercetak di kop struk belanja dan kop laporan resmi.</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="form-group">
              <Input
                label="Nama Kantin / Sekolah"
                name="namaToko"
                value={formData.namaToko}
                onChange={handleChange}
                placeholder="Contoh: Kantin Sekolah Kabupaten Bogor"
                required
                id="input-nama-toko"
              />
            </div>

            <div className="form-group">
              <Input
                label="Nomor Kontak / Telepon"
                name="telepon"
                value={formData.telepon}
                onChange={handleChange}
                placeholder="Contoh: 0812-3456-7890"
                id="input-telepon"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Alamat Kantin / Sekolah"
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                placeholder="Contoh: Kabupaten Bogor, Jawa Barat"
                id="input-alamat"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <Textarea
                label="Pesan Penutup Kaki Struk (Receipt Footer)"
                name="pesanKakiStruk"
                value={formData.pesanKakiStruk}
                onChange={handleChange}
                rows={2}
                placeholder="Pesan ucapan terima kasih pada bagian bawah struk..."
                id="input-footer-struk"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Operasional Kasir & Stok */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <span className="card-icon">⚙️</span>
            <div>
              <h3 className="card-title">Preferensi Kasir & Batas Stok</h3>
              <p className="card-desc">Konfigurasi operasional harian kasir dan notifikasi inventaris.</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="form-group">
              <Select
                label="Metode Pembayaran Default Kasir"
                name="mataPembayaranDefault"
                value={formData.mataPembayaranDefault}
                onChange={handleChange}
                id="select-metode-default"
              >
                <option value="tunai">💵 Uang Tunai (Cash)</option>
                <option value="non-tunai">📱 Non-Tunai (QRIS)</option>
              </Select>
            </div>

            <div className="form-group">
              <Input
                label="Default Modal Awal Kasir (Rp)"
                name="modalAwalDefault"
                type="number"
                min="0"
                value={formData.modalAwalDefault}
                onChange={handleChange}
                hint="Nilai standar saat membuka shift kasir"
                id="input-modal-awal-default"
              />
            </div>

            <div className="form-group">
              <Input
                label="Batas Peringatan Stok Menipis (Unit)"
                name="stokMinimumDefault"
                type="number"
                min="1"
                value={formData.stokMinimumDefault}
                onChange={handleChange}
                hint="Produk dengan stok <= angka ini akan diberi badge 'Kritis'"
                id="input-stok-minimum"
              />
            </div>

            <div className="switches-box" style={{ gridColumn: '1 / -1' }}>
              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  name="autoPrintReceipt"
                  checked={formData.autoPrintReceipt}
                  onChange={handleChange}
                  id="checkbox-auto-print"
                />
                <span className="switch-slider"></span>
                <span className="toggle-label-text">
                  <strong>Otomatis Tampilkan Struk</strong>
                  <small>Langsung buka dialog cetak struk begitu transaksi kasir selesai</small>
                </span>
              </label>

              <label className="toggle-switch-label" style={{ marginTop: 'var(--space-3)' }}>
                <input
                  type="checkbox"
                  name="showKasirOnReceipt"
                  checked={formData.showKasirOnReceipt}
                  onChange={handleChange}
                  id="checkbox-show-kasir"
                />
                <span className="switch-slider"></span>
                <span className="toggle-label-text">
                  <strong>Tampilkan Nama Petugas di Struk</strong>
                  <small>Menampilkan nama kasir yang melayani pada bukti transaksi</small>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Toggle Fitur Opsional (PRD §6) */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <span className="card-icon">🧩</span>
            <div>
              <h3 className="card-title">Modul Fitur Tambahan (Opsional)</h3>
              <p className="card-desc">Aktifkan atau nonaktifkan fitur tambahan sesuai kebutuhan kantin sekolah.</p>
            </div>
          </div>

          <div className="optional-features-list">
            {[
              {
                key: 'barangTitipan',
                title: '🤝 Manajemen Barang Titipan (Konsinyasi)',
                desc: 'Kelola makanan titipan vendor/ibu kantin luar, hitung otomatis bagi hasil komisi kantin, sisa retur, dan total uang setoran.',
              },
              {
                key: 'rekapIstirahat',
                title: 'Rekap Shift Jam Istirahat (Istirahat 1 & 2)',
                desc: 'Memisahkan laporan penjualan berdasarkan periode lonjakan jam istirahat siswa.',
              },
              {
                key: 'makananTerbuang',
                title: 'Pencatatan Makanan Terbuang / Basi (Food Waste)',
                desc: 'Mencatat log limbah makanan sisa untuk analisa efisiensi porsi harian.',
              },
              {
                key: 'catatanUtang',
                title: 'Pencatatan Kasbon / Utang Siswa & Guru',
                desc: 'Fasilitas pencatatan piutang sementara dengan kartu batas limit belanja.',
              },
              {
                key: 'manajemenPemasok',
                title: 'Buku Kontak Pemasok & Vendor Bahan Baku',
                desc: 'Buku direktori kontak dan riwayat faktur pembelian dari supplier luar.',
              },
            ].map(f => {
              const isEnabled = !!settings.optionalFeatures?.[f.key]

              return (
                <div key={f.key} className="optional-feature-item">
                  <div className="feature-info">
                    <span className="feature-title">{f.title}</span>
                    <span className="feature-desc">{f.desc}</span>
                  </div>
                  <button
                    type="button"
                    className={`toggle-feature-pill ${isEnabled ? 'feature-enabled' : 'feature-disabled'}`}
                    onClick={() => toggleFeature(f.key)}
                    id={`toggle-feature-${f.key}`}
                  >
                    <span className="dot"></span>
                    {isEnabled ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </form>

      {/* ── Scoped Styling ── */}
      <style>{`
        .pengaturan-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        /* Header */
        .pengaturan-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .pengaturan-header-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-1);
        }
        .pengaturan-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .pengaturan-form-layout {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        /* Settings Card */
        .settings-card {
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }
        .settings-card-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-4);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }
        .card-icon {
          font-size: 1.8rem;
          background: var(--color-surface-sunken);
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .card-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }
        .card-desc {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .settings-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .switches-box {
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
        }

        .toggle-switch-label {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          cursor: pointer;
          user-select: none;
        }
        .toggle-switch-label input {
          width: 18px;
          height: 18px;
          accent-color: var(--color-primary);
          cursor: pointer;
        }
        .toggle-label-text {
          display: flex;
          flex-direction: column;
          font-size: var(--font-size-sm);
        }
        .toggle-label-text small {
          color: var(--color-text-muted);
          font-size: var(--font-size-xs);
        }

        /* Optional Features List */
        .optional-features-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .optional-feature-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-4);
          background: var(--color-surface-sunken);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          gap: var(--space-4);
        }
        .feature-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .feature-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }
        .feature-desc {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .toggle-feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          border: 1px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .toggle-feature-pill .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .feature-enabled {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }
        .feature-enabled .dot { background: #10b981; }
        .feature-disabled {
          background: #f1f5f9;
          color: #64748b;
          border-color: #cbd5e1;
        }
        .feature-disabled .dot { background: #94a3b8; }

        @media (max-width: 768px) {
          .pengaturan-header { flex-direction: column; align-items: stretch; }
          .pengaturan-header-actions { width: 100%; }
          .pengaturan-header-actions button { flex: 1; }
          .settings-fields-grid { grid-template-columns: 1fr; }
          .optional-feature-item { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}
