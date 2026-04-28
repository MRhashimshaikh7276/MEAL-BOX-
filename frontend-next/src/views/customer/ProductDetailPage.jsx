import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Star, Plus, Minus, ArrowLeft, Share2, ChevronLeft, ChevronRight, Package, Clock, Check } from 'lucide-react'
import { fetchProductById } from '../../redux/slices/productSlice'
import { addToCart, updateCartItem } from '../../redux/slices/cartSlice'
import { fetchAddOnesByProduct } from '../../redux/slices/addOnesSlice'
import { reviewAPI, comboAPI, productAPI } from '../../services/api'
import toast from 'react-hot-toast'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

const handleShare = async (product) => {
  const shareData = {
    title: product.name,
    text: `Check out this product: ${product.name}`,
    url: window.location.href
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err)
      }
    }
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy link')
    }
  }
}

export default function ProductDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const navigate = (path) => {
    if (path === -1) {
      router.back()
    } else {
      router.push(path)
    }
  }
  const dispatch = useDispatch()
  const { list: addOnesList, loading: addOnesLoading } = useSelector(s => s.addOnes)
  const { items } = useSelector(s => s.cart)
  const { isAuthenticated } = useSelector(s => s.auth)
  const [activeImg, setActiveImg] = useState(0)
  const [reviews, setReviews] = useState([])
  const [myRating, setMyRating] = useState(5)
  const [myComment, setMyComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [product, setProduct] = useState(null)
  const [isCombo, setIsCombo] = useState(false)
  const [detailLoading, setDetailLoading] = useState(true)
  const [selectedAddOnes, setSelectedAddOnes] = useState([])
  const [showAllAddOnes, setShowAllAddOnes] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchAddOnesByProduct(id))
    }
  }, [dispatch, id])

  useEffect(() => {
    const fetchData = async () => {
      setDetailLoading(true)
      try {
        const productRes = await productAPI.getById(id)
        if (productRes.data.product) {
          setProduct(productRes.data.product)
          setIsCombo(false)
          reviewAPI.getByProduct(id).then(r => setReviews(r.data.reviews || [])).catch(() => { })
        }
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            const comboRes = await comboAPI.getById(id)
            if (comboRes.data.combo) {
              setProduct(comboRes.data.combo)
              setIsCombo(true)
            }
          } catch (comboErr) {
            console.error('Combo not found:', comboErr)
          }
        }
      }
      setDetailLoading(false)
    }
    fetchData()
  }, [id])

  const availableAddOnes = addOnesList.filter(a => a.isAvailable)
  const displayAddOnes = showAllAddOnes ? availableAddOnes : availableAddOnes.slice(0, 6)

  const toggleAddOn = (addOn) => {
    setSelectedAddOnes(prev => {
      const exists = prev.find(a => a.addOnesId === addOn._id)
      if (exists) {
        return prev.filter(a => a.addOnesId !== addOn._id)
      } else {
        return [...prev, { addOnesId: addOn._id, name: addOn.name, price: addOn.price || addOn.discountPrice || addOn.price, quantity: 1 }]
      }
    })
  }

  const getAddOnesTotal = () => {
    return selectedAddOnes.reduce((sum, a) => sum + (a.price * a.quantity), 0)
  }

  const cartItem = items.find(i => {
    if (isCombo) return i.comboId && i.comboId === id
    const pid = i.product && i.product._id
    return pid && pid === id
  })
  const qty = cartItem?.quantity || 0

  const handleAdd = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (isCombo) {
      dispatch(addToCart({ comboId: id, quantity: 1 }))
    } else {
      dispatch(addToCart({ productId: id, quantity: 1, addOnes: selectedAddOnes }))
    }
  }

  const handleUpdate = (newQty) => {
    if (isCombo) {
      dispatch(updateCartItem({ comboId: id, quantity: newQty }))
    } else {
      dispatch(updateCartItem({ productId: id, quantity: newQty, addOnes: selectedAddOnes }))
    }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { navigate('/login'); return }
    setSubmitting(true)
    try {
      const payload = { productId: id, rating: myRating, comment: myComment };
      const res = await reviewAPI.add(payload)
      setReviews(prev => [res.data.review, ...prev])
      setMyComment(''); toast.success('Review submitted! 🌟')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit review') }
    finally { setSubmitting(false) }
  }

  const displayData = isCombo ? {
    name: product?.comboName,
    description: product?.description,
    price: product?.actualPrice || 0,
    discountPrice: product?.comboPrice,
    images: product?.comboImage ? [{ url: product.comboImage }] : [],
    isAvailable: product?.status === 'active',
    products: product?.products || [],
    preparationTime: product?.preparationTime || 15
  } : {
    name: product?.name,
    description: product?.description,
    price: product?.price,
    discountPrice: product?.discountPrice,
    images: product?.images || [],
    isAvailable: product?.isAvailable,
    products: [],
    preparationTime: product?.preparationTime || 15
  }

  const basePrice = displayData.discountPrice || displayData.price || 0
  const totalPrice = basePrice + getAddOnesTotal()

  if (detailLoading || !product) return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="skeleton h-72 rounded-3xl" />
      <div className="skeleton h-8 w-3/4" />
      <div className="skeleton h-4 w-full" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-8 px-4 mt-4">
        <div>
          <div className="relative rounded-3xl overflow-hidden mb-3 aspect-video">
            <img
              src={`${baseUrl}${displayData.images?.[activeImg]?.url}`}
              alt={displayData.name}
              className="w-full h-full object-cover"
            />
            {!displayData.isAvailable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-xl bg-gray-900/80 px-4 py-2 rounded-full">Currently Unavailable</span>
              </div>
            )}
            {displayData.images?.length > 1 && (
              <>
                <button onClick={() => setActiveImg(p => (p - 1 + displayData.images.length) % displayData.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setActiveImg(p => (p + 1) % displayData.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
          {displayData.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {displayData.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary-500' : 'border-transparent'}`}>
                  <img src={`${baseUrl}${img.url}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 md:mt-0">
          {isCombo && (
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-bold px-3 py-1 rounded-full">
                <Package size={14} className="inline mr-1" />
                COMBO
              </span>
              <span className="text-sm text-gray-500">{displayData.products?.length || 0} items included</span>
              <div className="flex items-center gap-1.5 text-gray-500 ml-auto">
                <Clock size={14} />
                <span className="text-sm font-medium">{displayData.preparationTime} min</span>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <div>
              {!isCombo && (
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${product.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${product.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  </span>
                  <span className={`text-xs font-bold ${product.isVeg ? 'text-green-600' : 'text-red-600'}`}>{product.isVeg ? 'VEG' : 'NON-VEG'}</span>
                </div>
              )}
              <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">{displayData.name}</h1>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => handleShare(displayData)}>
              <Share2 size={20} />
            </button>
          </div>

          {!isCombo && (
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg">
                <Star size={14} fill="currentColor" />
                <span className="font-bold text-sm">{product.rating?.toFixed(1) || '4.5'}</span>
              </div>
              <span className="text-sm text-gray-500">({product.totalReviews || 0} reviews)</span>
              <div className="flex items-center gap-1.5 text-gray-500 ml-auto">
                <Clock size={16} />
                <span className="text-sm font-medium">{displayData.preparationTime} min</span>
              </div>
            </div>
          )}

          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-5">{displayData.description}</p>

          {isCombo && displayData.products?.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Included Items:</h3>
              <div className="space-y-3">
                {displayData.products.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                      {item.productId?.images?.[0] ? (
                        <img src={`${baseUrl}${item.productId.images[0].url}`} alt={item.productId.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={20} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{item.productId?.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">₹{item.productId?.discountPrice || item.productId?.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AddOnes Section - Horizontal Scrollable */}
          {!isCombo && availableAddOnes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Add Extras</h3>
                <span className="text-xs text-gray-500">{selectedAddOnes.length} selected</span>
              </div>
              
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {displayAddOnes.map(addOn => {
                  const isSelected = selectedAddOnes.some(a => a.addOnesId === addOn._id)
                  return (
                    <button
                      key={addOn._id}
                      onClick={() => toggleAddOn(addOn)}
                      className={`shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all relative ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {addOn.images?.[0] ? (
                        <img src={`${baseUrl}${addOn.images[0]}`} alt={addOn.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl">🍽️</div>
                      )}
                      <span className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">{addOn.name}</span>
                      <span className="text-xs font-bold text-primary-600">+₹{addOn.discountPrice || addOn.price}</span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {!showAllAddOnes && availableAddOnes.length > 6 && (
                <button onClick={() => setShowAllAddOnes(true)} className="text-sm text-primary-500 font-medium hover:text-primary-600 mt-2">
                  +{availableAddOnes.length - 6} more extras
                </button>
              )}

              {selectedAddOnes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Extras total:</span>
                    <span className="font-bold text-primary-600">+₹{getAddOnesTotal()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            {displayData.discountPrice ? (
              <>
                <span className="font-display font-bold text-3xl text-gray-900 dark:text-white">₹{totalPrice}</span>
                <span className="text-lg text-gray-400 line-through">₹{displayData.price}</span>
                <span className="text-sm font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-lg">
                  {Math.round(((displayData.price - displayData.discountPrice) / displayData.price) * 100)}% OFF
                </span>
              </>
            ) : (
              <span className="font-display font-bold text-3xl text-gray-900 dark:text-white">₹{totalPrice}</span>
            )}
          </div>

          {displayData.isAvailable && (
            <div className="flex items-center gap-4">
              {qty > 0 ? (
                <div className="flex items-center gap-4">
                  <button onClick={() => handleUpdate(qty - 1)}
                    className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-500/20 text-primary-500 flex items-center justify-center hover:bg-primary-200 transition-colors active:scale-90">
                    <Minus size={20} />
                  </button>
                  <span className="font-display font-bold text-2xl text-gray-900 dark:text-white w-8 text-center">{qty}</span>
                  <button onClick={() => handleUpdate(qty + 1)}
                    className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors active:scale-90 shadow-lg shadow-primary-500/30">
                    <Plus size={20} />
                  </button>
                  <button onClick={() => navigate('/cart')} className="btn-primary flex-1">View Cart →</button>
                </div>
              ) : (
                <button onClick={handleAdd} className="btn-primary w-full text-lg py-4">
                  <Plus size={20} className="inline mr-2" /> Add to Cart
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-10">
        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-5">Ratings & Reviews</h2>

        {isAuthenticated && (
          <form onSubmit={handleReview} className="card p-5 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Write a Review</h3>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} type="button" onClick={() => setMyRating(r)}>
                  <Star size={28} className={r <= myRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
              placeholder="Share your experience..." rows={3} className="input resize-none mb-3" required />
            <button type="submit" disabled={submitting} className="btn-primary py-2.5 text-sm">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Star size={40} className="mx-auto mb-2 opacity-30" />
              <p>No reviews yet. Be the first!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-xs">{review.userId?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{review.userId?.name}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}