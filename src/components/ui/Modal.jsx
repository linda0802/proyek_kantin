import { useEffect, useRef } from 'react'
import Button from './Button'

/**
 * Modal — Dialog modal dengan overlay
 *
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   title: string
 *   size: 'sm' | 'md' | 'lg' | 'xl'
 *   footer: ReactNode — konten footer (tombol-tombol)
 *   closeOnOverlay: boolean — tutup modal saat klik overlay (default: true)
 *   children: ReactNode
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  size,
  footer,
  closeOnOverlay = true,
  children,
  id,
}) {
  const modalRef = useRef(null)

  // Kunci scroll body saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Tutup dengan Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = e => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClass = size ? `modal-${size}` : ''

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={id ? `${id}-title` : 'modal-title'}
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        ref={modalRef}
        className={`modal ${sizeClass}`}
        onClick={e => e.stopPropagation()}
        id={id}
      >
        {/* Header */}
        <div className="modal-header">
          <h2
            className="modal-title"
            id={id ? `${id}-title` : 'modal-title'}
          >
            {title}
          </h2>
          <button
            className="btn btn-ghost btn-icon"
            id={id ? `${id}-close-btn` : 'modal-close-btn'}
            onClick={onClose}
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

/**
 * ConfirmDialog — Dialog konfirmasi tindakan berisiko
 *
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   onConfirm: () => void
 *   title: string
 *   message: string
 *   confirmLabel: string (default: 'Ya, Lanjutkan')
 *   confirmVariant: 'primary' | 'danger' (default: 'danger')
 *   loading: boolean
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message,
  confirmLabel = 'Ya, Lanjutkan',
  confirmVariant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      id="confirm-dialog"
      footer={
        <>
          <Button
            variant="secondary"
            id="confirm-dialog-cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant={confirmVariant}
            id="confirm-dialog-confirm-btn"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-relaxed)' }}>
        {message}
      </p>
    </Modal>
  )
}
