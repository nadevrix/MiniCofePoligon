'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Order, OrderStatus, Project } from '@/types'

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  paid:     'text-green-400  bg-green-400/10 border-green-400/20',
  underpaid:'text-orange-400 bg-orange-400/10 border-orange-400/20',
  overpaid: 'text-blue-400   bg-blue-400/10 border-blue-400/20',
  expired:  'text-gray-400   bg-gray-500/10 border-gray-500/20',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:  'Pendiente',
  paid:     'Pagado',
  underpaid:'Monto menor',
  overpaid: 'Excedente',
  expired:  'Expirada',
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      // Load orders
      const url = projectId ? `/api/orders?project_id=${projectId}` : '/api/orders'
      const res = await fetch(url)
      if (res.ok) setOrders(await res.json())

      // If specific project, load its details
      if (projectId) {
        const pRes = await fetch('/api/projects')
        if (pRes.ok) {
          const projects: Project[] = await pRes.json()
          const p = projects.find(x => x.id === projectId)
          if (p) setProject(p)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [projectId])

  const recaudado = orders
    .filter(o => o.status === 'paid' || o.status === 'overpaid')
    .reduce((acc, o) => acc + Number(o.amount_received ?? o.amount), 0)

  return (
    <div className="max-w-6xl mx-auto w-full relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Dashboard {project && <span className="text-violet-400">— {project.name}</span>}
          </h1>
          <p className="text-gray-400 mt-2">
            {project ? 'Órdenes de este proyecto' : 'Todas las órdenes recientes'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/projects" className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-medium transition-colors border border-white/10 text-sm">
            Proyectos
          </Link>
          <Link href={projectId ? `/?project_id=${projectId}` : "/"} className="premium-button-primary px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center">
            Nueva orden
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-violet-600/20 rounded-full blur-[40px] group-hover:bg-violet-600/30 transition-all"></div>
          <p className="text-gray-400 text-sm font-medium mb-2">Total Órdenes</p>
          <p className="text-white text-4xl font-bold">{orders.length}</p>
        </div>
        
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] group-hover:bg-green-500/20 transition-all"></div>
          <p className="text-gray-400 text-sm font-medium mb-2">Pagadas exitosamente</p>
          <p className="text-green-400 text-4xl font-bold">
            {orders.filter(o => o.status === 'paid' || o.status === 'overpaid').length}
          </p>
        </div>
        
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group border-violet-500/20">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-fuchsia-600/20 rounded-full blur-[40px] group-hover:bg-fuchsia-600/30 transition-all"></div>
          <p className="text-violet-300 text-sm font-medium mb-2">Recaudado (USDC/USDT)</p>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 text-4xl font-bold">
            ${recaudado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-12 flex justify-center items-center">
           <svg className="animate-spin h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center border-dashed border-white/20">
          <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Sin órdenes</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">No hay órdenes registradas. Empieza a crear links de pago para ver tus transacciones aquí.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">Orden</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">Descripción</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">Monto</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">Estado</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-gray-400 font-mono text-sm group-hover:text-violet-400 transition-colors">
                        #{order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-200 text-sm font-medium">
                      {order.description}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">
                          ${Number(order.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-medium text-gray-500 bg-black/50 px-2 py-0.5 rounded-full border border-white/10">
                          {order.token}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                        {order.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5 animate-pulse"></span>}
                        {order.status === 'paid' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>}
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(order.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/pay/${order.id}`} 
                        className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors opacity-0 group-hover:opacity-100 bg-violet-500/10 px-3 py-1.5 rounded-lg"
                      >
                        Portal →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="min-h-screen p-6 sm:p-12">
      <Suspense fallback={<div className="text-center text-gray-400 mt-20">Cargando dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
