import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const HUTANG_STORAGE_KEY = 'kantinku_hutang'

const HutangContext = createContext(null)

export function HutangProvider({ children }) {
  const [hutangList, setHutangList] = useState(() => {
    try {
      const saved = localStorage.getItem(HUTANG_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (e) {
      console.error('Error loading hutang:', e)
    }
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem(HUTANG_STORAGE_KEY, JSON.stringify(hutangList))
    } catch (e) {
      console.error('Error saving hutang:', e)
    }
  }, [hutangList])

  /**
   * Tambah catatan hutang dari transaksi kasbon.
   * Dipanggil otomatis dari POSPage saat metode = kasbon.
   */
  const tambahHutang = useCallback(({ transaksi, pelanggan, kasir }) => {
    if (!transaksi || !transaksi.id) return null
    const maxId = hutangList.reduce((m, h) => Math.max(m, h.id), 0)
    const newHutang = {
      id: maxId + 1,
      nomorHutang: `HT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(maxId + 1).padStart(3, '0')}`,
      pelanggan: pelanggan?.trim() || 'Pelanggan',
      kasir: kasir || 'Kasir',
      nominal: Number(transaksi.total),
      tanggal: new Date().toISOString(),
      nomorTransaksi: transaksi.id,
      items: transaksi.items,
      status: 'belum_lunas', // 'belum_lunas' | 'lunas'
      tanggalLunas: null,
      catatan: '',
    }
    setHutangList(prev => [newHutang, ...prev])
    return newHutang
  }, [hutangList])

  /**
   * Batalkan catatan hutang berdasarkan nomor transaksi jika transaksi dibatalkan
   */
  const batalkanHutangByTransaksi = useCallback((nomorTransaksi) => {
    setHutangList(prev => prev.filter(h => h.nomorTransaksi !== nomorTransaksi))
    return { error: null }
  }, [])

  /**
   * Tandai hutang sebagai lunas
   */
  const lunasiHutang = useCallback((id, catatan) => {
    setHutangList(prev =>
      prev.map(h =>
        h.id === id
          ? {
              ...h,
              status: 'lunas',
              tanggalLunas: new Date().toISOString(),
              catatan: catatan || h.catatan,
            }
          : h
      )
    )
    return { error: null }
  }, [])

  /**
   * Hapus catatan hutang (hanya yang sudah lunas atau oleh admin)
   */
  const hapusHutang = useCallback((id) => {
    setHutangList(prev => prev.filter(h => h.id !== id))
    return { error: null }
  }, [])

  /**
   * Edit catatan hutang
   */
  const editHutang = useCallback((id, updates) => {
    setHutangList(prev =>
      prev.map(h => h.id === id ? { ...h, ...updates } : h)
    )
    return { error: null }
  }, [])

  // Metrics ringkasan
  const metrics = useMemo(() => {
    const belumLunas = hutangList.filter(h => h.status === 'belum_lunas')
    const lunas = hutangList.filter(h => h.status === 'lunas')
    const totalHutang = belumLunas.reduce((s, h) => s + h.nominal, 0)
    const totalLunas = lunas.reduce((s, h) => s + h.nominal, 0)

    return {
      totalCatatan: hutangList.length,
      jumlahBelumLunas: belumLunas.length,
      jumlahLunas: lunas.length,
      totalHutangBelumLunas: totalHutang,
      totalSudahLunas: totalLunas,
    }
  }, [hutangList])

  return (
    <HutangContext.Provider
      value={{
        hutangList,
        tambahHutang,
        lunasiHutang,
        hapusHutang,
        batalkanHutangByTransaksi,
        editHutang,
        metrics,
      }}
    >
      {children}
    </HutangContext.Provider>
  )
}

export function useHutang() {
  const ctx = useContext(HutangContext)
  if (!ctx) throw new Error('useHutang harus digunakan di dalam HutangProvider')
  return ctx
}
