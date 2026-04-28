import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchOrderById } from '../../redux/slices/orderSlice'
import { CheckCircle, Package, Clock, Truck, Home, XCircle } from 'lucide-react'
import DeliveryTrackingMap from '../../components/customer/DeliveryTrackingMap'

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package, color: 'bg-yellow-500' },

  { key: 'preparing', label: 'Preparing', icon: Clock, color: 'bg-blue-500' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-purple-500' },
  { key: 'delivered', label: 'Delivered', icon: Home, color: 'bg-green-600' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500' },
]

export default function OrderSuccessPage() {
  const { orderId } = useParams()
  const dispatch = useDispatch()
  const { order } = useSelector(s => s.orders)

  useEffect(() => {
    dispatch(fetchOrderById(orderId))
  }, [orderId])

  const currentStep = STATUS_STEPS.findIndex(s => s.key === order?.orderStatus)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-center">
      <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-once">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Order Placed!</h1>
      <p className="text-gray-500 mb-2">Your order has been placed successfully.</p>
      {order && <p className="text-sm text-gray-400 mb-8">Order #{order.orderNumber}</p>}


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
                  ${done ? step.color + ' shadow-lg' : 'bg-gray-100 dark:bg-gray-800'}`}
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

      <div className="flex gap-3">
        <Link to="/" className="flex-1 btn-outline text-center">Back to Home</Link>
        <Link to="/my-orders" className="flex-1 btn-primary text-center">My Orders</Link>
      </div>
    </div>
  )
}
