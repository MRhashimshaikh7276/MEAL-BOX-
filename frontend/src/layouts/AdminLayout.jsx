import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Menu, Combine, X, LogOut, ChevronRight, Moon, Sun, Settings, BarChart3 } from 'lucide-react'
import { logoutUser } from '../redux/slices/authSlice'
import { toggleTheme } from '../redux/slices/uiSlice'
import { initializeSocketConnection, disconnectSocketConnection } from '../redux/slices/adminSlice'
import OrderNotification from '../components/admin/OrderNotification'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
 
  { to: '/admin/offers', label: 'Offers', icon: Tag },
  { to: '/admin/combos', label: 'Combos', icon: Combine },
  { to: '/admin/add-ones', label: 'Add Ones', icon: Tag },
   
   { to: '/admin/reports', label: 'Reports', icon: BarChart3  },
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
 
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useSelector(s => s.auth)
  const { theme } = useSelector(s => s.ui)
  const { socket } = useSelector(s => s.admin)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Initialize socket connection when admin logs in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user?.role === 'admin') {
      dispatch(initializeSocketConnection({ token }));
    }
    
    return () => {
      dispatch(disconnectSocketConnection());
    };
  }, [dispatch, user]);

  const handleLogout = () => { 
    dispatch(disconnectSocketConnection());
    dispatch(logoutUser()); 
    navigate('/login') 
  }

  const handleOrderClick = (order) => {
    navigate(`/admin/orders/${order._id}`);
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🍱</span>
              </div>
              <div>
                <p className="font-display font-bold text-gray-900 dark:text-white">Meal-Box</p>
                <p className="text-xs text-primary-500 font-semibold">Admin Panel</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon, subItems }) => {
              const [expanded, setExpanded] = useState(false)
              // determine if current route is active for parent or any child
              // note: NavLink provides isActive automatically for 'to', but
              // we also want to highlight parent when a subitem is active.

              return (
                <div key={to}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group">
                    <Icon size={18} />
                    {subItems ? (
                      // clickable label toggles submenu
                      <button onClick={() => setExpanded(e => !e)}
                        className="flex-1 text-left">
                        {label}
                      </button>
                    ) : (
                      <NavLink to={to} onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => `${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}> {label} </NavLink>
                    )}
                    {subItems && <ChevronRight size={14} className={`ml-auto transition-transform ${expanded ? 'rotate-90' : ''}`} />}
                  </div>
                  {subItems && expanded && (
                    <div className="ml-8 space-y-1">
                      {subItems.map(si => (
                        <NavLink key={si.to} to={si.to} onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                          {si.label}
                        </NavLink>
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

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-900 shadow-sm px-4 py-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu size={20} />
          </button>
          <h1 className="font-display font-bold text-gray-900 dark:text-white text-lg flex-1">Admin Dashboard</h1>
          <button onClick={() => dispatch(toggleTheme())} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
          </button>
          {/* Order Notification Component */}
          <OrderNotification onOrderClick={handleOrderClick} />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
