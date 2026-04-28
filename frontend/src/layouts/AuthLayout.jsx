import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function AuthLayout() {
  const { isAuthenticated, user } = useSelector(s => s.auth)
  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user?.role === 'delivery') return <Navigate to="/delivery/dashboard" replace />
    return <Navigate to="/" replace />
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center">
              <span className="text-white text-xl">🍱</span>
            </div>
            <span className="font-display text-2xl font-bold text-gray-900 dark:text-white">Meal-Box</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Fresh food, fast delivery</p>
        </div>
        <div className="card p-8 shadow-xl">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
