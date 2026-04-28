import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff, Mail, Lock, User, Phone, Gift } from 'lucide-react'
import { useState } from 'react'
import { registerUser } from '../../redux/slices/authSlice'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const { loading } = useSelector(s => s.auth)
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const onSubmit = (data) => {
    const { confirmPassword, ...rest } = data
    dispatch(registerUser(rest))
  }

  return (
    <div>
      <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Create account</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Join Meal-Box and start ordering</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="John Doe" className={`input pl-10 ${errors.name ? 'ring-2 ring-red-400' : ''}`}
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 chars' } })} />
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" placeholder="you@example.com" className={`input pl-10 ${errors.email ? 'ring-2 ring-red-400' : ''}`}
              {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })} />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="+91 98765 43210" className={`input pl-10 ${errors.phone ? 'ring-2 ring-red-400' : ''}`}
              {...register('phone', { required: 'Phone is required', pattern: { value: /^[0-9+\s-]{10,15}$/, message: 'Invalid phone' } })} />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" className={`input pl-10 pr-10 ${errors.password ? 'ring-2 ring-red-400' : ''}`}
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="password" placeholder="••••••••" className={`input pl-10 ${errors.confirmPassword ? 'ring-2 ring-red-400' : ''}`}
              {...register('confirmPassword', { required: true, validate: v => v === watch('password') || 'Passwords do not match' })} />
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Referral Code (Optional)</label>
          <div className="relative">
            <Gift size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Enter friend's code" className="input pl-10"
              {...register('referralCode')} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Have a friend's referral code? Enter it to earn ₹50 rewards!</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</span> : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
        Already have an account? <Link href="/login" className="text-primary-500 font-semibold hover:text-primary-600">Sign in</Link>
      </p>
    </div>
  )
}
