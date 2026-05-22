'use client'

import { useEffect, useState } from 'react'
import { Order, OrderStatus } from '@/types'

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:  'text-yellow-400 bg-yellow-400/10',
  paid:     'text-green-400  bg-green-400/10',
  underpaid:'text-orange-400 bg-orange-400/10',
  overpaid: 'text-blue-400   bg-blue-400/10',
  expired:  'text-gray-500   bg-gray-500/10',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:  'Pendiente',
  paid:     'Pagado',
  underpaid:'Monto menor',
  overpaid: 'Excedente',
  expired:  'Expirada',
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/orders')
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  const recaudado = orders
    .filter(o => o.status === 'paid' || o.status === 'overpaid')
    .reduce((acc, o) => acc + Number(o.amount_received ?? o.amount), 0)

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-0.5">Todas las órdenes</p>
          </div>
          <a href="/" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Nueva orden
          </a>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs">Total órdenes</p>
            <p className="text-white text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs">Pagadas</p>
            <p className="text-green-400 text-2xl font-bold">
              {orders.filter(o => o.status === 'paid' || o.status === 'overpaid').length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs">Recaudado</p>
            <p className="text-white text-2xl font-bold">
              ${recaudado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Cargando...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No hay órdenes aún.</p>
        ) : (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs text-gray-500 px-4 py-3">#</th>
                  <th className="text-left text-xs text-gray-500 px-4 py-3">Descripción</th>
                  <th className="text-left text-xs text-gray-500 px-4 py-3">Monto</th>
                  <th className="text-left text-xs text-gray-500 px-4 py-3">Estado</th>
                  <th className="text-left text-xs text-gray-500 px-4 py-3">Fecha</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-500 text-sm">{order.order_number}</td>
                    <td className="px-4 py-3 text-gray-200 text-sm">{order.description}</td>
                    <td className="px-4 py-3 text-white text-sm font-medium">
                      ${Number(order.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {order.token}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/pay/${order.id}`} className="text-violet-400 hover:text-violet-300 text-xs transition-colors">
                        Ver
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
