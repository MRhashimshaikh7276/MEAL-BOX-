import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, User, Phone, Mail, MessageSquare, CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react'
import { bookingAPI } from '../services/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import useRouter from 'next/router'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

   useEffect(() => {
     loadMyBookings()

     // Auto-refresh every 30 seconds to get real-time status updates 
     const interval = setInterval(() => {
       loadMyBookings()
     }, 10000)

     return () => clearInterval(interval)
   }, [])

  const loadMyBookings = async () => {
    setLoading(true)
    try {
      const res = await bookingAPI.getMy()
      setBookings(res.data.bookings || [])
    } catch (err) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30'
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30'
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={16} />
      case 'cancelled': return <XCircle size={16} />
      case 'completed': return <CheckCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  const timeSlots = [
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '21:00', label: '9:00 PM' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold text-lg text-gray-900 dark:text-white">My Bookings</h1>
          <div className="w-9"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 pb-24">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Bookings Yet</h3>
            <p className="text-gray-500 text-sm mb-6">You haven't made any table bookings yet.</p>
            <Link href="/booking" className="btn-primary">Book a Table</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-xl flex items-center justify-center">
                      <Calendar size={24} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {timeSlots.find(t => t.value === booking.time)?.label} • {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                      </p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    {booking.status?.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <User size={14} />
                    <span>{booking.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone size={14} />
                    <span>{booking.customerPhone}</span>
                  </div>
                </div>
                

                {booking.specialRequest && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Special Request</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{booking.specialRequest}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}