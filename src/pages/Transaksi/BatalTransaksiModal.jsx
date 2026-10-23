import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Select, Textarea } from '../../components/ui/Input'
import { formatRupiah } from '../../utils/currency'

const ALASAN_OPTIONS = [
  { value: 'Pelanggan membatalkan pesanan', label: 'Pelanggan membatalkan pesanan' },
  { value: 'Salah input pesanan / kasir', label: 'Salah input pesanan / kasir' },
  { value: 'Produk rusak / tidak tersedia', label: 'Produk rusak / tidak tersedia' },
  { value: 'Pembayaran gagal / ditolak', label: 'Pembayaran gagal / ditolak' },
  { value: 'Lainnya', label: 'Lainnya (tuliskan keterangan)' },
]

export default function BatalTransaksiModal({ isOpen, onClose, transaksi, onConfirm }) {
  const [alasanPilihan, setAlasanPilihan] = useState(ALASAN_OPTIONS[0].value)
  const [alasanKustom, setAlasanKustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!transaksi) return null

  const handleBatal = async () => {
    let finalAlasan = alasanPilihan
    if (alasanPilihan === 'Lainnya') {
      if (!alasanKustom.trim()) {
        setError('Harap tuliskan alasan pembatalan.')
        return
      }
      finalAlasan = alasanKustom.trim()
    }

    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 400))
      onConfirm(transaksi.id, finalAlasan)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚠️ Batalkan Transaksi"
      size="md"
      id="modal-batal-transaksi"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading} id="btn-batal-cancel">
            Kembali
          </Button>
          <Button
            variant="danger"
            onClick={handleBatal}
            loading={loading}
            id="btn-confirm-batal-transaksi"
          >
            Ya, Batalkan Transaksi
          </Button>
        </>
      }
    >
      <div className="batal-transaksi-content">
        <div className="batal-warning-box">
          <p>
            Apakah Anda yakin ingin membatalkan transaksi <strong>{transaksi.id}</strong> sebesar{' '}
            <strong>{formatRupiah(transaksi.total)}</strong>?
          </p>
          <p className="batal-warning-sub">
            Status transaksi akan ditandai sebagai <em>Batal</em> dan dikeluarkan dari perhitungan omzet aktif.
          </p>
        </div>

        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
          <Select
            label="Alasan Pembatalan"
            value={alasanPilihan}
            onChange={e => {
              setAlasanPilihan(e.target.value)
              setError('')
            }}
            id="select-alasan-batal"
            required
          >
            {ALASAN_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {alasanPilihan === 'Lainnya' && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Textarea
              label="Keterangan Tambahan"
              placeholder="Jelaskan alasan pembatalan transaksi ini..."
              value={alasanKustom}
              onChange={e => {
                setAlasanKustom(e.target.value)
                if (error) setError('')
              }}
              error={error}
              rows={3}
              required
              id="textarea-alasan-kustom"
            />
          </div>
        )}
      </div>

      <style>{`
        .batal-transaksi-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .batal-warning-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-sm);
        }
        .batal-warning-sub {
          margin-top: var(--space-2);
          font-size: var(--font-size-xs);
          color: #b91c1c;
        }
      `}</style>
    </Modal>
  )
}
