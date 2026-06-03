import React, { useState } from 'react'
import { useSession } from '@presentation/hooks/useSession'
import { Button } from '@presentation/components/ui/Button'
import { Input } from '@presentation/components/ui/Input'

export function OpenShiftPage() {
  const { openShift, logout } = useSession()
  const [cash, setCash] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(cash)
    if (isNaN(amount) || amount < 0) {
      setError('Enter a valid opening cash amount')
      return
    }
    setLoading(true)
    try {
      await openShift(amount)
    } catch {
      setError('Failed to open shift. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="shift-card">
        <div className="shift-card__header">
          <span style={{ fontSize: '3rem' }}>🏪</span>
          <h2>Abrir turno de caja</h2>
          <p>Declara el efectivo inicial para empezar</p>
        </div>

        <form onSubmit={handleOpen} className="shift-form">
          <Input
            label="Efectivo inicial"
            type="number"
            min="0"
            step="0.01"
            value={cash}
            onChange={(e) => { setCash(e.target.value); setError('') }}
            placeholder="Ej. 200000"
            autoFocus
            required
          />

          {error && <p className="login-error" role="alert">❌ {error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!cash}
          >
            Abrir turno
          </Button>
        </form>

        <button className="pin-logout-link" onClick={logout}>
          Volver al login
        </button>
      </div>
    </div>
  )
}
