'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    merchant_wallet: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        // Backend returns 400 { error: 'Wallet address inválida' } if the regex fails
        setError(data.error ?? 'Error al crear el proyecto')
        setLoading(false)
        return
      }

      router.push('/projects')
    } catch (err: any) {
      setError('Ocurrió un error inesperado al conectar con el servidor.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-900/30 border border-violet-500/30 mb-4 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Nuevo Proyecto</h1>
          <p className="text-gray-400 mt-2">Configura tu billetera para recibir pagos web3</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-3xl p-8 space-y-6 relative overflow-hidden"
        >
          {/* Subtle glow effect behind the form */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-600/20 rounded-full blur-[60px] pointer-events-none"></div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Mi Tienda Online"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="premium-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet de Cobro (Merchant Wallet)
            </label>
            <input
              type="text"
              required
              placeholder="0x..."
              value={form.merchant_wallet}
              onChange={(e) => setForm({ ...form, merchant_wallet: e.target.value })}
              className="premium-input font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Esta es la billetera a la que se enviarán todos los fondos recaudados en este proyecto.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="premium-button premium-button-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : (
                'Crear Proyecto'
              )}
            </button>
          </div>
        </form>

        <p className="text-center mt-6">
          <Link href="/projects" className="text-gray-500 hover:text-white text-sm transition-colors">
            ← Volver a proyectos
          </Link>
        </p>
      </div>
    </div>
  )
}
