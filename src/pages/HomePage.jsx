import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatDateRange } from '../lib/dateUtils'

export default function HomePage() {
  const [rallies, setRallies] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('rallies')
        .select('*')
        .eq('status', 'active')
        .order('date', { ascending: true })
      setRallies(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-white mb-2">Upcoming events</h1>
        <p className="text-white/50 text-sm">Select an event to access all official information, bulletins and documents.</p>
      </div>

      {/* Rally Logistics CTA for logged-in competitors */}
      {user && (
        <div className="mb-8 bg-gradient-to-r from-rl-surface to-rl-card border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-medium text-sm mb-0.5">Rally Logistics</p>
            <p className="text-white/45 text-xs">Full team logistics platform — service scheduling, notes, contacts and more.</p>
          </div>
          <a
            href="https://rally-logistics.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 rl-btn-primary text-xs whitespace-nowrap"
          >
            Open app →
          </a>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rallies.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">No events currently active.</p>
          {!user && (
            <p className="text-white/20 text-xs mt-2">
              Are you an organiser? <Link to="/register" className="text-rl-accent">Create an account</Link> to publish your event.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rallies.map((rally) => (
            <RallyCard key={rally.id} rally={rally} />
          ))}
        </div>
      )}
    </main>
  )
}

function RallyCard({ rally }) {
  const isLive = rally.status === 'active'
  const isPast = new Date(rally.date) < new Date()

  return (
    <Link
      to={`/event/${rally.id}`}
      className="block bg-rl-card border border-white/10 rounded-xl p-4 sm:p-5 hover:border-white/25 transition-all no-underline group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {isLive && !isPast && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-rl-accent bg-rl-accent/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rl-accent animate-pulse" />
                Live
              </span>
            )}
            {rally.series && (
              <span className="text-white/30 text-xs">{rally.series}</span>
            )}
          </div>
          <h2 className="text-white font-medium text-base sm:text-lg leading-tight">{rally.name}</h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5 3.5h6A1.5 1.5 0 0112.5 5v6A1.5 1.5 0 0111 12.5H5A1.5 1.5 0 013.5 11V5A1.5 1.5 0 015 3.5z" />
              </svg>
              {formatDateRange(rally.date, rally.end_date)}
            </span>
            <span>{rally.location}</span>
          </div>
        </div>
        <div className="text-white/25 group-hover:text-white/50 transition-colors mt-1">
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
