import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { offerAPI } from '../../services/api'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

export default function AdminOffers() {
  const router = useRouter()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, data: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', couponCode: '', discountType: 'percentage', discountValue: '',
    minOrderAmount: '', expiryDate: ''
  })

  const load = async () => {
    setLoading(true)
    try { const r = await offerAPI.getAll(); setOffers(r.data.offers || []) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openModal = (offer = null) => {
    setForm(offer ? {
      title: offer.title, couponCode: offer.couponCode, discountType: offer.discountType,
      discountValue: offer.discountValue, minOrderAmount: offer.minOrderAmount || '',
      expiryDate: offer.expiryDate ? new Date(offer.expiryDate).toISOString().split('T')[0] : ''
    } : { title: '', couponCode: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', expiryDate: '' })
    setModal({ open: true, data: offer })
  }

  const handleSave = async () => {
    if (!form.title || !form.couponCode || !form.discountValue) { toast.error('Fill required fields'); return }
    setSaving(true)
    try {
      if (modal.data) { await offerAPI.update(modal.data._id, form); toast.success('Updated!') }
      else { await offerAPI.create(form); toast.success('Coupon created!') }
      setModal({ open: false, data: null })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return
    try { await offerAPI.delete(id); toast.success('Deleted!'); load() }
    catch { toast.error('Failed to delete') }
  }

  const isExpired = (date) => date && new Date(date) < new Date()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Offers & Coupons</h1>
          <p className="text-sm text-gray-500">{offers.length} coupons</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary text-sm py-2.5 flex items-center gap-2">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({length:3}).map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)
        ) : offers.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Tag size={48} className="mx-auto mb-3 opacity-20" />
            <p>No coupons yet</p>
          </div>
        ) : offers.map(offer => {
          const expired = isExpired(offer.expiryDate)
          return (
            <div key={offer._id} className={`card p-5 border-2 ${expired ? 'border-gray-100 dark:border-gray-800 opacity-60' : 'border-dashed border-primary-200 dark:border-primary-500/30'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{offer.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-display font-bold text-2xl text-primary-500">
                      {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                    </span>
                    <span className="text-xs text-gray-400">OFF</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(offer)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(offer._id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 flex items-center gap-2 mb-3">
                <Tag size={14} className="text-primary-500" />
                <span className="font-mono font-bold text-gray-900 dark:text-white tracking-widest text-sm">{offer.couponCode}</span>
              </div>
              <div className="space-y-1 text-xs text-gray-400">
                {offer.minOrderAmount > 0 && <p>Min order: ₹{offer.minOrderAmount}</p>}
                {offer.expiryDate && (
                  <p className={expired ? 'text-red-400' : 'text-gray-400'}>
                    {expired ? 'Expired: ' : 'Valid till: '}{new Date(offer.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              {expired && <span className="mt-2 inline-block text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded">Expired</span>}
            </div>
          )
        })}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Edit Coupon' : 'Add Coupon'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
            <input className="input" placeholder="e.g., First Order Discount" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Coupon Code *</label>
            <input className="input uppercase" placeholder="e.g., MEAL50" value={form.couponCode}
              onChange={e => setForm(p => ({ ...p, couponCode: e.target.value.toUpperCase() }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount Type</label>
              <select className="input" value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount Value *</label>
              <input type="number" className="input" placeholder={form.discountType === 'percentage' ? '20' : '50'}
                value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Min Order Amount (₹)</label>
            <input type="number" className="input" placeholder="0 for no minimum" value={form.minOrderAmount}
              onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expiry Date</label>
            <input type="date" className="input" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal({ open: false, data: null })} className="btn-outline flex-1 text-sm py-2.5">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm py-2.5">
              {saving ? 'Saving...' : 'Save Coupon'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
