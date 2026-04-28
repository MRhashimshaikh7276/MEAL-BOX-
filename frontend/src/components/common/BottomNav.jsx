import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Home, UtensilsCrossed, ShoppingBag, User } from 'lucide-react'

export default function BottomNav() {
  const { isAuthenticated } = useSelector(s => s.auth)
  const navigate = useNavigate()

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: isAuthenticated ? '/my-orders' : '/login', label: 'Orders', icon: ShoppingBag },
    { to: isAuthenticated ? '/profile' : '/login', label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-2xl">
      <div className="flex">
        {navItems.map(({ to, label, icon: Icon }, idx) => (
          // include index or label to ensure uniqueness when `to` repeats
          <NavLink key={`${to}-${label}-${idx}`} to={to} end={to === '/'}
            className={({ isActive }) => `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
