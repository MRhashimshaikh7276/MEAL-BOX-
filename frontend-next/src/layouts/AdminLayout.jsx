import { useRouter } from 'next/router'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Menu, Combine, LogOut, ChevronRight, Moon, Sun, Settings, BarChart3, PlusCircle, Calendar } from 'lucide-react'
import { logoutUser } from '../redux/slices/authSlice'
import { toggleTheme } from '../redux/slices/uiSlice'
import { initializeSocketConnection, disconnectSocketConnection } from '../redux/slices/adminSlice'
import OrderNotification from '../components/admin/OrderNotification'
import { generalSettingsAPI } from '../services/api'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { to: '/admin/products', label: 'Products', icon: Package },
  {
    to: '/admin/categories',
    label: 'Categories',
    icon: Tag,
    subItems: [
      { to: '/admin/categories', label: ' Categories' },
      { to: '/admin/sub-categories', label: 'Sub Categories' },
      { to: '/admin/sub-sub-categories', label: 'Sub Sub Categories' },
    ],
  },
  { to: '/admin/add-ones', label: 'Add Ones', icon: PlusCircle },
  { to: '/admin/offers', label: 'Offers', icon: Tag },
  { to: '/admin/combos', label: 'Combos', icon: Combine },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', icon: Users },
  {
    to: '/admin/master-settings',
    label: 'Master Settings',
    icon: Settings,
    subItems: [
      { to: '/admin/general-settings', label: 'General Settings', icon: Settings },
      { to: '/admin/banner-sections', label: 'Banner Sections', icon: Settings },
    ],
  },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})
  const [companySettings, setCompanySettings] = useState({ companyName: 'Meal-Box', logo: '' })
  const { user } = useSelector(s => s.auth)
  const { theme } = useSelector(s => s.ui)
  const { socket } = useSelector(s => s.admin)
  const dispatch = useDispatch()
  const router = useRouter()

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

  useEffect(() => {
    loadCompanySettings()
  }, [])

  const loadCompanySettings = async () => {
    try {
      const res = await generalSettingsAPI.get()
      const settings = res.data?.settings || res.data || {}
      if (settings.companyName || settings.logo) {
        setCompanySettings({
          companyName: settings.companyName || 'Meal-Box',
          logo: settings.logo || ''
        })
      }
    } catch (err) {
      console.error('Failed to load company settings:', err)
    }
  }

  const getLogoUrl = (logo) => {
    if (!logo) return null
    return logo.startsWith('http') ? logo : `${baseUrl}${logo}`
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = (to) => {
    setExpandedMenus(prev => ({
      ...prev,
      [to]: !prev[to]
    }))
  }

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token && user?.role === 'admin') {
      dispatch(initializeSocketConnection({ token }))
    }
    return () => {
      dispatch(disconnectSocketConnection())
    }
  }, [dispatch, user])

  if (!mounted) {
    return (
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center overflow-hidden">
                  <span className="text-white text-lg">🍱</span>
                </div>
                <div>
                  <p className="font-display font-bold text-gray-900">Meal-Box</p>
                  <p className="text-xs text-primary-500 font-semibold">Admin Panel</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm px-4 py-4 flex items-center gap-4 border-b border-gray-100">
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu size={20} />
            </button>
            <h1 className="font-display font-bold text-gray-900 text-lg flex-1">Admin Dashboard</h1>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Moon size={18} className="text-gray-600" />
            </button>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    dispatch(disconnectSocketConnection())
    dispatch(logoutUser())
    router.push('/login')
  }

  const handleOrderClick = (order) => {
    router.push(`/admin/orders/${order._id}`)
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-16 h-10  rounded-xl flex items-center justify-center overflow-hidden">
                {companySettings.logo ? (
                  <img src={getLogoUrl(companySettings.logo)} alt={companySettings.companyName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-white text-lg">🍱</span>
                )}
              </div>
              <div>
                <p className="font-display font-bold text-gray-900 dark:text-white">{companySettings.companyName}</p>
                <p className="text-xs text-primary-500 font-semibold">Admin Panel</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const isExpanded = expandedMenus[item.to] || false
              const Icon = item.icon
              return (
                <div key={item.to}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group">
                    <Icon size={18} />
                    {item.subItems ? (
                      <button onClick={() => toggleMenu(item.to)} className="flex-1 text-left">
                        {item.label}
                      </button>
                    ) : (
                      <Link href={item.to} onClick={() => setSidebarOpen(false)}
                        className={router.pathname === item.to ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}>
                        {item.label}
                      </Link>
                    )}
                    {item.subItems && <ChevronRight size={14} className={`ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
                  </div>
                  {item.subItems && isExpanded && (
                    <div className="ml-8 space-y-1">
                      {item.subItems.map(si => (
                        <Link key={si.to} href={si.to} onClick={() => setSidebarOpen(false)}
                          className={router.pathname === si.to ? 'block px-4 py-2 rounded-lg text-sm transition-colors bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'block px-4 py-2 rounded-lg text-sm transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}>
                          {si.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 px-3 py-2 mb-3">
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-900 shadow-sm px-4 py-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu size={20} />
          </button>
          <h1 className="font-display font-bold text-gray-900 dark:text-white text-lg flex-1">Admin Dashboard</h1>
          <button onClick={() => dispatch(toggleTheme())} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {mounted && theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
          </button>
          <OrderNotification onOrderClick={handleOrderClick} role="admin" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}