import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useSelector(s => s.auth)
  const token = localStorage.getItem('accessToken')

  if (!isAuthenticated && !token) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}
