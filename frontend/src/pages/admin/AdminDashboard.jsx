import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { PageLoader, ErrorState } from '../../components/ui/States'
import { StatusBadge } from '../../components/ui/Badges'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/admin/stats')
        setStats(data)
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-margin-desktop"><PageLoader /></div>
  if (error) return <div className="p-margin-desktop"><ErrorState message={error} /></div>

  const cards = [
    { icon: 'people', label: 'Total Users', value: stats?.users?.total ?? '—', sub: `${stats?.users?.tenants ?? 0} tenants · ${stats?.users?.owners ?? 0} owners` },
    { icon: 'domain', label: 'Total Listings', value: stats?.listings?.total ?? '—', sub: `${stats?.listings?.active ?? 0} active · ${stats?.listings?.filled ?? 0} filled` },
    { icon: 'favorite', label: 'Total Interests', value: stats?.interests?.total ?? '—', sub: `${stats?.interests?.accepted ?? 0} accepted` },
    { icon: 'auto_awesome', label: 'AI Scores', value: stats?.scores?.total ?? '—', sub: `${stats?.scores?.pending ?? 0} pending scoring`, highlight: true },
  ]

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background">Admin Dashboard</h1>
        <p className="text-body-md text-on-surface-variant mt-unit">Platform overview and management tools.</p>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter mb-stack-lg">
        {cards.map(({ icon, label, value, sub, highlight }) => (
          <div key={label} className={`card p-6 relative overflow-hidden ${highlight ? 'border-primary/20' : ''}`}>
            {highlight && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className={`material-symbols-outlined ${highlight ? 'text-primary' : 'text-on-surface-variant'}`}>{icon}</span>
                <span className="text-body-sm text-on-surface-variant">{label}</span>
              </div>
              <p className="text-headline-lg-mobile font-bold text-on-surface mb-1">{value}</p>
              <p className="text-body-sm text-on-surface-variant text-[12px]">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {[
          { to: '/admin/users', icon: 'people', title: 'Manage Users', desc: 'View, deactivate, or delete user accounts.' },
          { to: '/admin/listings', icon: 'domain', title: 'Manage Listings', desc: 'Review and manage all property listings.' },
        ].map(({ to, icon, title, desc }) => (
          <a key={to} href={to} className="card p-6 flex items-start gap-4 hover:shadow-lift transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-primary group-hover:text-on-primary">{icon}</span>
            </div>
            <div>
              <h3 className="text-title-md font-semibold text-on-surface mb-1">{title}</h3>
              <p className="text-body-sm text-on-surface-variant">{desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
