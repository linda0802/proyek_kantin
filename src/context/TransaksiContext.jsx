import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { hitungKembalian } from '../utils/currency'
import { generateNomorTransaksi } from '../utils/date'

const STORAGE_KEY = 'kantinku_transaksi'

const TransaksiContext = createContext(null)

export function TransaksiProvider({ children }) {
  const [transaksiList, setTransaksiList] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Jika data lama adalah data mock (ID dimulai TRX-20261023), bersihkan
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id?.startsWith('TRX-20261023')) {
          localStorage.removeItem(STORAGE_KEY)
          return []
        }
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (e) {
      console.error('Error loading transaksi:', e)
    }
    return []
  })

  // Sinkronkan ke localStorage setiap kali transaksiList berubah
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transaksiList))
    } catch (e) {
      console.error('Error saving transaksi:', e)
    }
  }, [transaksiList])

  // Simpan transaksi baru dari POS
  // metodePembayaran: 'tunai' | 'non-tunai' | 'kasbon'
  // pelanggan: nama pelanggan (hanya untuk kasbon)
  const simpanTransaksi = useCallback(({ items, total, metodePembayaran, uangDiterima, kasir, pelanggan }) => {
    const nomorTransaksi = generateNomorTransaksi(transaksiList.length + 1)

    const transaksiBaru = {
      id: nomorTransaksi,
      tanggal: new Date().toISOString(),
      kasir: kasir || 'Kasir',
      metodePembayaran,
      pelanggan: pelanggan || null,
      uangDiterima: metodePembayaran === 'tunai' ? Number(uangDiterima) : Number(total),
      kembalian: metodePembayaran === 'tunai' ? hitungKembalian(total, uangDiterima) : 0,
      total: Number(total),
      status: 'selesai',
      items: items.map(i => ({
        produkId: i.produk.id,
        nama: i.produk.nama,
        hargaJual: i.produk.hargaJual,
        hargaModal: i.produk.hargaModal || Math.round(i.produk.hargaJual * 0.7),
        jumlah: i.jumlah,
        subtotal: i.produk.hargaJual * i.jumlah,
        isTitipan: i.produk.isTitipan || false,
      })),
    }

    setTransaksiList(prev => [transaksiBaru, ...prev])
    return transaksiBaru
  }, [transaksiList.length])

  // Batalkan transaksi
  const batalkanTransaksi = useCallback((id, alasan) => {
    setTransaksiList(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              status: 'batal',
              alasanBatal: alasan || 'Dibatalkan oleh petugas',
              dibatalkanPada: new Date().toISOString(),
            }
          : t
      )
    )
  }, [])

  // Cari transaksi berdasarkan ID
  const getTransaksiById = useCallback((id) => {
    return transaksiList.find(t => t.id === id) || null
  }, [transaksiList])

  // Ringkasan metrik transaksi hari ini
  const summary = useMemo(() => {
    const todayStr = new Date().toDateString()
    const hariIni = transaksiList.filter(t => new Date(t.tanggal).toDateString() === todayStr)
    const selesai = hariIni.filter(t => t.status === 'selesai')
    const batal = hariIni.filter(t => t.status === 'batal')

    const totalOmzet = selesai.reduce((sum, t) => sum + t.total, 0)
    const totalTransaksi = selesai.length
    const totalBatal = batal.length
    const rataRata = totalTransaksi > 0 ? Math.round(totalOmzet / totalTransaksi) : 0

    return {
      totalOmzet,
      totalTransaksi,
      totalBatal,
      rataRata,
    }
  }, [transaksiList])

  return (
    <TransaksiContext.Provider
      value={{
        transaksiList,
        simpanTransaksi,
        batalkanTransaksi,
        getTransaksiById,
        summary,
      }}
    >
      {children}
    </TransaksiContext.Provider>
  )
}

export function useTransaksiContext() {
  const ctx = useContext(TransaksiContext)
  if (!ctx) throw new Error('useTransaksiContext harus digunakan di dalam TransaksiProvider')
  return ctx
}
