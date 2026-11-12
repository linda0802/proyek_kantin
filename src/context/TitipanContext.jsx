import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const TITIPAN_STORAGE_KEY = 'kantinku_titipan'

const TitipanContext = createContext(null)

export function TitipanProvider({ children }) {
  const [titipanList, setTitipanList] = useState(() => {
    try {
      const saved = localStorage.getItem(TITIPAN_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Jika data lama adalah data dummy (ada 'Risoles Mayo Daging'), bersihkan
        const isDummy =
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed[0]?.namaProduk === 'Risoles Mayo Daging'
        if (isDummy) {
          localStorage.removeItem(TITIPAN_STORAGE_KEY)
          return []
        }
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (e) {
      console.error('Error loading titipan:', e)
    }
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem(TITIPAN_STORAGE_KEY, JSON.stringify(titipanList))
    } catch (e) {
      console.error('Error saving titipan:', e)
    }
  }, [titipanList])

  // Tambah titipan baru
  const tambahTitipan = useCallback((data) => {
    const maxId = titipanList.reduce((m, t) => Math.max(m, t.id), 0)
    const newItem = {
      id: maxId + 1,
      namaProduk: data.namaProduk.trim(),
      penitip: data.penitip.trim(),
      kontak: data.kontak?.trim() || '',
      hargaJual: parseInt(data.hargaJual, 10) || 0,
      hargaSetor: parseInt(data.hargaSetor, 10) || 0,
      jumlahTitip: parseInt(data.jumlahTitip, 10) || 0,
      terjual: 0,
      retur: 0,
      statusBayar: 'belum',
      tanggal: new Date().toISOString(),
    }
    setTitipanList(prev => [newItem, ...prev])
    return newItem
  }, [titipanList])

  // Update rekap retur
  const updateRekap = useCallback((id, returNum) => {
    setTitipanList(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              retur: returNum,
              terjual: Math.max(0, item.jumlahTitip - returNum),
            }
          : item
      )
    )
  }, [])

  // Toggle status bayar
  const toggleStatusBayar = useCallback((id) => {
    setTitipanList(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, statusBayar: item.statusBayar === 'lunas' ? 'belum' : 'lunas' }
          : item
      )
    )
  }, [])

  // Hapus titipan
  const hapusTitipan = useCallback((id) => {
    setTitipanList(prev => prev.filter(item => item.id !== id))
  }, [])

  // Kurangi stok titipan saat terjual di kasir
  const kurangiStokTitipan = useCallback((titipanId, jumlah) => {
    setTitipanList(prev =>
      prev.map(item => {
        if (item.id === titipanId) {
          const terjualBaru = item.terjual + jumlah
          return { ...item, terjual: terjualBaru }
        }
        return item
      })
    )
  }, [])

  // Kembalikan stok titipan saat transaksi dibatalkan
  const kembalikanStokTitipan = useCallback((titipanId, jumlah) => {
    setTitipanList(prev =>
      prev.map(item => {
        if (item.id === titipanId) {
          const terjualBaru = Math.max(0, item.terjual - (jumlah || 1))
          return { ...item, terjual: terjualBaru }
        }
        return item
      })
    )
  }, [])

  // Produk titipan yang masih tersedia (stok > 0)
  const produkTitipanTersedia = useMemo(() => {
    return titipanList
      .filter(item => {
        const sisaStok = item.jumlahTitip - item.terjual - item.retur
        return sisaStok > 0
      })
      .map(item => ({
        // Format agar kompatibel dengan format produk di POS
        id: `titipan-${item.id}`,
        titipanId: item.id,
        nama: item.namaProduk,
        penitip: item.penitip,
        hargaJual: item.hargaJual,
        hargaModal: item.hargaSetor,
        stok: item.jumlahTitip - item.terjual - item.retur,
        status: 'tersedia',
        isTitipan: true,
        kategoriId: null,
      }))
  }, [titipanList])

  // Metrics ringkasan
  const metrics = useMemo(() => {
    let totalUnitTitip = 0
    let totalUnitTerjual = 0
    let totalUangSetoran = 0
    let totalKomisiKantin = 0

    titipanList.forEach(item => {
      totalUnitTitip += item.jumlahTitip
      totalUnitTerjual += item.terjual
      totalUangSetoran += item.terjual * item.hargaSetor
      totalKomisiKantin += item.terjual * (item.hargaJual - item.hargaSetor)
    })

    return {
      totalMacam: titipanList.length,
      totalUnitTitip,
      totalUnitTerjual,
      totalUangSetoran,
      totalKomisiKantin,
    }
  }, [titipanList])

  return (
    <TitipanContext.Provider
      value={{
        titipanList,
        tambahTitipan,
        updateRekap,
        toggleStatusBayar,
        hapusTitipan,
        kurangiStokTitipan,
        kembalikanStokTitipan,
        produkTitipanTersedia,
        metrics,
      }}
    >
      {children}
    </TitipanContext.Provider>
  )
}

export function useTitipan() {
  const ctx = useContext(TitipanContext)
  if (!ctx) throw new Error('useTitipan harus digunakan di dalam TitipanProvider')
  return ctx
}
