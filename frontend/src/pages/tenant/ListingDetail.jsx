import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { ScoreBadge, RoomTypeBadge, FurnishingBadge } from '../../components/ui/Badges'
import { PageLoader, ErrorState } from '../../components/ui/States'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [interestStatus, setInterestStatus] = useState(null) // null | 'PENDING' | 'ACCEPTED' | 'DECLINED'
  const [interestLoading, setInterestLoading] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/listings/${id}`)
        setListing(data)
        // Check existing interest
        if (user?.role === 'TENANT') {
          try {
            const { data: interests } = await api.get('/interests/my')
            const existing = interests.data?.find((i) => i.listingId === id)
            if (existing) setInterestStatus(existing.status)
          } catch {}
        }
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Listing not found')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user])

  const handleExpressInterest = async () => {
    if (!user) { navigate('/login'); return }
    setInterestLoading(true)
    try {
      await api.post('/interests', { listingId: id })
      setInterestStatus('PENDING')
      toast.success('Interest sent! The owner will review your request.')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to express interest')
    } finally {
      setInterestLoading(false)
    }
  }

  if (loading) return <div className="p-margin-desktop"><PageLoader /></div>
  if (error) return <div className="p-margin-desktop"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>
  if (!listing) return null

  const amenitiesList = listing.amenities ? JSON.parse(listing.amenities) : []
  const photos = listing.photos?.length ? listing.photos : []

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary mb-6 transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left: photos + details */}
        <div className="lg:col-span-2 space-y-gutter">
          {/* Photo gallery */}
          <div className="card overflow-hidden">
            {photos.length > 0 ? (
              <>
                <div className="h-72 md:h-96 relative overflow-hidden bg-surface-container">
                  <img
                    src={photos[activePhoto]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <ScoreBadge score={listing.compatibilityScore} fallback={listing.scoreFallback} />
                  </div>
                </div>
                {photos.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
                    {photos.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          activePhoto === i ? 'border-primary' : 'border-transparent'
                        }`}
                      >
                        <img src={p} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-72 bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[64px] text-on-surface-variant/20">apartment</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="card p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <RoomTypeBadge type={listing.roomType} />
              <FurnishingBadge status={listing.furnishingStatus} />
              <span className="inline-flex items-center gap-1 bg-primary text-on-primary text-label-caps font-mono px-2 py-0.5 rounded text-[10px]">FOR RENT</span>
            </div>

            <h1 className="text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface mb-2">{listing.title}</h1>
            <p className="text-body-md text-on-surface-variant flex items-center gap-1 mb-4">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              {listing.location}
            </p>

            {listing.description && (
              <div className="mb-6">
                <h2 className="text-title-md font-semibold text-on-surface mb-2">About this room</h2>
                <p className="text-body-md text-on-surface-variant whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-t border-b border-outline-variant/20 mb-6">
              {[
                { icon: 'calendar_today', label: 'Available From', value: format(new Date(listing.availableFrom), 'dd MMM yyyy') },
                { icon: 'people', label: 'Occupants Allowed', value: listing.occupantsAllowed || 1 },
                { icon: 'wc', label: 'Preferred Gender', value: listing.preferredGender || 'Any' },
              ].map(({ icon, label, value }) => (
                <div key={label}>
                  <span className="text-label-caps font-mono text-on-surface-variant flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-[14px]">{icon}</span>
                    {label}
                  </span>
                  <span className="text-body-md font-semibold text-on-surface">{value}</span>
                </div>
              ))}
            </div>

            {/* Amenities */}
            {amenitiesList.length > 0 && (
              <div>
                <h2 className="text-title-md font-semibold text-on-surface mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container text-body-sm text-on-surface-variant border border-outline-variant/30">
                      <span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Score breakdown (if available) */}
          {listing.scoreExplanation && (
            <div className="card p-6 border-t-4 border-primary">
              <h2 className="text-title-md font-semibold text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                AI Compatibility Breakdown
              </h2>
              <p className="text-body-sm text-on-surface-variant mb-4">{listing.scoreExplanation}</p>
            </div>
          )}
        </div>

        {/* Right: price + CTA */}
        <div className="lg:col-span-1 space-y-gutter">
          <div className="card p-6 sticky top-24">
            <div className="mb-4">
              <span className="text-display-lg font-bold text-on-surface">
                ₹{listing.rent.toLocaleString('en-IN')}
              </span>
              <span className="text-body-md text-on-surface-variant">/month</span>
            </div>

            {listing.compatibilityScore !== null && (
              <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-[16px] filled">auto_awesome</span>
                  <span className="text-ai-stat text-primary">AI Compatibility Score</span>
                </div>
                <div className="text-headline-lg-mobile font-bold text-primary">
                  {listing.compatibilityScore}%
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${listing.compatibilityScore}%` }} />
                </div>
              </div>
            )}

            {/* Interest CTA */}
            {user?.role === 'TENANT' && (
              <>
                {interestStatus === null && (
                  <button
                    className="btn-primary w-full py-3 text-title-md"
                    disabled={interestLoading}
                    onClick={handleExpressInterest}
                  >
                    {interestLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      'Express Interest'
                    )}
                  </button>
                )}
                {interestStatus === 'PENDING' && (
                  <div className="w-full py-3 rounded-lg bg-amber-100 text-amber-800 text-center text-title-md font-semibold border border-amber-200">
                    ⏳ Interest Sent — Pending Review
                  </div>
                )}
                {interestStatus === 'ACCEPTED' && (
                  <div className="space-y-2">
                    <div className="w-full py-3 rounded-lg bg-green-100 text-green-800 text-center text-title-md font-semibold border border-green-200">
                      ✓ Interest Accepted!
                    </div>
                    <Link to="/chat" className="btn-primary w-full py-3 text-title-md flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">forum</span>
                      Open Chat
                    </Link>
                  </div>
                )}
                {interestStatus === 'DECLINED' && (
                  <div className="w-full py-3 rounded-lg bg-red-100 text-red-800 text-center text-title-md font-semibold border border-red-200">
                    Interest Declined
                  </div>
                )}
              </>
            )}

            {!user && (
              <Link to="/login" className="btn-primary w-full py-3 text-title-md flex items-center justify-center gap-2">
                Sign in to Express Interest
              </Link>
            )}

            {/* Owner info */}
            {listing.owner && (
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <p className="text-label-caps font-mono text-on-surface-variant mb-2">LISTED BY</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                  </div>
                  <div>
                    <p className="text-body-md font-semibold text-on-surface">{listing.owner.name}</p>
                    <p className="text-body-sm text-on-surface-variant">Owner</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
