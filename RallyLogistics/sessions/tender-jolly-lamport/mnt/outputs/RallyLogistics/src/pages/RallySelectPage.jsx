import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function fmt(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function RallySelectPage() {
  const [rallies, setRallies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('rallies').select('id,name,date,end_date,location,series,status')
      .in('status', ['active', 'draft'])
      .order('date', { ascending: true })
      .then(({ data }) => { setRallies(data || []); setLoading(false) })
  }, [])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Your events</h1>
        <p className="text-white/40 text-sm">Select a rally to open or create your logistics pack.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : rallies.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No active events found.</div>
      ) : (
        <div className="space-y-3">
          {rallies.map(r => (
            <Link key={r.id} to={`/pack/${r.id}`}
              className="block bg-rl-card border border-white/10 rounded-xl px-5 py-4 hover:border-white/25 transition-all no-underline group">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {r.series && <p className="text-white/30 text-[11px] mb-1">{r.series}</p>}
                  <h2 className="text-white font-medium text-base leading-tight">{r.name}</h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/35 flex-wrap">
                    <span>{fmt(r.date)}{r.end_date && r.end_date !== r.date ? ` – ${fmt(r.end_date)}` : ''}</span>
                    {r.location && <span>{r.location}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.status === 'active' ? 'bg-rl-accent/10 text-rl-accent' : 'bg-white/5 text-white/30'}`}>
                    {r.status === 'active' ? 'Live' : 'Upcoming'}
                  </span>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors">
                    <path fillRule="evenodd" d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
