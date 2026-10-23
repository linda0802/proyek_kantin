/**
 * currency.js — Utility format mata uang Rupiah
 * Menggunakan integer (dalam rupiah penuh) untuk menghindari floating point error.
 */

/**
 * Format angka ke format Rupiah
 * @param {number} amount - nilai dalam rupiah (integer)
 * @returns {string} "Rp 10.000"
 */
export function formatRupiah(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}

/**
 * Parse string rupiah ke integer
 * "Rp 10.000" → 10000
 * @param {string} str
 * @returns {number}
 */
export function parseRupiah(str) {
  if (!str) return 0
  return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0
}

/**
 * Hitung kembalian
 * @param {number} total - total yang harus dibayar
 * @param {number} diterima - uang yang diterima
 * @returns {number} kembalian (min 0)
 */
export function hitungKembalian(total, diterima) {
  const kembalian = diterima - total
  return kembalian < 0 ? 0 : Math.round(kembalian)
}

/**
 * Format angka sederhana dengan pemisah ribuan
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  if (n === null || n === undefined) return '0'
  return new Intl.NumberFormat('id-ID').format(Math.round(n))
}
