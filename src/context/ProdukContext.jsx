import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const PRODUK_STORAGE_KEY = 'kantinku_produk'
const KATEGORI_STORAGE_KEY = 'kantinku_kategori'
const MUTASI_STORAGE_KEY = 'kantinku_mutasi'

const DEFAULT_KATEGORI = [
  { id: 1, nama: 'Makanan' },
  { id: 2, nama: 'Minuman' },
  { id: 3, nama: 'Camilan' },
  { id: 4, nama: 'Lainnya' },
]

const ProdukContext = createContext(null)

export function ProdukProvider({ children }) {
  // Produk dimulai KOSONG sesuai kebutuhan user
  const [produkList, setProdukList] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODUK_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Jika data lama adalah data mock bawaan (12 produk dummy), bersihkan agar kosong
        const isMock = Array.isArray(parsed) && parsed.length === 12 && parsed[0]?.nama === 'Nasi Goreng' && parsed[1]?.nama === 'Mie Goreng'
        if (isMock) {
          localStorage.removeItem(PRODUK_STORAGE_KEY)
          return []
        }
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (e) {
      console.error('Error loading produk:', e)
    }
    return []
  })

  // Kategori Produk
  const [kategoriList, setKategoriList] = useState(() => {
    try {
      const saved = localStorage.getItem(KATEGORI_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error('Error loading kategori:', e)
    }
    return DEFAULT_KATEGORI
  })

  // Mutasi Stok dimulai KOSONG (tanpa data mock)
  const [mutasiList, setMutasiList] = useState(() => {
    try {
      const saved = localStorage.getItem(MUTASI_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const isMock = Array.isArray(parsed) && parsed.some(m => m.id === 'MUT-20261023-001')
        if (isMock) {
          localStorage.removeItem(MUTASI_STORAGE_KEY)
          return []
        }
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (e) {
      console.error('Error loading mutasi stok:', e)
    }
    return []
  })

  // Sinkronisasi ke LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(PRODUK_STORAGE_KEY, JSON.stringify(produkList))
    } catch (e) {
      console.error('Error saving produk:', e)
    }
  }, [produkList])

  useEffect(() => {
    try {
      localStorage.setItem(KATEGORI_STORAGE_KEY, JSON.stringify(kategoriList))
    } catch (e) {
      console.error('Error saving kategori:', e)
    }
  }, [kategoriList])

  useEffect(() => {
    try {
      localStorage.setItem(MUTASI_STORAGE_KEY, JSON.stringify(mutasiList))
    } catch (e) {
      console.error('Error saving mutasi stok:', e)
    }
  }, [mutasiList])

  // ── PRODUK CRUD ──
  const tambahProduk = useCallback((data) => {
    setProdukList(prev => {
      const maxId = prev.reduce((m, p) => Math.max(m, p.id), 0)
      const newProduct = {
        ...data,
        id: maxId + 1,
        stok: parseInt(data.stok, 10) || 0,
        hargaJual: parseInt(data.hargaJual, 10) || 0,
        hargaModal: parseInt(data.hargaModal, 10) || 0,
        status: (parseInt(data.stok, 10) || 0) > 0 ? (data.status || 'tersedia') : 'habis',
      }
      return [...prev, newProduct]
    })
  }, [])

  const editProduk = useCallback((id, data) => {
    setProdukList(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updatedStok = data.stok !== undefined ? parseInt(data.stok, 10) : p.stok
          return {
            ...p,
            ...data,
            stok: updatedStok,
            status: updatedStok > 0 ? (data.status || p.status || 'tersedia') : 'habis',
          }
        }
        return p
      })
    )
  }, [])

  const hapusProduk = useCallback((id) => {
    setProdukList(prev => prev.filter(p => p.id !== id))
  }, [])

  const toggleStatusProduk = useCallback((id) => {
    setProdukList(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: p.status === 'tersedia' ? 'habis' : 'tersedia' }
          : p
      )
    )
  }, [])

  // ── KATEGORI CRUD ──
  const tambahKategori = useCallback((nama) => {
    setKategoriList(prev => {
      const maxId = prev.reduce((m, k) => Math.max(m, k.id), 0)
      return [...prev, { id: maxId + 1, nama }]
    })
  }, [])

  const editKategori = useCallback((id, nama) => {
    setKategoriList(prev => prev.map(k => k.id === id ? { ...k, nama } : k))
  }, [])

  const hapusKategori = useCallback((id) => {
    const dipakai = produkList.some(p => p.kategoriId === id)
    if (dipakai) return { error: 'Kategori masih digunakan oleh produk.' }
    setKategoriList(prev => prev.filter(k => k.id !== id))
    return { error: null }
  }, [produkList])

  const getNamaKategori = useCallback((id) => {
    return kategoriList.find(k => k.id === id)?.nama ?? '—'
  }, [kategoriList])

  // ── MANAJEMEN STOK & MUTASI ──

  // Stok Masuk (Restock)
  const tambahStokMasuk = useCallback(({ produkId, jumlah, supplier, catatan, petugas }) => {
    const n = parseInt(jumlah, 10)
    if (isNaN(n) || n <= 0) return { error: 'Jumlah stok masuk harus lebih dari 0' }

    let targetProduk = null

    setProdukList(prev =>
      prev.map(p => {
        if (p.id === produkId) {
          targetProduk = p
          const stokBaru = p.stok + n
          return {
            ...p,
            stok: stokBaru,
            status: stokBaru > 0 ? 'tersedia' : p.status,
          }
        }
        return p
      })
    )

    if (targetProduk) {
      const newMutasi = {
        id: `MUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-3)}`,
        tanggal: new Date().toISOString(),
        produkId: targetProduk.id,
        namaProduk: targetProduk.nama,
        tipe: 'masuk',
        jumlah: n,
        stokSebelum: targetProduk.stok,
        stokSesudah: targetProduk.stok + n,
        keterangan: catatan ? `${supplier ? `[${supplier}] ` : ''}${catatan}` : (supplier ? `Pemasok: ${supplier}` : 'Stok masuk manual'),
        petugas: petugas || 'Petugas',
      }
      setMutasiList(prev => [newMutasi, ...prev])
    }

    return { error: null }
  }, [])

  // Penyesuaian Stok (Opname)
  const sesuaikanStok = useCallback(({ produkId, stokBaru, alasan, catatan, petugas }) => {
    const n = parseInt(stokBaru, 10)
    if (isNaN(n) || n < 0) return { error: 'Stok fisik tidak valid' }

    let targetProduk = null

    setProdukList(prev =>
      prev.map(p => {
        if (p.id === produkId) {
          targetProduk = p
          return {
            ...p,
            stok: n,
            status: n === 0 ? 'habis' : 'tersedia',
          }
        }
        return p
      })
    )

    if (targetProduk) {
      const selisih = n - targetProduk.stok
      const newMutasi = {
        id: `MUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-3)}`,
        tanggal: new Date().toISOString(),
        produkId: targetProduk.id,
        namaProduk: targetProduk.nama,
        tipe: 'penyesuaian',
        jumlah: selisih,
        stokSebelum: targetProduk.stok,
        stokSesudah: n,
        keterangan: `[${alasan || 'Opname'}] ${catatan || 'Penyesuaian stok fisik'}`,
        petugas: petugas || 'Petugas',
      }
      setMutasiList(prev => [newMutasi, ...prev])
    }

    return { error: null }
  }, [])

  // Pengurangan Stok Otomatis saat Penjualan POS (HANYA PRODUK KANTIN)
  const kurangiStokPenjualan = useCallback((items, nomorTransaksi, petugas) => {
    setProdukList(prev =>
      prev.map(p => {
        const itemTerjual = items.find(i => {
          const id = i.produkId ?? i.produk?.id
          const isTitipan = i.isTitipan || i.produk?.isTitipan
          return id === p.id && !isTitipan
        })

        if (itemTerjual) {
          const qty = itemTerjual.jumlah || 1
          const stokBaru = Math.max(0, p.stok - qty)
          return {
            ...p,
            stok: stokBaru,
            status: stokBaru === 0 ? 'habis' : p.status,
          }
        }
        return p
      })
    )

    // Catat mutasi keluar
    const mutasiKeluar = items
      .filter(i => !(i.isTitipan || i.produk?.isTitipan))
      .map((item, idx) => {
        const pId = item.produkId ?? item.produk?.id
        const pNama = item.nama ?? item.produk?.nama
        const pStok = item.produk?.stok ?? 0
        const qty = item.jumlah || 1
        return {
          id: `MUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now() + idx).slice(-3)}`,
          tanggal: new Date().toISOString(),
          produkId: pId,
          namaProduk: pNama,
          tipe: 'keluar',
          jumlah: -qty,
          stokSebelum: pStok,
          stokSesudah: Math.max(0, pStok - qty),
          keterangan: `Penjualan Kasir (${nomorTransaksi || 'TRX'})`,
          petugas: petugas || 'Kasir',
        }
      })

    if (mutasiKeluar.length > 0) {
      setMutasiList(prev => [...mutasiKeluar, ...prev])
    }
  }, [])

  // Pengembalian Stok Otomatis saat Transaksi Dibatalkan (HANYA PRODUK KANTIN)
  const kembalikanStokPembatalan = useCallback((items, nomorTransaksi, petugas, alasan) => {
    if (!items || !Array.isArray(items)) return

    // Kembalikan stok produk kantin
    setProdukList(prev =>
      prev.map(p => {
        const itemBatal = items.find(i => {
          const id = i.produkId ?? i.produk?.id
          const isTitipan = i.isTitipan || i.produk?.isTitipan
          return id === p.id && !isTitipan
        })

        if (itemBatal) {
          const qty = itemBatal.jumlah || 1
          const stokBaru = p.stok + qty
          return {
            ...p,
            stok: stokBaru,
            status: stokBaru > 0 ? (p.status === 'habis' ? 'tersedia' : p.status) : 'habis',
          }
        }
        return p
      })
    )

    // Catat mutasi masuk akibat pembatalan
    const mutasiMasuk = items
      .filter(i => !(i.isTitipan || i.produk?.isTitipan))
      .map((item, idx) => {
        const pId = item.produkId ?? item.produk?.id
        const pNama = item.nama ?? item.produk?.nama
        const pStok = item.produk?.stok ?? 0
        const qty = item.jumlah || 1
        return {
          id: `MUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now() + idx).slice(-3)}`,
          tanggal: new Date().toISOString(),
          produkId: pId,
          namaProduk: pNama,
          tipe: 'masuk',
          jumlah: qty,
          stokSebelum: pStok,
          stokSesudah: pStok + qty,
          keterangan: `Batal Transaksi (${nomorTransaksi || 'TRX'})${alasan ? `: ${alasan}` : ''}`,
          petugas: petugas || 'Kasir',
        }
      })

    if (mutasiMasuk.length > 0) {
      setMutasiList(prev => [...mutasiMasuk, ...prev])
    }
  }, [])

  return (
    <ProdukContext.Provider
      value={{
        produkList,
        tambahProduk,
        editProduk,
        hapusProduk,
        toggleStatusProduk,
        kategoriList,
        tambahKategori,
        editKategori,
        hapusKategori,
        getNamaKategori,
        // Stok & Mutasi
        mutasiList,
        tambahStokMasuk,
        sesuaikanStok,
        kurangiStokPenjualan,
        kembalikanStokPembatalan,
      }}
    >
      {children}
    </ProdukContext.Provider>
  )
}

export function useProduk() {
  const ctx = useContext(ProdukContext)
  if (!ctx) throw new Error('useProduk harus digunakan di dalam ProdukProvider')
  return ctx
}

export const useStok = useProduk
