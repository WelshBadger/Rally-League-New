import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDistanceToNow } from '../lib/dateUtils'

export default function BulletinFeed({ rallyId, limit = 4 }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('rally_documents')
        .select('*')
        .eq('rally_id', rallyId)
        .eq('section', 'bulletins')
        .order('created_at', { ascending: false })
        .limit(limit)
      setDocs(data || [])
      setLoading(false)
    }
    load()

    // Real-time subscription for live bulletin updates
    const channel = supabase
      .channel(`bulletins-${rallyId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rally_documents',
        filter: `rally_id=eq.${rallyId}`,
      }, (payload) => {
        if (payload.new.section === 'bulletins') {
          setDocs(prev => [payload.new, ...prev].slice(0, limit))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [rallyId, limit])

  if (loading) return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
      ))}
    </div>
  )

  if (!docs.length) return (
    <div className="text-white/30 text-sm py-4 text-center">No bulletins posted yet.</div>
  )

  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <Link
          key={doc.id}
          to={`/event/${rallyId}/bulletins`}
          className="flex items-center gap-3 bg-rl-card border border-white/10 rounded-xl px-4 py-3 hover:border-white/25 transition-all no-underline group"
        >
          {/* Icon */}
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            doc.is_urgent ? 'bg-red-500/15' : 'bg-white/5'
          }`}>
            {doc.is_urgent ? (
              <svg className="w-4 h-4 text-rl-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{doc.title}</p>
            <p className="text-white/40 text-xs mt-0.5">
              {formatDistanceToNow(doc.created_at)}
            </p>
          </div>

          {/* Badge */}
          {doc.is_urgent && (
            <span className="text-[10px] bg-red-500/15 text-rl-accent px-2 py-0.5 rounded-full font-medium flex-shrink-0">
              Urgent
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
