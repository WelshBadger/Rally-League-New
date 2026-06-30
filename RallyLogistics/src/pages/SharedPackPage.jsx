import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TABS = [
  { id: 'team',      label: 'Team' },
  { id: 'schedule',  label: 'Schedule' },
  { id: 'stages',    label: 'Stages' },
  { id: 'pre-event', label: 'Pre-event' },
  { id: 'fuel',      label: 'Fuel' },
  { id: 'recce',     label: 'Recce' },
]

export default function SharedPackPage() {
  const { shareCode } = useParams()
  const [pack, setPack] = useState(null)
  const [rally, setRally] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('team')

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('logistics_packs').select('*').eq('share_code', shareCode).maybeSingle()
      if (!p) { setLoading(false); return }
      const { data: r } = await supabase.from('rallies').select('*').eq('id', p.rally_id).single()
      setPack(p)
      setRally(r)
      setLoading(false)
    }
    load()
  }, [shareCode])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-rl-accent rounded-full animate-spin" /></div>
  if (!pack || !rally) return <div className="text-center py-16 text-white/30">Pack not found.</div>

  const fi = rally.final_instructions_data || {}
  const stages = rally.regulations_data?.stages || []

  function fmt(d) {
    return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-white/25 bg-white/5 px-2 py-0.5 rounded-full">Read-only shared view</span>
      </div>
      <div className="mb-6">
        {rally.series && <p className="text-white/30 text-xs mb-1">{rally.series}</p>}
        <h1 className="text-xl font-semibold text-white">{rally.name}</h1>
        <p className="text-white/40 text-sm mt-0.5">{fmt(rally.date)}{rally.location && ` · ${rally.location}`}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={tab === t.id ? 'tab-btn-active' : 'tab-btn-inactive'}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'team' && <SharedTeam members={pack.team_members || []} />}
      {tab === 'schedule' && <SharedSchedule pack={pack} fi={fi} />}
      {tab === 'stages' && <SharedStages pack={pack} stages={stages} />}
      {tab === 'pre-event' && <SharedPreEvent fi={fi} rally={rally} />}
      {tab === 'fuel' && <SharedFuel rows={pack.fuel_schedule || []} />}
      {tab === 'recce' && <SharedRecce notes={pack.recce_notes || {}} stages={stages} />}
    </main>
  )
}

function SharedTeam({ members }) {
  if (!members.length) return <p className="text-white/30 text-sm">No team members added yet.</p>
  return (
    <div className="space-y-2">
      {members.map((m, i) => (
        <div key={i} className="bg-rl-card border border-white/10 rounded-xl px-4 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><p className="text-white font-medium text-sm">{m.name || '—'}</p></div>
          <div><p className="text-white/50 text-sm">{m.role || '—'}</p></div>
          <div><a href={`tel:${m.phone}`} className="text-rl-accent text-sm no-underline">{m.phone || '—'}</a></div>
          <div><p className="text-white/35 text-xs mt-0.5">{m.notes}</p></div>
        </div>
      ))}
    </div>
  )
}

function SharedSchedule({ pack, fi }) {
  const schedule = fi?.schedule || []
  return (
    <div className="space-y-5">
      {schedule.length > 0 && (
        <div className="bg-rl-card border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {schedule.map((item, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-white/35 text-xs w-20">{item.day}</td>
                  <td className="px-4 py-3 text-rl-accent font-mono text-xs w-20">{item.time}</td>
                  <td className="px-4 py-3 text-white text-sm">{item.event}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pack.schedule_notes && (
        <div className="bg-rl-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Team notes</p>
          <pre className="text-white/70 text-sm whitespace-pre-wrap font-sans">{pack.schedule_notes}</pre>
        </div>
      )}
    </div>
  )
}

function SharedStages({ pack, stages }) {
  const notes = pack.stage_notes || {}
  if (!stages.length) return <p className="text-white/30 text-sm">No stage info yet.</p>
  return (
    <div className="space-y-2">
      {stages.map(s => (
        <div key={s.number} className="bg-rl-card border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-rl-accent font-bold text-base w-10 text-center">SS{s.number}</span>
            <div><p className="text-white font-medium text-sm">{s.name}</p>{s.distance && <p className="text-white/30 text-xs">{s.distance}</p>}</div>
          </div>
          {notes[s.number] && <p className="text-white/60 text-sm bg-white/3 rounded-lg px-3 py-2 mt-1">{notes[s.number]}</p>}
        </div>
      ))}
    </div>
  )
}

function SharedPreEvent({ fi, rally }) {
  const noiseLimit = fi?.noiseLimit
  const signingOn = fi?.signingOn || []
  const scrutineering = fi?.scrutineering || []
  if (!fi || Object.keys(fi).length === 0) return <p className="text-white/30 text-sm">Pre-event information not yet available.</p>
  return (
    <div className="space-y-5">
      {noiseLimit && (
        <div className="bg-rl-card border border-rl-accent/25 rounded-xl p-5">
          <p className="text-rl-accent text-[11px] uppercase tracking-widest font-semibold mb-1">Noise limit</p>
          <p className="text-white text-3xl font-bold">{noiseLimit}</p>
        </div>
      )}
      {signingOn.length > 0 && (
        <div>
          <h3 className="text-white/50 text-xs uppercase tracking-wide mb-2">Signing on</h3>
          <div className="bg-rl-card border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm"><tbody className="divide-y divide-white/5">
              {signingOn.map((row, i) => <tr key={i}>
                <td className="px-4 py-2.5 text-white">{row.carRange || row.cars || '-'}</td>
                <td className="px-4 py-2.5 text-white/50">{row.location || '-'}</td>
                <td className="px-4 py-2.5 text-rl-accent font-mono">{row.time || '-'}</td>
              </tr>)}
            </tbody></table>
          </div>
        </div>
      )}
      {scrutineering.length > 0 && (
        <div>
          <h3 className="text-white/50 text-xs uppercase tracking-wide mb-2">Scrutineering</h3>
          <div className="bg-rl-card border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm"><tbody className="divide-y divide-white/5">
              {scrutineering.map((row, i) => <tr key={i}>
                <td className="px-4 py-2.5 text-white">{row.carRange || row.cars || '-'}</td>
                <td className="px-4 py-2.5 text-white/50">{row.location || '-'}</td>
                <td className="px-4 py-2.5 text-rl-accent font-mono">{row.time || '-'}</td>
              </tr>)}
            </tbody></table>
          </div>
        </div>
      )}
    </div>
  )
}

function SharedFuel({ rows }) {
  const total = rows.reduce((s, r) => s + (parseFloat(r.fuel) || 0), 0)
  if (!rows.length) return <p className="text-white/30 text-sm">No fuel schedule yet.</p>
  return (
    <div className="space-y-3">
      {total > 0 && <div className="bg-rl-accent/10 border border-rl-accent/25 rounded-xl px-4 py-3 flex justify-between"><span className="text-white/60 text-sm">Total</span><span className="text-rl-accent font-bold">{total.toFixed(1)}L</span></div>}
      <div className="bg-rl-card border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/8 bg-white/3">
            <th className="text-left px-3 py-2.5 text-white/30 text-xs font-medium">SS</th>
            <th className="text-left px-3 py-2.5 text-white/30 text-xs font-medium">Stage</th>
            <th className="text-left px-3 py-2.5 text-white/30 text-xs font-medium">Dist</th>
            <th className="text-left px-3 py-2.5 text-white/30 text-xs font-medium">Fuel</th>
            <th className="text-left px-3 py-2.5 text-white/30 text-xs font-medium hidden sm:table-cell">Notes</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r, i) => <tr key={i}>
              <td className="px-3 py-2.5 text-rl-accent font-bold">{r.stage}</td>
              <td className="px-3 py-2.5 text-white">{r.name}</td>
              <td className="px-3 py-2.5 text-white/40 text-xs">{r.distance}</td>
              <td className="px-3 py-2.5 text-white font-medium">{r.fuel ? `${r.fuel}L` : '—'}</td>
              <td className="px-3 py-2.5 text-white/35 text-xs hidden sm:table-cell">{r.notes}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SharedRecce({ notes, stages }) {
  if (!stages.length) {
    return notes.general ? <pre className="text-white/60 text-sm whitespace-pre-wrap font-sans">{notes.general}</pre> : <p className="text-white/30 text-sm">No recce notes yet.</p>
  }
  return (
    <div className="space-y-2">
      {stages.map(s => (
        <div key={s.number} className="bg-rl-card border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-rl-accent font-bold">SS{s.number}</span>
            <span className="text-white text-sm">{s.name}</span>
            {s.distance && <span className="text-white/30 text-xs">{s.distance}</span>}
          </div>
          {notes[s.number] ? <p className="text-white/60 text-sm">{notes[s.number]}</p> : <p className="text-white/20 text-xs italic">No notes</p>}
        </div>
      ))}
    </div>
  )
}
