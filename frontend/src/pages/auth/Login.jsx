import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      if (from) return navigate(from, { replace: true })
      if (user.role === 'TENANT') navigate('/dashboard')
      else if (user.role === 'OWNER') navigate('/my-listings')
      else navigate('/admin')
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link to="/" className="block text-center mb-8">
          <span className="text-display-lg font-bold text-primary tracking-tighter">NivasAI</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-headline-lg-mobile font-bold text-on-surface mb-2">Sign in</h1>
          <p className="text-body-sm text-on-surface-variant mb-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">Create one</Link>
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Email</label>
              <input
                type="email"
                className="input-base"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Password</label>
              <input
                type="password"
                className="input-base"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-title-md mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <p className="text-label-caps font-mono text-on-surface-variant mb-2">DEMO CREDENTIALS</p>
            <div className="space-y-1 text-body-sm">
              <p><span className="text-on-surface-variant">Tenant:</span> <code className="text-primary">sneha@example.com</code> / <code className="text-primary">password123</code></p>
              <p><span className="text-on-surface-variant">Owner:</span> <code className="text-primary">rahul@example.com</code> / <code className="text-primary">password123</code></p>
              <p><span className="text-on-surface-variant">Admin:</span> <code className="text-primary">admin@example.com</code> / <code className="text-primary">password123</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
