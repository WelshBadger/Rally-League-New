import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'team',      label: 'Team' },
  { id: 'schedule',  label: 'Schedule' },
  { id: 'stages',    label: 'Stages' },
  { id: 'pre-event', label: 'Pre-event' },
  { id: 'fuel',      label: 'Fuel' },
  { id: 'recce',     label: 'Recce' },
]

function fmt(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PackPage() {
  const { rallyId } = useParams()
  const { user } = useAuth()
  const [rally, setRally] = useState(null)
  const [pack, setPack] = useState(null)
  const [tab, setTab] = useState('team')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase.from('rallies').select('*').eq('id', rallyId).single(),
        supabase.from('logistics_packs').select('*').eq('rally_id', rallyId).eq('user_id', user.id).maybeSingle(),
      ])
      setRally(r)
      if (p) {
        setPack(p)
      } else {
        // Create pack seeded from rally data
        const stages = r?.regulations_data?.stages || []
        const newPack = {
          rally_id: rallyId,
          user_id: user.id,
          team_members: [],
          fuel_schedule: stages.map(s => ({ stage: s.number, name: s.name, distance: s.distance, fuel: '', notes: '' })),
          recce_notes: Object.fromEntries(stages.map(s => [s.number, ''])),
          stage_notes: Object.fromEntries(stages.map(s => [s.number, ''])),
          schedule_notes: '',
        }
        const { data: created } = await supabase.from('logistics_packs').insert(newPack).select().single()
        setPack(created)
      }
      setLoading(false)
    }
    load()
  }, [rallyId, user.id])

  const save = useCallback(async (updates) => {
    if (!pack?.id) return
    setSaving(true)
    const { data, error } = await supabase.from('logistics_packs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', pack.id)
      .select().single()
    if (error) { toast.error('Save failed'); setSaving(false); return }
    setPack(data)
    setSaving(false)
    toast.success('Saved')
  }, [pack?.id])

  function copyShareLink() {
    const url = `${window.location.origin}/shared/${pack.share_code}`
    setShareUrl(url)
    navigator.clipboard.writeText(url).then(() => toast.success('Share link copied!'))
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
      <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
      <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
    </div>
  )

  if (!rally) return <div className="text-center py-16 text-white/30">Rally not found.</div>

  const fi = rally.final_instructions_data || {}
  const regs = rally.regulations_data || {}
  const stages = regs.stages || []

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link to="/" className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 mb-4 no-underline transition-colors">
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" clipRule="evenodd" />
          </svg>
          All events
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            {rally.series && <p className="text-white/30 text-xs mb-1">{rally.series}</p>}
            <h1 className="text-xl font-semibold text-white">{rally.name}</h1>
            <p className="text-white/40 text-sm mt-0.5">{fmt(rally.date)}{rally.end_date && rally.end_date !== rally.date ? ` – ${fmt(rally.end_date)}` : ''}{rally.location && ` · ${rally.location}`}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {saving && <span className="text-white/25 text-xs">Saving…</span>}
            <button onClick={copyShareLink} className="rl-btn-ghost text-xs gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.5 1a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM4.5 6a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm7 5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-6.5.25l5.75-2.75M5.25 6.75L11 4" />
                <path fillRule="evenodd" d="M11.5 2.5a1 1 0 100 2 1 1 0 000-2zM4.5 7a1 1 0 100 2 1 1 0 000-2zm7 5a1 1 0 100 2 1 1 0 000-2z" />
              </svg>
              Share with team
            </button>
          </div>
        </div>
        {shareUrl && (
          <div className="mt-3 bg-rl-accent/10 border border-rl-accent/25 rounded-lg px-3 py-2.5 flex items-center gap-2">
            <span className="text-rl-accent text-xs flex-1 truncate">{shareUrl}</span>
            <button onClick={() => setShareUrl(null)} className="text-white/30 hover:text-white text-xs">✕</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={tab === t.id ? 'tab-btn-active' : 'tab-btn-inactive'}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'team'      && <TeamTab pack={pack} onSave={save} />}
      {tab === 'schedule'  && <ScheduleTab pack={pack} rally={rally} fi={fi} onSave={save} />}
      {tab === 'stages'    && <StagesTab pack={pack} stages={stages} onSave={save} />}
      {tab === 'pre-event' && <PreEventTab fi={fi} rally={rally} />}
      {tab === 'fuel'      && <FuelTab pack={pack} stages={stages} onSave={save} />}
      {tab === 'recce'     && <RecceTab pack={pack} stages={stages} onSave={save} />}
    </main>
  )
}

// ─── Team Tab ───────────────────────────────────────────────────────────────

function TeamTab({ pack, onSave }) {
  const [members, setMembers] = useState(pack?.team_members || [])
  const [dirty, setDirty] = useState(false)

  function addMember() {
    setMembers(m => [...m, { name: '', role: '', phone: '', notes: '' }])
    setDirty(true)
  }

  function update(i, field, val) {
    setMembers(m => m.map((x, idx) => idx === i ? { ...x, [field]: val } : x))
    setDirty(true)
  }

  function remove(i) {
    setMembers(m => m.filter((_, idx) => idx !== i))
    setDirty(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-medium">Team members</h2>
          <p className="text-white/35 text-xs mt-0.5">Names, roles and contact numbers for your whole team</p>
        </div>
        <button onClick={addMember} className="rl-btn-primary text-xs">+ Add member</button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12 bg-rl-card border border-white/8 rounded-xl">
          <p className="text-white/30 text-sm mb-3">No team members yet</p>
          <button onClick={addMember} className="rl-btn-ghost text-xs">Add first member</button>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={i} className="bg-rl-card border border-white/10 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-white/35 text-[10px] uppercase tracking-wide mb-1 block">Name</label>
                  <input value={m.name} onChange={e => update(i, 'name', e.target.value)}
                    placeholder="Full name" className="rl-input text-sm" />
                </div>
                <div>
                  <label className="text-white/35 text-[10px] uppercase tracking-wide mb-1 block">Role</label>
                  <input value={m.role} onChange={e => update(i, 'role', e.target.value)}
                    placeholder="e.g. Lead mechanic" className="rl-input text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/35 text-[10px] uppercase tracking-wide mb-1 block">Phone</label>
                  <input value={m.phone} onChange={e => update(i, 'phone', e.target.value)}
                    placeholder="+44 7700 900000" className="rl-input text-sm" type="tel" />
                </div>
                <div>
                  <label className="text-white/35 text-[10px] uppercase tracking-wide mb-1 block">Notes</label>
                  <input value={m.notes} onChange={e => update(i, 'notes', e.target.value)}
                    placeholder="e.g. Arrives Friday evening" className="rl-input text-sm" />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={() => remove(i)} className="text-red-400/50 hover:text-red-400 text-xs transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dirty && (
        <button onClick={() => { onSave({ team_members: members }); setDirty(false) }}
          className="rl-btn-primary w-full justify-center">
          Save team
        </button>
      )}
    </div>
  )
}

// ─── Schedule Tab ────────────────────────────────────────────────────────────

function ScheduleTab({ pack, fi, onSave }) {
  const [notes, setNotes] = useState(pack?.schedule_notes || '')
  const [dirty, setDirty] = useState(false)
  const schedule = fi?.schedule || []
  const signingOn = fi?.signingOn || []
  const scrutineering = fi?.scrutineering || []

  return (
    <div className="space-y-6">
      {/* Official schedule from Final Instructions */}
      {schedule.length > 0 && (
        <div>
          <h2 className="text-white font-medium mb-3">Official schedule <span className="text-white/25 text-xs font-normal ml-1">from Final Instructions</span></h2>
          <div className="bg-rl-card border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/5">
                {schedule.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-white/35 text-xs whitespace-nowrap w-24">{item.day}</td>
                    <td className="px-4 py-3 text-rl-accent font-mono text-xs whitespace-nowrap w-20">{item.time}</td>
                    <td className="px-4 py-3 text-white text-sm">{item.event}</td>
                    {item.location && <td className="px-4 py-3 text-white/35 text-xs hidden sm:table-cell">{item.location}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Signing on */}
      {signingOn.length > 0 && (
        <div>
          <h3 className="text-white/60 text-sm font-medium mb-2">Signing on</h3>
          <div className="bg-rl-card border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/8">
                <th className="text-left px-4 py-2.5 text-white/30 text-xs font-medium">Car range</th>
                <th className="text-left px-4 py-2.5 text-white/30 text-xs font-medium">Location</th>
                <th className="text-left px-4 py-2.5 text-white/30 text-xs font-medium">Time</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {signingOn.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-white text-sm">{row.carRange || row.cars || '-'}</td>
                    <td className="px-4 py-2.5 text-white/60 text-sm">{row.location || '-'}</td>
                    <td className="px-4 py-2.5 text-rl-accent font-mono text-xs">{row.time || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team notes */}
      <div>
        <h2 className="text-white font-medium mb-2">Team schedule notes</h2>
        <p className="text-white/35 text-xs mb-3">Add your own timings, reminders and logistics notes here</p>
        <textarea value={notes} onChange={e => { setNotes(e.target.value); setDirty(true) }}
          rows={8} placeholder="e.g.&#10;Friday&#10;14:00 – Load van at service park&#10;16:00 – All crew arrive&#10;18:00 – Signing on (car 3)&#10;&#10;Saturday&#10;06:00 – Tyres fitted&#10;07:30 – Parc ferme opens"
          className="rl-textarea" />
        {dirty && (
          <button onClick={() => { onSave({ schedule_notes: notes }); setDirty(false) }}
            className="rl-btn-primary mt-3">Save notes</button>
        )}
      </div>
    </div>
  )
}

// ─── Stages Tab ──────────────────────────────────────────────────────────────

function StagesTab({ pack, stages, onSave }) {
  const [stageNotes, setStageNotes] = useState(pack?.stage_notes || {})
  const [dirty, setDirty] = useState(false)

  function update(num, val) {
    setStageNotes(n => ({ ...n, [num]: val }))
    setDirty(true)
  }

  if (stages.length === 0) {
    return <div className="text-center py-16 text-white/30 text-sm">Stage information will appear here once the organiser uploads the regulations.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-medium">Stage notes</h2>
          <p className="text-white/35 text-xs mt-0.5">Stage info from regulations — add your own crew notes per stage</p>
        </div>
        {dirty && (
          <button onClick={() => { onSave({ stage_notes: stageNotes }); setDirty(false) }}
            className="rl-btn-primary text-xs">Save notes</button>
        )}
      </div>
      <div className="space-y-2">
        {stages.map(s => (
          <div key={s.number} className="bg-rl-card border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-rl-accent font-bold text-lg w-10 text-center">SS{s.number}</span>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{s.name}</p>
                {s.distance && <p className="text-white/35 text-xs">{s.distance}</p>}
              </div>
            </div>
            <textarea value={stageNotes[s.number] || ''} onChange={e => update(s.number, e.target.value)}
              placeholder="Crew notes, hazards, tyre strategy…"
              rows={2} className="rl-textarea text-xs" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Pre-Event Tab ───────────────────────────────────────────────────────────

function PreEventTab({ fi, rally }) {
  const noiseLimit = fi?.noiseLimit
  const signingOn = fi?.signingOn || []
  const scrutineering = fi?.scrutineering || []
  const serviceArea = fi?.serviceArea || rally?.regulations_data?.serviceArea
  const importantNotes = fi?.importantNotes || []

  if (!fi || Object.keys(fi).length === 0) {
    return (
      <div className="text-center py-16 bg-rl-card border border-white/8 rounded-xl">
        <p className="text-white/30 text-sm">Pre-event information will appear here once the organiser uploads the Final Instructions on RallyGo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Noise limit */}
      {noiseLimit && (
        <div className="bg-rl-card border border-rl-accent/25 rounded-xl p-5">
          <p className="text-rl-accent text-[11px] uppercase tracking-widest font-semibold mb-1">Noise limit</p>
          <p className="text-white text-3xl font-bold">{noiseLimit}</p>
        </div>
      )}

      {/* Service area */}
      {serviceArea && (
        <InfoRow label="Service area" value={serviceArea} />
      )}

      {/* Signing on */}
      {signingOn.length > 0 && (
        <div>
          <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3">Signing on</h3>
          <div className="bg-rl-card border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/8 bg-white/3">
                <th className="text-left px-4 py-2.5 text-white/30 text-xs font-medium">Cars</th>
                <th className="text-left px-4 py-2.5 text-white/30 text-xs font-medium">Location</th>
                <th className="text-left px-4 py-2.5 text-white/30 text-xs font-medium">Time</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {signingOn.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-white text-sm">{row.carRange || row.cars || row.competitors || '-'}</td>
                    <td className="px-4 py-2.5 text-white/60 text-sm">{row.location || '-'}</td>
                    <td className="px-4 py-2.5 text-rl-accent font-mono text-sm font-medium">{row.time || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scrutineering */}
      {scrutineering.length > 0 && (
        <div>
          <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3">Scrutineering</h3>
          <div className="bg-rl-card border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/8 bg-white/3">
                <th className="text-left px-4 py-2.5 text-white/30 text-xs font-medium">Cars</th>
                <th className="text-left px-4 py-2.5 text-white/30 text-xs font-medium">Location</th>
                <th className="text-left px-4 py-2.5 text-white/30 text-xs font-medium">Time</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {scrutineering.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-white text-sm">{row.carRange || row.cars || row.competitors || '-'}</td>
                    <td className="px-4 py-2.5 text-white/60 text-sm">{row.location || '-'}</td>
                    <td className="px-4 py-2.5 text-rl-accent font-mono text-sm font-medium">{row.time || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Important notes */}
      {importantNotes.length > 0 && (
        <div>
          <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3">Important notes</h3>
          <ul className="space-y-2">
            {importantNotes.map((note, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/70 bg-rl-card border border-white/8 rounded-lg px-4 py-3">
                <span className="text-rl-accent mt-0.5 flex-shrink-0">→</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Fuel Tab ────────────────────────────────────────────────────────────────

function FuelTab({ pack, stages, onSave }) {
  const [rows, setRows] = useState(() => {
    if (pack?.fuel_schedule?.length) return pack.fuel_schedule
    return stages.map(s => ({ stage: s.number, name: s.name, distance: s.distance || '', fuel: '', notes: '' }))
  })
  const [dirty, setDirty] = useState(false)

  function update(i, field, val) {
    setRows(r => r.map((x, idx) => idx === i ? { ...x, [field]: val } : x))
    setDirty(true)
  }

  function addRow() {
    setRows(r => [...r, { stage: '', name: 'Service / transit', distance: '', fuel: '', notes: '' }])
    setDirty(true)
  }

  const totalFuel = rows.reduce((sum, r) => sum + (parseFloat(r.fuel) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-medium">Fuel schedule</h2>
          <p className="text-white/35 text-xs mt-0.5">Plan fuel requirements per stage or service</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addRow} className="rl-btn-ghost text-xs">+ Add row</button>
          {dirty && (
            <button onClick={() => { onSave({ fuel_schedule: rows }); setDirty(false) }}
              className="rl-btn-primary text-xs">Save</button>
          )}
        </div>
      </div>

      {totalFuel > 0 && (
        <div className="bg-rl-accent/10 border border-rl-accent/25 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-white/60 text-sm">Total fuel requirement</span>
          <span className="text-rl-accent font-bold text-lg">{totalFuel.toFixed(1)}L</span>
        </div>
      )}

      <div className="bg-rl-card border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="text-left px-3 py-2.5 text-white/30 text-xs font-medium">SS</th>
              <th className="text-left px-3 py-2.5 text-white/30 text-xs font-medium">Stage</th>
              <th className="text-left px-3 py-2.5 text-white/30 text-xs font-medium">Dist</th>
              <th className="text-left px-3 py-2.5 text-white/30 text-xs font-medium">Fuel (L)</th>
              <th className="text-left px-3 py-2.5 text-white/30 text-xs font-medium hidden sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2 w-12">
                  <input value={r.stage} onChange={e => update(i, 'stage', e.target.value)}
                    className="w-10 bg-transparent text-rl-accent font-bold text-sm outline-none" />
                </td>
                <td className="px-3 py-2">
                  <input value={r.name} onChange={e => update(i, 'name', e.target.value)}
                    className="w-full bg-transparent text-white text-sm outline-none placeholder-white/20" placeholder="Stage name" />
                </td>
                <td className="px-3 py-2 w-20">
                  <input value={r.distance} onChange={e => update(i, 'distance', e.target.value)}
                    className="w-16 bg-transparent text-white/50 text-xs outline-none" placeholder="km" />
                </td>
                <td className="px-3 py-2 w-20">
                  <input type="number" value={r.fuel} onChange={e => update(i, 'fuel', e.target.value)}
                    className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm outline-none focus:border-rl-accent/50" placeholder="0" min="0" step="0.5" />
                </td>
                <td className="px-3 py-2 hidden sm:table-cell">
                  <input value={r.notes} onChange={e => update(i, 'notes', e.target.value)}
                    className="w-full bg-transparent text-white/40 text-xs outline-none" placeholder="Notes" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Recce Tab ───────────────────────────────────────────────────────────────

function RecceTab({ pack, stages, onSave }) {
  const [notes, setNotes] = useState(pack?.recce_notes || {})
  const [dirty, setDirty] = useState(false)

  function update(num, val) {
    setNotes(n => ({ ...n, [num]: val }))
    setDirty(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-medium">Recce notes</h2>
          <p className="text-white/35 text-xs mt-0.5">Per-stage notes from reconnaissance — visible to the whole team</p>
        </div>
        {dirty && (
          <button onClick={() => { onSave({ recce_notes: notes }); setDirty(false) }}
            className="rl-btn-primary text-xs">Save notes</button>
        )}
      </div>

      {stages.length === 0 ? (
        <div>
          {/* No stages from regs — show a general notepad */}
          <textarea value={notes.general || ''} onChange={e => { update('general', e.target.value) }}
            placeholder="General recce notes…"
            rows={12} className="rl-textarea" />
        </div>
      ) : (
        <div className="space-y-2">
          {stages.map(s => (
            <div key={s.number} className="bg-rl-card border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-rl-accent font-bold text-base w-10 text-center">SS{s.number}</span>
                <div>
                  <p className="text-white font-medium text-sm">{s.name}</p>
                  {s.distance && <p className="text-white/30 text-xs">{s.distance}</p>}
                </div>
              </div>
              <textarea value={notes[s.number] || ''} onChange={e => update(s.number, e.target.value)}
                placeholder="Hazards, cuts, surface changes, notes for pacenotes…"
                rows={3} className="rl-textarea text-xs" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="bg-rl-card border border-white/10 rounded-xl px-4 py-3.5 flex items-start gap-3">
      <p className="text-white/35 text-xs uppercase tracking-wide mt-0.5 w-28 flex-shrink-0">{label}</p>
      <p className="text-white text-sm">{value}</p>
    </div>
  )
}
