import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Phone, Mail, MessageSquare, CheckCircle, XCircle, Trash2, Search } from 'lucide-react'
import { bookingAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadBookings()
  }, [filter])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const res = await bookingAPI.getAll(params)
      setBookings(res.data.bookings || [])
    } catch (err) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await bookingAPI.updateStatus(id, { status })
      toast.success(`Booking ${status}!`)
      loadBookings()
    } catch (err) {
      toast.error('Failed to update')
    }
  }

  const deleteBooking = async (id) => {
    if (!confirm('Are you sure?')) return
    try {
      await bookingAPI.delete(id)
      toast.success('Booking deleted')
      loadBookings()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const filteredBookings = bookings.filter(b => 
    b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    b.customerPhone?.includes(search)
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">Table Bookings</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div key={booking._id} className="card p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{booking.customerName}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status?.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{booking.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      <span>{booking.guests} guests</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} />
                      <span>{booking.customerPhone}</span>
                    </div>
                  </div>

                  {booking.customerEmail && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <Mail size={14} />
                      <span>{booking.customerEmail}</span>
                    </div>
                  )}

                  {booking.specialRequest && (
                    <div className="flex items-start gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <MessageSquare size={14} className="mt-0.5" />
                      <span className="italic">"{booking.specialRequest}"</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {booking.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(booking._id, 'confirmed')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle size={16} /> Confirm
                    </button>
                    <button
                      onClick={() => updateStatus(booking._id, 'cancelled')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  </div>
                )}

                {booking.status === 'confirmed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(booking._id, 'completed')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      <CheckCircle size={16} /> Complete
                    </button>
                    <button
                      onClick={() => deleteBooking(booking._id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Booked: {new Date(booking.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}