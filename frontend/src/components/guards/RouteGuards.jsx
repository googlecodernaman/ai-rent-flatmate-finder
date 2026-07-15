import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function RequireAuth({ children, role }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && user.role !== role) {
    // Redirect to their correct dashboard
    if (user.role === 'TENANT') return <Navigate to="/dashboard" replace />
    if (user.role === 'OWNER') return <Navigate to="/my-listings" replace />
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  }

  return children
}

export function RequireGuest({ children }) {
  const { user } = useAuth()

  if (user) {
    if (user.role === 'TENANT') return <Navigate to="/dashboard" replace />
    if (user.role === 'OWNER') return <Navigate to="/my-listings" replace />
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  }

  return children
}
