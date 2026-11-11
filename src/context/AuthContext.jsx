import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const USERS_STORAGE_KEY = 'kantinku_users'

const INITIAL_USERS = [
  {
    id: 1,
    name: 'Admin KantinKu',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    status: 'aktif',
    permissions: {
      hutang: true,
      titipan: true,
    },
    terakhirLogin: null,
  },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usersList, setUsersList] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Jika data lama adalah data dummy (ada user 'kasir' atau 'budi'), bersihkan
          const isDummy = parsed.some(u => u.username === 'kasir' || u.username === 'budi')
          if (isDummy) {
            localStorage.removeItem(USERS_STORAGE_KEY)
            return INITIAL_USERS
          }
          // Pastikan setiap user memiliki struktur permissions lengkap
          return parsed.map(u => ({
            ...u,
            permissions: {
              hutang: u.role === 'admin' ? true : (u.permissions?.hutang ?? true),
              titipan: u.role === 'admin' ? true : (u.permissions?.titipan ?? true),
            },
          }))
        }
      }
    } catch (e) {
      console.error('Error loading users:', e)
    }
    return INITIAL_USERS
  })

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kantinku_user')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Refresh permissions dari usersList jika ada
        return parsed
      }
    } catch {
      return null
    }
    return null
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList))
    } catch (e) {
      console.error('Error saving users:', e)
    }
  }, [usersList])

  // Sinkronkan state user yang sedang login jika datanya di usersList berubah
  useEffect(() => {
    if (user) {
      const currentInList = usersList.find(u => u.id === user.id)
      if (currentInList) {
        const { password: _, ...safeUser } = currentInList
        // Cek jika permissions atau nama atau role berubah
        if (JSON.stringify(safeUser) !== JSON.stringify(user)) {
          setUser(safeUser)
          localStorage.setItem('kantinku_user', JSON.stringify(safeUser))
        }
      }
    }
  }, [usersList, user])

  const login = async ({ username, password }) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(r => setTimeout(r, 300))

      const found = usersList.find(
        u =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          u.password === password
      )

      if (!found) {
        throw new Error('Username atau password salah.')
      }

      if (found.status === 'nonaktif') {
        throw new Error('Akun ini telah dinonaktifkan oleh administrator.')
      }

      // Update terakhir login
      const updatedUser = {
        ...found,
        terakhirLogin: new Date().toISOString(),
      }
      setUsersList(prev => prev.map(u => u.id === found.id ? updatedUser : u))

      const { password: _, ...safeUser } = updatedUser
      setUser(safeUser)
      localStorage.setItem('kantinku_user', JSON.stringify(safeUser))
      return safeUser
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('kantinku_user')
  }

  // ── USER MANAGEMENT (Admin) ──
  const tambahUser = useCallback((userData) => {
    const existing = usersList.some(u => u.username.toLowerCase() === userData.username.trim().toLowerCase())
    if (existing) return { error: 'Username sudah digunakan, silakan pilih username lain.' }

    setUsersList(prev => {
      const maxId = prev.reduce((m, u) => Math.max(m, u.id), 0)
      const role = userData.role || 'kasir'
      const newUser = {
        id: maxId + 1,
        name: userData.name.trim(),
        username: userData.username.trim().toLowerCase(),
        password: userData.password || 'password',
        role,
        status: 'aktif',
        permissions: {
          hutang: role === 'admin' ? true : !!userData.permissions?.hutang,
          titipan: role === 'admin' ? true : !!userData.permissions?.titipan,
        },
        terakhirLogin: null,
      }
      return [...prev, newUser]
    })
    return { error: null }
  }, [usersList])

  const editUser = useCallback((id, updates) => {
    // Check duplicate username if username is changing
    if (updates.username) {
      const existing = usersList.some(
        u => u.id !== id && u.username.toLowerCase() === updates.username.trim().toLowerCase()
      )
      if (existing) return { error: 'Username sudah digunakan oleh akun lain.' }
    }

    setUsersList(prev =>
      prev.map(u => {
        if (u.id === id) {
          const next = { ...u, ...updates }
          if (updates.name) next.name = updates.name.trim()
          if (updates.username) next.username = updates.username.trim().toLowerCase()
          if (updates.password && updates.password.trim()) next.password = updates.password.trim()
          if (updates.permissions) {
            next.permissions = {
              hutang: next.role === 'admin' ? true : !!updates.permissions.hutang,
              titipan: next.role === 'admin' ? true : !!updates.permissions.titipan,
            }
          }
          return next
        }
        return u
      })
    )

    return { error: null }
  }, [usersList])

  const hapusUser = useCallback((id) => {
    if (user && user.id === id) {
      return { error: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.' }
    }
    setUsersList(prev => prev.filter(u => u.id !== id))
    return { error: null }
  }, [user])

  const toggleStatusUser = useCallback((id) => {
    if (user && user.id === id) {
      return { error: 'Tidak dapat menonaktifkan akun yang sedang aktif digunakan.' }
    }
    setUsersList(prev =>
      prev.map(u =>
        u.id === id
          ? { ...u, status: u.status === 'aktif' ? 'nonaktif' : 'aktif' }
          : u
      )
    )
    return { error: null }
  }, [user])

  // Cek izin fitur per user (Admin selalu lolos)
  const hasPermission = useCallback((featureName) => {
    if (!user) return false
    if (user.role === 'admin') return true
    return !!user.permissions?.[featureName]
  }, [user])

  const isAdmin = user?.role === 'admin'
  const isKasir = user?.role === 'kasir'
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        usersList,
        login,
        logout,
        loading,
        error,
        isAdmin,
        isKasir,
        isAuthenticated,
        hasPermission,
        // CRUD User
        tambahUser,
        editUser,
        hapusUser,
        toggleStatusUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider')
  return ctx
}
