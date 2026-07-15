import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { ScoreBadge, RoomTypeBadge, FurnishingBadge } from '../../components/ui/Badges'
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/States'
import { format } from 'date-fns'

function FilterSidebar({ filters, setFilters, onApply }) {
  const [local, setLocal] = useState(filters)

  const handleApply = () => {
    setFilters(local)
    onApply(local)
  }

  const handleReset = () => {
    const reset = { location: '', budgetMin: '', budgetMax: '' }
    setLocal(reset)
    setFilters(reset)
    onApply(reset)
  }

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="card p-6 sticky top-24 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-title-md text-on-surface">Filters</h2>
          <button onClick={handleReset} className="btn-ghost text-body-sm py-1 px-2">Reset</button>
        </div>

        {/* AI Match indicator */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-tertiary" />
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-[16px] filled">auto_awesome</span>
            <span className="text-ai-stat text-on-surface">AI Match Sorting</span>
          </div>
          <p className="text-body-sm text-on-surface-variant">Results ranked by your compatibility score automatically.</p>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-ai-stat text-on-surface mb-2">Location</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">location_on</span>
            <input
              className="input-base pl-9"
              type="text"
              placeholder="e.g. Koramangala"
              value={local.location}
              onChange={(e) => setLocal({ ...local, location: e.target.value })}
            />
          </div>
        </div>

        {/* Budget */}
        <div>
          <h3 className="text-ai-stat text-on-surface mb-2">Budget (₹/month)</h3>
          <div className="flex gap-2 items-center">
            <input
              className="input-base"
              type="number"
              placeholder="Min"
              value={local.budgetMin}
              onChange={(e) => setLocal({ ...local, budgetMin: e.target.value })}
            />
            <span className="text-outline-variant">–</span>
            <input
              className="input-base"
              type="number"
              placeholder="Max"
              value={local.budgetMax}
              onChange={(e) => setLocal({ ...local, budgetMax: e.target.value })}
            />
          </div>
        </div>

        <button onClick={handleApply} className="btn-primary w-full">Apply Filters</button>
      </div>
    </aside>
  )
}

function ListingCard({ listing }) {
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="card block overflow-hidden hover:shadow-lift transition-shadow group"
    >
      <div className="h-48 bg-secondary-container relative overflow-hidden">
        {listing.photos?.[0] ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">apartment</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <ScoreBadge score={listing.compatibilityScore} fallback={listing.scoreFallback} />
        </div>
        <div className="absolute top-3 left-3 bg-primary text-on-primary text-label-caps font-mono px-2 py-0.5 rounded text-[10px]">
          FOR RENT
        </div>
      </div>

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

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <RoomTypeBadge type={listing.roomType} />
          <FurnishingBadge status={listing.furnishingStatus} />
        </div>

        <p className="text-body-sm text-on-surface-variant text-[12px]">
          Available from {format(new Date(listing.availableFrom), 'dd MMM yyyy')}
        </p>
      </div>
    </Link>
  )
}

export default function BrowseListings() {
  const [listings, setListings] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ location: '', budgetMin: '', budgetMax: '' })

  const fetchListings = useCallback(async (f = filters, p = page) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: p, limit: 12 })
      if (f.location) params.set('location', f.location)
      if (f.budgetMin) params.set('budgetMin', f.budgetMin)
      if (f.budgetMax) params.set('budgetMax', f.budgetMax)
      const { data } = await api.get(`/listings?${params}`)
      setListings(data.data)
      setPagination(data.pagination)
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchListings(filters, 1) }, [])

  const handleFilterApply = (f) => {
    setPage(1)
    fetchListings(f, 1)
  }

  const handlePageChange = (p) => {
    setPage(p)
    fetchListings(filters, p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background">Browse Listings</h1>
        <p className="text-body-md text-on-surface-variant mt-unit">
          {pagination ? `${pagination.total} listings found` : 'Find your perfect room'}
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-gutter">
        <FilterSidebar filters={filters} setFilters={setFilters} onApply={handleFilterApply} />

        <div className="flex-1">
          {error && <ErrorState message={error} onRetry={() => fetchListings()} />}

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {!loading && !error && listings.length === 0 && (
            <EmptyState
              icon="search_off"
              title="No listings match your filters"
              description="Try adjusting your location or budget range."
            />
          )}

          {!loading && !error && listings.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter mb-stack-lg">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    className="btn-secondary text-body-sm py-2 px-4"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Previous
                  </button>
                  <span className="text-body-sm text-on-surface-variant">
                    Page {page} of {pagination.pages}
                  </span>
                  <button
                    className="btn-secondary text-body-sm py-2 px-4"
                    disabled={page >= pagination.pages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
