import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  return (
    <nav className="border-b border-white/8 bg-rl-bg/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-7 h-7 rounded-lg bg-rl-accent flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="white" className="w-4 h-4">
              <path d="M8 1L2 4v5c0 3.5 2.5 5.8 6 7 3.5-1.2 6-3.5 6-7V4L8 1z"/>
            </svg>
          </div>
          <div>
            <span className="text-white font-semibold text-sm leading-none">Rally Logistics</span>
            <p className="text-white/30 text-[10px] leading-none mt-0.5">Team management</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-white/30 text-xs hidden sm:block">{user.email}</span>
              <button onClick={signOut} className="text-white/40 hover:text-white text-xs transition-colors">Sign out</button>
            </>
          ) : (
            <Link to="/login" className="rl-btn-primary text-xs px-3 py-1.5">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
