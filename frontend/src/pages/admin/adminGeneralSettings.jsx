import { useState, useEffect } from 'react'
import { Save, Upload, Facebook, Instagram } from 'lucide-react'
import { generalSettingsAPI } from '../../services/api'
import toast from 'react-hot-toast'

const baseUrl = import.meta.env.VITE_SERVER_URL

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
  })
  const [logoPreview, setLogoPreview] = useState('')

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
      })
      
      if (settings.logo) {
        setLogoPreview(settings.logo.startsWith('http') ? settings.logo : `${baseUrl}${settings.logo}`)
      }
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
