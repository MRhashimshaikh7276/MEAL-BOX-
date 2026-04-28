import { useState, useEffect } from 'react'
import { Save, Upload, Facebook, Instagram, Clock, MapPin, DollarSign, Calendar, X, Plus, Trash2 } from 'lucide-react'
import { generalSettingsAPI } from '../../services/api'
import toast from 'react-hot-toast'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

export default function AdminGeneralSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    logo: '',
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    facebookLink: '',
    instagramLink: '',
    // Restaurant Control
    isOpen: true,
    businessHoursOpen: '08:00',
    businessHoursClose: '22:00',
    businessHoursAutoClose: true,
    minimumOrder: 0,
    deliveryRadius: 5,
    deliveryCharge: 0,
  })
  const [logoPreview, setLogoPreview] = useState('')
  const [blockedDates, setBlockedDates] = useState([])
  const [newBlockedDate, setNewBlockedDate] = useState({ date: '', startTime: '', endTime: '', reason: '' })
  const [blocking, setBlocking] = useState(false)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await generalSettingsAPI.get()
      const settings = res.data?.settings || res.data || {}

      setForm({
        logo: settings.logo || '',
        companyName: settings.companyName || '',
        companyEmail: settings.companyEmail || '',
        companyPhone: settings.companyPhone || '',
        companyAddress: settings.companyAddress || '',
        facebookLink: settings.facebookLink || '',
        instagramLink: settings.instagramLink || '',
        // Restaurant Control
        isOpen: settings.isOpen !== undefined ? settings.isOpen : true,
        businessHoursOpen: settings.businessHours?.open || '08:00',
        businessHoursClose: settings.businessHours?.close || '22:00',
        businessHoursAutoClose: settings.businessHours?.autoClose !== undefined ? settings.businessHours.autoClose : true,
        minimumOrder: settings.minimumOrder || 0,
        deliveryRadius: settings.deliveryRadius || 5,
        deliveryCharge: settings.deliveryCharge || 0,
      })

      if (settings.logo) {
        setLogoPreview(settings.logo.startsWith('http') ? settings.logo : `${baseUrl}${settings.logo}`)
      }

      setBlockedDates(settings.blockedDates || [])
    } catch (err) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setForm(prev => ({ ...prev, logo: file }))
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleBlockDate = async () => {
    if (!newBlockedDate.date) {
      toast.error('Please select a date')
      return
    }
    setBlocking(true)
    try {
      await generalSettingsAPI.blockDate(
        newBlockedDate.date,
        newBlockedDate.reason || 'Private Event',
        'block',
        newBlockedDate.startTime,
        newBlockedDate.endTime
      )
      toast.success('Date blocked successfully')
      setBlockedDates(prev => [...prev, {
        date: newBlockedDate.date,
        startTime: newBlockedDate.startTime,
        endTime: newBlockedDate.endTime,
        reason: newBlockedDate.reason || 'Private Event',
        isActive: true
      }])
      setNewBlockedDate({ date: '', startTime: '', endTime: '', reason: '' })
      loadSettings()
    } catch (err) {
      toast.error('Failed to block date')
    } finally {
      setBlocking(false)
    }
  }

  const handleUnblockDate = async (date) => {
    setBlocking(true)
    try {
      await generalSettingsAPI.blockDate(date, '', 'unblock')
      toast.success('Date unblocked')
      setBlockedDates(prev => prev.filter(b => b.date !== date))
      loadSettings()
    } catch (err) {
      toast.error('Failed to unblock date')
    } finally {
      setBlocking(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()

      if (form.logo instanceof File) {
        formData.append('logo', form.logo)
      } else if (form.logo) {
        formData.append('logo', form.logo)
      }

      formData.append('companyName', form.companyName)
      formData.append('companyEmail', form.companyEmail)
      formData.append('companyPhone', form.companyPhone)
      formData.append('companyAddress', form.companyAddress)
      formData.append('facebookLink', form.facebookLink)
      formData.append('instagramLink', form.instagramLink)
      formData.append('isOpen', form.isOpen)
      formData.append('businessHours', JSON.stringify({
        open: form.businessHoursOpen,
        close: form.businessHoursClose,
        autoClose: form.businessHoursAutoClose
      }))
      formData.append('minimumOrder', form.minimumOrder)
      formData.append('deliveryRadius', form.deliveryRadius)
      formData.append('deliveryCharge', form.deliveryCharge)

      await generalSettingsAPI.update(formData)
      toast.success('Settings saved successfully!')
      loadSettings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">General Settings</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Manage your company's general information and branding.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Section */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Company Logo</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />  
              )}
            </div>
            <div>
              <label className="btn btn-primary cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">Recommended: 200x200px, JPG or PNG</p>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Email
              </label>
              <input
                type="email"
                name="companyEmail"
                value={form.companyEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="company@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Phone
              </label>
              <input
                type="tel"
                name="companyPhone"
                value={form.companyPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Address
              </label>
              <textarea
                name="companyAddress"
                value={form.companyAddress}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter full company address"
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Social Media Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Facebook className="w-4 h-4 inline mr-1" />
                Facebook Link
              </label>
              <input
                type="url"
                name="facebookLink"
                value={form.facebookLink}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://facebook.com/yourcompany"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Instagram className="w-4 h-4 inline mr-1" />
                Instagram Link
              </label>
              <input
                type="url"
                name="instagramLink"
                value={form.instagramLink}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://instagram.com/yourcompany"
              />
            </div>
          </div>
        </div>

        {/* Restaurant Control - Admin Settings */}
        <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Restaurant Control</h2>

          {/* Open/Closed Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${form.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                Restaurant: <span className={form.isOpen ? 'text-green-600' : 'text-red-600'}>{form.isOpen ? 'OPEN' : 'CLOSED'}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, isOpen: !prev.isOpen }))}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-white transition-colors ${form.isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {form.isOpen ? 'Close Restaurant' : 'Open Restaurant'}
            </button>
          </div>
   
          {/* Business Hours */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Open Time
              </label>
              <input
                type="time"
                name="businessHoursOpen"
                value={form.businessHoursOpen}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Close Time
              </label>
              <input
                type="time"
                name="businessHoursClose"
                value={form.businessHoursClose}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="businessHoursAutoClose"
                  checked={form.businessHoursAutoClose}
                  onChange={(e) => setForm(prev => ({ ...prev, businessHoursAutoClose: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto close based on time</span>
              </label>
            </div>
          </div>

          {/* Order & Delivery Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Minimum Order (₹)
              </label>
              <input
                type="number"
                name="minimumOrder"
                value={form.minimumOrder}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Delivery Radius (km)
              </label>
              <input
                type="number"
                name="deliveryRadius"
                value={form.deliveryRadius}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Delivery Charge (₹)
              </label>
              <input
                type="number"
                name="deliveryCharge"
                value={form.deliveryCharge}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Blocked Dates Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10 px-6 py-4 border-b border-red-100 dark:border-red-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Blocked Dates & Time Slots</h3>
                <p className="text-xs text-gray-500">Block specific dates or time ranges for private events</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Add New Blocked Date */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Add New Block</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newBlockedDate.date}
                    onChange={(e) => setNewBlockedDate(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newBlockedDate.startTime}
                    onChange={(e) => setNewBlockedDate(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newBlockedDate.endTime}
                    onChange={(e) => setNewBlockedDate(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reason</label>
                  <input
                    type="text"
                    placeholder="e.g., Birthday Party"
                    value={newBlockedDate.reason}
                    onChange={(e) => setNewBlockedDate(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBlockDate}
                  disabled={blocking || !newBlockedDate.date}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Block
                </button>
                <span className="text-xs text-gray-500">Leave time empty to block entire day</span>
              </div>
            </div>

            {/* Blocked Dates List */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Blocked List ({blockedDates.length})
              </h4>
              {blockedDates.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {blockedDates.map((blocked, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-red-500 text-lg">📅</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {new Date(blocked.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            {blocked.startTime && blocked.endTime ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                                🕐 {blocked.startTime} - {blocked.endTime}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                                Full Day
                              </span>
                            )}
                            <span className="text-gray-500 text-xs">{blocked.reason}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblockDate(blocked.date)}
                        disabled={blocking}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Remove block"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">No blocked dates</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary inline-flex items-center gap-2 px-6 py-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
