/**
 * Badge — Komponen label status
 *
 * Props:
 *   variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'
 *   dot: boolean — tampilkan dot indicator
 *   children: ReactNode
 */
export default function Badge({ variant = 'neutral', dot = false, children, className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  )
}
