import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ToastProvider } from './context/ToastContext'
import { ProdukProvider } from './context/ProdukContext'
import { TransaksiProvider } from './context/TransaksiContext'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/shared/ProtectedRoute'
import PlaceholderPage from './components/shared/PlaceholderPage'
import LoginPage from './pages/Auth/LoginPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import POSPage from './pages/POS/POSPage'
import ProdukPage from './pages/Produk/ProdukPage'
import TransaksiPage from './pages/Transaksi/TransaksiPage'
import StokPage from './pages/Stok/StokPage'
import LaporanPage from './pages/Laporan/LaporanPage'
import TutupKasPage from './pages/TutupKas/TutupKasPage'
import PenggunaPage from './pages/Pengguna/PenggunaPage'
import PengaturanPage from './pages/Pengaturan/PengaturanPage'
import TitipanPage from './pages/Titipan/TitipanPage'

import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <ProdukProvider>
              <TransaksiProvider>
                <Routes>
                  {/* Public */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected — Shell */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    {/* Dashboard */}
                    <Route index element={<DashboardPage />} />

                    {/* Phase 3 — POS ✅ */}
                    <Route path="kasir" element={<POSPage />} />

                    {/* Phase 5 — Transaksi ✅ */}
                    <Route path="transaksi" element={<TransaksiPage />} />

                    {/* Phase 4 — Produk ✅ */}
                    <Route path="produk" element={<ProdukPage />} />

                    {/* Phase 6 — Stok ✅ */}
                    <Route path="stok" element={<StokPage />} />

                    {/* Phase 7 — Laporan ✅ */}
                    <Route path="laporan" element={<LaporanPage />} />

                    {/* Phase 8 — Tutup Kas ✅ */}
                    <Route path="tutup-kas" element={<TutupKasPage />} />

                    {/* Phase 8 — Pengguna (admin only) ✅ */}
                    <Route
                      path="pengguna"
                      element={
                        <ProtectedRoute requireAdmin>
                          <PenggunaPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Phase 8 — Pengaturan ✅ */}
                    <Route path="pengaturan" element={<PengaturanPage />} />

                    {/* Fitur Opsional — Barang Titipan (Konsinyasi) */}
                    <Route path="titipan" element={<TitipanPage />} />

                    {/* Fitur Opsional Lainnya (Placeholders) */}
                    <Route
                      path="laporan/istirahat"
                      element={<PlaceholderPage title="Rekap Istirahat" icon="⏰" description="Rekapitulasi penjualan per jam istirahat sekolah." />}
                    />
                    <Route
                      path="stok/terbuang"
                      element={<PlaceholderPage title="Catatan Makanan Terbuang" icon="🗑️" description="Pencatatan sisa makanan kedaluwarsa atau terbuang." />}
                    />
                    <Route
                      path="utang"
                      element={<PlaceholderPage title="Catatan Utang / Bon" icon="📝" description="Buku catatan utang pelanggan dan jatuh tempo pembayaran." />}
                    />
                    <Route
                      path="pemasok"
                      element={<PlaceholderPage title="Manajemen Pemasok" icon="🚚" description="Daftar kontak pemasok bahan baku dan jadwal pengiriman." />}
                    />

                    {/* 404 dalam shell */}
                    <Route path="*" element={<Navigate to="/" replace />} />
              </Route>

              {/* 404 global */}
              <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </TransaksiProvider>
            </ProdukProvider>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
