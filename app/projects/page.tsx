'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Project } from '@/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          setProjects(data)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  return (
    <div className="min-h-screen p-6 sm:p-12 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Proyectos</h1>
          <p className="text-gray-400 mt-2">Gestiona tus proyectos y billeteras de cobro</p>
        </div>
        <Link 
          href="/projects/new" 
          className="premium-button premium-button-primary px-6 py-2.5 text-center inline-block w-auto"
        >
          Nuevo Proyecto
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 h-40 animate-pulse bg-white/5"></div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-2xl mx-auto border-dashed border-white/20">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No hay proyectos</h3>
          <p className="text-gray-400 mb-6">Crea tu primer proyecto para empezar a recibir pagos web3.</p>
          <Link href="/projects/new" className="premium-button premium-button-primary px-6 py-2.5 inline-block w-auto">
            Crear Proyecto
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="glass-panel rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors">
                  {project.name}
                </h3>
                <span className="text-xs font-mono text-gray-500 bg-black/40 px-2 py-1 rounded-md">
                  ID: {project.id.slice(0, 8)}
                </span>
              </div>
              
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-1">Wallet destino</p>
                <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                  <p className="text-gray-300 text-xs font-mono truncate">
                    {project.merchant_wallet}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Link 
                  href={`/?project_id=${project.id}`}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2.5 rounded-lg text-center transition-colors border border-white/10 hover:border-violet-500/50"
                >
                  Cobrar
                </Link>
                <Link 
                  href={`/dashboard?project_id=${project.id}`}
                  className="flex-1 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-semibold py-2.5 rounded-lg text-center transition-colors border border-violet-500/30"
                >
                  Ver Órdenes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
