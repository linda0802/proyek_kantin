/**
 * Button — Komponen tombol KantinKu
 *
 * Props:
 *   variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 *   size: 'sm' | 'md' | 'lg' | 'xl'
 *   fullWidth: boolean
 *   icon: boolean (icon-only button)
 *   loading: boolean
 *   disabled: boolean
 *   children: ReactNode
 *   ...rest: props HTML button/anchor
 */
export default function Button({
  variant = 'primary',
  size,
  fullWidth = false,
  icon = false,
  loading = false,
  disabled = false,
  children,
  className = '',
  as: Tag = 'button',
  ...rest
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size ? `btn-${size}` : '',
    fullWidth ? 'btn-full' : '',
    icon ? 'btn-icon' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <Tag
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="btn-spinner" aria-hidden="true">⏳</span> : null}
      {children}
    </Tag>
  )
}
