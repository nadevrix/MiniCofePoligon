'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'react-qr-code'
import { buildPaymentQR } from '@/lib/tokens'
import { Order } from '@/types'

const STATUS_UI = {
  pending:  { label: 'Esperando pago',           color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  paid:     { label: 'Pago confirmado',           color: 'text-green-400',  bg: 'bg-green-400/10'  },
  underpaid:{ label: 'Monto incorrecto (menor)',  color: 'text-orange-400', bg: 'bg-orange-400/10' },
  overpaid: { label: 'Pago recibido (excedente)', color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  expired:  { label: 'Orden expirada',            color: 'text-red-400',    bg: 'bg-red-400/10'    },
}

function useCountdown(expiresAt: string) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const calc = () => setSeconds(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)))
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [expiresAt])
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return { display: `${m}:${s}`, expired: seconds === 0 }
}

export default function PayPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}`)
    if (res.ok) setOrder(await res.json())
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    fetchOrder()
    // Polling cada 3s mientras la orden esté pending
    const interval = setInterval(() => {
      setOrder((prev) => {
        if (!prev || prev.status !== 'pending') return prev
        fetchOrder()
        return prev
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  const countdown = useCountdown(order?.expires_at ?? new Date().toISOString())

  async function copyAddress() {
    if (!order) return
    await navigator.clipboard.writeText(order.payment_address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Orden no encontrada</p>
      </main>
    )
  }

  const ui = STATUS_UI[order.status]
  const qrValue = buildPaymentQR(order.token, order.payment_address, order.amount)
  const isActive = order.status === 'pending'

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Pollar Pay</h1>
          <p className="text-gray-500 text-sm mt-0.5">#{order.order_number} — {order.description}</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
          {/* Status */}
          <div className={`${ui.bg} rounded-xl px-4 py-2.5 text-center`}>
            <p className={`${ui.color} font-semibold text-sm`}>{ui.label}</p>
            {order.status === 'underpaid' && order.amount_received && (
              <p className="text-gray-400 text-xs mt-0.5">
                Recibido: ${order.amount_received} — Esperado: ${order.amount}
              </p>
            )}
            {order.status === 'overpaid' && order.amount_received && (
              <p className="text-gray-400 text-xs mt-0.5">
                Recibido: ${order.amount_received} (excedente: ${(order.amount_received - order.amount).toFixed(6)})
              </p>
            )}
          </div>

          {/* Monto */}
          <div className="text-center">
            <p className="text-4xl font-bold text-white">
              ${Number(order.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-violet-400 font-medium">{order.token} · Polygon</p>
          </div>

          {/* QR */}
          {isActive && (
            <div className="bg-white rounded-xl p-4 flex items-center justify-center">
              <QRCode value={qrValue} size={200} />
            </div>
          )}

          {/* Address */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Dirección de pago</p>
            <button
              onClick={copyAddress}
              disabled={!isActive}
              className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg px-3 py-2 text-left transition-colors"
            >
              <p className="text-gray-300 text-xs font-mono break-all">{order.payment_address}</p>
              <p className="text-gray-500 text-xs mt-0.5">{copied ? 'Copiado!' : 'Toca para copiar'}</p>
            </button>
          </div>

          {/* Countdown */}
          {isActive && (
            <div className="text-center">
              <p className="text-xs text-gray-500">Expira en</p>
              <p className={`text-2xl font-mono font-bold ${countdown.expired ? 'text-red-400' : 'text-white'}`}>
                {countdown.display}
              </p>
            </div>
          )}

          {/* Payer wallet */}
          {order.payer_wallet && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Pagado desde</p>
              <p className="text-gray-400 text-xs font-mono break-all">{order.payer_wallet}</p>
            </div>
          )}
        </div>

        <p className="text-center mt-4">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Crear nueva orden
          </a>
        </p>
      </div>
    </main>
  )
}
