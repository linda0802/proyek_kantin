/**
 * date.js — Utility format tanggal/waktu untuk KantinKu
 */

const LOCALE = 'id-ID'

/**
 * Format tanggal panjang: "Senin, 23 Oktober 2026"
 */
export function formatTanggalPanjang(date) {
  return new Date(date).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format tanggal pendek: "23 Okt 2026"
 */
export function formatTanggal(date) {
  return new Date(date).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const formatTanggalPendek = formatTanggal

/**
 * Format waktu: "14:30"
 */
export function formatWaktu(date) {
  return new Date(date).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format tanggal + waktu: "23 Okt 2026, 14:30"
 */
export function formatTanggalWaktu(date) {
  const d = new Date(date)
  return `${formatTanggal(d)}, ${formatWaktu(d)}`
}

/**
 * Tanggal hari ini dalam format "YYYY-MM-DD" (untuk filter)
 */
export function hariIni() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Cek apakah date adalah hari ini
 */
export function isHariIni(date) {
  const d = new Date(date)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

/**
 * Generate nomor transaksi: "TRX-20261023-001"
 */
export function generateNomorTransaksi(counter = 1) {
  const now = new Date()
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(counter).padStart(3, '0')
  return `TRX-${ymd}-${seq}`
}
