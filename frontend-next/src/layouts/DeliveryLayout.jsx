import { useRouter } from 'next/router'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { LayoutDashboard, Package, LogOut } from 'lucide-react'
import { logoutUser } from '../redux/slices/authSlice'
import { initializeDeliverySocketConnection, disconnectSocketConnection } from '../redux/slices/adminSlice'
import { useState, useEffect } from 'react'
import OrderNotification from '../components/admin/OrderNotification'

export default function DeliveryLayout({ children }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const { user } = useSelector(s => s.auth)
  const { socket } = useSelector(s => s.admin)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize socket connection when delivery person logs in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && user?.role === 'delivery') {
      dispatch(initializeDeliverySocketConnection({ token }));
    }

    return () => {
      dispatch(disconnectSocketConnection());
    };
  }, [dispatch, user]);

  const handleLogout = () => { 
    dispatch(logoutUser()); 
    router.push('/login') 
  }

  // Prevent hydration mismatch by rendering a loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm px-4 py-4 flex items-center gap-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🛵</span>
          </div>
          <span className="font-display font-bold text-gray-900 flex-1">Meal-Box Delivery</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:block">Loading...</span>
            <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <nav className="bg-white border-b border-gray-100 px-4 flex gap-1">
          {[
            { href: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/delivery/orders', label: 'Orders', icon: Package },
          ].map(({ href, label, icon: Icon }) => (
            <div key={href} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500">
              <Icon size={16} /> {label}
            </div>
          ))}
        </nav>
        <main className="p-4 max-w-2xl mx-auto">
          {children}
        </main>
        <OrderNotification />
      </div>
    )
  }

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
          { href: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/delivery/orders', label: 'Orders', icon: Package },
        ].map(({ href, label, icon: Icon }) => {
          const isActive = router.pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              <Icon size={16} /> {label}
            </Link>
          )
        })}
      </nav>
      <main className="p-4 max-w-2xl mx-auto">
        {children}
        {/* Test notification sound button - remove in production */}
        <button 
          onClick={() => window.playNotificationSound?.()}
          className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg z-40"
          title="Test notification sound"
        >
          🔔
        </button>
      </main>
      <OrderNotification role="delivery" />
    </div>
  )
}
