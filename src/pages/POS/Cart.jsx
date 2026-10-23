import { useState, useEffect } from 'react'
import Button from '../../components/ui/Button'
import { formatRupiah, hitungKembalian, parseRupiah } from '../../utils/currency'

const METODE = [
  { id: 'tunai', label: 'Tunai', icon: '💵' },
  { id: 'non-tunai', label: 'Non-Tunai', icon: '💳' },
]

/**
 * Cart — Panel kanan POS
 * Daftar item keranjang + qty control + pembayaran
 */
export default function Cart({
  items,
  subTotal,
  totalItem,
  isEmpty,
  onKurangi,
  onTambah,
  onHapus,
  onKosongkan,
  onBayar,
  loading,
}) {
  const [metode, setMetode] = useState('tunai')
  const [uangDiterima, setUangDiterima] = useState('')
  const [uangError, setUangError] = useState('')

  // Reset uang diterima saat metode berubah
  useEffect(() => {
    setUangDiterima('')
    setUangError('')
  }, [metode])

  // Nominal cepat (tunai)
  const NOMINAL_CEPAT = [5000, 10000, 20000, 50000, 100000]

  const uangDiterimaNominal = parseRupiah(uangDiterima)
  const kembalian = metode === 'tunai' ? hitungKembalian(subTotal, uangDiterimaNominal) : 0
  const uangKurang = metode === 'tunai' && uangDiterimaNominal > 0 && uangDiterimaNominal < subTotal

  const handleBayar = () => {
    if (isEmpty) return
    if (metode === 'tunai') {
      if (!uangDiterima || uangDiterimaNominal <= 0) {
        setUangError('Masukkan jumlah uang yang diterima.')
        return
      }
      if (uangDiterimaNominal < subTotal) {
        setUangError('Uang yang diterima kurang dari total.')
        return
      }
    }
    setUangError('')
    onBayar({ metode, uangDiterima: uangDiterimaNominal })
  }

  const handleUangChange = (e) => {
    // Hanya izinkan angka
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setUangDiterima(raw)
    setUangError('')
  }

  return (
    <div className="pos-cart-panel" id="pos-cart-panel">
      {/* Header */}
      <div className="pos-cart-header">
        <h2 className="pos-cart-title">
          🛒 Keranjang
          {totalItem > 0 && (
            <span className="pos-cart-count" aria-label={`${totalItem} item`}>
              {totalItem}
            </span>
          )}
        </h2>
        {!isEmpty && (
          <button
            className="btn btn-ghost btn-sm"
            id="pos-cart-kosongkan-btn"
            onClick={onKosongkan}
            aria-label="Kosongkan keranjang"
          >
            🗑️ Kosongkan
          </button>
        )}
      </div>

      {/* Item list */}
      <div className="pos-cart-items" id="pos-cart-items" role="list">
        {isEmpty ? (
          <div className="pos-cart-empty" id="pos-cart-empty">
            <div className="pos-cart-empty-icon" aria-hidden="true">🛒</div>
            <p>Keranjang kosong</p>
            <p>Pilih produk dari daftar di sebelah kiri</p>
          </div>
        ) : (
          items.map(({ produk, jumlah }) => (
            <div
              key={produk.id}
              className="pos-cart-item"
              id={`pos-cart-item-${produk.id}`}
              role="listitem"
            >
              <div className="pos-cart-item-info">
                <div className="pos-cart-item-name">{produk.nama}</div>
                <div className="pos-cart-item-price">
                  {formatRupiah(produk.hargaJual)} × {jumlah} =&nbsp;
                  <strong>{formatRupiah(produk.hargaJual * jumlah)}</strong>
                </div>
              </div>

              {/* Quantity control */}
              <div className="pos-qty-control" role="group" aria-label={`Jumlah ${produk.nama}`}>
                <button
                  className="pos-qty-btn"
                  id={`pos-kurangi-${produk.id}`}
                  onClick={() => onKurangi(produk.id)}
                  aria-label="Kurangi"
                >
                  −
                </button>
                <input
                  type="number"
                  className="pos-qty-input"
                  id={`pos-qty-input-${produk.id}`}
                  value={jumlah}
                  min={1}
                  max={produk.stok}
                  onChange={e => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v)) {
                      // ditangani melalui onTambah/onKurangi di parent
                    }
                  }}
                  aria-label={`Jumlah ${produk.nama}`}
                  readOnly
                />
                <button
                  className="pos-qty-btn"
                  id={`pos-tambah-${produk.id}`}
                  onClick={() => onTambah(produk)}
                  disabled={jumlah >= produk.stok}
                  aria-label="Tambah"
                >
                  +
                </button>
                <button
                  className="pos-hapus-btn"
                  id={`pos-hapus-${produk.id}`}
                  onClick={() => onHapus(produk.id)}
                  aria-label={`Hapus ${produk.nama} dari keranjang`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment section */}
      {!isEmpty && (
        <div className="pos-payment" id="pos-payment-section">
          {/* Subtotal */}
          <div className="pos-subtotal">
            <span>Subtotal ({totalItem} item)</span>
            <span className="pos-subtotal-value">{formatRupiah(subTotal)}</span>
          </div>

          <div className="pos-divider" />

          {/* Metode Pembayaran */}
          <div className="pos-metode-label">Metode Pembayaran</div>
          <div className="pos-metode-group" role="radiogroup" aria-label="Metode pembayaran">
            {METODE.map(m => (
              <button
                key={m.id}
                className={`pos-metode-btn${metode === m.id ? ' active' : ''}`}
                id={`pos-metode-${m.id}`}
                role="radio"
                aria-checked={metode === m.id}
                onClick={() => setMetode(m.id)}
              >
                <span aria-hidden="true">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Uang diterima (hanya tunai) */}
          {metode === 'tunai' && (
            <div className="pos-tunai-section" id="pos-tunai-section">
              <label className="pos-field-label" htmlFor="pos-uang-diterima">
                Uang Diterima
              </label>
              <div className="pos-uang-input-wrap">
                <span className="pos-rp-prefix">Rp</span>
                <input
                  type="number"
                  id="pos-uang-diterima"
                  className={`pos-uang-input${uangError ? ' error' : ''}`}
                  placeholder="0"
                  value={uangDiterima}
                  onChange={handleUangChange}
                  min={subTotal}
                  aria-describedby={uangError ? 'pos-uang-error' : undefined}
                />
              </div>
              {uangError && (
                <p className="pos-uang-error" id="pos-uang-error" role="alert">{uangError}</p>
              )}

              {/* Nominal cepat */}
              <div className="pos-nominal-cepat" id="pos-nominal-cepat">
                {NOMINAL_CEPAT.map(n => (
                  <button
                    key={n}
                    className="pos-nominal-btn"
                    id={`pos-nominal-${n}`}
                    onClick={() => { setUangDiterima(String(n)); setUangError('') }}
                  >
                    {n >= 1000 ? `${n / 1000}rb` : n}
                  </button>
                ))}
                {/* Pas */}
                <button
                  className="pos-nominal-btn pos-nominal-pas"
                  id="pos-nominal-pas"
                  onClick={() => { setUangDiterima(String(subTotal)); setUangError('') }}
                >
                  Pas
                </button>
              </div>

              {/* Kembalian */}
              {uangDiterimaNominal > 0 && !uangKurang && (
                <div className="pos-kembalian" id="pos-kembalian">
                  <span>Kembalian</span>
                  <span className="pos-kembalian-value">{formatRupiah(kembalian)}</span>
                </div>
              )}
              {uangKurang && (
                <div className="pos-kembalian pos-kembalian-kurang" id="pos-kembalian-kurang">
                  <span>Kurang</span>
                  <span className="pos-kembalian-value">{formatRupiah(subTotal - uangDiterimaNominal)}</span>
                </div>
              )}
            </div>
          )}

          {/* Tombol Bayar */}
          <Button
            variant="primary"
            fullWidth
            size="lg"
            id="pos-bayar-btn"
            onClick={handleBayar}
            loading={loading}
            style={{ marginTop: 'var(--space-4)' }}
          >
            {loading ? 'Memproses...' : `💳 Bayar ${formatRupiah(subTotal)}`}
          </Button>
        </div>
      )}
    </div>
  )
}
