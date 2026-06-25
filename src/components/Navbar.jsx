import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, signOut, isOrganiser } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <nav className="bg-[#111] border-b border-white/8 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-13 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="w-2 h-2 rounded-full bg-rl-accent" />
          <span className="text-white font-medium text-base tracking-wide">RallyGo</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-white/50 hover:text-white text-sm transition-colors">Events</Link>
          {isOrganiser && (
            <Link to="/organiser" className="text-white/50 hover:text-white text-sm transition-colors">Dashboard</Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-xs">
                {profile?.full_name || user.email}
              </span>
              <button onClick={handleSignOut} className="rl-btn-ghost text-xs px-4 py-2">
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">Sign in</Link>
              <Link to="/register" className="rl-btn-primary text-xs px-4 py-2">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white/60 hover:text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {menuOpen
              ? <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#111] border-t border-white/8 px-4 py-3 flex flex-col gap-3">
          <Link to="/" className="text-white/60 hover:text-white text-sm py-1" onClick={() => setMenuOpen(false)}>Events</Link>
          {isOrganiser && (
            <Link to="/organiser" className="text-white/60 hover:text-white text-sm py-1" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          )}
          {user ? (
            <button onClick={handleSignOut} className="text-left text-white/60 hover:text-white text-sm py-1">Sign out</button>
          ) : (
            <>
              <Link to="/login" className="text-white/60 hover:text-white text-sm py-1" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link to="/register" className="text-rl-accent font-medium text-sm py-1" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
