import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { adminAPI } from '../../services/api'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, MapPin, Phone, User, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
const baseUrl = import.meta.env.VITE_SERVER_URL
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

const STATUS_STEPS = [
    { key: 'pending', label: 'Order Placed', icon: Package },
  
    { key: 'preparing', label: 'Preparing', icon: Clock },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
]

export default function AdminOrderDetails() {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [deliveryBoys, setDeliveryBoys] = useState([])
    const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('')
    const [assigning, setAssigning] = useState(false)

    useEffect(() => {
        fetchOrderDetails()
        fetchDeliveryBoys()
    }, [orderId])

    const fetchOrderDetails = async () => {
        try {
            const response = await adminAPI.getOrderById(orderId)
            setOrder(response.data.order)
            if (response.data.order.assignedDeliveryBoy) {
                setSelectedDeliveryBoy(response.data.order.assignedDeliveryBoy._id)
            }
        } catch (error) {
            toast.error('Failed to load order details')
            navigate('/admin/orders')
        } finally {
            setLoading(false)
        }
    }

    const fetchDeliveryBoys = async () => {
        try {
            const response = await adminAPI.getDeliveryBoys()
            setDeliveryBoys(response.data.deliveryBoys)
        } catch (error) {
            console.error('Failed to fetch delivery boys')
        }
    }

    const handleAssignDeliveryBoy = async () => {
        if (!selectedDeliveryBoy) return
        setAssigning(true)
        try {
            await adminAPI.assignDelivery(orderId, selectedDeliveryBoy)
            toast.success('Delivery boy assigned!')
            fetchOrderDetails()
        } catch {
            toast.error('Failed to assign delivery boy')
        } finally {
            setAssigning(false)
        }
    }

    const handleStatusUpdate = async (status) => {
        setUpdating(true)
        try {
            await adminAPI.updateOrderStatus(orderId, status)
            toast.success('Status updated!')
            fetchOrderDetails()
        } catch {
            toast.error('Failed to update status')
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (!order) return null

    const currentStep = STATUS_STEPS.findIndex(s => s.key === order.orderStatus)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/orders')}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex-1">
                    <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
                        Order #{order.orderNumber}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>
                <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${STATUS_COLOR[order.orderStatus]}`}>
                    {STATUS_OPTIONS.find(o => o.value === order.orderStatus)?.label || order.orderStatus}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items Card */}
                    <div className="card p-5">
                        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Order Items</h2>
                        <div className="space-y-4">
                            {order.items?.map((item, index) => {
                                // Handle different image URL formats: full URL with domain, full path, short ID, or empty
                                // Backend now returns proper URLs for products and combos
                                const getImageUrl = (img) => {
                                    if (!img) return null;
                                    // Already a full URL with domain (from product/combo)
                                    if (img.startsWith('http://') || img.startsWith('https://')) return img;
                                    // Path starting with /uploads - needs baseUrl
                                    if (img.startsWith('/uploads')) return `${baseUrl}${img}`;
                                    // Could be a short ID (24 chars) - this shouldn't happen now but handle it
                                    if (img.length === 24) return null;
                                    // Relative path that needs baseUrl
                                    return `${baseUrl}/uploads/${img}`;
                                };
                                const imageUrl = getImageUrl(item.image);
                                
                                return (
                                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        {imageUrl && (
                                            <img
                                                src={imageUrl}
                                                alt={item.name}
                                                className="w-16 h-16 rounded-lg object-cover"
                                                onError={(e) => { e.target.style.display = 'none' }}
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                            <p className="text-sm text-gray-500">₹{item.price} x {item.quantity}</p>
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white">₹{item.price * item.quantity}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary */}
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium">₹{order.subtotal}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Delivery Fee</span>
                                    <span className="font-medium">₹{order.deliveryFee || 0}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-green-500">
                                        <span>Discount</span>
                                        <span>-₹{order.discount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <span>Total</span>
                                    <span className="text-primary-500">₹{order.totalAmount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="card p-5">
                        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Payment Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <CreditCard className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Payment Method</p>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">{order.paymentMethod}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <p className="text-xs text-gray-400">Payment Status</p>
                                    <p className={`font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-green-500' : 'text-orange-500'}`}>
                                        {order.paymentStatus || 'pending'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer Details */}
                    <div className="card p-5">
                        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Customer Details</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Name</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{order.user?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Phone</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{order.user?.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Email</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{order.user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    {order.deliveryAddress && (
                        <div className="card p-5">
                            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Delivery Address</h2>
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <p className="font-medium text-gray-900 dark:text-white">{order.deliveryAddress.fullName}</p>
                                <p className="text-sm text-gray-500">{order.deliveryAddress.fullAddress}</p>
                                {order.deliveryAddress.landmark && (
                                    <p className="text-sm text-gray-400">Landmark: {order.deliveryAddress.landmark}</p>
                                )}
                                <p className="text-sm text-gray-500">
                                    {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                                </p>
                                <p className="text-sm text-gray-400 mt-2">Phone: {order.deliveryAddress.phone}</p>
                            </div>
                        </div>
                    )}

                    {/* Delivery Boy */}
                    <div className="card p-5">
                        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Delivery Boy</h2>
                        {order.assignedDeliveryBoy ? (
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <p className="font-medium text-gray-900 dark:text-white">{order.assignedDeliveryBoy.name}</p>
                                <p className="text-sm text-gray-400">Phone: {order.assignedDeliveryBoy.phone}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 mb-3">No delivery boy assigned yet</p>
                        )}
                        <div className="mt-3 space-y-3">
                            <select
                                value={selectedDeliveryBoy}
                                onChange={(e) => setSelectedDeliveryBoy(e.target.value)}
                                className="w-full input py-2.5 text-sm"
                            >
                                <option value="">Select Delivery Boy</option>
                                {deliveryBoys.map((boy) => (
                                    <option key={boy._id} value={boy._id}>
                                        {boy.name} - {boy.phone}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAssignDeliveryBoy}
                                disabled={assigning || !selectedDeliveryBoy}
                                className="w-full btn-primary py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {assigning ? 'Assigning...' : 'Assign Delivery Boy'}
                            </button>
                        </div>
                    </div>

                    {/* Update Status */}
                    <div className="card p-5">
                        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Update Status</h2>
                        <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusUpdate(e.target.value)}
                            disabled={updating || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled'}
                            className="w-full input py-2.5"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} disabled={opt.value === 'delivered' || opt.value === 'cancelled'}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {updating && <p className="text-sm text-gray-400 mt-2">Updating...</p>}
                    </div>

                    {/* Order Timeline */}
                    <div className="card p-5">
                        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Order Timeline</h2>
                        <div className="space-y-4">
                            {order.statusTimeline?.slice().reverse().map((timeline, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${index === 0 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white text-sm capitalize">
                                            {STATUS_OPTIONS.find(o => o.value === timeline.status)?.label || timeline.status}
                                        </p>
                                        <p className="text-xs text-gray-400">{new Date(timeline.timestamp).toLocaleString()}</p>
                                        {timeline.message && <p className="text-xs text-gray-500 mt-0.5">{timeline.message}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
