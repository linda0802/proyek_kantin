import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

/**
 * ToastContext — Sistem notifikasi toast
 */
const ToastContext = createContext(null)

const TOAST_ICONS = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
}

let toastIdCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { id, type, title, message }])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container" role="region" aria-label="Notifikasi" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role="alert"
          id={`toast-${toast.id}`}
        >
          <span className="toast__icon" aria-hidden="true">
            {TOAST_ICONS[toast.type] || 'ℹ️'}
          </span>
          <div className="toast__content">
            {toast.title && <div className="toast__title">{toast.title}</div>}
            {toast.message && <div className="toast__message">{toast.message}</div>}
          </div>
          <button
            className="toast__close"
            onClick={() => onRemove(toast.id)}
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus digunakan di dalam ToastProvider')
  return ctx
}
