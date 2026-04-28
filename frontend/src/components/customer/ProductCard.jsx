import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Minus, Star, Clock } from 'lucide-react'
import { addToCart, updateCartItem } from '../../redux/slices/cartSlice'
import { useNavigate } from 'react-router-dom'
export const baseUrl = import.meta.env.VITE_SERVER_URL
export default function ProductCard({ product }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector(s => s.auth)
  const { items } = useSelector(s => s.cart)

  // protect against malformed items where productId may be null/undefined
  const cartItem = items.find(i => {
    const pid = i.productId ? (i.productId._id || i.productId) : undefined;
    return pid === product._id;
  })
  const qty = cartItem?.quantity || 0

  const handleAdd = (e) => {
    e.preventDefault()
    if (!isAuthenticated) { navigate('/login'); return }
    dispatch(addToCart({ productId: product._id, quantity: 1 }))
  }

  const handleUpdate = (e, newQty) => {
    e.preventDefault()
    if (newQty < 1) dispatch(updateCartItem({ productId: product._id, quantity: 0 }))
    else dispatch(updateCartItem({ productId: product._id, quantity: newQty }))
  }

  const discount = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0

  return (
    <Link to={`/product/${product._id}`} className="card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group block">
      <div className="relative overflow-hidden">
        <img
          src={`${baseUrl}${product.images?.[0]?.url}`}
          alt={product.name}
          className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-gray-900/80 px-3 py-1 rounded-full">Unavailable</span>
          </div>
        )}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            {discount}% OFF
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`w-5 h-5 rounded border-2 flex items-center justify-center bg-white ${product.isVeg ? 'border-green-500' : 'border-red-500'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${product.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">{product.description}</p>

        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-lg">
            <Star size={10} fill="currentColor" />
            <span className="text-xs font-bold">{product.rating?.toFixed(1) || '4.5'}</span>
          </div>
          {product.totalReviews > 0 && (
            <span className="text-xs text-gray-400">({product.totalReviews})</span>
          )}
          <div className="flex items-center gap-0.5 text-gray-400 ml-auto">
            <Clock size={12} />
            <span className="text-xs font-medium">{product.preparationTime || 15} min</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {product.discountPrice ? (
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-base">₹{product.discountPrice}</span>
                <span className="text-xs text-gray-400 line-through ml-1">₹{product.price}</span>
              </div>
            ) : (
              <span className="font-bold text-gray-900 dark:text-white text-base">₹{product.price}</span>
            )}
          </div>

          {product.isAvailable && (
            qty > 0 ? (
              <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                <button onClick={(e) => handleUpdate(e, qty - 1)}
                  className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-500/20 text-primary-500 flex items-center justify-center hover:bg-primary-200 transition-colors active:scale-90">
                  <Minus size={13} strokeWidth={3} />
                </button>
                <span className="w-4 text-center text-sm font-bold text-gray-900 dark:text-white">{qty}</span>
                <button onClick={(e) => handleUpdate(e, qty + 1)}
                  className="w-7 h-7 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors active:scale-90">
                  <Plus size={13} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <button onClick={handleAdd}
                className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-2 py-2 rounded-xl transition-all active:scale-90 shadow-md shadow-primary-500/20">
                <Plus size={13} strokeWidth={3} /> ADD
              </button>
            )
          )}
        </div>
      </div>
    </Link>
  )
}
