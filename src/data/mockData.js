/**
 * mockData.js — Data mock untuk development KantinKu
 * Digunakan selama belum ada backend.
 * Format sesuai struktur PRD.
 */

// ===== KATEGORI =====
export const KATEGORI = [
  { id: 1, nama: 'Makanan' },
  { id: 2, nama: 'Minuman' },
  { id: 3, nama: 'Camilan' },
  { id: 4, nama: 'Lainnya' },
]

// ===== PRODUK =====
export const PRODUK = [
  { id: 1, nama: 'Nasi Goreng', kategoriId: 1, hargaJual: 12000, hargaModal: 7000, stok: 25, status: 'tersedia', foto: null },
  { id: 2, nama: 'Mie Goreng', kategoriId: 1, hargaJual: 10000, hargaModal: 6000, stok: 18, status: 'tersedia', foto: null },
  { id: 3, nama: 'Ayam Geprek', kategoriId: 1, hargaJual: 15000, hargaModal: 9000, stok: 12, status: 'tersedia', foto: null },
  { id: 4, nama: 'Bakso', kategoriId: 1, hargaJual: 10000, hargaModal: 5500, stok: 3, status: 'tersedia', foto: null },
  { id: 5, nama: 'Es Teh Manis', kategoriId: 2, hargaJual: 5000, hargaModal: 1500, stok: 40, status: 'tersedia', foto: null },
  { id: 6, nama: 'Es Jeruk', kategoriId: 2, hargaJual: 6000, hargaModal: 2000, stok: 30, status: 'tersedia', foto: null },
  { id: 7, nama: 'Air Mineral', kategoriId: 2, hargaJual: 4000, hargaModal: 2500, stok: 50, status: 'tersedia', foto: null },
  { id: 8, nama: 'Jus Alpukat', kategoriId: 2, hargaJual: 8000, hargaModal: 4000, stok: 5, status: 'tersedia', foto: null },
  { id: 9, nama: 'Keripik Singkong', kategoriId: 3, hargaJual: 5000, hargaModal: 2500, stok: 20, status: 'tersedia', foto: null },
  { id: 10, nama: 'Biscuit Roma', kategoriId: 3, hargaJual: 4000, hargaModal: 2000, stok: 2, status: 'tersedia', foto: null },
  { id: 11, nama: 'Coklat Silverqueen', kategoriId: 3, hargaJual: 7000, hargaModal: 4500, stok: 8, status: 'tersedia', foto: null },
  { id: 12, nama: 'Indomie Rebus', kategoriId: 1, hargaJual: 8000, hargaModal: 4000, stok: 0, status: 'habis', foto: null },
]

// ===== TRANSAKSI HARI INI (mock) =====
const today = new Date()
const todayStr = today.toISOString()

export const TRANSAKSI_HARI_INI = [
  {
    id: 'TRX-20261023-001',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 30).toISOString(),
    kasir: 'Siti Kasir',
    metodePembayaran: 'tunai',
    status: 'selesai',
    items: [
      { produkId: 1, nama: 'Nasi Goreng', hargaJual: 12000, jumlah: 2 },
      { produkId: 5, nama: 'Es Teh Manis', hargaJual: 5000, jumlah: 2 },
    ],
    total: 34000,
  },
  {
    id: 'TRX-20261023-002',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 10).toISOString(),
    kasir: 'Siti Kasir',
    metodePembayaran: 'non-tunai',
    status: 'selesai',
    items: [
      { produkId: 3, nama: 'Ayam Geprek', hargaJual: 15000, jumlah: 1 },
      { produkId: 6, nama: 'Es Jeruk', hargaJual: 6000, jumlah: 1 },
    ],
    total: 21000,
  },
  {
    id: 'TRX-20261023-003',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 45).toISOString(),
    kasir: 'Admin KantinKu',
    metodePembayaran: 'tunai',
    status: 'selesai',
    items: [
      { produkId: 5, nama: 'Es Teh Manis', hargaJual: 5000, jumlah: 3 },
      { produkId: 9, nama: 'Keripik Singkong', hargaJual: 5000, jumlah: 2 },
    ],
    total: 25000,
  },
  {
    id: 'TRX-20261023-004',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 15).toISOString(),
    kasir: 'Siti Kasir',
    metodePembayaran: 'tunai',
    status: 'selesai',
    items: [
      { produkId: 2, nama: 'Mie Goreng', hargaJual: 10000, jumlah: 2 },
      { produkId: 7, nama: 'Air Mineral', hargaJual: 4000, jumlah: 2 },
    ],
    total: 28000,
  },
  {
    id: 'TRX-20261023-005',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(),
    kasir: 'Siti Kasir',
    metodePembayaran: 'non-tunai',
    status: 'selesai',
    items: [
      { produkId: 1, nama: 'Nasi Goreng', hargaJual: 12000, jumlah: 3 },
      { produkId: 5, nama: 'Es Teh Manis', hargaJual: 5000, jumlah: 3 },
      { produkId: 9, nama: 'Keripik Singkong', hargaJual: 5000, jumlah: 1 },
    ],
    total: 56000,
  },
  {
    id: 'TRX-20261023-006',
    tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 5).toISOString(),
    kasir: 'Siti Kasir',
    metodePembayaran: 'tunai',
    status: 'batal',
    items: [
      { produkId: 4, nama: 'Bakso', hargaJual: 10000, jumlah: 1 },
    ],
    total: 10000,
    alasanBatal: 'Produk tidak tersedia',
  },
]

// ===== PRODUK TERLARIS (agregasi dari transaksi) =====
export const PRODUK_TERLARIS = [
  { produkId: 1, nama: 'Nasi Goreng', kategori: 'Makanan', terjual: 5, omzet: 60000 },
  { produkId: 5, nama: 'Es Teh Manis', kategori: 'Minuman', terjual: 8, omzet: 40000 },
  { produkId: 2, nama: 'Mie Goreng', kategori: 'Makanan', terjual: 2, omzet: 20000 },
  { produkId: 3, nama: 'Ayam Geprek', kategori: 'Makanan', terjual: 1, omzet: 15000 },
  { produkId: 9, nama: 'Keripik Singkong', kategori: 'Camilan', terjual: 3, omzet: 15000 },
]

// ===== STOK HAMPIR HABIS (stok <= 5) =====
export const STOK_MENIPIS = PRODUK.filter(p => p.stok <= 5 && p.status !== 'habis')
export const STOK_HABIS = PRODUK.filter(p => p.status === 'habis' || p.stok === 0)

// ===== DATA GRAFIK — penjualan per jam =====
export const GRAFIK_PER_JAM = [
  { jam: '07:00', penjualan: 34000, transaksi: 1 },
  { jam: '08:00', penjualan: 21000, transaksi: 1 },
  { jam: '09:00', penjualan: 25000, transaksi: 1 },
  { jam: '10:00', penjualan: 28000, transaksi: 1 },
  { jam: '11:00', penjualan: 56000, transaksi: 1 },
  { jam: '12:00', penjualan: 0, transaksi: 0 },
  { jam: '13:00', penjualan: 0, transaksi: 0 },
]

// ===== SUMMARY HARI INI =====
const transaksiSelesai = TRANSAKSI_HARI_INI.filter(t => t.status === 'selesai')

export const SUMMARY_HARI_INI = {
  totalPenjualan: transaksiSelesai.reduce((sum, t) => sum + t.total, 0),
  jumlahTransaksi: transaksiSelesai.length,
  estimasiLaba: transaksiSelesai.reduce((sum, t) => {
    return sum + t.items.reduce((s, item) => {
      const produk = PRODUK.find(p => p.id === item.produkId)
      return s + (produk ? (item.hargaJual - produk.hargaModal) * item.jumlah : 0)
    }, 0)
  }, 0),
  stokMenipis: STOK_MENIPIS.length,
  stokHabis: STOK_HABIS.length,
}
