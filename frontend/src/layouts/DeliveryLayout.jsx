import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { LayoutDashboard, Package, LogOut } from 'lucide-react'
import { logoutUser } from '../redux/slices/authSlice'

export default function DeliveryLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const handleLogout = () => { dispatch(logoutUser()); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow-sm px-4 py-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm">🛵</span>
        </div>
        <span className="font-display font-bold text-gray-900 dark:text-white flex-1">Meal-Box Delivery</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.name}</span>
          <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 flex gap-1">
        {[
          { to: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/delivery/orders', label: 'Orders', icon: Package },
        ].map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>
      <main className="p-4 max-w-2xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
