import { useState, useCallback } from 'react'
import { hitungKembalian } from '../utils/currency'
import { generateNomorTransaksi } from '../utils/date'
import { useTransaksiContext } from '../context/TransaksiContext'

/**
 * useCart — state management keranjang belanja POS
 */
export function useCart() {
  const [items, setItems] = useState([]) // [{ produk, jumlah }]

  // Tambah produk ke keranjang
  const tambahItem = useCallback((produk) => {
    if (produk.status === 'habis' || produk.stok === 0) return
    setItems(prev => {
      const existing = prev.find(i => i.produk.id === produk.id)
      if (existing) {
        // Jangan melebihi stok
        if (existing.jumlah >= produk.stok) return prev
        return prev.map(i =>
          i.produk.id === produk.id ? { ...i, jumlah: i.jumlah + 1 } : i
        )
      }
      return [...prev, { produk, jumlah: 1 }]
    })
  }, [])

  // Kurangi jumlah (hapus jika jadi 0)
  const kurangiItem = useCallback((produkId) => {
    setItems(prev =>
      prev
        .map(i => i.produk.id === produkId ? { ...i, jumlah: i.jumlah - 1 } : i)
        .filter(i => i.jumlah > 0)
    )
  }, [])

  // Set jumlah langsung
  const setJumlah = useCallback((produkId, jumlah, stok) => {
    const n = parseInt(jumlah, 10)
    if (isNaN(n) || n < 0) return
    if (n === 0) {
      setItems(prev => prev.filter(i => i.produk.id !== produkId))
      return
    }
    setItems(prev =>
      prev.map(i =>
        i.produk.id === produkId
          ? { ...i, jumlah: Math.min(n, stok) }
          : i
      )
    )
  }, [])

  // Hapus item dari keranjang
  const hapusItem = useCallback((produkId) => {
    setItems(prev => prev.filter(i => i.produk.id !== produkId))
  }, [])

  // Kosongkan keranjang
  const kosongkanKeranjang = useCallback(() => setItems([]), [])

  // Kalkulasi total
  const subTotal = items.reduce((sum, i) => sum + i.produk.hargaJual * i.jumlah, 0)
  const totalItem = items.reduce((sum, i) => sum + i.jumlah, 0)

  return {
    items,
    tambahItem,
    kurangiItem,
    setJumlah,
    hapusItem,
    kosongkanKeranjang,
    subTotal,
    totalItem,
    isEmpty: items.length === 0,
  }
}

/**
 * useTransaksi — hook simpan transaksi melalui TransaksiContext
 */
export function useTransaksi() {
  const { simpanTransaksi } = useTransaksiContext()
  return { simpanTransaksi }
}
