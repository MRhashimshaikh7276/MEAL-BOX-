import Link from 'next/link'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Search, ShoppingCart, User, Moon, Sun, LogOut, ChevronDown, X, Circle, Utensils, Calendar } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toggleTheme } from '../../redux/slices/uiSlice'
import { logoutUser } from '../../redux/slices/authSlice'
import { toggleCart } from '../../redux/slices/cartSlice'
import { generalSettingsAPI, categoryAPI, subcategoryAPI, subsubcategoryAPI, productAPI } from '../../services/api'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

export default function Navbar() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { isAuthenticated, user } = useSelector(s => s.auth)
  const { items } = useSelector(s => s.cart)
  const { theme } = useSelector(s => s.ui)
  const [mounted, setMounted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [logo, setLogo] = useState('')
  const [companyName, setCompanyName] = useState('Meal-Box')
  const [restaurantStatus, setRestaurantStatus] = useState({ isOpen: true, openTime: '', closeTime: '' })
  const [searchResults, setSearchResults] = useState({ categories: [], subcategories: [], subsubcategories: [], products: [] })
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef(null)

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  // Only render theme-specific UI after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // PWA: Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // PWA: Check if app is already installed
  useEffect(() => {
    const handler = () => setShowInstallButton(false)
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallButton(false)
    }
    setDeferredPrompt(null)
  }

  useEffect(() => {
    loadSettings()
    loadSearchData()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await generalSettingsAPI.get()
      console.log('General Settings:', res.data)
      const settings = res.data?.settings || res.data?.message || res.data
      if (settings) {
        if (settings.logo) {
          const logoPath = settings.logo.startsWith('http')
            ? settings.logo
            : `${baseUrl}${settings.logo}`
          console.log('Logo URL:', logoPath)
          setLogo(logoPath)
        }
        if (settings.companyName) {
          setCompanyName(settings.companyName)
        }
        let isOpen = true
        if (settings.businessHours && settings.businessHours.autoClose) {
          const now = new Date()
          const currentTime = now.getHours() * 60 + now.getMinutes()
          const parseTime = (timeStr) => {
            if (!timeStr) return null
            const [hours, minutes] = timeStr.split(':').map(Number)
            return hours * 60 + minutes
          }
          const openTime = parseTime(settings.businessHours.open)
          const closeTime = parseTime(settings.businessHours.close)
          console.log('Current time (minutes):', currentTime)
          console.log('Open time (minutes):', openTime)
          console.log('Close time (minutes):', closeTime)
          console.log('isOpen calculated:', currentTime >= openTime && currentTime < closeTime)
          if (openTime !== null && closeTime !== null) {
            isOpen = currentTime >= openTime && currentTime < closeTime
          }
        } else if (settings.isOpen !== undefined && settings.isOpen !== null) {
          isOpen = Boolean(settings.isOpen)
        }
        setRestaurantStatus({
          isOpen,
          openTime: settings.businessHours?.open || '',
          closeTime: settings.businessHours?.close || ''
        })
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const [allCategories, setAllCategories] = useState([])
  const [allSubcategories, setAllSubcategories] = useState([])
  const [allSubsubcategories, setAllSubsubcategories] = useState([])
  const [allProducts, setAllProducts] = useState([])

  const loadSearchData = async () => {
    try {
      const [catRes, subcatRes, subsubcatRes, prodRes] = await Promise.all([
        categoryAPI.getAll(),
        subcategoryAPI.getAll(),
        subsubcategoryAPI.getAll(),
        productAPI.getAll({ limit: 100 })
      ])
      setAllCategories(catRes.data?.categories || catRes.data || [])
      setAllSubcategories(subcatRes.data?.subcategories || subcatRes.data || [])
      setAllSubsubcategories(subsubcatRes.data?.subsubcategories || subsubcatRes.data || [])
      setAllProducts(prodRes.data?.products || prodRes.data || [])
    } catch (err) {
      console.error('Failed to load search data:', err)
    }
  }

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim()
      const filteredCategories = allCategories.filter(cat =>
        cat.name?.toLowerCase().includes(query)
      ).slice(0, 5)
      const filteredSubcategories = allSubcategories.filter(sub =>
        sub.name?.toLowerCase().includes(query)
      ).slice(0, 5)
      const filteredSubsubcategories = allSubsubcategories.filter(subsub =>
        subsub.name?.toLowerCase().includes(query)
      ).slice(0, 5)
      const filteredProducts = allProducts.filter(prod =>
        prod.name?.toLowerCase().includes(query) ||
        prod.description?.toLowerCase().includes(query)
      ).slice(0, 5)
      setSearchResults({
        categories: filteredCategories,
        subcategories: filteredSubcategories,
        subsubcategories: filteredSubsubcategories,
        products: filteredProducts
      })
      setShowDropdown(true)
    } else {
      setSearchResults({ categories: [], subcategories: [], subsubcategories: [], products: [] })
      setShowDropdown(false)
    }
  }, [searchQuery, allCategories, allSubcategories, allSubsubcategories, allProducts])

  const handleSearchResultClick = (type, item) => {
    setShowDropdown(false)
    setSearchQuery('')
    switch (type) {
      case 'category':
        router.push(`/menu?categoryId=${item._id || item.id}`)
        break
      case 'subcategory':
        router.push(`/menu?subcategoryId=${item._id || item.id}`)
        break
      case 'subsubcategory':
        router.push(`/menu?subsubcategoryId=${item._id || item.id}`)
        break
      case 'product':
        router.push(`/menu?search=${item.name}`)
        break
      default:
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) router.push(`/menu?search=${searchQuery.trim()}`)
  }

  const handleLogout = () => { dispatch(logoutUser()); setDropdownOpen(false); router.push('/') }

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between  gap-4">
        <button onClick={() => { console.log('Logo clicked, navigating to /'); router.push('/') }} className="flex items-center gap-2 shrink-0 cursor-pointer bg-transparent border-none p-0">
          {logo ? (
            <img src={logo} alt={companyName} className="w-28 h-10 object-cover" />
          ) : (
            <div className="w-12 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-md shadow-primary-500/30">
              <span className="text-white text-lg">🍱</span>
            </div>
          )}
          {restaurantStatus.isOpen ? (
            <span className=" flex sm:flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full">
              <Circle size={6} className="fill-green-500" /> Open
            </span>
          ) : (
            <span className=" flex sm:flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-full">
              <Circle size={6} className="fill-red-500" /> Closed
            </span>
          )}
        </button>
        <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:flex" ref={searchInputRef}>
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search dishes, categories..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => searchQuery.trim().length > 0 && setShowDropdown(true)}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); setShowDropdown(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                {searchResults.categories.length === 0 && searchResults.subcategories.length === 0 &&
                  searchResults.subsubcategories.length === 0 && searchResults.products.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">No results found</div>
                ) : (
                  <>
                    {searchResults.categories.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categories</div>
                        {searchResults.categories.map(cat => (
                          <button key={cat._id || cat.id} onClick={() => handleSearchResultClick('category', cat)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                            {cat.image ? (
                              <img src={cat.image.startsWith('http') ? cat.image : `${baseUrl}${cat.image}`}
                                alt={cat.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                                <span className="text-primary-600 text-sm font-medium">{cat.name?.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <span className="text-gray-900 dark:text-white text-sm">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.subcategories.length > 0 && (
                      <div className="py-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subcategories</div>
                        {searchResults.subcategories.map(sub => (
                          <button key={sub._id || sub.id} onClick={() => handleSearchResultClick('subcategory', sub)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                            {sub.image ? (
                              <img src={sub.image.startsWith('http') ? sub.image : `${baseUrl}${sub.image}`}
                                alt={sub.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                                <span className="text-orange-600 text-sm font-medium">{sub.name?.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <span className="text-gray-900 dark:text-white text-sm">{sub.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.subsubcategories.length > 0 && (
                      <div className="py-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sub-Subcategories</div>
                        {searchResults.subsubcategories.map(subsub => (
                          <button key={subsub._id || subsub.id} onClick={() => handleSearchResultClick('subsubcategory', subsub)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                            {subsub.image ? (
                              <img src={subsub.image.startsWith('http') ? subsub.image : `${baseUrl}${subsub.image}`}
                                alt={subsub.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                <span className="text-blue-600 text-sm font-medium">{subsub.name?.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <span className="text-gray-900 dark:text-white text-sm">{subsub.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.products.length > 0 && (
                      <div className="py-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Products</div>
                        {searchResults.products.map(prod => (
                          <button key={prod._id || prod.id} onClick={() => handleSearchResultClick('product', prod)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                            {prod.images && prod.images[0] ? (
                              <img src={prod.images[0].url?.startsWith('http') ? prod.images[0].url : `${baseUrl}${prod.images[0].url}`}
                                alt={prod.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-600 text-sm font-medium">{prod.name?.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-900 dark:text-white text-sm font-medium truncate">{prod.name}</div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">₹{prod.effectivePrice || prod.price}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </form>
        <div className="flex items-center gap-2 shrink-0">
          {showInstallButton && (
            <button onClick={handleInstallClick}
              className="btn-primary py-2 px-3 flex items-center gap-1.5 text-sm whitespace-nowrap">
              <svg className=' sm:block hidden' width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Install
            </button>
          )}
          <button onClick={() => dispatch(toggleTheme())} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:flex">
            {mounted && theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
          </button>
          {isAuthenticated && (
            <button onClick={() => dispatch(toggleCart())} className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ShoppingCart size={20} className="text-gray-700 dark:text-gray-300" />
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce-once">{items.length}</span>
              )}
            </button>
          )}
          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="w-7 h-7 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-xs">{user?.name?.[0]?.toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className="text-gray-400 hidden md:block" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 card shadow-xl py-1 animate-fade-in">
                  <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                    <User size={14} /> Profile
                  </Link>
                  <Link href="/booking" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                    <Utensils size={14} /> Book a Table
                  </Link>
                  <Link href="/my-orders" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                    <ShoppingCart size={14} /> My Orders
                  </Link>
                  <Link href="/my-bookings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                    <Calendar size={14} /> My Bookings
                  </Link>
                  <hr className="my-1 border-gray-100 dark:border-gray-800" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-primary py-2 px-4 text-sm">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}