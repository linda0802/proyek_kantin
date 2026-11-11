import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * ProtectedRoute — Redirect ke /login jika belum login.
 * Menegakkan izin akses role admin dan permission fitur individual (hutang, titipan).
 */
export default function ProtectedRoute({ children, requireAdmin = false, requirePermission = null }) {
  const { isAuthenticated, isAdmin, hasPermission } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  if (requirePermission && !isAdmin && !hasPermission(requirePermission)) {
    return <Navigate to="/" replace />
  }

  return children
}
