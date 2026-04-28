import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchAllOrders } from '../../redux/slices/adminSlice'
import { adminAPI } from '../../services/api'
import { Search, Filter, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

// values must match backend enum (lowercase with underscores)
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]
const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',

  preparing: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  out_for_delivery: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

export default function AdminOrders() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { orders, loading } = useSelector(s => s.admin)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => { dispatch(fetchAllOrders()) }, [])

  const handleStatusUpdate = async (orderId, status) => {
    setUpdatingId(orderId)
    try {
      await adminAPI.updateOrderStatus(orderId, status)
      toast.success('Status updated!')
      dispatch(fetchAllOrders())
    } catch { toast.error('Failed to update') }
    finally { setUpdatingId(null) }
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.orderNumber?.toString().includes(search) || o.userId?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || o.orderStatus === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Orders</h1>
        <p className="text-sm text-gray-500">{orders.length} total orders</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order or customer..." className="input pl-9 py-2.5 text-sm" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${filterStatus === '' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${filterStatus === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('preparing')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${filterStatus === 'preparing' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Preparing
          </button>
          <button
            onClick={() => setFilterStatus('out_for_delivery')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${filterStatus === 'out_for_delivery' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Out for Delivery
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Order', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Date', 'Update', 'actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                    {Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No orders found</td></tr>
              ) : filtered.map(order => (
                <tr key={order._id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">#{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{order.user?.name}</p>
                    <p className="text-xs text-gray-400">{order.user?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{order.items?.length} item{order.items?.length > 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">₹{order.totalAmount}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{order.paymentMethod}</span>
                      <p className={`text-xs font-bold ${order.paymentStatus === 'paid' ? 'text-green-500' : 'text-orange-500'}`}>
                        {order.paymentStatus || 'pending'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ${STATUS_COLOR[order.orderStatus]}`}>
                      {STATUS_OPTIONS.find(o => o.value === order.orderStatus)?.label || order.orderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.orderStatus}
                      onChange={e => handleStatusUpdate(order._id, e.target.value)}
                      disabled={updatingId === order._id || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled'}
                      className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50">
                      {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Eye 
                      className="w-4 h-4 text-gray-500 hover:text-primary-500 cursor-pointer" 
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
