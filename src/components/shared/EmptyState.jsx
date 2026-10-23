/**
 * EmptyState — Tampilan saat data kosong
 *
 * Props:
 *   icon: string | ReactNode
 *   title: string
 *   description: string
 *   action: ReactNode (opsional, tombol CTA)
 */
export function EmptyState({ icon = '📭', title = 'Tidak ada data', description, action }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      {description && (
        <p className="empty-state__desc">{description}</p>
      )}
      {action}
    </div>
  )
}

/**
 * Skeleton — Placeholder loading
 *
 * Props:
 *   variant: 'text' | 'title' | 'avatar' | 'rect'
 *   width: string (CSS)
 *   height: string (CSS)
 *   count: number (jumlah baris skeleton)
 */
export function Skeleton({ variant = 'text', width, height, count = 1, className = '' }) {
  const variantClass = {
    text: 'skeleton skeleton-text',
    title: 'skeleton skeleton-title',
    avatar: 'skeleton skeleton-avatar',
    rect: 'skeleton',
  }[variant] || 'skeleton skeleton-text'

  const style = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${variantClass} ${className}`}
          style={style}
          aria-hidden="true"
        />
      ))}
    </>
  )
}

/**
 * SkeletonCard — Card placeholder untuk stat cards
 */
export function SkeletonCard() {
  return (
    <div className="stat-card" aria-hidden="true">
      <Skeleton variant="avatar" />
      <div className="stat-card__content">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="title" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  )
}
