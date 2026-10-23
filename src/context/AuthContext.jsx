import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const USERS_STORAGE_KEY = 'kantinku_users'

const INITIAL_USERS = [
  {
    id: 1,
    name: 'Admin KantinKu',
    username: 'admin',
    password: 'password', // or admin123
    role: 'admin',
    status: 'aktif',
    terakhirLogin: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Siti Kasir',
    username: 'kasir',
    password: 'password', // or kasir123
    role: 'kasir',
    status: 'aktif',
    terakhirLogin: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Budi Santoso',
    username: 'budi',
    password: 'password',
    role: 'kasir',
    status: 'aktif',
    terakhirLogin: new Date(Date.now() - 86400000).toISOString(),
  },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kantinku_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [usersList, setUsersList] = useState(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error('Error loading users:', e)
    }
    return INITIAL_USERS
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

  const login = async ({ username, password }) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(r => setTimeout(r, 400))

      const found = usersList.find(
        u =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          (u.password === password ||
            (u.username === 'admin' && (password === 'admin123' || password === 'password')) ||
            (u.username === 'kasir' && (password === 'kasir123' || password === 'password')))
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
      const newUser = {
        id: maxId + 1,
        name: userData.name.trim(),
        username: userData.username.trim().toLowerCase(),
        password: userData.password || 'password',
        role: userData.role || 'kasir',
        status: 'aktif',
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
          return next
        }
        return u
      })
    )

    // Jika yang diedit adalah user yang sedang login, update safeUser di state
    if (user && user.id === id) {
      setUser(prev => ({
        ...prev,
        name: updates.name ? updates.name.trim() : prev.name,
        role: updates.role || prev.role,
      }))
    }

    return { error: null }
  }, [usersList, user])

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
