import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message); setLoading(false); return }
    navigate('/')
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Sign in</h1>
          <p className="text-white/40 text-sm">Use your RallyGo account credentials</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-rl-card border border-white/10 rounded-2xl p-6">
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="rl-input" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wide mb-1.5 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="rl-input" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="rl-btn-primary w-full justify-center disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
