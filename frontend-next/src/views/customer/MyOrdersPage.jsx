import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { Package, Clock, CheckCircle, XCircle, Truck, RotateCcw } from 'lucide-react'
import { fetchMyOrders } from '../../redux/slices/orderSlice'
import { fetchCart } from '../../redux/slices/cartSlice'
import { addToCart as addToCartById } from '../../redux/slices/cartSlice'
import { cartAPI } from '../../services/api'
import { OrderCardSkeleton } from '../../components/common/Skeleton'
import toast from 'react-hot-toast'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

const getImageUrl = (img) => {
  if (!img) return null;
  // Already a full URL (from product/combo) - use as-is
  if (img.startsWith('http')) return img;
  // Path starting with /uploads - needs baseUrl
  if (img.startsWith('/uploads')) return `${baseUrl}${img}`;
  // Relative path that needs baseUrl
  return `${baseUrl}/uploads/${img}`;
}

const STATUS_CONFIG = {
  'pending': { color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-400', icon: Clock },
  
  'preparing': { color: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400', icon: Package },
  'out_for_delivery': { color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400', icon: Truck },
  'delivered': { color: 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400', icon: CheckCircle },
  'cancelled': { color: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400', icon: XCircle },
}

export default function MyOrdersPage() {
  const dispatch = useDispatch()
  const { list: orders, loading } = useSelector(s => s.orders)
  const [reordering, setReordering] = useState(null)

  useEffect(() => { dispatch(fetchMyOrders()) }, [dispatch])

  const handleReorder = async (order) => {
    setReordering(order._id)
    try {
      if (!order.items || order.items.length === 0) {
        toast.error('No items to reorder')
        return
      }
      let addedCount = 0
      for (const item of order.items) {
        const cartData = item.comboId 
          ? { comboId: item.comboId, quantity: item.quantity || 1 }
          : { productId: item.product, quantity: item.quantity || 1 }
        await cartAPI.addToCart(cartData)
        addedCount++
      }
      toast.success(`${addedCount} items added to cart!`)
      dispatch(fetchCart())
    } catch (error) {
      console.error('Reorder error:', error)
      toast.error('Failed to add items to cart')
    } finally {
      setReordering(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">My Orders</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <OrderCardSkeleton key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={36} className="text-gray-300" />
          </div>
          <h2 className="font-display font-bold text-xl text-gray-700 dark:text-gray-300 mb-2">No orders yet</h2>
          <p className="text-gray-400 mb-6">Start ordering your favorite food!</p>
          <Link href="/menu" className="btn-primary">Browse Menu</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['pending']
            const Icon = status.icon
            return (
              <div key={order._id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${status.color}`}>
                    <Icon size={12} /> {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1).replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {order.items?.slice(0, 4).map((item, i) => {
                    const imageUrl = getImageUrl(item.image);
                    return (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-lg min-w-0">
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="w-8 h-8 rounded object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[10rem]">
                          {item.name || 'Item'}{order.items.length > 4 && i === 3 ? ` +${order.items.length - 4}` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white text-lg">₹{order.totalAmount}</span>
                    <span className="text-xs text-gray-400 ml-2">{order.paymentMethod}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reordering === order._id}
                      className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <RotateCcw size={14} />
                      {reordering === order._id ? 'Adding...' : 'Order Again'}
                    </button>
                    <Link href={'/order-success/' + order._id}
                      className="flex items-center gap-1.5 text-sm font-semibold text-primary-500 hover:text-primary-600 bg-primary-50 dark:bg-primary-500/10 px-4 py-2 rounded-xl transition-colors">
                      Track Order
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}