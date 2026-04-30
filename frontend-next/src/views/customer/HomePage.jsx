import { useEffect, useState, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Search, ChevronRight, Flame, Star, X, Package } from 'lucide-react'
import { fetchProducts } from '../../redux/slices/productSlice'
import { fetchCategories } from '../../redux/slices/categorySlice'
import { fetchOffers } from '../../redux/slices/offerSlice'
import { fetchTopRatedProducts } from '../../redux/slices/topRatedSlice'
import { fetchCombos } from '../../redux/slices/comboSlice'
import { fetchBanners } from '../../redux/slices/bannerSlice'
import { addToCart } from '../../redux/slices/cartSlice'
import { categoryAPI, subcategoryAPI, subsubcategoryAPI, productAPI } from '../../services/api'
import ProductCard from '../../components/customer/ProductCard'
import { ProductCardSkeleton, CategorySkeleton } from '../../components/common/Skeleton'
import toast from 'react-hot-toast'

export const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''

export default function HomePage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const navigate = router.push
  const { list: products, loading: prodLoading } = useSelector(s => s.products)
  const { list: categories, loading: catLoading } = useSelector(s => s.categories)
  const { list: offers, loading: offersLoading } = useSelector(s => s.offers)
  const { list: topRated, loading: topRatedLoading } = useSelector(s => s.topRated)
  const { list: combos, loading: comboLoading } = useSelector(s => s.combos)
  const { list: banners, loading: bannerLoading } = useSelector(s => s.banners)

  const [activeIndex, setActiveIndex] = useState(0)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [isCatSheetOpen, setCatSheetOpen] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState({ categories: [], subcategories: [], subsubcategories: [], products: [] })
  const [allCategories, setAllCategories] = useState([])
  const [allSubcategories, setAllSubcategories] = useState([])
  const [allSubsubcategories, setAllSubsubcategories] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const searchInputRef = useRef(null)

  // Load all search data
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const [catRes, subRes, subsubRes, prodRes] = await Promise.all([
          categoryAPI.getAll(),
          subcategoryAPI.getAll(),
          subsubcategoryAPI.getAll(),
          productAPI.getAll()
        ])
        setAllCategories(catRes.data.categories || [])
        setAllSubcategories(subRes.data.subcategories || [])
        setAllSubsubcategories(subsubRes.data.subsubcategories || [])
        setAllProducts(prodRes.data.products || [])
      } catch (err) {
        console.error('Failed to load search data:', err)
      }
    }
    loadSearchData()
  }, [])

  // Filter search results
  useEffect(() => {
    if (search.trim().length > 0) {
      const query = search.toLowerCase().trim()
      setSearchResults({
        categories: allCategories.filter(cat => cat.name?.toLowerCase().includes(query)).slice(0, 5),
        subcategories: allSubcategories.filter(sub => sub.name?.toLowerCase().includes(query)).slice(0, 5),
        subsubcategories: allSubsubcategories.filter(subsub => subsub.name?.toLowerCase().includes(query)).slice(0, 5),
        products: allProducts.filter(prod => prod.name?.toLowerCase().includes(query)).slice(0, 5)
      })
      setShowSearchDropdown(true)
    } else {
      setSearchResults({ categories: [], subcategories: [], subsubcategories: [], products: [] })
      setShowSearchDropdown(false)
    }
  }, [search, allCategories, allSubcategories, allSubsubcategories, allProducts])

  // Handle click outside search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchProducts({ limit: 12, sort: '-createdAt' }))
    dispatch(fetchCategories())
    dispatch(fetchOffers())
    dispatch(fetchTopRatedProducts())
    dispatch(fetchCombos())
    dispatch(fetchBanners())
  }, [dispatch])

  const activeBanners = useMemo(() => {
    const now = new Date()
    return banners.filter(b =>
      b.status === 'active' &&
      (!b.startdatetTime || new Date(b.startdatetTime) <= now) &&
      (!b.enddatetTime || new Date(b.enddatetTime) >= now)
    )
  }, [banners])

  const activeBannerItem = activeBanners[activeIndex]

  // Reset index whenever the active banner list changes
  useEffect(() => {
    if (activeBanners.length > 0) {
      setActiveIndex(0)
    }
  }, [activeBanners])

  // Auto-advance only when the current banner is not a video
  useEffect(() => {
    if (!activeBannerItem || activeBannerItem.type === 'video') return

    const interval = setInterval(() => {
      setActiveIndex(p => (p + 1) % activeBanners.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [activeBannerItem, activeBanners.length])

  const handleSearchResultClick = (type, item) => {
    setShowSearchDropdown(false)
    setSearch('')
    const params = new URLSearchParams()

    switch (type) {
      case 'category':
        params.append('categoryId', item._id)
        break
      case 'subcategory':
        params.append('subcategoryId', item._id)
        break
      case 'subsubcategory':
        params.append('subsubcategoryId', item._id)
        break
      case 'product':
        params.append('search', item.name)
        break
    }
    router.push(`/menu?${params.toString()}`)
  }

  const handleCategoryClick = (id) => {
    setActiveCategory(id)
    router.push(`/menu?categoryId=${id}`)
    setCatSheetOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/menu?search=${search.trim()}`)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Banner Section */}
      <div className="relative w-full mt-6">
        <div className="relative overflow-hidden mx-4 rounded-2xl">
          <AnimatePresence mode="wait">
            {activeBannerItem && activeBannerItem.type === 'video' ? (
              <video
                key={activeBannerItem._id}
                src={`${baseUrl}${activeBannerItem.bannerImage}`}
                poster={activeBannerItem.thumbnail ? `${baseUrl}${activeBannerItem.thumbnail}` : undefined}
                className="w-full h-[280px] sm:h-[320px] md:h-[430px] object-cover"
                autoPlay
                muted
                playsInline
                onEnded={() => setActiveIndex(p => (p + 1) % activeBanners.length)}
              />
            ) : activeBannerItem ? (
              <img
                key={activeBannerItem._id}
                src={`${baseUrl}${activeBannerItem.bannerImage || activeBannerItem.thumbnail}`}
                alt="Banner"
                className="w-full h-[280px] sm:h-[320px] md:h-[430px] object-cover"
              />
            ) : null}
          </AnimatePresence>

          {/* Banner Dots */}
          {activeBanners.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {activeBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === activeIndex ? "w-6 bg-white" : "w-2 bg-white/60"
                    }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden relative" ref={searchInputRef}>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.trim().length > 0 && setShowSearchDropdown(true)}
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setShowSearchDropdown(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto z-50  ">
              {searchResults.categories.length === 0 &&
                searchResults.subcategories.length === 0 &&
                searchResults.subsubcategories.length === 0 &&
                searchResults.products.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No results found
                </div>
              ) : (
                <>
                  {/* Categories Results */}
                  {searchResults.categories.map(cat => (
                    <button
                      key={cat._id}
                      onClick={() => handleSearchResultClick('category', cat)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100">
                        {cat.image && <img src={`${baseUrl}${cat.image}`} alt={cat.name} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-200">{cat.name}</span>
                    </button>
                  ))}

                  {/* Products Results */}
                  {searchResults.products.map(prod => (
                    <button
                      key={prod._id}
                      onClick={() => handleSearchResultClick('product', prod)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                    >
                      {prod.images?.[0] && (
                        <img
                          src={prod.images[0].url.startsWith('http') ? prod.images[0].url : `${baseUrl}${prod.images[0].url}`}
                          alt={prod.name}
                          className="w-8 h-8 rounded-lg object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="flex flex-col text-left">
                        <span className="text-sm text-gray-700 dark:text-gray-200">{prod.name}</span>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </form>

        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Categories</h2>
            <Link href="/menu" className="text-primary-500 text-sm font-semibold flex items-center gap-1 hover:text-primary-600">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {catLoading ? (
              Array.from({ length: 5 }).map((_, i) => <CategorySkeleton key={i} />)
            ) : (
              categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => {
                    setActiveCategory(cat._id)
                    router.push(`/menu?categoryId=${cat._id}`)
                  }}

                  className="flex flex-col items-center gap-2 shrink-0 transition-transform active:scale-90"
                >
                  <div className={`w-16 h-16 rounded-2xl overflow-hidden transition-all ${activeCategory === cat._id ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : 'border border-gray-100 dark:border-gray-800'}`}>
                    <img src={`${baseUrl}${cat.image}`} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{cat.name}</span>
                </button>
              ))
            )}
            <button
              onClick={() => { setCatSheetOpen(true); setActiveCategory('all') }}
              className={`flex flex-col items-center gap-2 shrink-0 transition-transform active:scale-90 ${activeCategory === 'all' ? 'opacity-100' : 'opacity-70'}`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all ${activeCategory === 'all' ? 'bg-primary-500 shadow-lg shadow-primary-500/30' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800'}`}>
                🍽️
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">All</span>
            </button>
          </div>
        </section>

        {/* All Categories Bottom Sheet */}
        <AnimatePresence>
          {isCatSheetOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex justify-center items-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0"
                onClick={() => setCatSheetOpen(false)}
              />

              {/* Bottom Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="relative bg-[#0c0f1a] w-full h-[90vh] rounded-t-2xl p-4 overflow-y-auto"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-white text-lg font-bold">
                    Cuisines and dishes
                  </h2>

                  <button
                    onClick={() => setCatSheetOpen(false)}
                    className="text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => handleCategoryClick(cat._id)}
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <img
                        src={`${baseUrl}${cat.image}`}
                        alt={cat.name}
                        className="w-20 h-20 object-cover rounded-full"
                      />

                      <p className="text-sm mt-2 text-center text-gray-300">
                        {cat.name}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offers Banner */}
        {offersLoading ? (
          <section>
            <div className="bg-gradient-to-r from-primary-500 to-orange-400 rounded-3xl p-5 flex items-center justify-between overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-white/80 text-sm font-medium">Loading offer...</p>
                <h3 className="text-white font-display font-bold text-2xl">&nbsp;</h3>
                <p className="text-white/90 text-sm mt-1">&nbsp;</p>
                <Link href="/menu" className="mt-3 inline-flex items-center gap-1 bg-white text-primary-600 font-bold text-sm px-4 py-2 rounded-xl hover:shadow-md transition-all">
                  Order Now <ChevronRight size={14} />
                </Link>
              </div>
              <div className="text-7xl opacity-30 absolute -right-4 -bottom-2 select-none">🎉</div>
              <div className="text-5xl hidden sm:block select-none relative z-10">🎁</div>
            </div>
          </section>
        ) : offers.length > 0 ? (
          offers.map(o => (
            <section key={o._id}>
              <div className="bg-gradient-to-r from-primary-500 to-orange-400 rounded-3xl p-5 flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                  <p className="text-white/80 text-sm font-medium">{o.description || 'Limited Time Offer'}</p>
                  <h3 className="text-white font-display font-bold text-2xl">{o.title}</h3>
                  {o.couponCode && <p className="text-white/90 text-sm mt-1">Use code {o.couponCode}</p>}
                  <Link href="/menu" className="mt-3 inline-flex items-center gap-1 bg-white text-primary-600 font-bold text-sm px-4 py-2 rounded-xl hover:shadow-md transition-all">
                    Order Now <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="text-7xl opacity-30 absolute -right-4 -bottom-2 select-none">🎉</div>
                <div className="text-5xl hidden sm:block select-none relative z-10">🎁</div>
              </div>
            </section>
          ))
        ) : 
          // <section>
          //   <div className="bg-gradient-to-r from-primary-500 to-orange-400 rounded-3xl p-5 flex items-center justify-between overflow-hidden relative">
          //     <div className="relative z-10">
          //       <p className="text-white/80 text-sm font-medium">Limited Time Offer</p>
          //       <h3 className="text-white font-display font-bold text-2xl">Use code MEAL50</h3>
          //       <p className="text-white/90 text-sm mt-1">Get 50% off on your first order</p>
          //       <Link href="/menu" className="mt-3 inline-flex items-center gap-1 bg-white text-primary-600 font-bold text-sm px-4 py-2 rounded-xl hover:shadow-md transition-all">
          //         Order Now <ChevronRight size={14} />
          //       </Link>
          //     </div>
          //     <div className="text-7xl opacity-30 absolute -right-4 -bottom-2 select-none">🎉</div>
          //     <div className="text-5xl hidden sm:block select-none relative z-10">🎁</div>
          //   </div>
          // </section>
         null}

        {/* Products Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Popular Items</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {prodLoading ? (
              Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : (
              products.slice(0, 12).map(product => (
                <ProductCard key={product._id} product={product} />
              ))
            )}
          </div>
        </section>

        {/* Top Rated Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star size={20} className="text-yellow-400 fill-yellow-400" />
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Top Rated</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {topRatedLoading
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : topRated.filter(p => p.rating > 0).slice(0, 6).map(p => <ProductCard key={p._id} product={p} />)
            }
          </div>
        </section>

        {/* Combo Deals Section */}
        {comboLoading ? (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Package size={20} className="text-primary-500" />
              <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Loading Combos...</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm animate-pulse">
                  <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </section>
        ) : combos.length > 0 ? (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Package size={20} className="text-primary-500" />
              <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Combo Deals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {combos.filter(c => c.status === 'active' || c.status === true).slice(0, 6).map(combo => (
                <div
                  key={combo._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/combo/${combo._id}`)}
                >
                  <div className="relative">
                    <img
                      src={`${baseUrl}${combo.comboImage}`}
                      alt={combo.comboName}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {combo.discountAmount > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Save ₹{combo.discountAmount}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{combo.comboName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{combo.description || 'Delicious combo meal'}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary-600">₹{combo.comboPrice}</span>
                        {combo.actualPrice && (
                          <span className="text-sm text-gray-400 line-through">₹{combo.actualPrice}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          dispatch(addToCart({ comboId: combo._id, quantity: 1 }))
                            .then(() => toast.success('Combo added to cart! 🛒'))
                            .catch(() => toast.error('Failed to add combo'))
                        }}
                        className="bg-primary-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}