import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TileGrid from '../components/TileGrid'
import BulletinFeed from '../components/BulletinFeed'
import { formatDateRange } from '../lib/dateUtils'

export default function EventPage() {
  const { rallyId } = useParams()
  const [rally, setRally] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newCounts, setNewCounts] = useState({})
  const { isOrganiser, user } = useAuth()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('rallies')
        .select('*')
        .eq('id', rallyId)
        .single()
      setRally(data)
      setLoading(false)
    }

    async function loadNewCounts() {
      // Get counts of documents posted in last 24h per section
      const since = new Date(Date.now() - 86400000).toISOString()
      const { data } = await supabase
        .from('rally_documents')
        .select('section')
        .eq('rally_id', rallyId)
        .gte('created_at', since)
      if (data) {
        const counts = data.reduce((acc, doc) => {
          acc[doc.section] = (acc[doc.section] || 0) + 1
          return acc
        }, {})
        setNewCounts(counts)
      }
    }

    load()
    loadNewCounts()
  }, [rallyId])

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-32 bg-white/5 rounded-xl animate-pulse mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  if (!rally) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <p className="text-white/40">Event not found.</p>
      <Link to="/" className="text-rl-accent text-sm mt-2 inline-block">← Back to events</Link>
    </div>
  )

  const isPast = new Date(rally.end_date || rally.date) < new Date()

  return (
    <main className="max-w-4xl mx-auto px-4 py-0">
      {/* Dark event header */}
      <div className="bg-[#111] -mx-4 px-4 sm:px-6 pt-6 pb-0 mb-6 sm:rounded-b-2xl border-b border-white/8">
        {/* Back */}
        <Link to="/" className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 mb-4 no-underline transition-colors">
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" clipRule="evenodd" />
          </svg>
          All events
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-2 mb-2">
          {!isPast && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rl-accent bg-rl-accent/10 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rl-accent animate-pulse" />
              Live event
            </span>
          )}
          {rally.series && (
            <span className="text-white/35 text-xs">{rally.series}</span>
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2">{rally.name}</h1>

        {/* Date & location */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/45 text-sm mb-5">
          <span>{formatDateRange(rally.date, rally.end_date)}</span>
          <span>{rally.location}</span>
        </div>

        {/* Organiser controls */}
        {isOrganiser && (
          <div className="pb-4 border-b border-white/8 mb-1">
            <Link to={`/organiser/event/${rallyId}`} className="rl-btn-primary text-xs inline-block">
              Manage event →
            </Link>
          </div>
        )}

        {/* Rally Logistics button for logged-in users */}
        {user && (
          <div className="flex items-center justify-between py-3 border-t border-white/8">
            <span className="text-white/40 text-xs">Team logistics platform</span>
            <a
              href="https://rally-logistics.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-rl-accent hover:text-white transition-colors font-medium"
            >
              Open Rally Logistics →
            </a>
          </div>
        )}
      </div>

      {/* Section tiles */}
      <section className="mb-6">
        <p className="text-white/30 text-[11px] uppercase tracking-widest font-medium mb-3">Event sections</p>
        <TileGrid rallyId={rallyId} newCounts={newCounts} />
      </section>

      {/* Latest bulletins */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/30 text-[11px] uppercase tracking-widest font-medium">Latest bulletins</p>
          <Link to={`/event/${rallyId}/bulletins`} className="text-white/40 hover:text-white text-xs transition-colors no-underline">
            View all →
          </Link>
        </div>
        <BulletinFeed rallyId={rallyId} limit={3} />
      </section>
    </main>
  )
}
