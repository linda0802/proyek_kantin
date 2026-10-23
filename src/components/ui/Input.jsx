import { forwardRef } from 'react'

/**
 * Input — Komponen input teks dengan label dan validasi
 *
 * Props:
 *   label: string
 *   hint: string
 *   error: string
 *   required: boolean
 *   iconLeft: ReactNode
 *   iconRight: ReactNode
 *   ...rest: props input HTML
 */
export const Input = forwardRef(function Input(
  { label, hint, error, required, iconLeft, iconRight, className = '', id, ...rest },
  ref
) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="form-group">
      {label && (
        <label
          className={`form-label${required ? ' required' : ''}`}
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <div className={iconLeft || iconRight ? 'input-group' : undefined}>
        {iconLeft && (
          <span className="input-icon" aria-hidden="true">{iconLeft}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`form-input${error ? ' error' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          required={required}
          {...rest}
        />
        {iconRight && (
          <span className="input-icon-right" aria-hidden="true">{iconRight}</span>
        )}
      </div>
      {hint && !error && (
        <span className="form-hint" id={`${inputId}-hint`}>{hint}</span>
      )}
      {error && (
        <span className="form-error" id={`${inputId}-error`} role="alert">{error}</span>
      )}
    </div>
  )
})

/**
 * Select — Komponen dropdown select
 */
export const Select = forwardRef(function Select(
  { label, hint, error, required, className = '', id, children, ...rest },
  ref
) {
  const inputId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="form-group">
      {label && (
        <label
          className={`form-label${required ? ' required' : ''}`}
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={`form-select${error ? ' error' : ''} ${className}`}
        aria-invalid={!!error}
        required={required}
        {...rest}
      >
        {children}
      </select>
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  )
})

/**
 * Textarea — Komponen textarea
 */
export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, className = '', id, rows = 3, ...rest },
  ref
) {
  const inputId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="form-group">
      {label && (
        <label
          className={`form-label${required ? ' required' : ''}`}
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`form-textarea${error ? ' error' : ''} ${className}`}
        aria-invalid={!!error}
        required={required}
        {...rest}
      />
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  )
})

/**
 * SearchInput — Input search dengan icon
 */
export function SearchInput({ placeholder = 'Cari...', className = '', id = 'search-input', ...rest }) {
  return (
    <div className="input-group" style={{ position: 'relative' }}>
      <span
        className="input-icon"
        aria-hidden="true"
        style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-text-muted)' }}
      >
        🔍
      </span>
      <input
        id={id}
        type="search"
        className={`search-input ${className}`}
        placeholder={placeholder}
        {...rest}
      />
    </div>
  )
}
