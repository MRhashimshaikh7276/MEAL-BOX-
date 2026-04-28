import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { X, CheckCircle, Loader2, QrCode } from 'lucide-react'
import { orderAPI } from '../../services/api'

export default function PaymentQRModal({ order, onClose, onPaymentComplete }) {
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (order && order.paymentMethod === 'cod') {
      fetchQRCode()
    }
  }, [order])

  const fetchQRCode = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await orderAPI.getPaymentQR(order._id)
      setQrData(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async () => {
    try {
      setMarkingPaid(true)
      await orderAPI.markAsPaid(order._id)
      if (onPaymentComplete) {
        onPaymentComplete()
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as paid')
    } finally {
      setMarkingPaid(false)
    }
  }

  if (!order || order.paymentMethod !== 'cod') {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Payment QR</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="mt-2 text-sm text-gray-500">Generating QR Code...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={fetchQRCode}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : qrData ? (
            <div className="text-center">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCode 
                  value={JSON.stringify({
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    amount: order.totalAmount,
                    currency: 'INR'
                  })} 
                  size={200}
                  level="H"
                />
              </div>

              {/* Amount */}
              <div className="mb-4">
                <p className="text-sm text-gray-500">Collect Amount</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{order.totalAmount}</p>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</p>
              </div>

              {/* Payment Status */}
              {qrData.paymentStatus === 'paid' ? (
                <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Payment Already Received</span>
                </div>
              ) : (
                <button
                  onClick={handleMarkAsPaid}
                  disabled={markingPaid}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {markingPaid ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Mark as Paid & Delivered
                    </>
                  )}
                </button>
              )}

              {/* Instructions */}
              <p className="text-xs text-gray-400 mt-4">
                Show this QR code to customer for UPI payment scan
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
