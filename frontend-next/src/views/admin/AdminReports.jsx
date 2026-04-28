import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, Users, ShoppingCart, DollarSign, Package, Star, Clock, X } from 'lucide-react'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

export default function AdminReports() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getReports({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
      setReports(res.data)
    } catch (error) {
      toast.error('Failed to load reports')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    loadReports()
  }

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Comprehensive analytics and statistics</p>
        </div>
        
        {/* Date Filter */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar size={18} className="text-gray-500 hidden sm:block" />
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="input text-sm py-2 w-full sm:w-auto min-w-[100px]"
            />
            <span className="text-gray-400 hidden sm:inline">to</span>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="input text-sm py-2 w-full sm:w-auto min-w-[100px]"
            />
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto">
            Apply
          </button>
        </form>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{reports?.userStats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ShoppingCart className="text-green-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{reports?.orderStats?.totalOrders || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <DollarSign className="text-purple-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">₹{reports?.orderStats?.totalRevenue?.toFixed(2) || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <TrendingUp className="text-orange-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">New Users</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{reports?.newUsers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="card p-5">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Order Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {reports?.orderStatusBreakdown?.map((item, idx) => (
            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item._id}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{item.count}</p>
              <p className="text-xs text-gray-400">₹{item.revenue?.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card p-5">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Payment Methods</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reports?.paymentMethodBreakdown?.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white uppercase">{item._id}</p>
              <p className="text-2xl font-bold text-primary-500">{item.count}</p>
              <p className="text-sm text-gray-500">₹{item.revenue?.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Top Selling Products</h2>
          {reports?.topProducts?.length > 0 && (
            <button 
              onClick={() => exportToCSV(reports.topProducts, 'top_products')}
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
            >
              <Download size={14} /> Export
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reports?.topProducts?.map((product, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-sm text-gray-500">{idx + 1}</td>
                  <td className="py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">{product._id}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-600 dark:text-gray-300">{product.quantity}</td>
                  <td className="py-3 px-2 text-sm text-right font-medium text-green-600">₹{product.revenue?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Categories */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Top Categories</h2>
          {reports?.topCategories?.length > 0 && (
            <button 
              onClick={() => exportToCSV(reports.topCategories, 'top_categories')}
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
            >
              <Download size={14} /> Export
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Orders</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reports?.topCategories?.map((cat, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-sm text-gray-500">{idx + 1}</td>
                  <td className="py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">{cat._id}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-600 dark:text-gray-300">{cat.orders}</td>
                  <td className="py-3 px-2 text-sm text-right font-medium text-green-600">₹{cat.revenue?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Orders */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Daily Orders Trend</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Orders</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reports?.dailyOrders?.slice(-10).map((day, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-sm text-gray-900 dark:text-white">{day._id}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-600 dark:text-gray-300">{day.orders}</td>
                  <td className="py-3 px-2 text-sm text-right font-medium text-green-600">₹{day.revenue?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Boy Performance */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Delivery Boy Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Deliveries</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reports?.deliveryPerformance?.map((boy, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-sm text-gray-500">{idx + 1}</td>
                  <td className="py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">{boy.name}</td>
                  <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-300">{boy.phone}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-600 dark:text-gray-300">{boy.totalDeliveries}</td>
                  <td className="py-3 px-2 text-sm text-right font-medium text-green-600">₹{boy.revenue?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Combo Sales */}
      {reports?.comboSales?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Combo Sales</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Combo Name</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reports?.comboSales?.map((combo, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-2 text-sm text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-2 text-sm font-medium text-gray-900 dark:text-white">{combo.comboName}</td>
                    <td className="py-3 px-2 text-sm text-right text-gray-600 dark:text-gray-300">{combo.quantity}</td>
                    <td className="py-3 px-2 text-sm text-right font-medium text-green-600">₹{combo.revenue?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hourly Analysis */}
      <div className="card p-5">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Peak Hours Analysis</h2>
        <div className="flex flex-wrap gap-2">
          {reports?.hourlyOrders?.map((hour, idx) => (
            <div key={idx} className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-center min-w-[60px]">
              <p className="text-xs text-gray-500 dark:text-gray-400">{hour._id}:00</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{hour.orders}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
