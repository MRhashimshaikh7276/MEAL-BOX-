import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { bannerSectionAPI } from '../../services/api'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

export default function AdminBannerSection() {
  const router = useRouter() 
  const [bannerSections, setBannerSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, data: null })

  const [form, setForm] = useState({
    startdatetTime: '',
    enddatetTime: '',
    bannerImage: '',
    thumbnail: '',
    type: 'image',
    status: 'active'
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await bannerSectionAPI.getAll()
      // Handle different response formats
      const bannerList = r.data?.bannerSections || r.data || []
      const banners = bannerList.map(b => ({
        ...b,
        isActive: b.status === 'active' || b.status === true,
      }))
      setBannerSections(banners)
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openModal = (banner = null) => {
    setForm(banner ? {
      startdatetTime: banner.startdatetTime ? new Date(banner.startdatetTime).toISOString().slice(0, 16) : '',
      enddatetTime: banner.enddatetTime ? new Date(banner.enddatetTime).toISOString().slice(0, 16) : '',
      bannerImage: banner.bannerImage || '',
      thumbnail: banner.thumbnail || '',
      type: banner.type || 'image',
      status: banner.status === 'active' || banner.status === true ? 'active' : 'inactive'
    } : {
      startdatetTime: '',
      enddatetTime: '',
      bannerImage: '',
      thumbnail: '',
      type: 'image',
      status: 'active'
    })
    setModal({ open: true, data: banner })
  }

  const handleSave = async () => {
    if (!form.bannerImage && !form.thumbnail) {
      toast.error('Banner image or thumbnail is required')
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()

      formData.append("startdatetTime", form.startdatetTime)
      formData.append("enddatetTime", form.enddatetTime)
      formData.append("type", form.type)
      formData.append("status", form.status)

      if (form.bannerImage instanceof File) {
        formData.append("bannerImage", form.bannerImage)
      }

      if (form.thumbnail instanceof File) {
        formData.append("thumbnail", form.thumbnail)
      }

      if (modal.data) {
        await bannerSectionAPI.update(modal.data._id, formData)
        toast.success('Updated!')
      } else {
        await bannerSectionAPI.create(formData)
        toast.success('Created!')
      }

      setModal({ open: false, data: null })
      load()

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
    finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner section?')) return
    try {
      await bannerSectionAPI.delete(id);
      toast.success('Deleted!');
      load()
    }
    catch { toast.error('Failed to delete') }
  }

  const filtered = bannerSections.filter(b =>
    b.type?.toLowerCase().includes(search.toLowerCase()) ||
    b.status?.toLowerCase().includes(search.toLowerCase())
  )

  const getBannerImage = (banner) => {
    if (banner.bannerImage) return `${baseUrl}${banner.bannerImage}`
    if (banner.thumbnail) return `${baseUrl}${banner.thumbnail}`
    return null
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Banner Sections</h1>
          <p className="text-sm text-gray-500">{bannerSections.length} total</p>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="input pl-9 py-2.5 text-sm"
            />
          </div>
        </div>
        <button onClick={() => openModal()} className="btn-primary text-sm py-2.5 ml-auto flex items-center gap-2">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)
        ) : filtered.map(banner => (
          <div key={banner._id} className="card p-4 group hover:shadow-md transition-all">
            <div className="relative mb-3 rounded-xl overflow-hidden h-32 bg-gray-100">
              {getBannerImage(banner) ? (
                banner.type === 'video' ? (
                  <video
                    src={getBannerImage(banner)}
                    className="w-full h-full object-cover"
                    controls
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={getBannerImage(banner)}
                    alt="Banner"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white">
                {banner.type || 'image'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  {banner.startdatetTime && banner.enddatetTime
                    ? `${new Date(banner.startdatetTime).toLocaleDateString()} - ${new Date(banner.enddatetTime).toLocaleDateString()}`
                    : 'No date range'}
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${banner.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(banner)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(banner._id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No banner sections found</p>
        </div>
      )}

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Edit Banner Section' : 'Add Banner Section'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Banner File</label>
            <input
              type="file"
              accept={form.type === 'video' ? 'video/*' : 'image/*'}
              className="input"
              onChange={e =>
                setForm(p => ({
                  ...p,
                  bannerImage: e.target.files[0]
                }))
              }
            />
            {form.bannerImage && (
              form.type === 'video' ? (
                <video
                  src={
                    typeof form.bannerImage === 'string'
                      ? `${baseUrl}${form.bannerImage}`
                      : URL.createObjectURL(form.bannerImage)
                  }
                  poster={
                    form.thumbnail
                      ? typeof form.thumbnail === 'string'
                        ? `${baseUrl}${form.thumbnail}`
                        : URL.createObjectURL(form.thumbnail)
                      : undefined
                  }
                  className="mt-2 h-24 w-full object-cover rounded-xl"
                  controls
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={
                    typeof form.bannerImage === 'string'
                      ? `${baseUrl}${form.bannerImage}`
                      : URL.createObjectURL(form.bannerImage)
                  }
                  alt="Banner preview"
                  className="mt-2 h-24 w-full object-cover rounded-xl"
                />
              )
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Thumbnail Image</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={e =>
                setForm(p => ({
                  ...p,
                  thumbnail: e.target.files[0]
                }))
              }
            />
            {form.thumbnail && (
              <img
                src={
                  typeof form.thumbnail === "string"
                    ? `${baseUrl}${form.thumbnail}`
                    : URL.createObjectURL(form.thumbnail)
                }
                alt="Thumbnail preview"
                className="mt-2 h-24 w-full object-cover rounded-xl"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Start Date & Time</label>
              <input
                type="datetime-local"
                className="input"
                value={form.startdatetTime}
                onChange={e => setForm(p => ({ ...p, startdatetTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">End Date & Time</label>
              <input
                type="datetime-local"
                className="input"
                value={form.enddatetTime}
                onChange={e => setForm(p => ({ ...p, enddatetTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal({ open: false, data: null })} className="btn-outline flex-1 text-sm py-2.5">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm py-2.5">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
