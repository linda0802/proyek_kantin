/**
 * mockData.js — Data inisial KantinKu (Kosong sesuai spesifikasi)
 * Seluruh data menggunakan data riil yang diinput pengguna.
 */

// Kategori Default
export const KATEGORI = [
  { id: 1, nama: 'Makanan' },
  { id: 2, nama: 'Minuman' },
  { id: 3, nama: 'Camilan' },
  { id: 4, nama: 'Lainnya' },
]

export const PRODUK = []
export const TRANSAKSI_HARI_INI = []
export const PRODUK_TERLARIS = []
export const STOK_MENIPIS = []
export const STOK_HABIS = []
export const GRAFIK_PER_JAM = []
export const SUMMARY_HARI_INI = {
  totalPenjualan: 0,
  jumlahTransaksi: 0,
  stokMenipis: 0,
  stokHabis: 0,
}
