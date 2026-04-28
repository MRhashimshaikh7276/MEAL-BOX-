import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { fetchOrderById } from '../../redux/slices/orderSlice'
import { fetchCart } from '../../redux/slices/cartSlice'
import { cartAPI } from '../../services/api'
import { CheckCircle, Package, Clock, Truck, Home, XCircle, MapPin, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

// Dynamically import DeliveryTrackingMap with SSR disabled to prevent Leaflet window error
const DeliveryTrackingMap = dynamic(() => import('../../components/customer/DeliveryTrackingMap'), { ssr: false })

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package, color: 'bg-yellow-500' },

  { key: 'preparing', label: 'Preparing', icon: Clock, color: 'bg-blue-500' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-purple-500' },
  { key: 'delivered', label: 'Delivered', icon: Home, color: 'bg-green-600' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500' },
]

export default function OrderSuccessPage() {
  const router = useRouter()
  const { orderId } = router.query
  const dispatch = useDispatch()
  const { order } = useSelector(s => s.orders)
  const [remainingPrepTime, setRemainingPrepTime] = useState(null)
  const [deliveryLocation, setDeliveryLocation] = useState(null)
  const [etaMinutes, setEtaMinutes] = useState(null)

  useEffect(() => {
    dispatch(fetchOrderById(orderId))
    
    const orderInterval = setInterval(() => {
      dispatch(fetchOrderById(orderId))
    }, 30000)
    
    return () => clearInterval(orderInterval)
  }, [orderId])

  const currentStep = STATUS_STEPS.findIndex(s => s.key === order?.orderStatus)

  useEffect(() => {
    if (!order?.preparationTime) return

    const calculateRemaining = () => {
      if (order.preparingStartedAt) {
        const started = new Date(order.preparingStartedAt).getTime()
        const now = Date.now()
        const elapsed = Math.floor((now - started) / 60000)
        const remaining = Math.max(0, order.preparationTime - elapsed)
        return remaining
      }
      return order.preparationTime
    }

    setRemainingPrepTime(calculateRemaining())

    const interval = setInterval(() => {
      setRemainingPrepTime(calculateRemaining())
    }, 1000)

    return () => clearInterval(interval)
  }, [order?.preparationTime, order?.preparingStartedAt])

  // Fetch delivery location and calculate ETA for out_for_delivery orders
  useEffect(() => {
    if (!order || order.orderStatus !== 'out_for_delivery' || !order.assignedDeliveryBoy) return

    const fetchDeliveryLocation = async () => {
      try {
        const { deliveryAPI } = await import('../../services/api')
        const res = await deliveryAPI.getDeliveryLocation(order._id)
        if (res.data?.deliveryBoy?.location) {
          setDeliveryLocation(res.data.deliveryBoy.location)
          // Calculate simple ETA based on distance (placeholder - could integrate Google Maps API)
          setEtaMinutes(order.deliveryBoyEstimatedTime !== null && order.deliveryBoyEstimatedTime !== undefined ? order.deliveryBoyEstimatedTime : null)
        }
      } catch (err) {
        console.log('Delivery location not available')
      }
    }

    fetchDeliveryLocation()
    const interval = setInterval(fetchDeliveryLocation, 30000)
    return () => clearInterval(interval)
  }, [order?._id, order?.orderStatus, order?.assignedDeliveryBoy])

  // Countdown for ETA
  useEffect(() => {
    if (!etaMinutes || etaMinutes <= 0) return
    const interval = setInterval(() => {
      setEtaMinutes(prev => Math.max(0, (prev || 0) - 1))
    }, 60000)
    return () => clearInterval(interval)
  }, [etaMinutes])

  const handleReorder = async () => {
    if (!order?.items || order.items.length === 0) return
    try {
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
      router.push('/cart')
    } catch (err) {
      toast.error('Failed to add items')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-center">
      <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 animate-bounce-once">
        <CheckCircle size={32} className="text-green-500 md:size-10" />
      </div>
      <h1 className="font-display font-bold text-2xl md:text-3xl text-gray-900 dark:text-white mb-2">Order Placed!</h1>
      <p className="text-gray-500 text-sm md:text-base mb-2">Your order has been placed successfully.</p>
      {order && <p className="text-xs md:text-sm text-gray-400 mb-6 md:mb-8">Order #{order.orderNumber}</p>}

      {/* Estimated Time Display */}
      {(order?.preparationTime || order?.estimatedDeliveryTime) && order?.orderStatus !== 'pending' && (
        <div className="card p-4 mb-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock size={18} className="text-blue-500" />
            <span className="font-semibold text-blue-600 dark:text-blue-400">Estimated Time</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {order?.preparationTime && order?.orderStatus !== 'pending' && (
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {remainingPrepTime !== null && remainingPrepTime > 0 
                    ? remainingPrepTime 
                    : order.preparationTime}
                </p>
                <p className="text-xs text-gray-500">Prep (min)</p>
              </div>
            )}
            {order?.deliveryBoyEstimatedTime && order?.orderStatus === 'out_for_delivery' && (
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{order.deliveryBoyEstimatedTime}</p>
                <p className="text-xs text-gray-500">Delivery (min)</p>
              </div>
            )}
            {order?.estimatedDeliveryTime && (
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{order.estimatedDeliveryTime}</p>
                <p className="text-xs text-gray-500">Total (min)</p>
              </div>
            )}
          </div>
          {!order?.preparingStartedAt && (
            <p className="text-xs text-gray-400 mt-3">
              Preparing will start soon...
            </p>
          )}
          {order?.preparingStartedAt && !order?.outForDeliveryAt && (
            <p className="text-xs text-gray-400 mt-3">
              {remainingPrepTime !== null && remainingPrepTime > 0 
                ? `Started at ${new Date(order.preparingStartedAt).toLocaleTimeString()} • ${remainingPrepTime} min remaining`
                : `Started at ${new Date(order.preparingStartedAt).toLocaleTimeString()}`
              }
            </p>
          )}
          {order?.outForDeliveryAt && (
            <p className="text-xs text-gray-400 mt-3">
              Out for delivery at {new Date(order.outForDeliveryAt).toLocaleTimeString()}
            </p>
          )}

          {/* Live ETA for out for delivery orders */}
          {order?.orderStatus === 'out_for_delivery' &&
            order?.assignedDeliveryBoy &&
            etaMinutes !== null && (
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-purple-500" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Your order is on the way!
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    ~{etaMinutes} min
                  </p>
                  <p className="text-xs text-gray-500">Estimated arrival</p>
                </div>
              </div>
            )}
        </div>
      )}


      {order && (
        <div className="card p-6 mb-6 text-left">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-5">Order Tracking</h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800" />
            {STATUS_STEPS.map((step, i) => {
              const Icon = step.icon
              const done = i <= currentStep
              const active = i === currentStep
              return (
                <div key={step.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                  <div
                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all 
                  ${done  ? step.color + ' shadow-lg' : 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    <Icon size={20} className={done ? 'text-white' : 'text-primary-500'} />
                  </div>
                  <div className="flex-1 pt-2.5">
                    <p className={`font-semibold text-sm ${done ? 'text-gray-900 dark:text-white' : 'text-primary-500'}`}>{step.label}</p>
                    {active && <p className="text-xs text-primary-500 font-medium mt-0.5 animate-pulse-slow">In progress...</p>}
                  </div>
                  {done && <div className="pt-2.5"><CheckCircle size={16} className="text-primary-500" /></div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Live Delivery Tracking - Show when out for delivery */}
      {order && (order.orderStatus === 'out_for_delivery' || order.orderStatus === 'preparing') && order.deliveryAddress?.lat && (
        <div className="card p-4 mb-6 ">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Live Tracking</h2>
          <DeliveryTrackingMap
            orderId={order._id}
            deliveryAddress={order.deliveryAddress}
            refreshInterval={10000}
          />
        </div>
      )}

      {/* Order Details */}
      {order && (
        <div className="card p-5 mb-6 text-left">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Order Details</h2>
          <div className="space-y-2 text-sm">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-500">{item.name || 'Item'} x{item.quantity}</span>
                <span className="font-medium">₹{(item.price * item.quantity)}</span>
              </div>
            ))}
            <hr className="border-gray-100 dark:border-gray-800 my-2" />
            <div className="flex justify-between font-bold">
              <span>Total Paid</span>
              <span className="text-primary-500">₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment</span>
              <span className="font-medium">{order.paymentMethod}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
       {order && (
         <>
           <div className="flex gap-2 md:gap-3 flex-col sm:flex-row mb-6">
             <button onClick={handleReorder} className="flex-1 btn-outline flex items-center justify-center gap-2 py-3 md:py-4 text-sm md:text-base">
               <RotateCcw size={16} /> Order Again
             </button>
             <Link href="/" className="flex-1 btn-outline text-center py-3 md:py-4 text-sm md:text-base">Back to Home</Link>
             <Link href="/my-orders" className="flex-1 btn-primary text-center py-3 md:py-4 text-sm md:text-base">My Orders</Link>
           </div>
         </>
       )}
    </div>
  )
}
