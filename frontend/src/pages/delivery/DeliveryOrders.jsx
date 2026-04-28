import { useEffect, useState } from 'react'
import { deliveryAPI } from '../../services/api'
import { CheckCircle, Package, QrCode } from 'lucide-react'

const STATUS_COLOR = {
  'out_for_delivery': 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  'delivered': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
}

export default function DeliveryOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    deliveryAPI.getAssignedOrders().then(r => setOrders(r.data.orders || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.orderStatus === filter)

  return (
    <div className="space-y-4 py-4">
      <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">All Orders</h1>

      <div className="flex gap-2">
        {['all', 'active', 'delivered'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:4}).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          <Package size={40} className="mx-auto mb-2 opacity-20" />
          <p>No orders</p>
        </div>
      ) : filtered.map(order => (
        <div key={order._id} className="card p-4">
          <div className="flex justify-between items-center mb-1">
            <p className="font-bold text-gray-900 dark:text-white">#{order.orderNumber}</p>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${STATUS_COLOR[order.orderStatus]}`}>
              {order.orderStatus}
            </span>
          </div>
          <p className="text-sm text-gray-500">{order.user?.name}</p>
          <p className="text-xs text-gray-400">{order.deliveryAddress?.fullAddress}, {order.deliveryAddress?.city}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="font-bold text-primary-500">₹{order.totalAmount}</span>
            <div className="flex items-center gap-2">
              {order.paymentMethod === 'cod' && (
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {order.paymentStatus === 'paid' ? 'Paid' : 'COD'}
                </span>
              )}
              <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}

      {selectedOrder && (
        <PaymentQRModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onPaymentComplete={() => {
            setOrders(orders.map(o => 
              o._id === selectedOrder._id ? { ...o, paymentStatus: 'paid' } : o
            ))
          }}
        />
      )}
    </div>
  )
}
