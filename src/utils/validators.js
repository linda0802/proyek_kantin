/**
 * validators.js — Utility validasi form KantinKu
 */

/**
 * Field tidak boleh kosong
 */
export function required(value, label = 'Field') {
  if (value === null || value === undefined) return `${label} wajib diisi.`
  if (typeof value === 'string' && value.trim() === '') return `${label} wajib diisi.`
  return null
}

/**
 * Nilai harus berupa angka positif
 */
export function positiveNumber(value, label = 'Nilai') {
  const n = Number(value)
  if (isNaN(n)) return `${label} harus berupa angka.`
  if (n < 0) return `${label} tidak boleh negatif.`
  return null
}

/**
 * Nilai harus berupa angka positif > 0
 */
export function positiveNonZero(value, label = 'Nilai') {
  const n = Number(value)
  if (isNaN(n)) return `${label} harus berupa angka.`
  if (n <= 0) return `${label} harus lebih dari 0.`
  return null
}

/**
 * Panjang string minimum
 */
export function minLength(value, min, label = 'Field') {
  if (!value || value.length < min) return `${label} minimal ${min} karakter.`
  return null
}

/**
 * Panjang string maksimum
 */
export function maxLength(value, max, label = 'Field') {
  if (value && value.length > max) return `${label} maksimal ${max} karakter.`
  return null
}

/**
 * Jalankan array validator dan kembalikan error pertama
 * @param {*} value
 * @param {Function[]} validators
 * @returns {string|null}
 */
export function runValidators(value, validators) {
  for (const validator of validators) {
    const error = validator(value)
    if (error) return error
  }
  return null
}

/**
 * Validasi form object
 * @param {Object} data - { field: value }
 * @param {Object} rules - { field: [validators] }
 * @returns {Object} errors - { field: errorMsg | null }
 */
export function validateForm(data, rules) {
  const errors = {}
  for (const [field, validators] of Object.entries(rules)) {
    const error = runValidators(data[field], validators)
    if (error) errors[field] = error
  }
  return errors
}
