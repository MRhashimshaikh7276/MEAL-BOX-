import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Star, Package, Tag, DollarSign, Clock, Image as ImageIcon } from 'lucide-react'
import { productAPI, categoryAPI, subcategoryAPI, subsubcategoryAPI } from '../../services/api'
import toast from 'react-hot-toast'

const baseUrl = import.meta.env.VITE_SERVER_URL

export default function AdminProductDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState([])
    const [subcategories, setSubcategories] = useState([])
    const [subsubcategories, setSubsubcategories] = useState([])

    useEffect(() => {
        loadProduct()
        loadCategories()
    }, [id])

    const loadProduct = async () => {
        setLoading(true)
        try {
            const res = await productAPI.getById(id)
            setProduct(res.data.product)

            // Load related categories
            if (res.data.product?.categoryId) {
                loadSubcategories(res.data.product.categoryId)
            }
            if (res.data.product?.subcategoryId) {
                loadSubsubcategories(res.data.product.subcategoryId)
            }
        } catch (err) {
            toast.error('Failed to load product')
            navigate('/admin/products')
        } finally {
            setLoading(false)
        }
    }

    const loadCategories = async () => {
        try {
            const res = await categoryAPI.getAll()
            setCategories(res.data.categories || [])
        } catch (err) {
            console.error('Failed to load categories')
        }
    }

    const loadSubcategories = async (categoryId) => {
        if (!categoryId) return
        try {
            const res = await subcategoryAPI.getAll(categoryId)
            setSubcategories(res.data.subcategories || [])
        } catch (err) {
            console.error('Failed to load subcategories')
        }
    }

    const loadSubsubcategories = async (subcategoryId) => {
        if (!subcategoryId) return
        try {
            const res = await subsubcategoryAPI.getAll({ subcategoryId })
            setSubsubcategories(res.data.subsubcategories || [])
        } catch (err) {
            console.error('Failed to load sub-subcategories')
        }
    }

    const getCategoryName = (id) => {
        const cat = categories.find(c => c._id === id || c._id === id?._id)
        return cat?.name || '-'
    }

    const getSubcategoryName = (id) => {
        const sub = subcategories.find(s => s._id === id || s._id === id?._id)
        return sub?.name || '-'
    }

    const getSubsubcategoryName = (id) => {
        const subsub = subsubcategories.find(s => s._id === id || s._id === id?._id)
        return subsub?.name || '-'
    }

    if (loading) {
        return (
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="skeleton h-8 w-48" />
                </div>
                <div className="card p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="skeleton h-64 w-full rounded-lg" />
                        <div className="space-y-4">
                            <div className="skeleton h-6 w-3/4" />
                            <div className="skeleton h-4 w-full" />
                            <div className="skeleton h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Product not found</p>
                <button onClick={() => navigate('/admin/products')} className="btn-primary mt-4">
                    Back to Products
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/admin/products')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex-1">
                    <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
                        Product Details
                    </h1>
                    <p className="text-sm text-gray-500">View and manage product information</p>
                </div>
                <button
                    onClick={() => navigate('/admin/products')}
                    className="btn-primary flex items-center gap-2"
                >
                    <Pencil size={16} /> Edit Product
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Product Images */}
                    <div className="card p-5">
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <ImageIcon size={20} className="text-primary-500" />
                            Product Images
                        </h2>
                        {product.images && product.images.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {product.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        <img
                                            src={`${baseUrl}${img.url}`}
                                            alt={`${product.name} - ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                                <p>No images available</p>
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="card p-5">
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Package size={20} className="text-primary-500" />
                            Basic Information
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500">Product Name</label>
                                <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Type</label>
                                <p className="font-medium">
                                    <span className={`inline-flex items-center gap-1 ${product.isVeg ? 'text-green-600' : 'text-red-600'}`}>
                                        <span className={`w-3 h-3 rounded border flex items-center justify-center ${product.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${product.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        </span>
                                        {product.isVeg ? 'Veg' : 'Non-Veg'}
                                    </span>
                                </p>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-sm text-gray-500">Description</label>
                                <p className="font-medium text-gray-900 dark:text-white">{product.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="card p-5">
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-primary-500" />
                            Pricing
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500">Regular Price</label>
                                <p className="font-bold text-xl text-gray-900 dark:text-white">₹{product.price}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Discount Price</label>
                                <p className="font-bold text-xl text-primary-600">
                                    {product.discountPrice ? `₹${product.discountPrice}` : '-'}
                                </p>
                                {product.discountPrice && product.price > product.discountPrice && (
                                    <p className="text-sm text-green-600">
                                        Save ₹{product.price - product.discountPrice} ({Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off)
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Preparation Time */}
                    <div className="card p-5">
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-primary-500" />
                            Preparation Time
                        </h2>
                        <div className="flex items-center gap-3">
                            <Clock size={24} className="text-gray-400" />
                            <div>
                                <p className="font-bold text-2xl text-gray-900 dark:text-white">{product.preparationTime || 20} min</p>
                                <p className="text-sm text-gray-500">Estimated time to prepare this dish</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    {/* Status */}
                    <div className="card p-5">
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Status</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Availability</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.isAvailable
                                    ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {product.isAvailable ? 'Available' : 'Unavailable'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Featured</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.isFeatured
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {product.isFeatured ? 'Featured' : 'Normal'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="card p-5">
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Tag size={20} className="text-primary-500" />
                            Categories
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-500">Category</label>
                                <p className="font-medium text-gray-900 dark:text-white">{getCategoryName(product.categoryId)}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Sub Category</label>
                                <p className="font-medium text-gray-900 dark:text-white">{getSubcategoryName(product.subcategoryId)}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Sub Sub Category</label>
                                <p className="font-medium text-gray-900 dark:text-white">{getSubsubcategoryName(product.subSubcategoryId)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Ratings & Stats */}
                    <div className="card p-5">
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Star size={20} className="text-primary-500" />
                            Performance
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Star size={18} className="text-yellow-500 fill-yellow-500" />
                                    <span className="text-gray-600 dark:text-gray-300">Rating</span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {product.rating?.toFixed(1) || '0'} / 5
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Total Reviews</span>
                                <span className="font-bold text-gray-900 dark:text-white">{product.totalReviews || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Total Orders</span>
                                <span className="font-bold text-gray-900 dark:text-white">{product.totalOrders || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                        <div className="card p-5">
                            <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Tags</h2>
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="card p-5">
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Timestamps</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="text-gray-500">Created At</label>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-gray-500">Last Updated</label>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
