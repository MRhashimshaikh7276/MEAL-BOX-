import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { Home, UtensilsCrossed, ShoppingBag, User } from 'lucide-react'

export default function BottomNav() {
  const { isAuthenticated } = useSelector(s => s.auth)
  const router = useRouter()

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: isAuthenticated ? '/my-orders' : '/login', label: 'Orders', icon: ShoppingBag },
    { href: isAuthenticated ? '/profile' : '/login', label: 'Profile', icon: User },
  ]

  const isActive = (href) => {
    if (href === '/') return router.pathname === '/'
    return router.pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-2xl">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }, idx) => {
          const active = isActive(href)
          return (
            <Link 
              key={`${href}-${label}-${idx}`} 
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${active ? 'text-primary-500' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
