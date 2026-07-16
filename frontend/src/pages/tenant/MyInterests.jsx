import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { StatusBadge, ScoreBadge } from '../../components/ui/Badges'
import { PageLoader, EmptyState, ErrorState } from '../../components/ui/States'
import { format } from 'date-fns'

export default function MyInterests() {
  const [interests, setInterests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('ALL')

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/interests')
        setInterests(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = tab === 'ALL' ? interests : interests.filter((i) => i.status === tab)
  const counts = {
    ALL: interests.length,
    PENDING: interests.filter((i) => i.status === 'PENDING').length,
    ACCEPTED: interests.filter((i) => i.status === 'ACCEPTED').length,
    DECLINED: interests.filter((i) => i.status === 'DECLINED').length,
  }

  if (loading) return <div className="p-margin-desktop"><PageLoader /></div>
  if (error) return <div className="p-margin-desktop"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background">My Interests</h1>
        <p className="text-body-md text-on-surface-variant mt-unit">Track all the rooms you've expressed interest in.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-stack-lg overflow-x-auto no-scrollbar">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setTab(status)}
            className={`shrink-0 px-4 py-2 rounded-full text-body-sm font-semibold transition-all border ${
              tab === status
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface border-outline-variant text-on-surface-variant hover:border-primary/50'
            }`}
          >
            {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            <span className="ml-1 text-[11px] opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="favorite_border"
          title={tab === 'ALL' ? 'No interests yet' : `No ${tab.toLowerCase()} interests`}
          description="Browse listings and express interest in rooms you like."
          action={<Link to="/listings" className="btn-primary">Browse Listings</Link>}
        />
      ) : (
        <div className="space-y-stack-md">
          {filtered.map((interest) => {
            const listing = interest.listing
            if (!listing) return null
            return (
              <div key={interest.id} className="card p-4 flex flex-col md:flex-row gap-4 hover:shadow-lift transition-shadow">
                {/* Photo */}
                <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden bg-surface-container shrink-0">
                  {listing.photos?.[0] ? (
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant/30">apartment</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link
                      to={`/listings/${listing.id}`}
                      className="text-title-md font-semibold text-on-surface hover:text-primary transition-colors truncate"
                    >
                      {listing.title}
                    </Link>
                    <StatusBadge status={interest.status} />
                  </div>
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mb-2">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {listing.location}
                  </p>
                  <p className="text-body-sm text-on-surface font-semibold mb-2">
                    ₹{listing.rent.toLocaleString('en-IN')}/month
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {interest.compatibilityScore !== null && (
                      <ScoreBadge score={interest.compatibilityScore} />
                    )}
                    <span className="text-body-sm text-on-surface-variant text-[12px]">
                      Sent {format(new Date(interest.createdAt), 'dd MMM yyyy')}
                    </span>
                    {interest.status === 'ACCEPTED' && (
                      <Link to="/chat" className="btn-ghost text-body-sm py-1 px-3 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">forum</span>
                        Open Chat
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
