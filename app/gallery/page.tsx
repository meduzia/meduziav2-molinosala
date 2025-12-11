'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  FolderOpen,
  Loader2,
  ArrowRight,
  Calendar,
  Sparkles,
  Images,
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description: string
  status: string
  createdAt: string
  outputsCount?: number
}

export default function GalleryIndexPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/v2/campaigns')
      const data = await res.json()
      if (data.success) {
        // Only show campaigns with outputs
        const withOutputs = (data.data || []).filter((c: Campaign) => c.outputsCount && c.outputsCount > 0)
        setCampaigns(withOutputs)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Logo Banner */}
      <div className="w-full">
        <div className="relative w-full py-12 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/15 to-violet-500/5" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Particle 1 */}
            <div className="absolute w-1 h-1 bg-violet-400/40 rounded-full animate-float-slow" style={{ left: '10%', top: '20%' }} />
            {/* Particle 2 */}
            <div className="absolute w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-float-medium" style={{ left: '20%', top: '60%' }} />
            {/* Particle 3 */}
            <div className="absolute w-1 h-1 bg-violet-300/50 rounded-full animate-float-fast" style={{ left: '30%', top: '30%' }} />
            {/* Particle 4 */}
            <div className="absolute w-2 h-2 bg-purple-500/20 rounded-full animate-float-slow" style={{ left: '40%', top: '70%' }} />
            {/* Particle 5 */}
            <div className="absolute w-1 h-1 bg-violet-400/40 rounded-full animate-float-medium" style={{ left: '50%', top: '15%' }} />
            {/* Particle 6 */}
            <div className="absolute w-1.5 h-1.5 bg-purple-300/35 rounded-full animate-float-fast" style={{ left: '60%', top: '50%' }} />
            {/* Particle 7 */}
            <div className="absolute w-1 h-1 bg-violet-500/30 rounded-full animate-float-slow" style={{ left: '70%', top: '25%' }} />
            {/* Particle 8 */}
            <div className="absolute w-2 h-2 bg-purple-400/25 rounded-full animate-float-medium" style={{ left: '80%', top: '65%' }} />
            {/* Particle 9 */}
            <div className="absolute w-1 h-1 bg-violet-300/45 rounded-full animate-float-fast" style={{ left: '85%', top: '35%' }} />
            {/* Particle 10 */}
            <div className="absolute w-1.5 h-1.5 bg-purple-500/30 rounded-full animate-float-slow" style={{ left: '15%', top: '45%' }} />
            {/* Particle 11 */}
            <div className="absolute w-1 h-1 bg-violet-400/35 rounded-full animate-float-medium" style={{ left: '25%', top: '80%' }} />
            {/* Particle 12 */}
            <div className="absolute w-1.5 h-1.5 bg-purple-300/40 rounded-full animate-float-fast" style={{ left: '75%', top: '75%' }} />
            {/* Particle 13 */}
            <div className="absolute w-1 h-1 bg-violet-500/25 rounded-full animate-float-slow" style={{ left: '90%', top: '20%' }} />
            {/* Particle 14 */}
            <div className="absolute w-2 h-2 bg-purple-400/20 rounded-full animate-float-medium" style={{ left: '5%', top: '75%' }} />
            {/* Particle 15 */}
            <div className="absolute w-1 h-1 bg-violet-300/50 rounded-full animate-float-fast" style={{ left: '95%', top: '55%' }} />
          </div>

          <div className="relative max-w-5xl mx-auto flex justify-center">
            <Image
              src="/assets/LOGO-PAX-16.png"
              alt="PAX Assistance"
              width={320}
              height={80}
              className="h-20 w-auto"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-6 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-white mb-4">
            Galería de Contenido
          </h1>
          <p className="text-lg text-slate-400 max-w-lg mx-auto">
            Revisa, aprueba y gestiona el contenido generado para tus campañas
          </p>
        </div>

        {/* Campaign List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-slate-500">Cargando campañas...</p>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
              <FolderOpen className="w-7 h-7 text-slate-600" />
            </div>
            <h3 className="text-lg font-light text-white mb-2">Sin contenido disponible</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              No hay campañas con contenido generado todavía.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/gallery/${campaign.id}`}
                className="block group"
              >
                <div className="relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-violet-500/40 transition-all duration-300">
                  <div className="flex items-center gap-6">
                    {/* Campaign Icon */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                      <Images className="w-8 h-8 text-emerald-400" />
                    </div>

                    {/* Campaign Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors mb-2">
                        {campaign.name}
                      </h3>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <Sparkles className="w-4 h-4" />
                          {campaign.outputsCount} contenido{campaign.outputsCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(campaign.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="flex-shrink-0 w-5 h-5 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
