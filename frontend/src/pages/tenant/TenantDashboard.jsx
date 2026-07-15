import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { ScoreBadge, RoomTypeBadge } from '../../components/ui/Badges'
import { PageLoader, EmptyState, ErrorState, CardSkeleton } from '../../components/ui/States'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function ListingCard({ listing }) {
  const photoUrl = listing.photos?.[0] ? listing.photos[0] : null
  const score = listing.compatibilityScore
  const isFallback = listing.scoreFallback

  return (
    <Link to={`/listings/${listing.id}`} className="card block overflow-hidden hover:shadow-lift transition-shadow group">
      {/* Photo */}
      <div className="h-44 bg-secondary-container relative overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">apartment</span>
          </div>
        )}
        {/* Score badge overlay */}
        <div className="absolute top-3 right-3">
          <ScoreBadge score={score} fallback={isFallback} />
        </div>
        <div className="absolute top-3 left-3">
          <span className="bg-primary text-on-primary text-label-caps font-mono px-2 py-0.5 rounded text-[10px]">FOR RENT</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-title-md font-semibold text-on-surface leading-tight truncate mr-2">{listing.title}</h3>
          <span className="text-title-md font-bold text-on-surface shrink-0">
            ₹{listing.rent.toLocaleString('en-IN')}
            <span className="text-body-sm font-normal text-on-surface-variant">/mo</span>
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mb-3">
          <span className="material-symbols-outlined text-[14px]">location_on</span>
          {listing.location}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <RoomTypeBadge type={listing.roomType} />
          <span className="text-body-sm text-on-surface-variant">
            Available {format(new Date(listing.availableFrom), 'dd MMM yyyy')}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function TenantDashboard() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasProfile, setHasProfile] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // Check profile exists
        try { await api.get('/tenant-profile') }
        catch (e) { if (e.response?.status === 404) setHasProfile(false) }

        const { data } = await api.get('/listings?limit=6')
        setListings(data.data || [])
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const topMatch = listings[0]
  const rest = listings.slice(1)

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      {/* Header */}
      <header className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-background">
            Your Best Matches
          </h2>
          <p className="text-body-md text-on-surface-variant mt-unit">
            AI-curated rooms based on your profile.
          </p>
        </div>
        <div className="flex gap-stack-sm">
          <Link to="/listings" className="btn-secondary text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">search</span>
            Browse All
          </Link>
        </div>
      </header>

      {/* No profile banner */}
      {!hasProfile && (
        <div className="mb-stack-lg p-4 rounded-xl bg-secondary-container/50 border border-primary/20 flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-[24px]">info</span>
          <div className="flex-1">
            <p className="text-body-md font-semibold text-on-surface">Create your profile to see personalized scores</p>
            <p className="text-body-sm text-on-surface-variant">AI compatibility scoring requires your preferences.</p>
          </div>
          <Link to="/profile" className="btn-primary text-body-sm shrink-0">Set Up Profile</Link>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8"><CardSkeleton /></div>
          <div className="lg:col-span-4"><CardSkeleton /></div>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}

      {!loading && !error && listings.length === 0 && (
        <EmptyState
          icon="apartment"
          title="No listings yet"
          description="Check back soon — owners are adding rooms."
          action={<Link to="/listings" className="btn-primary">Browse All Listings</Link>}
        />
      )}

      {!loading && !error && listings.length > 0 && (
        <>
          {/* Bento top section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-stack-lg">
            {/* Top match */}
            {topMatch && (
              <article className="col-span-1 lg:col-span-8">
                <Link to={`/listings/${topMatch.id}`} className="card block overflow-hidden hover:shadow-lift transition-shadow group cursor-pointer">
                  <div className="absolute top-4 right-4 z-10">
                    <ScoreBadge score={topMatch.compatibilityScore} fallback={topMatch.scoreFallback} />
                  </div>
                  <div className="relative">
                    <div className="aspect-[21/9] w-full bg-secondary-container relative overflow-hidden">
                      {topMatch.photos?.[0] ? (
                        <img src={topMatch.photos[0]} alt={topMatch.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[64px] text-on-surface-variant/20">apartment</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <span className="text-label-caps font-mono bg-primary px-2 py-0.5 rounded inline-block mb-2">FOR RENT</span>
                        <h3 className="text-title-md">₹{topMatch.rent.toLocaleString('en-IN')}<span className="text-body-sm opacity-80">/mo</span></h3>
                        <p className="text-body-md truncate">{topMatch.title} • {topMatch.location}</p>
                      </div>
                      <div className="absolute top-4 right-4">
                        <ScoreBadge score={topMatch.compatibilityScore} fallback={topMatch.scoreFallback} />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-container-lowest border-t border-outline-variant/20">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">location_on</span> Location
                        </span>
                        <span className="text-ai-stat text-primary">{topMatch.compatibilityScore ?? '—'}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${topMatch.compatibilityScore ?? 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">payments</span> Budget
                        </span>
                        <span className="text-ai-stat text-primary">{topMatch.compatibilityScore ?? '—'}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${topMatch.compatibilityScore ?? 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <RoomTypeBadge type={topMatch.roomType} />
                      <p className="text-body-sm text-on-surface-variant mt-2">{topMatch.furnishingStatus?.replace('_', ' ')}</p>
                    </div>
                  </div>
                </Link>
              </article>
            )}

            {/* Quick stats / AI insights panel */}
            <aside className="col-span-1 lg:col-span-4 card border-t-4 border-primary p-6 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
              <h3 className="text-title-md text-on-background mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                AI Match Summary
              </h3>
              <p className="text-body-sm text-on-surface-variant mb-6">Based on your profile preferences.</p>
              <div className="space-y-4">
                {listings.slice(0, 3).map((l, i) => (
                  <Link key={l.id} to={`/listings/${l.id}`} className="flex items-center gap-3 hover:bg-surface-container-low p-2 rounded-lg transition-colors">
                    <span className="text-label-caps font-mono text-on-surface-variant w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-semibold truncate">{l.title}</p>
                      <p className="text-body-sm text-on-surface-variant text-[12px]">₹{l.rent.toLocaleString('en-IN')}/mo • {l.location}</p>
                    </div>
                    <ScoreBadge score={l.compatibilityScore} size="sm" />
                  </Link>
                ))}
              </div>
              <Link to="/listings" className="mt-4 btn-secondary w-full text-body-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">search</span>
                View All
              </Link>
            </aside>
          </div>

          {/* More listings */}
          {rest.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-stack-md">
                <h3 className="text-title-md text-on-background">More Listings</h3>
                <Link to="/listings" className="text-primary text-body-sm hover:underline">View All</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                {rest.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
