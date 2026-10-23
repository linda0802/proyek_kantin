import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { PRODUK as INITIAL_PRODUK, KATEGORI as INITIAL_KATEGORI } from '../data/mockData'

const MUTASI_STORAGE_KEY = 'kantinku_mutasi'

const today = new Date()
const INITIAL_MUTASI = [
  {
    id: 'MUT-20261023-001',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 30).toISOString(),
    produkId: 1,
    namaProduk: 'Nasi Goreng',
    tipe: 'masuk',
    jumlah: 30,
    stokSebelum: 15,
    stokSesudah: 45,
    keterangan: 'Pemasok Dapur Utama (Stok Pagi)',
    petugas: 'Admin',
  },
  {
    id: 'MUT-20261023-002',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 15).toISOString(),
    produkId: 5,
    namaProduk: 'Es Teh Manis',
    tipe: 'masuk',
    jumlah: 50,
    stokSebelum: 20,
    stokSesudah: 70,
    keterangan: 'Restock Bahan Es & Teh',
    petugas: 'Siti Kasir',
  },
  {
    id: 'MUT-20261023-003',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 45).toISOString(),
    produkId: 7,
    namaProduk: 'Air Mineral',
    tipe: 'masuk',
    jumlah: 48,
    stokSebelum: 12,
    stokSesudah: 60,
    keterangan: 'Pengiriman 2 Dus Air Mineral PT Tirta',
    petugas: 'Admin',
  },
  {
    id: 'MUT-20261023-004',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(),
    produkId: 4,
    namaProduk: 'Bakso',
    tipe: 'penyesuaian',
    jumlah: -2,
    stokSebelum: 5,
    stokSesudah: 3,
    keterangan: 'Koreksi: 2 porsi kuah tumpah',
    petugas: 'Siti Kasir',
  },
  {
    id: 'MUT-20261023-005',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(),
    produkId: 1,
    namaProduk: 'Nasi Goreng',
    tipe: 'keluar',
    jumlah: -3,
    stokSebelum: 45,
    stokSesudah: 42,
    keterangan: 'Penjualan Kasir (TRX-20261023-005)',
    petugas: 'Siti Kasir',
  },
]

const ProdukContext = createContext(null)

export function ProdukProvider({ children }) {
  const [produkList, setProdukList] = useState(INITIAL_PRODUK)
  const [kategoriList, setKategoriList] = useState(INITIAL_KATEGORI)

  // Mutasi Stok
  const [mutasiList, setMutasiList] = useState(() => {
    try {
      const saved = localStorage.getItem(MUTASI_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error('Error loading mutasi stok:', e)
    }
    return INITIAL_MUTASI
  })

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
      return [...prev, { ...data, id: maxId + 1 }]
    })
  }, [])

  const editProduk = useCallback((id, data) => {
    setProdukList(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
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
        id: `MUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(mutasiList.length + 1).padStart(3, '0')}`,
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
  }, [mutasiList.length])

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
        id: `MUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(mutasiList.length + 1).padStart(3, '0')}`,
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
  }, [mutasiList.length])

  // Pengurangan Stok Otomatis saat Penjualan POS
  const kurangiStokPenjualan = useCallback((items, nomorTransaksi, petugas) => {
    items.forEach(item => {
      setProdukList(prev =>
        prev.map(p => {
          if (p.id === item.produkId) {
            const stokBaru = Math.max(0, p.stok - item.jumlah)
            return {
              ...p,
              stok: stokBaru,
              status: stokBaru === 0 ? 'habis' : p.status,
            }
          }
          return p
        })
      )
    })
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
