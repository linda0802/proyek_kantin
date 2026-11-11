import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ToastProvider } from './context/ToastContext'
import { ProdukProvider } from './context/ProdukContext'
import { TransaksiProvider } from './context/TransaksiContext'
import { TitipanProvider } from './context/TitipanContext'
import { HutangProvider } from './context/HutangContext'
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
import HutangPage from './pages/Hutang/HutangPage'

import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <ProdukProvider>
              <TransaksiProvider>
                <TitipanProvider>
                  <HutangProvider>
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

                        {/* Kasir / POS */}
                        <Route path="kasir" element={<POSPage />} />

                        {/* Riwayat Transaksi */}
                        <Route path="transaksi" element={<TransaksiPage />} />

                        {/* Data Produk */}
                        <Route path="produk" element={<ProdukPage />} />

                        {/* Manajemen Stok */}
                        <Route path="stok" element={<StokPage />} />

                        {/* Laporan Penjualan */}
                        <Route path="laporan" element={<LaporanPage />} />

                        {/* Tutup Kas */}
                        <Route path="tutup-kas" element={<TutupKasPage />} />

                        {/* Pengguna (admin only) */}
                        <Route
                          path="pengguna"
                          element={
                            <ProtectedRoute requireAdmin>
                              <PenggunaPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Pengaturan */}
                        <Route path="pengaturan" element={<PengaturanPage />} />

                        {/* Fitur Opsional — Barang Titipan (Konsinyasi) */}
                        <Route
                          path="titipan"
                          element={
                            <ProtectedRoute requirePermission="titipan">
                              <TitipanPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Fitur Opsional — Catatan Hutang / Kasbon */}
                        <Route
                          path="utang"
                          element={
                            <ProtectedRoute requirePermission="hutang">
                              <HutangPage />
                            </ProtectedRoute>
                          }
                        />

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
                          path="pemasok"
                          element={<PlaceholderPage title="Manajemen Pemasok" icon="🚚" description="Daftar kontak pemasok bahan baku dan jadwal pengiriman." />}
                        />

                        {/* 404 dalam shell */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Route>

                      {/* 404 global */}
                      <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                  </HutangProvider>
                </TitipanProvider>
              </TransaksiProvider>
            </ProdukProvider>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
