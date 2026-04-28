import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { User, Mail, Phone, MapPin, Plus, Trash2, Check, Edit3, MapPinned } from 'lucide-react'
import { authAPI, addressAPI } from '../../services/api'
import toast from 'react-hot-toast'
import MapPicker from '../../components/customer/MapPicker.jsx'

export default function ProfilePage() {
  const { user } = useSelector(s => s.auth)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [addresses, setAddresses] = useState([])
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [mapLocation, setMapLocation] = useState(null)
  // address model requires fullName, phone and state in addition to the other fields
  const [newAddr, setNewAddr] = useState({ fullName: '', phone: '', fullAddress: '', landmark: '', city: '', state: '', pincode: '', location: null })

  useEffect(() => {
    addressAPI.getAll().then(r => setAddresses(r.data.addresses || [])).catch(() => { })
  }, [])

  const handleSaveProfile = async () => {
    try {
      await authAPI.updateProfile(formData)
      toast.success('Profile updated!')
      setEditing(false)
    } catch { toast.error('Failed to update') }
  }

  const handleAddAddress = async () => {
    // Validate pincode - must be exactly 6 digits starting with 1-9
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    const trimmedPincode = newAddr.pincode.trim();
    if (!pincodeRegex.test(trimmedPincode)) {
      toast.error('Please enter a valid 6-digit pincode (e.g., 110001)');
      return;
    }
    // Validate required fields
    if (!newAddr.fullName || !newAddr.phone || !newAddr.fullAddress || !newAddr.city || !newAddr.state) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const addressData = {
        ...newAddr,
        pincode: trimmedPincode,
        location: mapLocation ? { lat: mapLocation.lat, lng: mapLocation.lng } : null
      }
      const res = await addressAPI.add(addressData)
      setAddresses(p => [...p, res.data.address])
      setShowAddAddress(false)
      setNewAddr({ fullName: '', phone: '', fullAddress: '', landmark: '', city: '', state: '', pincode: '', location: null })
      setMapLocation(null)
      toast.success('Address added!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address')
    }
  }

  const handleDeleteAddress = async (id) => {
    try {
      await addressAPI.delete(id)
      setAddresses(p => p.filter(a => a._id !== id))
      toast.success('Address removed')
    } catch { toast.error('Failed to delete') }
  }

  const handleSetDefault = async (id) => {
    try {
      await addressAPI.setDefault(id)
      setAddresses(p => p.map(a => ({ ...a, isDefault: a._id === id })))
      toast.success('Default address set!')
    } catch { toast.error('Failed to set default') }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">My Profile</h1>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-500/20 rounded-2xl flex items-center justify-center">
            <span className="font-display font-bold text-2xl text-primary-600">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button onClick={() => setEditing(!editing)} className="ml-auto flex items-center gap-2 text-sm text-primary-500 font-semibold hover:text-primary-600">
            <Edit3 size={16} /> {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
              <input className="input" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
              <input className="input" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <button onClick={handleSaveProfile} className="btn-primary text-sm py-2.5">Save Changes</button>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { icon: User, label: 'Full Name', value: user?.name },
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Phone, label: 'Phone', value: user?.phone || 'Not set' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Icon size={18} className="text-primary-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Addresses */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-primary-500" />
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Saved Addresses</h2>
          </div>
          <button onClick={() => setShowAddAddress(!showAddAddress)} className="flex items-center gap-1 text-sm text-primary-500 font-semibold">
            <Plus size={16} /> Add New
          </button>
        </div>

        {showAddAddress && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4 space-y-3 animate-fade-in">
            <input placeholder="Full Name" className="input text-sm" value={newAddr.fullName}
              onChange={e => setNewAddr(p => ({ ...p, fullName: e.target.value }))} />
            <input placeholder="Phone" className="input text-sm" value={newAddr.phone}
              onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} />
            <input placeholder="Full Address" className="input text-sm" value={newAddr.fullAddress}
              onChange={e => setNewAddr(p => ({ ...p, fullAddress: e.target.value }))} />
            <div className="flex gap-2">
              <input placeholder="Landmark (optional)" className="input text-sm flex-1" value={newAddr.landmark}
                onChange={e => setNewAddr(p => ({ ...p, landmark: e.target.value }))} />
              <button type="button" onClick={() => setShowMap(true)} className="btn-secondary text-sm py-2.5 px-3 flex items-center gap-1.5 whitespace-nowrap">
                <MapPinned size={16} /> Pick on Map
              </button>
            </div>
            {showMap && (
              <div className="mt-4 space-y-3 animate-fade-in">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={14} className="inline mr-1" />
                  Tap on the map to select your delivery location
                </p>
                <MapPicker
                  onSelect={(location) => {
                    setMapLocation(location)
                    setNewAddr(prev => ({
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
              <input placeholder="City" className="input text-sm" value={newAddr.city}
                onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} />
              <input placeholder="State" className="input text-sm" value={newAddr.state}
                onChange={e => setNewAddr(p => ({ ...p, state: e.target.value }))} />
            </div>
            <input placeholder="Pincode" className="input text-sm" value={newAddr.pincode}
              onChange={e => setNewAddr(p => ({ ...p, pincode: e.target.value }))} />
            <button onClick={handleAddAddress} className="btn-primary text-sm py-2.5 w-full">Save Address</button>
          </div>
        )}

        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr._id} className={`p-4 rounded-2xl border-2 ${addr.isDefault ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-100 dark:border-gray-800'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{addr.fullAddress}</p>
                  {addr.landmark && <p className="text-xs text-gray-400 mt-0.5">Near: {addr.landmark}</p>}
                  <p className="text-xs text-gray-500">{addr.city} - {addr.pincode}</p>
                  {addr.isDefault && <span className="text-xs text-primary-500 font-bold mt-1 block">✓ Default Address</span>}
                </div>
                <div className="flex gap-2 ml-3">
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr._id)} className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors" title="Set as default">
                      <Check size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDeleteAddress(addr._id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {addresses.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No saved addresses</p>}
        </div>
      </div>
    </div>
  )
}
