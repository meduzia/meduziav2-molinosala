'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  FolderOpen,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  Calendar,
  TrendingUp,
  Cpu,
  Layers,
  Wand2,
  Rocket,
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description: string
  status: string
  createdAt: string
  outputsCount?: number
}

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Brief',
    desc: 'Tu visión, nuestro punto de partida',
    icon: Layers,
  },
  {
    step: 2,
    title: 'Arquetipos',
    desc: 'Perfiles de audiencia estratégicos',
    icon: Cpu,
  },
  {
    step: 3,
    title: 'Ángulos',
    desc: 'Enfoques creativos únicos',
    icon: Wand2,
  },
  {
    step: 4,
    title: 'Prompts',
    desc: 'Instrucciones de alta precisión',
    icon: Sparkles,
  },
  {
    step: 5,
    title: 'Producción',
    desc: 'Generación de imágenes y videos',
    icon: Rocket,
  },
]

export default function StudioPage() {
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
        setCampaigns(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string; label: string; icon: typeof CheckCircle2 }> = {
      draft: { color: 'text-slate-400', bgColor: 'bg-slate-500/20', label: 'Borrador', icon: Layers },
      archetypes_generated: { color: 'text-violet-400', bgColor: 'bg-violet-500/20', label: 'Arquetipos', icon: Cpu },
      angles_generated: { color: 'text-violet-400', bgColor: 'bg-violet-500/20', label: 'Ángulos', icon: Wand2 },
      prompts_generated: { color: 'text-violet-400', bgColor: 'bg-violet-500/20', label: 'Prompts', icon: Sparkles },
      producing: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'Produciendo', icon: Loader2 },
      completed: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: 'Completado', icon: CheckCircle2 },
    }
    return configs[status] || configs.draft
  }

  const getProgressPercentage = (status: string, outputsCount?: number) => {
    if (outputsCount && outputsCount > 0) {
      return 100
    }
    const progress: Record<string, number> = {
      draft: 10,
      archetypes_generated: 30,
      angles_generated: 50,
      prompts_generated: 70,
      producing: 85,
      completed: 100,
    }
    return progress[status] || 10
  }

  const hasOutputs = (outputsCount?: number) => outputsCount && outputsCount > 0

  return (
    <div className="min-h-screen bg-slate-950">
      {/* CSS for animations - 12s total cycle */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .float-animation { animation: float 6s ease-in-out infinite; }
        .float-animation-delayed-1 { animation: float 6s ease-in-out infinite 1s; }
        .float-animation-delayed-2 { animation: float 6s ease-in-out infinite 2s; }
        .float-animation-delayed-3 { animation: float 6s ease-in-out infinite 3s; }
        .float-animation-delayed-4 { animation: float 6s ease-in-out infinite 4s; }

        /* Sequential soft glow - 5s total cycle, very smooth fade in/out */
        @keyframes glow-1 {
          0%, 2% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); border-color: rgba(51, 65, 85, 0.5); }
          8% { box-shadow: 0 0 18px 4px rgba(167, 139, 250, 0.35); border-color: rgba(167, 139, 250, 0.4); }
          16%, 100% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); border-color: rgba(51, 65, 85, 0.5); }
        }
        @keyframes glow-2 {
          0%, 18% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); border-color: rgba(51, 65, 85, 0.5); }
          26% { box-shadow: 0 0 18px 4px rgba(167, 139, 250, 0.35); border-color: rgba(167, 139, 250, 0.4); }
          34%, 100% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); border-color: rgba(51, 65, 85, 0.5); }
        }
        @keyframes glow-3 {
          0%, 36% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); border-color: rgba(51, 65, 85, 0.5); }
          44% { box-shadow: 0 0 18px 4px rgba(167, 139, 250, 0.35); border-color: rgba(167, 139, 250, 0.4); }
          52%, 100% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); border-color: rgba(51, 65, 85, 0.5); }
        }
        @keyframes glow-4 {
          0%, 54% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); border-color: rgba(51, 65, 85, 0.5); }
          62% { box-shadow: 0 0 18px 4px rgba(167, 139, 250, 0.35); border-color: rgba(167, 139, 250, 0.4); }
          70%, 100% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); border-color: rgba(51, 65, 85, 0.5); }
        }
        @keyframes glow-5 {
          0%, 72% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); border-color: rgba(51, 65, 85, 0.5); }
          80% { box-shadow: 0 0 18px 4px rgba(167, 139, 250, 0.35); border-color: rgba(167, 139, 250, 0.4); }
          88%, 100% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); border-color: rgba(51, 65, 85, 0.5); }
        }

        .icon-glow-1 { animation: glow-1 5s ease-in-out infinite; }
        .icon-glow-2 { animation: glow-2 5s ease-in-out infinite; }
        .icon-glow-3 { animation: glow-3 5s ease-in-out infinite; }
        .icon-glow-4 { animation: glow-4 5s ease-in-out infinite; }
        .icon-glow-5 { animation: glow-5 5s ease-in-out infinite; }
      `}</style>

      <div className="container mx-auto py-12 px-6 max-w-6xl">
        {/* Header - Minimal */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-white">
              Creative Studio
            </h1>
            <p className="text-slate-500 mt-2 text-lg font-light">
              Producción creativa impulsada por IA
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/studio/new">
              <button className="group relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all overflow-hidden text-white shadow-lg hover:shadow-xl hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-violet-500/20 via-purple-500/30 to-violet-500/20" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
                <Plus className="relative w-4 h-4 text-violet-300" />
                <span className="relative text-violet-100">Nueva Campaña</span>
              </button>
            </Link>
          </div>
        </div>

        {/* The System - Workflow */}
        <div className="mb-16">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-violet-400/70 mb-4">El Sistema</p>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              De la idea al contenido en minutos
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
              Un proceso automatizado que transforma tu brief en contenido publicitario listo para impactar
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="relative">
            {/* Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4 relative z-10">
              {WORKFLOW_STEPS.map((item, i) => {
                const Icon = item.icon
                const floatClass = [
                  'float-animation',
                  'float-animation-delayed-1',
                  'float-animation-delayed-2',
                  'float-animation-delayed-3',
                  'float-animation-delayed-4',
                ][i]
                const glowClass = `icon-glow-${i + 1}`

                return (
                  <div key={item.step} className="relative group">
                    <div className="flex flex-col items-center text-center">
                      {/* Icon Container */}
                      <div className={`relative mb-6 ${floatClass}`}>
                        {/* Outer ring with glow animation */}
                        <div className={`absolute inset-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 ${glowClass}`} />

                        {/* Inner icon */}
                        <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center">
                          <Icon className="w-8 h-8 text-slate-400 group-hover:text-violet-400 transition-colors duration-500" strokeWidth={1.5} />
                        </div>

                        {/* Step number */}
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-500 group-hover:text-violet-400 group-hover:border-violet-500/50 transition-all duration-300">
                          {item.step}
                        </span>
                      </div>

                      <h3 className="font-medium text-white text-sm tracking-wide mb-1.5 group-hover:text-violet-300 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-light">
                        {item.desc}
                      </p>
                    </div>

                    {/* Arrow for mobile */}
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <ArrowRight className="lg:hidden absolute -bottom-5 left-1/2 -translate-x-1/2 w-4 h-4 text-slate-700 rotate-90" />
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        </div>

        {/* Stats Cards - Modern Design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            {
              value: campaigns.length,
              label: 'Total Campañas',
              icon: FolderOpen,
              gradient: 'from-slate-600 to-slate-700',
              iconBg: 'bg-slate-500/20',
              iconColor: 'text-slate-300'
            },
            {
              value: campaigns.filter(c => c.status === 'producing' && !hasOutputs(c.outputsCount)).length,
              label: 'Produciendo',
              icon: Clock,
              gradient: 'from-amber-500 to-orange-600',
              iconBg: 'bg-amber-500/20',
              iconColor: 'text-amber-300'
            },
            {
              value: campaigns.filter(c => c.status === 'completed' || hasOutputs(c.outputsCount)).length,
              label: 'Completadas',
              icon: CheckCircle2,
              gradient: 'from-emerald-500 to-green-600',
              iconBg: 'bg-emerald-500/20',
              iconColor: 'text-emerald-300'
            },
            {
              value: campaigns.filter(c => !['draft', 'completed'].includes(c.status) && !hasOutputs(c.outputsCount)).length,
              label: 'En Progreso',
              icon: TrendingUp,
              gradient: 'from-violet-500 to-purple-600',
              iconBg: 'bg-violet-500/20',
              iconColor: 'text-violet-300'
            },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={i}
                className="group relative bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 overflow-hidden"
              >
                {/* Subtle gradient accent on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-3xl font-semibold text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-400 font-light">{stat.label}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Campaigns Section */}
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xl font-medium text-white">Mis Campañas</h3>
              <p className="text-sm text-slate-500 font-light mt-1">Gestiona y visualiza tus proyectos creativos</p>
            </div>
            <Link href="/studio/new">
              <button className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all overflow-hidden text-white border border-slate-700 hover:border-violet-500/50">
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
                <span className="text-slate-300 group-hover:text-violet-300 transition-colors">Nueva</span>
              </button>
            </Link>
          </div>

          {/* Campaigns Grid */}
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/50 overflow-hidden">
            {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" strokeWidth={1.5} />
                <p className="text-slate-500 font-light">Cargando...</p>
              </div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
                <FolderOpen className="w-7 h-7 text-slate-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-light text-white mb-2">Sin campañas</h3>
              <p className="text-slate-500 mb-8 font-light text-sm max-w-sm mx-auto">
                Comienza creando tu primera campaña para explorar el poder de la generación creativa con IA
              </p>
              <Link href="/studio/new">
                <button className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all overflow-hidden text-white">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
                  <Sparkles className="relative w-4 h-4 text-violet-300" />
                  <span className="relative text-violet-100">Crear campaña</span>
                </button>
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {campaigns.map((campaign) => {
                const statusConfig = getStatusConfig(campaign.status)
                const progress = getProgressPercentage(campaign.status, campaign.outputsCount)
                const isComplete = hasOutputs(campaign.outputsCount)
                const StatusIcon = statusConfig.icon

                return (
                  <Link
                    key={campaign.id}
                    href={`/studio/${campaign.id}`}
                    className="block group"
                  >
                    <div className={`relative p-5 rounded-xl border transition-all duration-300 ${
                      isComplete
                        ? 'bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                        : 'bg-slate-800/30 border-slate-700/30 hover:border-violet-500/40 hover:bg-slate-800/50'
                    }`}>
                      <div className="flex items-center gap-5">
                        {/* Campaign Icon */}
                        <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isComplete
                            ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20'
                            : 'bg-slate-700/30 group-hover:bg-violet-500/10'
                        }`}>
                          {isComplete ? (
                            <CheckCircle2 className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
                          ) : (
                            <FolderOpen className="w-7 h-7 text-slate-400 group-hover:text-violet-400 transition-colors" strokeWidth={1.5} />
                          )}
                        </div>

                        {/* Campaign Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-white text-lg group-hover:text-violet-300 transition-colors truncate">
                              {campaign.name}
                            </h3>
                            {isComplete && (
                              <span className="flex-shrink-0 text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg font-medium">
                                {campaign.outputsCount} contenido{campaign.outputsCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isComplete
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                    : 'bg-gradient-to-r from-violet-500 to-purple-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className={`text-sm font-semibold min-w-[45px] text-right ${isComplete ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {progress}%
                            </span>
                          </div>
                        </div>

                        {/* Status & Date */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold ${
                              isComplete
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : statusConfig.bgColor + ' ' + statusConfig.color
                            }`}
                          >
                            <StatusIcon className={`w-3.5 h-3.5 ${campaign.status === 'producing' && !isComplete ? 'animate-spin' : ''}`} strokeWidth={2} />
                            {isComplete ? 'Completado' : statusConfig.label}
                          </span>
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                            {new Date(campaign.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        <ArrowRight className="flex-shrink-0 w-5 h-5 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
