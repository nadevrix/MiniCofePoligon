'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateOrder() {
  const router = useRouter()
  const [form, setForm] = useState({
    description: '',
    amount: '',
    token: 'USDC',
    payment_limit_minutes: '15',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: form.description,
        amount: parseFloat(form.amount),
        token: form.token,
        payment_limit_minutes: parseInt(form.payment_limit_minutes),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Error al crear la orden')
      return
    }

    router.push(`/pay/${data.id}`)
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Pollar Pay</h1>
          <p className="text-gray-400 mt-1">Pagos en USDC y USDT sobre Polygon</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-2xl p-6 space-y-5 border border-gray-800"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descripción
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Orden #001 — Servicio de diseño"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Monto
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="10.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Token
              </label>
              <select
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-violet-500"
              >
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tiempo límite de pago
            </label>
            <select
              value={form.payment_limit_minutes}
              onChange={(e) => setForm({ ...form, payment_limit_minutes: e.target.value })}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-violet-500"
            >
              <option value="10">10 minutos</option>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Creando orden...' : 'Generar QR de pago'}
          </button>
        </form>

        <p className="text-center mt-4">
          <a href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Ver todas las órdenes
          </a>
        </p>
      </div>
    </main>
  )
}
