import { createContext, useContext, useState, useEffect } from 'react'

/**
 * SettingsContext — Pengaturan sistem dan toggle fitur opsional
 */
const SettingsContext = createContext(null)

const DEFAULT_SETTINGS = {
  // Informasi toko
  namaToko: 'KantinKu',
  alamat: '',
  telepon: '',

  // Preferensi
  mataPembayaranDefault: 'tunai',
  formatTanggal: 'id-ID',

  // Toggle fitur opsional (PRD §6 & Titipan Konsinyasi)
  optionalFeatures: {
    barangTitipan: true,
    rekapIstirahat: false,
    makananTerbuang: false,
    catatanUtang: false,
    manajemenPemasok: false,
  },

  // Stok
  stokMinimumDefault: 10,
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('kantinku_settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const updateSettings = (updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates }
      localStorage.setItem('kantinku_settings', JSON.stringify(next))
      return next
    })
  }

  const toggleFeature = (key) => {
    setSettings(prev => {
      const next = {
        ...prev,
        optionalFeatures: {
          ...prev.optionalFeatures,
          [key]: !prev.optionalFeatures[key],
        },
      }
      localStorage.setItem('kantinku_settings', JSON.stringify(next))
      return next
    })
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleFeature }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings harus digunakan di dalam SettingsProvider')
  return ctx
}
