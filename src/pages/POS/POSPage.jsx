import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useCart, useTransaksi } from '../../hooks/useCart'
import { useHutang } from '../../context/HutangContext'
import { useProduk } from '../../context/ProdukContext'
import { useTitipan } from '../../context/TitipanContext'
import { ConfirmDialog } from '../../components/ui/Modal'
import ProductGrid from './ProductGrid'
import Cart from './Cart'
import ReceiptModal from './ReceiptModal'

export default function POSPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const { simpanTransaksi } = useTransaksi()
  const { tambahHutang } = useHutang()
  const { kurangiStokPenjualan } = useProduk()
  const { kurangiStokTitipan } = useTitipan()
  const {
    items, tambahItem, kurangiItem, hapusItem, kosongkanKeranjang,
    subTotal, totalItem, isEmpty,
  } = useCart()

  const [loading, setLoading] = useState(false)
  const [transaksiSelesai, setTransaksiSelesai] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showKosongkanConfirm, setShowKosongkanConfirm] = useState(false)

  const handleBayar = async ({ metode, uangDiterima, pelanggan }) => {
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 700))

      // Simpan transaksi
      const transaksi = simpanTransaksi({
        items,
        total: subTotal,
        metodePembayaran: metode,
        uangDiterima,
        kasir: user?.name ?? 'Kasir',
        pelanggan: metode === 'kasbon' ? pelanggan : null,
      })

      // Kurangi stok produk kantin (hanya produk kantin asli)
      kurangiStokPenjualan(items, transaksi.id, user?.name)

      // Kurangi stok produk titipan (hanya produk titipan, tidak sentuh stok kantin)
      items.forEach(item => {
        if (item.produk?.isTitipan && item.produk?.titipanId) {
          kurangiStokTitipan(item.produk.titipanId, item.jumlah)
        }
      })

      // Jika kasbon, tambah ke catatan hutang
      if (metode === 'kasbon') {
        tambahHutang({
          transaksi,
          pelanggan: pelanggan || 'Pelanggan',
          kasir: user?.name ?? 'Kasir',
        })
      }

      setTransaksiSelesai(transaksi)
      setShowReceipt(true)
      addToast({
        type: 'success',
        title: metode === 'kasbon' ? 'Kasbon Tercatat' : 'Transaksi Berhasil',
        message: `${transaksi.id} tersimpan.`,
      })
    } catch (err) {
      addToast({ type: 'error', title: 'Gagal', message: 'Transaksi gagal disimpan.' })
    } finally {
      setLoading(false)
    }
  }

  const handleTransaksiBaru = () => {
    setShowReceipt(false)
    setTransaksiSelesai(null)
    kosongkanKeranjang()
  }

  const handleKosongkan = () => {
    if (isEmpty) return
    setShowKosongkanConfirm(true)
  }

  return (
    <div className="pos-page" id="pos-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">🛒 Kasir / Penjualan</h2>
          <p className="page-subtitle">Pilih produk dan proses transaksi</p>
        </div>
      </div>

      {/* POS Layout: kiri (produk) | kanan (cart) */}
      <div className="pos-layout" id="pos-layout">
        {/* Panel Kiri — Produk */}
        <ProductGrid
          onTambah={tambahItem}
          cartItems={items}
        />

        {/* Panel Kanan — Keranjang */}
        <Cart
          items={items}
          subTotal={subTotal}
          totalItem={totalItem}
          isEmpty={isEmpty}
          onTambah={tambahItem}
          onKurangi={kurangiItem}
          onHapus={hapusItem}
          onKosongkan={handleKosongkan}
          onBayar={handleBayar}
          loading={loading}
        />
      </div>

      {/* Confirm kosongkan keranjang */}
      <ConfirmDialog
        isOpen={showKosongkanConfirm}
        onClose={() => setShowKosongkanConfirm(false)}
        onConfirm={() => { kosongkanKeranjang(); setShowKosongkanConfirm(false) }}
        title="Kosongkan Keranjang"
        message="Semua item di keranjang akan dihapus. Lanjutkan?"
        confirmLabel="Ya, Kosongkan"
        confirmVariant="danger"
      />

      {/* Receipt Modal */}
      {showReceipt && (
        <ReceiptModal
          transaksi={transaksiSelesai}
          onClose={() => setShowReceipt(false)}
          onTransaksiBaru={handleTransaksiBaru}
        />
      )}

      {/* POS Styles */}
      <style>{`
        .pos-page { height: 100%; }

        .pos-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: var(--space-4);
          height: calc(100vh - var(--header-height) - 140px);
          min-height: 500px;
        }

        .pos-product-panel {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          overflow: hidden;
        }
        .pos-search-row { flex-shrink: 0; }

        .pos-kategori-filter {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        .pos-kategori-btn {
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-full);
          border: 1.5px solid var(--color-border-input);
          background: var(--color-surface);
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .pos-kategori-btn:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
          background: var(--color-primary-subtle);
        }
        .pos-kategori-btn.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #fff;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);
        }

        .pos-product-grid {
          flex: 1;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: var(--space-3);
          align-content: start;
          padding-bottom: var(--space-2);
        }
        .pos-product-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4) var(--space-3);
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: center;
          min-height: 140px;
        }
        .pos-product-card:hover:not(:disabled) {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
          background: var(--color-primary-subtle);
        }
        .pos-product-card.in-cart {
          border-color: var(--color-primary);
          background: var(--color-primary-subtle);
        }
        .pos-product-card.habis {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }
        .pos-product-card.titipan-card {
          border-color: #d97706;
          background: #fffbeb;
        }
        .pos-product-card.titipan-card:hover:not(:disabled) {
          border-color: #b45309;
          background: #fef3c7;
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .pos-product-card.titipan-card.in-cart {
          border-color: #b45309;
          background: #fef3c7;
        }
        .pos-product-cart-badge {
          position: absolute;
          top: -8px; right: -8px;
          width: 24px; height: 24px;
          background: var(--color-primary);
          color: #fff;
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(22, 163, 74, 0.4);
        }
        .pos-product-icon { font-size: 2rem; line-height: 1; }
        .pos-product-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          line-height: 1.3;
        }
        .pos-product-price {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
        }
        .pos-product-footer { margin-top: auto; }
        .pos-empty {
          grid-column: 1/-1;
          text-align: center;
          padding: var(--space-12) var(--space-4);
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }
        .pos-empty span { font-size: 2rem; opacity: 0.4; }

        /* Section pemisah titipan */
        .pos-section-divider {
          grid-column: 1/-1;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) 0 var(--space-1) 0;
        }
        .pos-section-divider-line {
          flex: 1;
          border-top: 1px dashed #d97706;
        }
        .pos-section-divider-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: #d97706;
          background: #fef3c7;
          border: 1px solid #d97706;
          border-radius: var(--radius-full);
          padding: 2px 10px;
          white-space: nowrap;
        }

        .pos-cart-panel {
          display: flex;
          flex-direction: column;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .pos-cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .pos-cart-title {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .pos-cart-count {
          background: var(--color-primary);
          color: #fff;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          min-width: 22px;
          text-align: center;
        }

        .pos-cart-items {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .pos-cart-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-8) var(--space-4);
          text-align: center;
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
          gap: var(--space-2);
        }
        .pos-cart-empty-icon { font-size: 3rem; opacity: 0.3; margin-bottom: var(--space-2); }
        .pos-cart-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }
        .pos-cart-item-info { flex: 1; min-width: 0; }
        .pos-cart-item-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pos-cart-item-price { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px; }

        .pos-qty-control { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .pos-qty-btn {
          width: 32px; height: 32px;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--color-border-strong);
          background: var(--color-surface);
          color: var(--color-primary);
          font-size: 1.1rem;
          font-weight: var(--font-weight-bold);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          line-height: 1;
        }
        .pos-qty-btn:hover:not(:disabled) { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
        .pos-qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pos-qty-input {
          width: 36px;
          text-align: center;
          border: 1.5px solid var(--color-border-input);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          padding: 2px 4px;
          height: 32px;
          background: var(--color-surface);
        }
        .pos-qty-input::-webkit-outer-spin-button,
        .pos-qty-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .pos-hapus-btn {
          width: 28px; height: 28px;
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--color-text-muted);
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          margin-left: 2px;
        }
        .pos-hapus-btn:hover { background: var(--color-danger-bg); color: var(--color-danger); }

        .pos-payment {
          padding: var(--space-4);
          border-top: 1px solid var(--color-border);
          flex-shrink: 0;
          background: var(--color-bg);
        }
        .pos-subtotal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin-bottom: var(--space-3);
        }
        .pos-subtotal-value {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          font-family: 'Plus Jakarta Sans', var(--font-family);
        }
        .pos-divider { border: none; border-top: 1px solid var(--color-border); margin-bottom: var(--space-3); }
        .pos-metode-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-2);
        }
        .pos-metode-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }
        .pos-metode-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border: 2px solid var(--color-border-input);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .pos-metode-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .pos-metode-btn.active {
          border-color: var(--color-primary);
          background: var(--color-primary-light);
          color: var(--color-primary-active);
          font-weight: var(--font-weight-semibold);
        }
        .pos-metode-btn.metode-kasbon.active {
          border-color: #d97706;
          background: #fef3c7;
          color: #92400e;
        }

        .pos-kasbon-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
        }
        .pos-kasbon-info {
          background: #fef3c7;
          border: 1px solid #d97706;
          border-radius: var(--radius-md);
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-xs);
          color: #92400e;
          line-height: 1.4;
        }

        .pos-tunai-section { display: flex; flex-direction: column; gap: var(--space-2); }
        .pos-field-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pos-uang-input-wrap {
          display: flex;
          align-items: center;
          border: 2px solid var(--color-border-input);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-surface);
          transition: border-color var(--transition-fast);
        }
        .pos-uang-input-wrap:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
        }
        .pos-rp-prefix {
          padding: 0 var(--space-3);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary);
          background: var(--color-primary-light);
          height: 40px;
          display: flex;
          align-items: center;
          border-right: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .pos-uang-input {
          flex: 1;
          border: none;
          outline: none;
          padding: var(--space-2) var(--space-3);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          background: transparent;
        }
        .pos-uang-input::-webkit-outer-spin-button,
        .pos-uang-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .pos-uang-error { font-size: var(--font-size-xs); color: var(--color-danger); }

        .pos-nominal-cepat { display: flex; flex-wrap: wrap; gap: var(--space-1); }
        .pos-nominal-btn {
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-strong);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .pos-nominal-btn:hover {
          border-color: var(--color-primary);
          background: var(--color-primary-light);
          color: var(--color-primary);
        }
        .pos-nominal-pas { background: var(--color-primary-light); border-color: var(--color-primary); color: var(--color-primary); }

        .pos-kembalian {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-2) var(--space-3);
          background: var(--color-success-bg);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }
        .pos-kembalian-kurang { background: var(--color-danger-bg); border-color: var(--color-danger); }
        .pos-kembalian-value { font-size: var(--font-size-base); font-weight: var(--font-weight-extrabold); color: var(--color-success); }
        .pos-kembalian-kurang .pos-kembalian-value { color: var(--color-danger); }

        @media (max-width: 900px) {
          .pos-layout { grid-template-columns: 1fr; grid-template-rows: 1fr auto; height: auto; }
          .pos-product-grid { max-height: 50vh; }
          .pos-cart-panel { max-height: 60vh; }
        }
        @media (max-width: 600px) {
          .pos-product-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
        }
      `}</style>
    </div>
  )
}
