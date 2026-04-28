import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { Package, CheckCircle, Truck, MapPin, Navigation, RefreshCw, Phone, QrCode, X, CreditCard } from 'lucide-react'
import { deliveryAPI, orderAPI } from '../../services/api'
import toast from 'react-hot-toast'

// Dynamically import DeliveryMap with SSR disabled to prevent Leaflet window error
const DeliveryMap = dynamic(() => import('../../components/delivery/DeliveryMap'), { ssr: false })
import QRCode from 'react-qr-code'

export default function DeliveryDashboard() {
  const router = useRouter()
  const { user } = useSelector(s => s.auth)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(false)
  const [qrModal, setQrModal] = useState({ show: false, order: null, qrData: null, loading: false, error: null })
  const [processingPayment, setProcessingPayment] = useState(null)
  const [myLocation, setMyLocation] = useState(null)

  const load = () => {
    deliveryAPI.getAssignedOrders().then(r => setOrders(r.data.orders || [])).catch(() => { }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Auto-get location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [])

  const updateMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setMyLocation(loc); // Store for distance calculation
        try {
          await deliveryAPI.updateLocation(loc.lat, loc.lng);
          toast.success('Location updated!');
        } catch (err) {
          toast.error('Failed to update location');
        } finally {
          setUpdatingLocation(false);
        }
      },
      (error) => {
        toast.error('Unable to get your location');
        setUpdatingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const handleDeliver = async (id) => {
    // For COD orders, first check if payment is pending
    const order = orders.find(o => o._id === id)
    if (order?.paymentMethod === 'cod' && order?.paymentStatus !== 'paid') {
      // Show QR modal to collect payment first
      handleShowPaymentQR(order)
      return
    }

    // For non-COD orders or already paid COD orders, mark as delivered directly
    setUpdatingId(id)
    try {
      await deliveryAPI.updateStatus(id, 'delivered')
      toast.success('Order marked as delivered!')
      load()
    } catch { toast.error('Failed to update') }
    finally { setUpdatingId(null) }
  }

  // Handle QR code for COD payment
  const handleShowPaymentQR = async (order) => {
    if (order.paymentMethod !== 'cod') {
      toast.error('This order is not a COD order')
      return
    }
    setQrModal({ show: true, order, qrData: null, loading: true, error: null })
    try {
      const response = await orderAPI.getPaymentQR(order._id)
      setQrModal(prev => ({ ...prev, qrData: response.data, loading: false }))
    } catch (err) {
      setQrModal(prev => ({ ...prev, loading: false, error: err.response?.data?.message || 'Failed to generate QR' }))
    }
  }

  const handleMarkAsPaid = async () => {
    if (!qrModal.order) return
    setProcessingPayment(qrModal.order._id)
    try {
      // First mark payment as received
      await orderAPI.markAsPaid(qrModal.order._id)
      toast.success('Payment marked as received!')

      // Then mark the order as delivered
      await deliveryAPI.updateStatus(qrModal.order._id, 'delivered')
      toast.success('Order marked as delivered!')

      setQrModal({ show: false, order: null, qrData: null, loading: false, error: null })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process')
    } finally {
      setProcessingPayment(null)
    }
  }

  const stats = {
    total: orders.length,
    active: orders.filter(o => o.orderStatus === 'out_for_delivery').length,
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
  }

  const active = orders.filter(o => o.orderStatus !== 'delivered')

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Hello, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-500 text-sm">Your deliveries today</p>
        </div>
        <button
          onClick={updateMyLocation}
          disabled={updatingLocation}
          className="btn-primary py-2 px-3 flex items-center gap-1.5 text-sm"
        >
          {updatingLocation ? <RefreshCw size={14} className="animate-spin" /> : <Navigation size={14} />}
          {updatingLocation ? 'Updating...' : 'Share Location'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Package, color: 'bg-blue-500' },
          { label: 'Active', value: stats.active, icon: Truck, color: 'bg-orange-500' },
          { label: 'Done', value: stats.delivered, icon: CheckCircle, color: 'bg-green-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="font-display font-bold text-2xl text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Active Deliveries</h2>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : active.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          <Truck size={40} className="mx-auto mb-2 opacity-20" />
          <p>No active deliveries</p>
        </div>
      ) : active.map(order => (
        <div key={order._id} className="card p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-bold text-gray-900 dark:text-white">#{order.orderNumber}</p>
              <p className="text-sm text-gray-500">{order.user?.name}</p>
              {order.deliveryAddress?.phone && (
                <a
                  href={`tel:${order.deliveryAddress.phone}`}
                  className="text-sm text-primary-500 flex items-center gap-1 mt-1 hover:underline"
                >
                  <Phone size={14} />
                  {order.deliveryAddress.phone}
                </a>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-lg">
                {order.orderStatus}
              </span>
              {order.paymentMethod === 'cod' ? (
                <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400'}`}>
                  <CreditCard size={12} />
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </span>
              ) : (
                <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'}`}>
                  <CreditCard size={12} />
                  {order.paymentStatus === 'paid' ? 'Paid' : order.paymentMethod}
                </span>
              )}
            </div>
          </div>
          <DeliveryMap
            deliveryLocation={{ lat: order.deliveryAddress?.lat, lng: order.deliveryAddress?.lng }}
            address={order.deliveryAddress}
            myLocation={myLocation}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="font-bold text-primary-500">₹{order.totalAmount}</span>
            <div className="flex items-center gap-2">
              {order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' && (
                <button
                  onClick={() => handleShowPaymentQR(order)}
                  className="p-2 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30"
                  title="Show Payment QR"
                >
                  <QrCode size={18} />
                </button>
              )}
              <button onClick={() => handleDeliver(order._id)} disabled={updatingId === order._id}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5 disabled:opacity-50">
                <CheckCircle size={15} />
                {updatingId === order._id ? 'Updating...' :
                  order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' ? 'Collect & Deliver' : 'Mark Delivered'}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Payment QR Modal */}
      {qrModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Collect Payment</h3>
              </div>
              <button
                onClick={() => setQrModal({ show: false, order: null, qrData: null, loading: false, error: null })}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              {qrModal.loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
                  <p className="mt-2 text-sm text-gray-500">Generating QR Code...</p>
                </div>
              ) : qrModal.error ? (
                <div className="text-center py-4">
                  <p className="text-red-500 mb-4">{qrModal.error}</p>
                  <button
                    onClick={() => handleShowPaymentQR(qrModal.order)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold"
                  >
                    Try Again
                  </button>
                </div>
              ) : qrModal.qrData ? (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl inline-block mb-4 border">
                    <QRCode
                      value={JSON.stringify({
                        orderId: qrModal.order._id,
                        orderNumber: qrModal.order.orderNumber,
                        amount: qrModal.order.totalAmount,
                        currency: 'INR'
                      })}
                      size={180}
                      level="H"
                    />
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Collect Amount</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{qrModal.order.totalAmount}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 text-left">
                    <p className="text-sm text-gray-500">Order Number</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{qrModal.order.orderNumber}</p>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Customer ko yeh QR code scan karne ke liye bolen
                  </p>
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={processingPayment === qrModal.order._id}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingPayment === qrModal.order._id ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Payment Received & Deliver
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
