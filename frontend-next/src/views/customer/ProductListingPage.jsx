import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import { fetchProducts, setFilters } from '../../redux/slices/productSlice'
import { fetchCategories } from '../../redux/slices/categorySlice'
import ProductCard from '../../components/customer/ProductCard'
import { ProductCardSkeleton } from '../../components/common/Skeleton'

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
]

export default function ProductListingPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { list: products, loading, pagination } = useSelector(s => s.products)
  const { list: categories } = useSelector(s => s.categories)
  const [showFilters, setShowFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState('')
  const [selectedSort, setSelectedSort] = useState('newest')
  const [isVeg, setIsVeg] = useState('')
  const [page, setPage] = useState(1)
  const [initialized, setInitialized] = useState(false)

  // Initialize state from URL query on mount and when router.query changes
  useEffect(() => {
    if (!router.isReady) return

    const { query } = router
    
    // If router.query is empty, try parsing from window.location
    let urlQuery = query
    if (!query || Object.keys(query).length === 0) {
      const params = new URLSearchParams(window.location.search)
      urlQuery = Object.fromEntries(params.entries())
      console.log('Parsed from URL:', urlQuery)
    } else {
      console.log('Initializing from URL query:', query)
    }
    
    setSelectedCategory(urlQuery?.categoryId || '')
    setSelectedSubcategory(urlQuery?.subcategoryId || '')
    setSelectedSubSubcategory(urlQuery?.subsubcategoryId || '')
    setLocalSearch(urlQuery?.search || '')
    setPage(1)
    setInitialized(true)
  }, [router.isReady, router.query])
  // Load products when filters change - only after initialized
  useEffect(() => {
    if (!initialized) return // Don't load until URL is processed

    const params = {}

    if (localSearch) params.search = localSearch
    if (selectedCategory) params.categoryId = selectedCategory
    if (selectedSubcategory) params.subcategoryId = selectedSubcategory
    if (selectedSubSubcategory) params.subsubcategoryId = selectedSubSubcategory
    if (isVeg !== '') params.isVeg = isVeg

    params.sort = selectedSort
    params.page = page
    params.limit = 12

    console.log('Loading products with params:', params)
    dispatch(fetchProducts(params))
  }, [selectedCategory, selectedSubcategory, selectedSubSubcategory, selectedSort, isVeg, page, localSearch, initialized, dispatch])

  // Keep the query string in sync with current filters so URL can be shared
  useEffect(() => {
    if (!router.isReady || !initialized) return // Skip during initialization

    const params = {}

    if (localSearch) params.search = localSearch
    if (selectedCategory) params.categoryId = selectedCategory
    if (selectedSubcategory) params.subcategoryId = selectedSubcategory
    if (selectedSubSubcategory) params.subsubcategoryId = selectedSubSubcategory

    // Only update URL if query has changed to avoid unnecessary re-renders
    const currentQuery = router.query || {}
    const queryChanged = Object.keys(params).some(key => params[key] !== currentQuery[key]) ||
                        Object.keys(currentQuery).some(key => params[key] !== currentQuery[key])

    if (queryChanged) {
      console.log('Updating URL with params:', params)
      router.push({ pathname: '/menu', query: params }, undefined, { shallow: false })
    }
  }, [localSearch, selectedCategory, selectedSubcategory, selectedSubSubcategory, router.isReady, initialized])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    // Products will be loaded automatically via useEffect when localSearch changes
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search dishes..."
            value={localSearch} onChange={(e) => setLocalSearch(e.target.value)}
            className="input pl-10 pr-4" />
        </form>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-colors ${showFilters ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4 mb-6 animate-fade-in">
          <div className="flex flex-wrap gap-3">
            {/* Sort */}
            <div className="flex-1 min-w-48">
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wide">Sort By</label>
              <select value={selectedSort} onChange={e => setSelectedSort(e.target.value)}
                className="input text-sm py-2.5">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {/* Category */}
            <div className="flex-1 min-w-48">
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wide">Category</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="input text-sm py-2.5">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            {/* Veg filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wide">Diet</label>
              <div className="flex gap-2">
                {[{ v: '', l: 'All' }, { v: 'true', l: '🟢 Veg' }, { v: 'false', l: '🔴 Non-Veg' }].map(({ v, l }) => (
                  <button key={v} onClick={() => setIsVeg(v)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${isVeg === v ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-5">
        <button onClick={() => setSelectedCategory('')}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${selectedCategory === '' ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'}`}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat._id} onClick={() => setSelectedCategory(cat._id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all whitespace-nowrap ${selectedCategory === cat._id ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? 'Loading...' : `${pagination?.total || products.length} items found`}
        </p>
        {(selectedCategory || localSearch || isVeg || selectedSubcategory || selectedSubSubcategory) && (
          <button onClick={() => { setSelectedCategory(''); setSelectedSubcategory(''); setSelectedSubSubcategory(''); setLocalSearch(''); setIsVeg('') }}
            className="flex items-center gap-1 text-sm text-primary-500 font-semibold hover:text-primary-600">
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length > 0
            ? products.map(p => <ProductCard key={p._id} product={p} />)
            : <div className="col-span-full text-center py-20">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="font-display font-bold text-xl text-gray-700 dark:text-gray-300 mb-2">No items found</h3>
              <p className="text-gray-400">Try different search terms or filters</p>
            </div>
        }
      </div>

      {/* Pagination */}
      {pagination?.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${page === i + 1 ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
