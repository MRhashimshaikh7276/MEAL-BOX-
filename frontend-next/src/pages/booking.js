import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Phone, User, Mail, MessageSquare, CheckCircle, Utensils, Star, MapPin, ArrowLeft, Loader } from 'lucide-react'
import { bookingAPI, generalSettingsAPI, reviewAPI } from '../services/api'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function TableBookingPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    guests: 2,
    specialRequest: ''
  })
  const [loading, setLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [restaurantInfo, setRestaurantInfo] = useState(null)
  const [blockedDates, setBlockedDates] = useState([])
  const router = useRouter()

  useEffect(() => {
    loadRestaurantInfo()
  }, [])

  const loadRestaurantInfo = async () => {
    try {
      // Fetch settings and reviews in parallel
      const [settingsRes, reviewsRes] = await Promise.all([
        generalSettingsAPI.get(),
        reviewAPI.getStats().catch(() => ({ data: { rating: 0, reviewsCount: 0 } }))
      ])

      const settings = settingsRes.data?.settings || settingsRes.data?.message || settingsRes.data
      setBlockedDates(settings?.blockedDates || [])
      const reviewStats = reviewsRes.data && reviewsRes.data.rating !== undefined ? reviewsRes.data : { rating: 0, reviewsCount: 0 }
      console.log('Review Stats:', reviewStats)

      if (settings) {
        let isOpen = true
        if (settings.businessHours?.autoClose && settings.businessHours?.open && settings.businessHours?.close) {
          const now = new Date()
          const currentTime = now.getHours() * 60 + now.getMinutes()
          const parseTime = (timeStr) => {
            if (!timeStr) return null
            const [hours, minutes] = timeStr.split(':').map(Number)
            return hours * 60 + minutes
          }
          const openTime = parseTime(settings.businessHours.open)
          const closeTime = parseTime(settings.businessHours.close)
          if (openTime !== null && closeTime !== null) {
            if (openTime <= closeTime) {
              isOpen = currentTime >= openTime && currentTime < closeTime
            } else {
              isOpen = currentTime >= openTime || currentTime < closeTime
            }
          }
        } else if (settings.isOpen !== undefined) {
          isOpen = settings.isOpen
        }

        setRestaurantInfo({
          name: settings.companyName || 'Meal Box',
          address: settings.companyAddress || '',
          phone: settings.companyPhone || '',
          email: settings.companyEmail || '',
          rating: reviewStats.rating || 0,
          reviews: reviewStats.reviewsCount || 0,
          timing: settings.businessHours ? `${settings.businessHours.open} - ${settings.businessHours.close}` : '8:00 AM - 10:00 PM',
          isOpen: isOpen,
          autoClose: settings.businessHours?.autoClose
        })
      }
    } catch (err) {
      setRestaurantInfo({
        name: 'Meal Box',
        address: 'Opposite Ashoka Medicover Hospital, Indira Nagar, Nashik',
        rating: 0,
        reviews: 0,
        timing: '8:00 AM - 10:00 PM',
        isOpen: true,
        autoClose: false
      })
    }
  }

  const baseTimeSlots = [
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '21:00', label: '9:00 PM' },
    { value: '22:00', label: '10:00 PM' },
    { value: '23:00', label: '11:00 PM' },
    { value: '24:00', label: '12:00 PM' },

  ]

  // Check if time is blocked for selected date
  const isTimeBlocked = (time) => {
    return blockedDates.some(b => {
      if (b.date !== formData.date || !b.isActive) return false;
      if (!b.startTime && !b.endTime) return true;
      if (b.startTime && b.endTime) {
        return time >= b.startTime && time <= b.endTime;
      }
      return false;
    });
  }

  // Dynamic time slots with blocked times disabled
  const timeSlots = baseTimeSlots.map(slot => ({
    ...slot,
    available: !isTimeBlocked(slot.value)
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!restaurantInfo.isOpen) {
      toast.error('Restaurant is currently closed. Please try again during open hours.')
      return
    }

    // Check if date AND time is blocked
    if (formData.date && formData.time) {
      const isBlocked = blockedDates.find(b => {
        if (b.date !== formData.date || !b.isActive) return false;

        // If no time range, block entire day
        if (!b.startTime && !b.endTime) return true;

        // Check if booking time falls in blocked range
        if (b.startTime && b.endTime) {
          return formData.time >= b.startTime && formData.time <= b.endTime;
        }

        return false;
      });

      if (isBlocked) {
        const timeMsg = isBlocked.startTime && isBlocked.endTime ? ` at ${isBlocked.startTime} - ${isBlocked.endTime}` : '';
        toast.error(`Sorry! Table booking is not available${timeMsg} on ${formData.date}. ${isBlocked.reason}`)
        return
      }
    }

    if (!formData.name || !formData.phone || !formData.date || !formData.time) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      const bookingData = {
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        date: formData.date,
        time: formData.time,
        guests: formData.guests,
        specialRequest: formData.specialRequest
      }
      await bookingAPI.create(bookingData)
      setBookingSuccess(true)
      toast.success('Table booked successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book table')
    } finally {
      setLoading(false)
    }
  }

  if (!restaurantInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950 dark:via-gray-900 dark:to-emerald-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card p-8 text-center animate-scale-in">booking
            <div className="relative mx-auto mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <CheckCircle size={48} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <Clock size={20} className="text-white" />
              </div>
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Booking Requested!</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Your table booking is pending. Admin will confirm shortly!</p>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl p-5 mb-6 text-left border border-green-100 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-green-100 dark:border-green-800">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center">
                  <Utensils size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{restaurantInfo.name}</p>
                  <p className="text-sm text-gray-500">Table for {formData.guests} {formData.guests === 1 ? 'guest' : 'guests'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar size={16} className="text-green-500" />
                    <span className="text-sm">Date</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {new Date(formData.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock size={16} className="text-green-500" />
                    <span className="text-sm">Time</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {timeSlots.find(t => t.value === formData.time)?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User size={16} className="text-green-500" />
                    <span className="text-sm">Guests</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{formData.guests} people</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/" className="btn-outline flex-1 text-center">
                Back to Home
              </Link>
              <Link
                href="/my-bookings"
                className="btn-primary flex-1 text-center"
              >
                My Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950 dark:via-gray-900 dark:to-rose-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 mb-6">
            <ArrowLeft size={18} /> Back
          </Link>
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-500/20 px-4 py-1.5 rounded-full mb-4">
              <Utensils size={14} className="text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">Book a Table</span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-3">
              Reserve Your <span className="text-primary-500">Perfect</span> Table
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Book your table for an unforgettable dining experience at Meal Box
            </p>

            {!restaurantInfo.isOpen && (
              <div className="mt-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
                    <Clock size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-600 dark:text-red-400">We're Currently Closed</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Open from {restaurantInfo.timing}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card p-4 md:p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 shrink-0">
                <Utensils size={22} className="text-white md:hidden" />
                <Utensils size={28} className="text-white hidden md:block" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">{restaurantInfo.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{restaurantInfo.address}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-3 md:pt-0 md:pl-4">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">{restaurantInfo.rating}</span>
                </div>
                <p className="text-xs text-gray-500">{restaurantInfo.reviews} reviews</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">{restaurantInfo.timing}</p>
                {restaurantInfo.isOpen ? (
                  <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Open
                  </p>
                ) : (
                  <p className="text-xs text-red-500 font-medium flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Closed
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6 order-2 md:order-1">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-primary-500 text-white text-sm font-bold flex items-center justify-center">1</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Your Details</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" className="input pl-10" placeholder="Enter your full name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number *</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" className="input pl-10" placeholder="10-digit mobile number" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email (optional)</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" className="input pl-10" placeholder="your@email.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-800" />

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-primary-500 text-white text-sm font-bold flex items-center justify-center">2</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Reservation</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Date *</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="date" className="input pl-10" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} min={new Date().toISOString().split('T')[0]} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Time *</label>
                    <div className="relative">
                      <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                      <select className="input pl-10" value={formData.time} onChange={e => setFormData(p => ({ ...p, time: e.target.value }))} required>
                        <option value="">Choose time</option>
                        {timeSlots.map(slot => (
                          <option key={slot.value} value={slot.value} disabled={!slot.available}>
                            {slot.label} {!slot.available && '(Full)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Number of Guests *</label>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => setFormData(p => ({ ...p, guests: Math.max(1, p.guests - 1) }))} disabled={formData.guests <= 1} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">-</button>
                      <div className="flex items-center gap-2">
                        <Users size={20} className="text-gray-400" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">{formData.guests}</span>
                      </div>
                      <button type="button" onClick={() => setFormData(p => ({ ...p, guests: Math.min(20, p.guests + 1) }))} disabled={formData.guests >= 20} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">+</button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Special Request (optional)</label>
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-3 top-3 text-gray-400" />
                  <textarea className="input h-20 resize-none pl-10" placeholder="Birthday celebration, seating preference, dietary requirements..." value={formData.specialRequest} onChange={e => setFormData(p => ({ ...p, specialRequest: e.target.value }))} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg">
                {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={20} /> Confirm Reservation</>}
              </button>
            </form>
          </div>

          <div className="card p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white order-1 md:order-2 md:hidden lg:block">
            <h3 className="font-semibold text-lg mb-4">Reservation Preview</h3>
            <div className="space-y-4">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><User size={20} /></div>
                  <div>
                    <p className="text-sm text-white/70">Guest</p>
                    <p className="font-semibold">{formData.name || 'Your name'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Phone size={20} /></div>
                  <div>
                    <p className="text-sm text-white/70">Phone</p>
                    <p className="font-semibold">{formData.phone || 'Phone number'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Calendar size={24} className="mx-auto mb-2 opacity-70" />
                    <p className="text-sm text-white/70">Date</p>
                    <p className="font-semibold">{formData.date ? new Date(formData.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '--'}</p>
                  </div>
                  <div className="text-center border-l border-white/20">
                    <Clock size={24} className="mx-auto mb-2 opacity-70" />
                    <p className="text-sm text-white/70">Time</p>
                    <p className="font-semibold">{formData.time ? timeSlots.find(t => t.value === formData.time)?.label : '--'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm text-center">
                <Users size={24} className="mx-auto mb-2 opacity-70" />
                <p className="text-sm text-white/70">Guests</p>
                <p className="font-semibold text-3xl">{formData.guests}</p>
              </div>

              {formData.specialRequest && (
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-sm text-white/70 mb-1">Special Request</p>
                  <p className="font-medium">{formData.specialRequest}</p>
                </div>
              )}

              <div className="pt-4 border-t border-white/20">
                <div className="flex items-center gap-2 text-sm">
                  <Utensils size={16} />
                  <span>{restaurantInfo.name} - {restaurantInfo.address?.split(',')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}