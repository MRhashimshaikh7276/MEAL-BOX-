import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { fetchAllOrders } from '../../redux/slices/adminSlice'
import { adminAPI } from '../../services/api'
import { Search, Filter, Eye, Wallet, DollarSign, Users, X } from 'lucide-react'
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

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'cod', label: 'COD' },
  { value: 'razorpay', label: 'Online' },
  { value: 'wallet', label: 'Wallet' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
]

export default function AdminOrders() {
  const router = useRouter()
  const dispatch = useDispatch()
  const navigate = router.push
  const { orders, loading } = useSelector(s => s.admin)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [codCollections, setCodCollections] = useState(null)
  const [showCODModal, setShowCODModal] = useState(false)
  const [loadingCOD, setLoadingCOD] = useState(false)

  useEffect(() => { dispatch(fetchAllOrders()) }, [dispatch])

  const handleStatusUpdate = async (orderId, status) => {
    setUpdatingId(orderId)
    try {
      await adminAPI.updateOrderStatus(orderId, { status })
      toast.success('Status updated!')
      dispatch(fetchAllOrders())
    } catch { toast.error('Failed to update') }
    finally { setUpdatingId(null) }
  }

  const loadCODCollections = async () => {
    setLoadingCOD(true)
    try {
      const res = await adminAPI.getCODCollections()
      // Handle both response formats: res.data.data or res.data
      const data = res.data?.data || res.data
      console.log('COD Collections:', data)
      setCodCollections(data || {})
      setShowCODModal(true)
    } catch (err) {
      console.error('COD Error:', err)
      // Fallback to local data if API fails
      setCodCollections({})
      setShowCODModal(true)
      toast.error('Using local data')
    } finally {
      setLoadingCOD(false)
    }
  }

  // COD Summary
  const codOrders = orders.filter(o => o.paymentMethod === 'cod')
  const codPending = codOrders.filter(o => o.paymentStatus === 'pending')
  const codPaid = codOrders.filter(o => o.paymentStatus === 'paid')
  const codPendingAmount = codPending.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const codPaidAmount = codPaid.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.orderNumber?.toString().includes(search) || o.userId?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || o.orderStatus === filterStatus
    const matchPaymentMethod = !filterPaymentMethod || o.paymentMethod === filterPaymentMethod
    const matchPaymentStatus = !filterPaymentStatus || o.paymentStatus === filterPaymentStatus
    return matchSearch && matchStatus && matchPaymentMethod && matchPaymentStatus
  })

  console.log('Orders:', orders?.length, 'COD:', codOrders?.length)
  
  return (
    <div className="space-y-5">
      {/* Debug - remove in production */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="text-xs text-gray-400 p-2 bg-gray-100 dark:bg-gray-800 rounded">
          Debug: {orders?.length || 0} orders, {codOrders?.length || 0} COD orders
        </div>
      )}
      
      {/* COD Summary Cards - Show even if empty to help debug */}
      {codOrders && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4 border-l-4 border-blue-500">
            <p className="text-xs text-gray-500 uppercase">Total COD Orders</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{codOrders?.length || 0}</p>
          </div>
          <div className="card p-4 border-l-4 border-orange-500">
            <p className="text-xs text-gray-500 uppercase">COD Pending</p>
            <p className="text-2xl font-bold text-orange-600">₹{codPendingAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{codPending?.length || 0} orders</p>
          </div>
          <div className="card p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-500 uppercase">COD Collected</p>
            <p className="text-2xl font-bold text-green-600">₹{codPaidAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{codPaid?.length || 0} orders</p>
          </div>
          <div className="card p-4 border-l-4 border-purple-500">
            <p className="text-xs text-gray-500 uppercase">Total COD Amount</p>
            <p className="text-2xl font-bold text-purple-600">₹{(codPendingAmount + codPaidAmount).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Delivery Boy COD Collection Button - Always show if there are orders */}
      {orders && orders.length > 0 && (
        <button
          onClick={loadCODCollections}
          disabled={loadingCOD}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
        >
          <Users size={18} />
          <span className="font-semibold">{loadingCOD ? 'Loading...' : 'Delivery Boy COD Collections'}</span>
        </button>
      )}

      {/* COD Collections Modal */}
      {showCODModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-lg">COD Collections by Delivery Boy</h2>
              <button onClick={() => setShowCODModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {/* Summary - use local calculation as fallback */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-orange-600">₹{codPendingAmount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-gray-500">Collected</p>
                  <p className="text-xl font-bold text-green-600">₹{codPaidAmount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-blue-600">₹{(codPendingAmount + codPaidAmount).toLocaleString()}</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-2">* API data loading - check console for errors</p>

              {/* Delivery Boy List */}
              {codCollections.byDeliveryBoy?.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">By Delivery Boy</h3>
                  {codCollections.byDeliveryBoy.map((boy) => (
                    <div key={boy.deliveryBoy?._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{boy.deliveryBoy?.name || 'Unassigned'}</p>
                        <p className="text-xs text-gray-400">{boy.deliveryBoy?.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{boy.collected?.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{boy.totalOrders} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">No delivery boy data</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Orders</h1>
        <p className="text-sm text-gray-500">{orders.length} total orders</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order or customer..." className="input pl-9 py-2.5 text-sm" />
        </div>
        
        {/* Payment Method Filter */}
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-gray-400" />
          <select
            value={filterPaymentMethod}
            onChange={e => setFilterPaymentMethod(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          >
            {PAYMENT_METHOD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        {/* Payment Status Filter */}
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-gray-400" />
          <select
            value={filterPaymentStatus}
            onChange={e => setFilterPaymentStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
          >
            {PAYMENT_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Order Status Filter */}
      <div className="flex gap-2 flex-wrap">
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
                      {STATUS_OPTIONS.filter(opt => opt.value !== 'delivered').map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
