/**
 * Card — Komponen card container
 *
 * Props:
 *   size: 'sm' | 'md' (default)
 *   hoverable: boolean
 *   className: string
 *   children: ReactNode
 */
export function Card({ size, hoverable = false, className = '', children, ...rest }) {
  const classes = [
    'card',
    size === 'sm' ? 'card-sm' : '',
    hoverable ? 'card-hover' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}

/**
 * StatCard — Kartu statistik untuk Dashboard
 *
 * Props:
 *   icon: string | ReactNode
 *   label: string
 *   value: string | number
 *   sub: string (opsional, keterangan kecil di bawah nilai)
 *   accentColor: string (opsional, override warna accent bar)
 *   iconBg: string (opsional, override warna background icon)
 */
export function StatCard({ icon, label, value, sub, accentColor, iconBg, className = '' }) {
  return (
    <div
      className={`stat-card ${className}`}
      style={accentColor ? { '--color-primary': accentColor } : undefined}
    >
      <div
        className="stat-card__icon"
        aria-hidden="true"
        style={iconBg ? { background: iconBg } : undefined}
      >
        {icon}
      </div>
      <div className="stat-card__content">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  )
}
