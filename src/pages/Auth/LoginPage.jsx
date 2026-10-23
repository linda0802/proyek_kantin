import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Input } from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const { login, loading } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const validate = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Username tidak boleh kosong.'
    if (!form.password) errs.password = 'Password tidak boleh kosong.'
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    try {
      await login(form)
      addToast({ type: 'success', title: 'Selamat datang!', message: 'Login berhasil.' })
      navigate('/')
    } catch (err) {
      setErrors({ general: err.message })
    }
  }

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo" aria-hidden="true">🍽️</div>
          <h1 className="login-title">KantinKu</h1>
          <p className="login-subtitle">Sistem Informasi Kantin</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate aria-label="Form login">
          {errors.general && (
            <div className="login-error" role="alert" id="login-error-msg">
              ⚠️ {errors.general}
            </div>
          )}

          <Input
            label="Username"
            name="username"
            id="login-username"
            type="text"
            placeholder="Masukkan username"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            required
            autoComplete="username"
            autoFocus
          />

          <div style={{ marginTop: 'var(--space-4)' }}>
            <Input
              label="Password"
              name="password"
              id="login-password"
              type="password"
              placeholder="Masukkan password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            variant="primary"
            fullWidth
            loading={loading}
            id="login-submit-btn"
            type="submit"
            size="lg"
            style={{ marginTop: 'var(--space-6)' }}
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </Button>
        </form>

        {/* Demo hint */}
        <div className="login-demo">
          <p>Demo: <strong>admin</strong> / <strong>admin123</strong></p>
          <p>Kasir: <strong>kasir</strong> / <strong>kasir123</strong></p>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
        }
        .login-card {
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          padding: var(--space-8);
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
          animation: slideUp var(--transition-slow) cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .login-brand {
          text-align: center;
          margin-bottom: var(--space-8);
        }
        .login-logo {
          font-size: 3rem;
          margin-bottom: var(--space-3);
          display: block;
          filter: drop-shadow(0 4px 8px rgba(22, 163, 74, 0.3));
        }
        .login-title {
          font-family: 'Plus Jakarta Sans', var(--font-family);
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-extrabold);
          color: var(--color-text-primary);
          letter-spacing: -0.03em;
          margin-bottom: var(--space-1);
        }
        .login-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }
        .login-error {
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border: 1px solid var(--color-danger);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          font-size: var(--font-size-sm);
          margin-bottom: var(--space-4);
        }
        .login-demo {
          margin-top: var(--space-6);
          padding: var(--space-3) var(--space-4);
          background: var(--color-primary-subtle);
          border-radius: var(--radius-md);
          border: 1px dashed var(--color-border-strong);
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
        }
        .login-demo strong { color: var(--color-primary); }
      `}</style>
    </div>
  )
}
