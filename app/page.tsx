'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Project } from '@/types'

function CreateOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialProjectId = searchParams.get('project_id') || ''

  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  const [form, setForm] = useState({
    project_id: initialProjectId,
    description: '',
    amount: '',
    token: 'USDC',
    payment_limit_minutes: '15',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          setProjects(data)
          if (data.length > 0 && !form.project_id) {
            setForm(prev => ({ ...prev, project_id: data[0].id }))
          }
        }
      } catch (err) {
        console.error('Error fetching projects', err)
      } finally {
        setLoadingProjects(false)
      }
    }
    fetchProjects()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.project_id) {
      setError('Debes seleccionar un proyecto.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: form.project_id,
          description: form.description,
          amount: parseFloat(form.amount),
          token: form.token,
          payment_limit_minutes: parseInt(form.payment_limit_minutes),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Handle 409 and other errors
        setError(data.error ?? 'Error al crear la orden')
        setLoading(false)
        return
      }

      router.push(`/pay/${data.id}`)
    } catch (err) {
      setError('Error de conexión con el servidor.')
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-3xl p-8 space-y-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Proyecto
          </label>
          <select
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            disabled={loadingProjects}
            className="premium-input appearance-none bg-black/60"
            required
          >
            {loadingProjects ? (
              <option value="">Cargando proyectos...</option>
            ) : projects.length === 0 ? (
              <option value="">No hay proyectos disponibles</option>
            ) : (
              <>
                <option value="" disabled>Selecciona un proyecto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </>
            )}
          </select>
          {projects.length === 0 && !loadingProjects && (
            <p className="text-xs text-yellow-500 mt-2">
              Necesitas <Link href="/projects/new" className="underline">crear un proyecto</Link> antes de generar una orden.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descripción de la orden
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Servicio de diseño web"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="premium-input"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monto a cobrar
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-400 font-medium">$</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="10.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="premium-input pl-8"
              />
            </div>
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token
            </label>
            <select
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
              className="premium-input appearance-none bg-black/60"
            >
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tiempo límite de pago
          </label>
          <select
            value={form.payment_limit_minutes}
            onChange={(e) => setForm({ ...form, payment_limit_minutes: e.target.value })}
            className="premium-input appearance-none bg-black/60"
          >
            <option value="10">10 minutos</option>
            <option value="15">15 minutos</option>
            <option value="30">30 minutos</option>
            <option value="60">1 hora</option>
          </select>
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
            disabled={loading || (projects.length === 0 && !loadingProjects)}
            className="premium-button premium-button-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando QR...
              </>
            ) : (
              'Generar Link de Pago'
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function CreateOrder() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 pb-20">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-3">Nueva Orden</h1>
          <p className="text-gray-400">Genera un pago en USDC o USDT sobre la red Polygon</p>
        </div>

        <Suspense fallback={
          <div className="glass-panel rounded-3xl p-8 h-[400px] flex items-center justify-center">
            <p className="text-gray-400">Cargando...</p>
          </div>
        }>
          <CreateOrderForm />
        </Suspense>

        <div className="mt-8 text-center flex items-center justify-center gap-6">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-violet-400 transition-colors font-medium">
            Ver órdenes
          </Link>
          <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
          <Link href="/projects" className="text-sm text-gray-500 hover:text-violet-400 transition-colors font-medium">
            Ver proyectos
          </Link>
        </div>
      </div>
    </div>
  )
}
