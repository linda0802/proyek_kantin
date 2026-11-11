import { useState, useMemo } from 'react'
import { useProduk } from '../../context/ProdukContext'
import { useTitipan } from '../../context/TitipanContext'
import { useAuth } from '../../context/AuthContext'
import { SearchInput } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { formatRupiah } from '../../utils/currency'

/**
 * ProductGrid — Panel kiri POS
 * Membedakan:
 * 1. PRODUK KANTIN (berasal dari Data Produk)
 * 2. TITIPAN (berasal dari fitur Titipan, hanya jika permission Titipan ON)
 */
export default function ProductGrid({ onTambah, cartItems }) {
  const { produkList, kategoriList } = useProduk()
  const { produkTitipanTersedia } = useTitipan()
  const { hasPermission } = useAuth()

  const bolehTitipan = hasPermission('titipan')

  const [kategoriAktif, setKategoriAktif] = useState(null) // null = semua
  const [search, setSearch] = useState('')

  // Map item di keranjang untuk badge quantity
  const cartMap = useMemo(() => {
    const map = {}
    cartItems.forEach(i => {
      map[i.produk.id] = i.jumlah
    })
    return map
  }, [cartItems])

  // Filter produk kantin
  const produkKantinFiltered = useMemo(() => {
    return produkList.filter(p => {
      const matchKategori = !kategoriAktif || p.kategoriId === kategoriAktif
      const matchSearch =
        !search.trim() ||
        p.nama.toLowerCase().includes(search.toLowerCase())
      return matchKategori && matchSearch
    })
  }, [produkList, kategoriAktif, search])

  // Filter produk titipan (hanya jika permission aktif)
  const titipanFiltered = useMemo(() => {
    if (!bolehTitipan) return []
    return produkTitipanTersedia.filter(p => {
      // Jika kategori dipilih (bukan semua), produk titipan tidak muncul jika kategori tertentu
      if (kategoriAktif !== null) return false
      const matchSearch =
        !search.trim() ||
        p.nama.toLowerCase().includes(search.toLowerCase()) ||
        p.penitip.toLowerCase().includes(search.toLowerCase())
      return matchSearch
    })
  }, [bolehTitipan, produkTitipanTersedia, kategoriAktif, search])

  return (
    <div className="pos-product-panel" id="pos-product-panel">
      {/* Search Bar */}
      <div className="pos-search-row">
        <SearchInput
          id="pos-search-produk"
          placeholder="Cari produk kantin atau titipan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Kategori Filter (hanya untuk produk kantin) */}
      <div className="pos-kategori-filter" role="group" aria-label="Filter kategori">
        <button
          className={`pos-kategori-btn${!kategoriAktif ? ' active' : ''}`}
          id="pos-kategori-semua"
          onClick={() => setKategoriAktif(null)}
        >
          Semua
        </button>
        {kategoriList.map(k => (
          <button
            key={k.id}
            className={`pos-kategori-btn${kategoriAktif === k.id ? ' active' : ''}`}
            id={`pos-kategori-${k.id}`}
            onClick={() => setKategoriAktif(k.id)}
          >
            {k.nama}
          </button>
        ))}
      </div>

      {/* Scrollable Container */}
      <div className="pos-products-scroll-area">
        {/* ── BAGIAN 1: PRODUK KANTIN ── */}
        <div className="pos-section-header">
          <span className="pos-section-title">🍱 PRODUK KANTIN</span>
          <span className="pos-section-count">{produkKantinFiltered.length} produk</span>
        </div>

        <div className="pos-product-grid" id="pos-product-grid" role="list">
          {produkKantinFiltered.length === 0 && (
            <div className="pos-empty" id="pos-product-empty">
              <span>🍽️</span>
              <p>Belum ada produk kantin yang tersedia.</p>
            </div>
          )}

          {produkKantinFiltered.map(produk => {
            const habis = produk.status === 'habis' || produk.stok === 0
            const jumlahDiCart = cartMap[produk.id] || 0
            const stokRendah = !habis && produk.stok <= 5

            return (
              <button
                key={produk.id}
                className={`pos-product-card${habis ? ' habis' : ''}${jumlahDiCart > 0 ? ' in-cart' : ''}`}
                id={`pos-produk-${produk.id}`}
                onClick={() => !habis && onTambah(produk)}
                disabled={habis}
                aria-label={`${produk.nama}, Rp ${produk.hargaJual.toLocaleString('id-ID')}${habis ? ', habis' : ''}`}
                role="listitem"
              >
                {jumlahDiCart > 0 && (
                  <div className="pos-product-cart-badge" aria-hidden="true">
                    {jumlahDiCart}
                  </div>
                )}

                <div className="pos-product-icon" aria-hidden="true">
                  {produk.kategoriId === 1 ? '🍽️' :
                   produk.kategoriId === 2 ? '🥤' :
                   produk.kategoriId === 3 ? '🍿' : '📦'}
                </div>

                <div className="pos-product-name">{produk.nama}</div>
                <div className="pos-product-price">
                  {formatRupiah(produk.hargaJual)}
                </div>

                <div className="pos-product-footer">
                  {habis ? (
                    <Badge variant="danger">Habis</Badge>
                  ) : stokRendah ? (
                    <Badge variant="warning">Sisa {produk.stok}</Badge>
                  ) : (
                    <Badge variant="neutral">Stok {produk.stok}</Badge>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* ── BAGIAN 2: TITIPAN (HANYA MUNCUL JIKA TITIPAN ON) ── */}
        {bolehTitipan && (
          <div className="pos-titipan-section" style={{ marginTop: 'var(--space-6)' }}>
            <div className="pos-section-header pos-titipan-header">
              <span className="pos-section-title text-amber">🤝 TITIPAN (KONSINYASI)</span>
              <span className="pos-section-count">{titipanFiltered.length} produk</span>
            </div>

            <div className="pos-product-grid" id="pos-titipan-grid" role="list">
              {titipanFiltered.length === 0 ? (
                <div className="pos-empty-titipan">
                  <span>ℹ️</span>
                  <p>Tidak ada produk titipan aktif atau stok titipan sedang habis.</p>
                </div>
              ) : (
                titipanFiltered.map(produk => {
                  const habis = produk.stok <= 0
                  const jumlahDiCart = cartMap[produk.id] || 0

                  return (
                    <button
                      key={produk.id}
                      className={`pos-product-card titipan-card${habis ? ' habis' : ''}${jumlahDiCart > 0 ? ' in-cart' : ''}`}
                      id={`pos-titipan-${produk.id}`}
                      onClick={() => !habis && onTambah(produk)}
                      disabled={habis}
                      aria-label={`${produk.nama} titipan ${produk.penitip}, Rp ${produk.hargaJual.toLocaleString('id-ID')}`}
                      role="listitem"
                    >
                      {jumlahDiCart > 0 && (
                        <div className="pos-product-cart-badge" aria-hidden="true">
                          {jumlahDiCart}
                        </div>
                      )}

                      <div className="pos-product-icon" aria-hidden="true">
                        🍱
                      </div>

                      <div className="pos-product-name">{produk.nama}</div>
                      <div className="pos-titipan-penitip">👤 {produk.penitip}</div>
                      <div className="pos-product-price">
                        {formatRupiah(produk.hargaJual)}
                      </div>

                      <div className="pos-product-footer">
                        <Badge variant={habis ? 'danger' : 'warning'}>
                          {habis ? 'Habis' : `Stok: ${produk.stok}`}
                        </Badge>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .pos-products-scroll-area {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding-right: 4px;
        }
        .pos-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2) 0;
          margin-bottom: var(--space-2);
          border-bottom: 2px solid var(--color-border);
        }
        .pos-titipan-header {
          border-bottom: 2px dashed #d97706;
        }
        .pos-section-title {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-extrabold);
          letter-spacing: 0.05em;
          color: var(--color-text-secondary);
        }
        .text-amber {
          color: #b45309;
        }
        .pos-section-count {
          font-size: 11px;
          color: var(--color-text-muted);
        }
        .pos-titipan-penitip {
          font-size: 10px;
          color: #92400e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .pos-empty-titipan {
          grid-column: 1/-1;
          text-align: center;
          padding: var(--space-4);
          color: var(--color-text-muted);
          font-size: var(--font-size-xs);
          background: var(--color-surface-sunken);
          border-radius: var(--radius-md);
        }
      `}</style>
    </div>
  )
}
