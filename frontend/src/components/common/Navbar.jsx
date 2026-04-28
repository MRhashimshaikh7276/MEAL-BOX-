import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Search, ShoppingCart, User, Moon, Sun, LogOut, ChevronDown, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toggleTheme } from '../../redux/slices/uiSlice'
import { logoutUser } from '../../redux/slices/authSlice'
import { toggleCart } from '../../redux/slices/cartSlice'
import { generalSettingsAPI, categoryAPI, subcategoryAPI, subsubcategoryAPI, productAPI } from '../../services/api'

const baseUrl = import.meta.env.VITE_SERVER_URL

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector(s => s.auth)
  const { items } = useSelector(s => s.cart)
  const { theme } = useSelector(s => s.ui)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [logo, setLogo] = useState('')
  const [companyName, setCompanyName] = useState('Meal-Box')
  const [searchResults, setSearchResults] = useState({ categories: [], subcategories: [], subsubcategories: [], products: [] })
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef(null)

  useEffect(() => {
    loadSettings()
    loadSearchData()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await generalSettingsAPI.get()
      console.log('General Settings:', res.data)
      // API returns data in res.data.settings (new format) or res.data.message (old format) or res.data (direct)
      const settings = res.data?.settings || res.data?.message || res.data
      if (settings) {
        if (settings.logo) {
          // Construct full URL for logo
          const logoPath = settings.logo.startsWith('http')
            ? settings.logo
            : `${baseUrl}${settings.logo}`
          console.log('Logo URL:', logoPath)
          setLogo(logoPath)
        }
        if (settings.companyName) {
          setCompanyName(settings.companyName)
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  // Load all categories, subcategories, subsubcategories for search
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

  // Filter search results based on query
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
        navigate(`/menu?categoryId=${item._id || item.id}`)
        break
      case 'subcategory':
        navigate(`/menu?subcategoryId=${item._id || item.id}`)
        break
      case 'subsubcategory':
        navigate(`/menu?subsubcategoryId=${item._id || item.id}`)
        break
      case 'product':
        navigate(`/menu?search=${item.name}`)
        break
      default:
        break
    }
  }

  // Close dropdown when clicking outside
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
    if (searchQuery.trim()) navigate(`/menu?search=${searchQuery.trim()}`)
  }

  const handleLogout = () => { dispatch(logoutUser()); setDropdownOpen(false); navigate('/') }

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between  gap-4">

        <Link to="/" className="flex items-center gap-2 shrink-0">


          <img
            src={logo}
            alt={companyName}
            className="w-12 h-9 rounded-xl object-cover shadow-md shadow-primary-500/30"
          />

          <span className="font-display font-bold text-xl text-gray-900 dark:text-white hidden sm:block">{companyName}</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:flex" ref={searchInputRef}>
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search dishes, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length > 0 && setShowDropdown(true)}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setShowDropdown(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}

            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                {searchResults.categories.length === 0 &&
                  searchResults.subcategories.length === 0 &&
                  searchResults.subsubcategories.length === 0 &&
                  searchResults.products.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No results found
                  </div>
                ) : (
                  <>
                    {/* Categories */}
                    {searchResults.categories.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Categories
                        </div>
                        {searchResults.categories.map(cat => (
                          <button
                            key={cat._id || cat.id}
                            onClick={() => handleSearchResultClick('category', cat)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            {cat.image ? (
                              <img
                                src={cat.image.startsWith('http') ? cat.image : `${baseUrl}${cat.image}`}
                                alt={cat.name}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                                <span className="text-primary-600 text-sm font-medium">
                                  {cat.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-gray-900 dark:text-white text-sm">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Subcategories */}
                    {searchResults.subcategories.length > 0 && (
                      <div className="py-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Subcategories
                        </div>
                        {searchResults.subcategories.map(sub => (
                          <button
                            key={sub._id || sub.id}
                            onClick={() => handleSearchResultClick('subcategory', sub)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            {sub.image ? (
                              <img
                                src={sub.image.startsWith('http') ? sub.image : `${baseUrl}${sub.image}`}
                                alt={sub.name}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                                <span className="text-orange-600 text-sm font-medium">
                                  {sub.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-gray-900 dark:text-white text-sm">{sub.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Sub-Subcategories */}
                    {searchResults.subsubcategories.length > 0 && (
                      <div className="py-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Sub-Subcategories
                        </div>
                        {searchResults.subsubcategories.map(subsub => (
                          <button
                            key={subsub._id || subsub.id}
                            onClick={() => handleSearchResultClick('subsubcategory', subsub)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            {subsub.image ? (
                              <img
                                src={subsub.image.startsWith('http') ? subsub.image : `${baseUrl}${subsub.image}`}
                                alt={subsub.name}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                <span className="text-blue-600 text-sm font-medium">
                                  {subsub.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-gray-900 dark:text-white text-sm">{subsub.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Products */}
                    {searchResults.products.length > 0 && (
                      <div className="py-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Products
                        </div>
                        {searchResults.products.map(prod => (
                          <button
                            key={prod._id || prod.id}
                            onClick={() => handleSearchResultClick('product', prod)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            {prod.images && prod.images[0] ? (
                              <img
                                src={prod.images[0].url?.startsWith('http') ? prod.images[0].url : `${baseUrl}${prod.images[0].url}`}
                                alt={prod.name}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-600 text-sm font-medium">
                                  {prod.name?.charAt(0).toUpperCase()}
                                </span>
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
          <button onClick={() => dispatch(toggleTheme())} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:flex">
            {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
          </button>

          {isAuthenticated && (
            <button onClick={() => dispatch(toggleCart())} className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ShoppingCart size={20} className="text-gray-700 dark:text-gray-300" />
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce-once">
                  {items.length}
                </span>
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
                  <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                    <User size={14} /> Profile
                  </Link>
                  <Link to="/my-orders" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                    <ShoppingCart size={14} /> My Orders
                  </Link>
                  <hr className="my-1 border-gray-100 dark:border-gray-800" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary py-2 px-4 text-sm">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
