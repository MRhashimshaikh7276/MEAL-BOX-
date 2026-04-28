import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { token } = router.query
  const navigate = router.push
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const hasToken = !!token

  const onSubmitEmail = async (data) => {
    setLoading(true)
    try { await authAPI.forgotPassword(data.email); setSent(true); toast.success('Reset email sent!') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to send email') }
    finally { setLoading(false) }
  }

  const onSubmitPassword = async (data) => {
    setLoading(true)
    try { await authAPI.resetPassword(token, data.password); toast.success('Password reset!'); navigate('/login') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to reset password') }
    finally { setLoading(false) }
  }

  if (hasToken) {
    return (
      <div className="card shadow-xl">
        <Link href="/login" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </Link>
        <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Reset password</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter your new password below</p>
        
        <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                className={`input pl-10 pr-10 ${errors.password ? 'ring-2 ring-red-400' : ''}`}
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                className={`input pl-10 pr-10 ${errors.confirmPassword ? 'ring-2 ring-red-400' : ''}`}
                {...register('confirmPassword', { validate: v => v === watch('password') || 'Passwords do not match' })} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</span> : 'Reset Password'}
          </button>
        </form>
      </div>
    )
  }

  if (sent) return (
    <div className=" text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl">📧</span>
      </div>
      <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Check your email</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm">We've sent a password reset link to your email address.</p>
      <Link href="/login" className="btn-primary inline-block mt-4">Back to Login</Link>
    </div>
  )

  return (
   <>
      <Link href="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Login
      </Link>
      <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Forgot password?</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter your email and we'll send you a reset link</p>

      <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" placeholder="you@example.com"
              className={`input pl-10 ${errors.email ? 'ring-2 ring-red-400' : ''}`}
              {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })} />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span> : 'Send Reset Link'}
        </button>
      </form>
   </>
  )
}