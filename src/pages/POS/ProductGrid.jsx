import { useState, useMemo } from 'react'
import { useProduk } from '../../context/ProdukContext'
import { SearchInput } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'

/**
 * ProductGrid — Panel kiri POS
 * Kategori filter + search + grid produk
 */
export default function ProductGrid({ onTambah, cartItems }) {
  const { produkList, kategoriList } = useProduk()
  const [kategoriAktif, setKategoriAktif] = useState(null) // null = semua
  const [search, setSearch] = useState('')

  // Produk yang sudah di-cart (untuk count badge)
  const cartMap = useMemo(() => {
    const map = {}
    cartItems.forEach(i => { map[i.produk.id] = i.jumlah })
    return map
  }, [cartItems])

  // Filter produk
  const produkFiltered = useMemo(() => {
    return produkList.filter(p => {
      const matchKategori = !kategoriAktif || p.kategoriId === kategoriAktif
      const matchSearch = !search.trim() ||
        p.nama.toLowerCase().includes(search.toLowerCase())
      return matchKategori && matchSearch
    })
  }, [produkList, kategoriAktif, search])

  return (
    <div className="pos-product-panel" id="pos-product-panel">
      {/* Search */}
      <div className="pos-search-row">
        <SearchInput
          id="pos-search-produk"
          placeholder="Cari produk..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Kategori Filter */}
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

      {/* Product Grid */}
      <div className="pos-product-grid" id="pos-product-grid" role="list">
        {produkFiltered.length === 0 && (
          <div className="pos-empty" id="pos-product-empty">
            <span>🔍</span>
            <p>Produk tidak ditemukan</p>
          </div>
        )}
        {produkFiltered.map(produk => {
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
              {/* Cart badge */}
              {jumlahDiCart > 0 && (
                <div className="pos-product-cart-badge" aria-hidden="true">
                  {jumlahDiCart}
                </div>
              )}

              {/* Icon placeholder (foto opsional) */}
              <div className="pos-product-icon" aria-hidden="true">
                {produk.kategoriId === 1 ? '🍽️' :
                 produk.kategoriId === 2 ? '🥤' :
                 produk.kategoriId === 3 ? '🍿' : '📦'}
              </div>

              <div className="pos-product-name">{produk.nama}</div>
              <div className="pos-product-price">
                Rp {produk.hargaJual.toLocaleString('id-ID')}
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
    </div>
  )
}
