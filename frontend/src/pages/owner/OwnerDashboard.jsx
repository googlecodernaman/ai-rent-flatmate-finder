import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { PageLoader, EmptyState, ErrorState, CardSkeleton } from '../../components/ui/States'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function MetricCard({ icon, label, value, delta, highlight }) {
  return (
    <div className={`card p-stack-md flex flex-col justify-between h-32 relative overflow-hidden group ${highlight ? 'border-primary/20' : ''}`}>
      {highlight && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0" />}
      <div className="flex justify-between items-start z-10 relative">
        <span className="text-body-sm text-on-surface-variant">{label}</span>
        <span className={`material-symbols-outlined ${highlight ? 'text-primary' : 'text-outline'}`}>{icon}</span>
      </div>
      <div className="z-10 relative">
        <span className="text-headline-lg-mobile font-bold text-on-surface block">{value}</span>
        {delta && <p className="text-label-caps font-mono text-primary mt-1">{delta}</p>}
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
    </div>
  )
}

export default function OwnerDashboard() {
  const [listings, setListings] = useState([])
  const [interests, setInterests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [listRes, intRes] = await Promise.all([
          api.get('/listings/my'),
          api.get('/interests/received')
        ])
        setListings(Array.isArray(listRes.data) ? listRes.data : (listRes.data.data || []))
        setInterests(Array.isArray(intRes.data) ? intRes.data : (intRes.data.data || []))
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleToggle = async (listing) => {
    try {
      await api.patch(`/listings/${listing.id}/toggle`, { isFilled: !listing.isFilled })
      setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, isFilled: !l.isFilled } : l))
      toast.success(listing.isFilled ? 'Listing reopened' : 'Listing marked as filled')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to update')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing?')) return
    try {
      await api.delete(`/listings/${id}`)
      setListings((prev) => prev.filter((l) => l.id !== id))
      toast.success('Listing deleted')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to delete')
    }
  }

  const pendingCount = interests.filter((i) => i.status === 'PENDING').length
  const avgScore = interests.length
    ? Math.round(interests.reduce((s, i) => s + (i.compatibilityScore || 0), 0) / interests.length)
    : null

  if (loading) return <div className="p-margin-desktop"><PageLoader /></div>
  if (error) return <div className="p-margin-desktop"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto space-y-stack-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
        <div>
          <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface">Dashboard Overview</h1>
          <p className="text-body-md text-on-surface-variant">Manage your listings and interest requests.</p>
        </div>
        <Link to="/my-listings/new" className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          List New Property
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <MetricCard icon="domain" label="Active Listings" value={listings.filter((l) => !l.isFilled).length} delta={`${listings.length} total`} />
        <MetricCard icon="mail" label="Pending Interests" value={pendingCount} delta={`+${interests.length} total requests`} />
        <MetricCard icon="auto_awesome" label="Avg. AI Match Score" value={avgScore !== null ? `${avgScore}%` : '—'} delta="Across all requests" highlight />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Listings */}
        <div className="lg:col-span-2 space-y-gutter">
          <div className="flex justify-between items-center">
            <h2 className="text-title-md text-on-surface">Active Properties</h2>
            <Link to="/my-listings" className="text-primary text-ai-stat hover:underline">View All</Link>
          </div>

          {listings.length === 0 ? (
            <EmptyState
              icon="add_home"
              title="No listings yet"
              description="Create your first listing to start receiving tenants."
              action={<Link to="/my-listings/new" className="btn-primary">Add Listing</Link>}
            />
          ) : (
            <div className="space-y-stack-md">
              {listings.slice(0, 4).map((listing) => (
                <div key={listing.id} className="card p-4 flex flex-col md:flex-row gap-stack-md hover:shadow-ambient-md transition-shadow">
                  <div className="w-full md:w-44 h-28 rounded-xl overflow-hidden bg-surface-container shrink-0">
                    {listing.photos?.[0] ? (
                      <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[32px] text-on-surface-variant/20">apartment</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-title-md font-semibold text-on-surface truncate">{listing.title}</h3>
                        <div className="flex gap-1 shrink-0">
                          <Link to={`/my-listings/${listing.id}/edit`} className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Link>
                          <button onClick={() => handleDelete(listing.id)} className="p-1.5 text-on-surface-variant hover:text-error rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mt-1">{listing.location}</p>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                      <span className="text-headline-lg-mobile font-bold text-on-surface">
                        ₹{listing.rent.toLocaleString('en-IN')}
                        <span className="text-body-sm font-normal text-on-surface-variant">/mo</span>
                      </span>
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleToggle(listing)}
                          className={`text-body-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            listing.isFilled
                              ? 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-variant'
                              : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                          }`}
                        >
                          {listing.isFilled ? 'Filled' : 'Available'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent interests */}
        <div className="lg:col-span-1 card p-6">
          <h2 className="text-title-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications_active</span>
            Recent Requests
          </h2>
          {interests.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">No interest requests yet.</p>
          ) : (
            <div className="space-y-3">
              {interests.slice(0, 5).map((interest) => (
                <div key={interest.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[16px]">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold truncate">{interest.tenant?.name}</p>
                    <p className="text-body-sm text-on-surface-variant text-[11px] truncate">{interest.listing?.title}</p>
                  </div>
                  {interest.compatibilityScore !== null && (
                    <span className="text-ai-stat text-primary shrink-0">{interest.compatibilityScore}%</span>
                  )}
                </div>
              ))}
              <Link to="/interests/received" className="btn-secondary w-full text-body-sm mt-2 flex items-center justify-center gap-2">
                View All Requests
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
