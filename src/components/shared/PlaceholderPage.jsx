/**
 * PlaceholderPage — Digunakan untuk halaman yang belum diimplementasi
 * Akan diganti dengan implementasi asli di Phase berikutnya.
 */
export default function PlaceholderPage({ title, phase, icon = '🚧', description }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{title}</h2>
          {description && <p className="page-subtitle">{description}</p>}
        </div>
      </div>
      <div
        style={{
          background: 'var(--color-primary-subtle)',
          border: '2px dashed var(--color-border-strong)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-12)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>{icon}</div>
        <p style={{
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-lg)',
          marginBottom: 'var(--space-2)',
        }}>
          {title}
        </p>
        {phase && (
          <p style={{ fontSize: 'var(--font-size-sm)' }}>
            Akan diimplementasi pada <strong style={{ color: 'var(--color-primary)' }}>{phase}</strong>
          </p>
        )}
      </div>
    </div>
  )
}
