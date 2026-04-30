import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import Script from 'next/script'
import { MapPin, Plus, Tag, Banknote, Loader, MapPinned, Clock, Calendar, Heart } from 'lucide-react';
import { placeOrder } from '../../redux/slices/orderSlice'
import { clearCart } from '../../redux/slices/cartSlice'
import { addressAPI, offerAPI, paymentAPI, walletAPI, authAPI, generalSettingsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('../../components/customer/MapPicker.jsx'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
})

export default function CheckoutPage() {
  const router = useRouter()
  const navigate = router.push
  const dispatch = useDispatch()
  const { items, totalAmount } = useSelector(s => s.cart)
  const { loading } = useSelector(s => s.orders)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  // match the lowercase enum values used in the Order schema
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({ fullName: '', phone: '', fullAddress: '', landmark: '', city: '', state: '', pincode: '', location: null })
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [mapLocation, setMapLocation] = useState(null)
  const [scheduleOrder, setScheduleOrder] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [tipAmount, setTipAmount] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [referralRewards, setReferralRewards] = useState(0)
  const [useReferralRewards, setUseReferralRewards] = useState(false)
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(true)
  const [restaurantMessage, setRestaurantMessage] = useState('')

  useEffect(() => {
    addressAPI.getAll().then(r => {
      const addrs = r.data.addresses || []
      setAddresses(addrs)
      setSelectedAddress(addrs.find(a => a.isDefault)?._id || addrs[0]?._id)
    }).catch(() => { })
    walletAPI.getWallet().then(r => {
      setWalletBalance(r.data.data?.balance || 0)
    }).catch(() => { })
    authAPI.getReferral().then(r => {
      const data = r.data.data || r.data || {}
      console.log('Referral API response:', r.data)
      const earned = data.referralRewardsEarned || 0
      const used = data.referralRewardsUsed || 0
      const available = data.availableRewards || (earned - used)
      console.log('Referral rewards - earned:', earned, 'used:', used, 'available:', available)
      setReferralRewards(available)
    }).catch((err) => { 
      console.error('Referral API error:', err)
    })
    
    // Check restaurant status
    generalSettingsAPI.getStatus().then(r => {
      // Backend sends data directly, not wrapped in data field
      if (!r.data.isOpen) {
        setIsRestaurantOpen(false)
        setRestaurantMessage(r.data.message || 'Restaurant is closed')
        toast.error(r.data.message || 'Restaurant is currently closed')
      }
    }).catch(() => { })
  }, [])

  const discount = appliedCoupon?.discountType === 'percentage'
    ? (totalAmount * appliedCoupon.discountValue) / 100
    : appliedCoupon?.discountValue || 0
  const referralDiscount = useReferralRewards ? Math.min(referralRewards, totalAmount) : 0
  const tax = totalAmount * 0.05
  const finalAmount = totalAmount - discount - referralDiscount + tax + tipAmount

  const handleApplyCoupon = async () => {
    setValidatingCoupon(true)
    try {
      const res = await offerAPI.validate(couponCode)
      setAppliedCoupon(res.data.offer)
      toast.success('Coupon applied!')
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid coupon') }
    finally { setValidatingCoupon(false) }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    toast.success('Coupon removed')
  }

  const handleAddAddress = async () => {
    // Validate pincode - must be exactly 6 digits starting with 1-9
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    const trimmedPincode = newAddress.pincode.trim();
    if (!pincodeRegex.test(trimmedPincode)) {
      toast.error('Please enter a valid 6-digit pincode (e.g., 110001)');
      return;
    }
    // Validate required fields
    if (!newAddress.fullName || !newAddress.phone || !newAddress.fullAddress || !newAddress.city || !newAddress.state) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const addressData = {
        ...newAddress,
        pincode: trimmedPincode,
        location: mapLocation ? { lat: mapLocation.lat, lng: mapLocation.lng } : null
      }
      const res = await addressAPI.add(addressData)
      const added = res.data.address
      setAddresses(prev => [...prev, added])
      setSelectedAddress(added._id)
      setShowAddAddress(false)
      // reset full address form including all fields
      setNewAddress({ fullName: '', phone: '', fullAddress: '', landmark: '', city: '', state: '', pincode: '', location: null })
      setMapLocation(null)
      toast.success('Address added!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address')
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return }

    const orderData = {
      items: items.map(i => {
        // Handle both product and combo items
        let itemId;
        let itemName;
        let itemImage = '';
        let comboId;

        if (i.comboId) {
          // Combo item - get combo ID and name
          comboId = i.comboId._id || i.comboId;
          itemName = i.comboId?.comboName || 'Combo';
          itemImage = i.comboId?.comboImage || '';
        } else if (i.product) {
          // Populated product object
          itemId = i.product._id || i.product.id;
          itemName = i.product?.name || 'Product';
          itemImage = i.product?.images?.[0] || i.product?.image || '';
        } else if (typeof i.productId === 'string') {
          itemId = i.productId;
          itemName = i.name || 'Product';
          itemImage = i.image || '';
        } else if (i.productId && typeof i.productId === 'object') {
          itemId = i.productId._id || i.productId.id;
          itemName = i.name || 'Product';
          itemImage = i.image || '';
        }

        return {
          productId: itemId,
          comboId: comboId,
          quantity: i.quantity,
          price: i.price,
          name: itemName,
          image: itemImage
        };
      }),
      addressId: selectedAddress,
      paymentMethod,
      couponCode: appliedCoupon?.couponCode,
      totalAmount: Math.round(finalAmount),
      referralDiscount: referralDiscount,
      ...(scheduleOrder && scheduledDate && { scheduledDate }),
      ...(scheduleOrder && scheduledTime && { scheduledTime }),
      ...(tipAmount > 0 && { tip: tipAmount }),
    }

    // If Razorpay, first create order then process payment
    if (paymentMethod === 'razorpay') {
      try {
        // Place order first (will be pending payment)
        toast.loading('Creating order...', { id: 'order' })
        const result = await dispatch(placeOrder(orderData))

        if (result.payload?.order) {
          const order = result.payload.order
          toast.success('Order created! Processing payment...', { id: 'order' })

          // Create Razorpay order
          const razorpayRes = await paymentAPI.createOrder(order._id)
          const { razorpayOrderId, amount, key } = razorpayRes.data

          // Open Razorpay checkout
          const options = {
            key: key,
            amount: amount,
            currency: 'INR',
            name: 'Meal Box',
            description: 'Order Payment',
            order_id: razorpayOrderId,
            handler: async (response) => {
              try {
                // Verify payment
                await paymentAPI.verify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: order._id
                })
                dispatch(clearCart())
                navigate('/order-success/' + order._id)
              } catch (err) {
                toast.error('Payment verification failed')
              }
            },
            prefill: {
              name: addresses.find(a => a._id === selectedAddress)?.fullName || '',
              contact: addresses.find(a => a._id === selectedAddress)?.phone || ''
            },
            theme: {
              color: '#10b981'
            }
          }

          if (typeof window !== 'undefined' && window.Razorpay) {
            const rzp = new window.Razorpay(options)
            rzp.open()
          } else {
            toast.error('Payment system not loaded. Please refresh the page.')
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to process order', { id: 'order' })
      }
      return
    }

    // Wallet - deduct from wallet and place order
    if (paymentMethod === 'wallet') {
      if (walletBalance < finalAmount) {
        toast.error('Insufficient wallet balance')
        return
      }
      try {
        toast.loading('Creating order...', { id: 'wallet' })
        const result = await dispatch(placeOrder(orderData))
        if (result.payload?.order) {
          const order = result.payload.order
          await walletAPI.deduct(Math.round(finalAmount), 'Order payment', order._id)
          toast.success('Order placed!', { id: 'wallet' })
          setWalletBalance(walletBalance - finalAmount)
          dispatch(clearCart())
          navigate('/order-success/' + order._id)
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Payment failed', { id: 'wallet' })
      }
      return
    }

    // COD - place order directly
    let result = await dispatch(placeOrder(orderData))
    if (result.payload?.order) {
      dispatch(clearCart())
      navigate('/order-success/' + result.payload.order._id)
    }
  }

  // Redirect to cart if no items - must be client-side only
  useEffect(() => {
    if (typeof window !== 'undefined' && items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])



  
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">Checkout</h1>
        
        {!isRestaurantOpen && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
            <p className="text-red-600 dark:text-red-400 font-semibold">Restaurant is Closed</p>
            <p className="text-red-500 dark:text-red-500 text-sm mt-1">{restaurantMessage}</p>
          </div>
        )}
        
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-2 space-y-5 mb-6 md:mb-0">
            {/* Address */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-primary-500" />
                  <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Delivery Address</h2>
                </div>
                <button onClick={() => setShowAddAddress(!showAddAddress)} className="flex items-center gap-1 text-sm text-primary-500 font-semibold">
                  <Plus size={16} /> Add New
                </button>
              </div>
              {showAddAddress && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4 space-y-3 animate-fade-in">
                  <input placeholder="Full Name" className="input text-sm" value={newAddress.fullName}
                    onChange={e => setNewAddress(p => ({ ...p, fullName: e.target.value }))} />
                  <input placeholder="Phone" className="input text-sm" value={newAddress.phone}
                    onChange={e => setNewAddress(p => ({ ...p, phone: e.target.value }))} />
                  <input placeholder="Full Address" className="input text-sm" value={newAddress.fullAddress}
                    onChange={e => setNewAddress(p => ({ ...p, fullAddress: e.target.value }))} />
                  <div className="flex gap-2">
                    <input placeholder="Landmark (optional)" className="input text-sm flex-1" value={newAddress.landmark}
                      onChange={e => setNewAddress(p => ({ ...p, landmark: e.target.value }))} />
                    <button type="button" onClick={() => setShowMap(true)} className="btn-secondary text-sm py-2.5 px-3 flex items-center gap-1.5 whitespace-nowrap">
                      <MapPinned size={16} /> Pick on Map
                    </button>
                  </div>
                  
                  {/* Map Picker */}
                  {showMap && (
                    <div className="mt-4 space-y-3 animate-fade-in">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <MapPin size={14} className="inline mr-1" />
                        Tap on the map to select your delivery location
                      </p>
                      <MapPicker
                        onSelect={(location) => {
                          setMapLocation(location)
                          setNewAddress(prev => ({
                            ...prev,
                            fullAddress: location.address || prev.fullAddress,
                            city: location.city || prev.city,
                            state: location.state || prev.state,
                            pincode: location.pincode || prev.pincode,
                            location: { lat: location.lat, lng: location.lng }
                          }))
                        }}
                      />
                      {mapLocation && (
                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl p-3">
                          <MapPin size={16} className="text-green-500" />
                          <span className="text-sm text-green-700 dark:text-green-400">Location selected!</span>
                          <button type="button" onClick={() => setShowMap(false)} className="ml-auto text-xs text-gray-500 hover:text-gray-700">
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="City" className="input text-sm" value={newAddress.city}
                      onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))} />
                    <input placeholder="State" className="input text-sm" value={newAddress.state}
                      onChange={e => setNewAddress(p => ({ ...p, state: e.target.value }))} />
                  </div>
                  <input placeholder="Pincode" className="input text-sm" value={newAddress.pincode}
                    onChange={e => setNewAddress(p => ({ ...p, pincode: e.target.value }))} />
<button onClick={handleAddAddress} className="btn-primary text-sm py-2.5 w-full">Save Address</button>
              </div>
            )}
            
            {/* Saved Addresses List */}
            <div className="space-y-3 mt-4">
              {addresses.map(addr => (
                <label key={addr._id} className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddress === addr._id ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}>
                  <input type="radio" name="address" value={addr._id} checked={selectedAddress === addr._id}
                    onChange={() => setSelectedAddress(addr._id)} className="mt-1 accent-primary-500" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{addr.fullAddress}</p>
                    {addr.landmark && <p className="text-xs text-gray-400">Near: {addr.landmark}</p>}
                    <p className="text-xs text-gray-500">{addr.city} - {addr.pincode}</p>
                    {addr.isDefault && <span className="text-xs text-primary-500 font-semibold">Default</span>}
                  </div>
                </label>
              ))}
              {addresses.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No saved addresses. Add one above.</p>}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={20} className="text-primary-500" />
                <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Apply Coupon</h2>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="input text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || validatingCoupon}
                    className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validatingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {appliedCoupon ? (
                  <div className="rounded-xl bg-green-50 dark:bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-200 border border-green-200 dark:border-green-500">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        Coupon <span className="font-semibold">{appliedCoupon.couponCode}</span> applied: {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`}
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-primary-600 text-sm font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Use a coupon code for discounts.</p>
                )}
              </div>
            </div>
            
            <button
                onClick={() => setScheduleOrder(!scheduleOrder)}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-3 hover:text-primary-500 transition-colors"
              >
                <Calendar size={16} />
                {scheduleOrder ? 'Cancel scheduled delivery' : 'Schedule for later'}
              </button>
            </div>

            {/* Tip for Delivery Partner */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Heart size={20} className="text-pink-500" />
                <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Tip Delivery Partner</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 0, label: 'No Tip' },
                  { value: 20, label: '₹20' },
                  { value: 50, label: '₹50' },
                  { value: 100, label: '₹100' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTipAmount(opt.value)}
                    className={`px-4 py-2 rounded-xl border-2 transition-all ${tipAmount === opt.value ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600' : 'border-gray-100 dark:border-gray-800 text-gray-600 hover:border-gray-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Banknote size={20} className="text-primary-500" />
                <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Payment Method</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive' },
                  { value: 'razorpay', label: 'Pay Online', icon: '💳', desc: 'Razorpay' },
                  ...(walletBalance >= finalAmount ? [{ value: 'wallet', label: 'Pay with Wallet', icon: '👛', desc: `Balance: ₹${walletBalance}` }] : []),
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}>
                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)} className="accent-primary-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{opt.icon}</span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card p-5 h-fit sticky top-24">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Bill Summary</h2>
            <div className="space-y-3 text-sm mb-5">
              {items.map((item, idx) => {
                // Handle both product and combo items
                let name = 'Unknown';
                if (item.product) {
                  // Product item
                  name = item.product?.name || 'Unknown';
                } else if (item.comboId) {
                  // Combo item
                  name = item.comboId?.comboName || 'Combo';
                }
                const key = item.comboId ? `combo-${item.comboId._id || item.comboId}` : (item.product?._id ? `product-${item.product._id}` : `item-${idx}`);
                return (
                  <div key={key}>
                    <div className="flex justify-between">
                      <span className="text-gray-500 truncate pr-2">{name} x{item.quantity}</span>
                      <span className="font-medium shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                    {/* AddOnes Display */}
                    {item.addOnes && item.addOnes.length > 0 && (
                      <div className="pl-2 mt-1 mb-2">
                        {item.addOnes.map((addOn, addIdx) => (
                          <div key={addIdx} className="flex justify-between text-xs">
                            <span className="text-gray-400">+ {addOn.name}</span>
                            <span className="text-primary-500 font-medium">₹{addOn.price * addOn.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              <hr className="border-gray-100 dark:border-gray-800" />
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{totalAmount}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-500"><span>Discount</span><span>-₹{discount.toFixed(0)}</span></div>}
              {referralRewards > 0 && (
                <div className="flex items-center justify-between text-gray-500">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useReferralRewards}
                      onChange={(e) => setUseReferralRewards(e.target.checked)}
                      className="w-4 h-4 accent-primary-500"
                    />
                    <span>Referral Reward (₹{referralRewards})</span>
                  </label>
                  <span className="font-semibold text-green-500">-₹{referralDiscount}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="text-green-500 font-semibold">FREE</span></div>
              {tipAmount > 0 && <div className="flex justify-between text-pink-500"><span>Tip</span><span>₹{tipAmount}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">GST (5%)</span><span>₹{tax.toFixed(0)}</span></div>
              <hr className="border-gray-100 dark:border-gray-800" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary-500">₹{Math.round(finalAmount)}</span>
              </div>
            </div>
            <button onClick={handlePlaceOrder} disabled={loading || !isRestaurantOpen} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {!isRestaurantOpen ? restaurantMessage || 'Restaurant Closed' : (loading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing...</> : 'Place Order')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
