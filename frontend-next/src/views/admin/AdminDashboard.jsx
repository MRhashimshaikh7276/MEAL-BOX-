import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { fetchDashboard } from '../../redux/slices/adminSlice'
import { ShoppingBag, Users, Package, TrendingUp, IndianRupee, Clock } from 'lucide-react'
import { DashboardStatSkeleton } from '../../components/common/Skeleton'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const StatCard = ({ title, value, icon: Icon, color, sub, onClick }) => (
  <div className={`card p-5 ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors' : ''}`} onClick={onClick}>
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <p className="font-display font-bold text-3xl text-gray-900 dark:text-white">{value ?? '-'}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

const STATUS_COLOR = {
  'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  'Preparing': 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  'Out for delivery': 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  'Delivered': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

export default function AdminDashboard() {
  const router = useRouter()
  const dispatch = useDispatch()
  const navigate = router.push
  const { dashboard, loading } = useSelector(s => s.admin)

  useEffect(() => { dispatch(fetchDashboard()) }, [dispatch])

  const stats = dashboard?.stats
  const recentOrders = dashboard?.recentOrders || []
  const chartData = dashboard?.revenueChart || [
    { name: 'Mon', revenue: 2400 }, { name: 'Tue', revenue: 1398 }, { name: 'Wed', revenue: 3800 },
    { name: 'Thu', revenue: 3908 }, { name: 'Fri', revenue: 4800 }, { name: 'Sat', revenue: 3800 }, { name: 'Sun', revenue: 4300 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <DashboardStatSkeleton key={i} />) : (
          <>
            <StatCard title="Total Revenue" value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`} icon={IndianRupee} color="bg-primary-500" sub="All time" />
            <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={ShoppingBag} color="bg-blue-500" sub="All time" onClick={() => navigate('/admin/orders')} />
            <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="bg-purple-500" sub="Registered" onClick={() => navigate('/admin/users')} />
            <StatCard title="Total Products" value={stats?.totalProducts || 0} icon={Package} color="bg-green-500" sub="Active items" onClick={() => navigate('/admin/products')} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={20} className="text-primary-500" />
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Weekly Revenue</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2.5} dot={{ fill: '#FF6B00', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={20} className="text-primary-500" />
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Order Status</h2>
          </div>
          {dashboard?.orderStatusDist ? (
            <div className="space-y-3">
              {Object.entries(dashboard.orderStatusDist).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${STATUS_COLOR[status]}`}>{status}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min((count / (stats?.totalOrders || 1)) * 100, 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card p-5">
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-5">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Order #', 'Customer', 'Items', 'Amount', 'Status', 'Time'].map(h => (
                  <th key={h} className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No orders yet</td></tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order._id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 font-bold text-gray-900 dark:text-white">#{order.orderNumber}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{order.userId?.name}</td>
                    <td className="py-3 text-gray-500">{order.items?.length} item{order.items?.length > 1 ? 's' : ''}</td>
                    <td className="py-3 font-bold text-gray-900 dark:text-white">₹{order.totalAmount}</td>
                    <td className="py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${STATUS_COLOR[order.orderStatus]}`}>{order.orderStatus}</span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">{new Date(order.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
