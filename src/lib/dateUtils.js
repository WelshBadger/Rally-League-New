export function formatDistanceToNow(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateRange(start, end) {
  const s = new Date(start)
  const e = end ? new Date(end) : null
  const opts = { day: 'numeric', month: 'long', year: 'numeric' }
  if (!e) return s.toLocaleDateString('en-GB', opts)
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.toLocaleDateString('en-GB', opts)}`
  }
  return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', opts)}`
}
