'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Check,
  X,
  RotateCcw,
  Loader2,
  Sparkles,
  Target,
  Lightbulb,
  Eye,
  Download,
  ExternalLink,
  Filter,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from 'lucide-react'

interface GeneratedContent {
  id: string
  promptId: string
  angleId: string
  archetypeId: string
  campaignId: string
  type: 'image' | 'video'
  url: string
  editedUrl?: string // URL de la imagen editada con textos/overlays
  thumbnailUrl?: string
  metadata: {
    provider: string
    jobId: string
    width?: number
    height?: number
  }
  createdAt: string
  approvedForClient?: boolean
  approvedForClientAt?: string
  // Client feedback
  clientFeedback?: 'approved' | 'rejected' | 'pending'
  clientFeedbackComment?: string
  clientFeedbackAt?: string
}

interface Archetype {
  id: string
  name: string
  summary: string
  mainMotivation: string
  emotionalTrigger: string
}

interface Angle {
  id: string
  archetypeId: string
  title: string
  description: string
  strategicGoal: string
}

interface ContentPrompt {
  id: string
  angleId: string
  archetypeId: string
  type: 'image' | 'video'
  text: string
  textOverlay?: {
    headline?: string
    subheadline?: string
    cta?: string
  }
  adType?: string
}

interface Campaign {
  id: string
  name: string
  brief: string
  coreMessage?: string
}

interface CampaignState {
  campaign: Campaign
  archetypes: Archetype[]
  angles: Angle[]
  prompts: ContentPrompt[]
  outputs: GeneratedContent[]
}

// Content status for approval workflow
type ContentStatus = 'pending' | 'approved' | 'rejected'

interface ContentWithStatus extends GeneratedContent {
  status: ContentStatus
}

export default function ClientGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [campaignState, setCampaignState] = useState<CampaignState | null>(null)
  const [loading, setLoading] = useState(true)
  const [contentStatuses, setContentStatuses] = useState<Record<string, ContentStatus>>({})
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const [previewContent, setPreviewContent] = useState<GeneratedContent | null>(null)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Rejection comments
  const [rejectionComments, setRejectionComments] = useState<Record<string, string>>({})
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [downloading, setDownloading] = useState(false)

  const handleMouseEnter = (content: GeneratedContent) => {
    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }
    // Set timer for 1 second before showing preview
    hoverTimerRef.current = setTimeout(() => {
      setPreviewContent(content)
      // Small delay to trigger CSS transition
      setTimeout(() => setPreviewVisible(true), 50)
    }, 1000)
  }

  const handleMouseLeave = () => {
    // Clear timer if user leaves before 1.5 seconds
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setPreviewVisible(false)
    // Wait for transition to complete before removing content
    setTimeout(() => setPreviewContent(null), 300)
  }

  useEffect(() => {
    fetchCampaign()
  }, [resolvedParams.id])

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/v2/campaigns/${resolvedParams.id}`)
      const data = await res.json()
      if (data.success) {
        setCampaignState(data.data)
        // Load saved feedback states from outputs
        const statuses: Record<string, ContentStatus> = {}
        const comments: Record<string, string> = {}
        data.data.outputs?.forEach((output: GeneratedContent) => {
          // Use saved clientFeedback or default to pending
          statuses[output.id] = output.clientFeedback || 'pending'
          // Load saved rejection comments
          if (output.clientFeedbackComment) {
            comments[output.id] = output.clientFeedbackComment
          }
        })
        setContentStatuses(statuses)
        setRejectionComments(comments)
      }
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  // Save feedback to backend
  const saveFeedback = async (outputId: string, feedback: ContentStatus, comment?: string) => {
    try {
      await fetch(`/api/v2/campaigns/${resolvedParams.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputId, feedback, comment }),
      })
    } catch (error) {
      console.error('Error saving feedback:', error)
    }
  }

  const toggleFlip = (contentId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(contentId)) {
        newSet.delete(contentId)
      } else {
        newSet.add(contentId)
      }
      return newSet
    })
  }

  const setContentStatus = (contentId: string, status: ContentStatus) => {
    setContentStatuses(prev => ({ ...prev, [contentId]: status }))
  }

  // Close preview helper
  const closePreview = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setPreviewVisible(false)
    setPreviewContent(null)
  }

  // Handle like toggle
  const handleLike = (contentId: string) => {
    closePreview() // Close preview when clicking
    const currentStatus = contentStatuses[contentId] || 'pending'
    const newStatus: ContentStatus = currentStatus === 'approved' ? 'pending' : 'approved'
    setContentStatus(contentId, newStatus)
    // Save to backend
    saveFeedback(contentId, newStatus)
    // Clear rejection comment if approving
    if (newStatus === 'approved') {
      setRejectionComments(prev => {
        const newComments = { ...prev }
        delete newComments[contentId]
        return newComments
      })
    }
  }

  // Handle dislike - opens modal for comment
  const handleDislike = (contentId: string) => {
    closePreview() // Close preview when clicking
    const currentStatus = contentStatuses[contentId] || 'pending'
    if (currentStatus === 'rejected') {
      // If already rejected, go back to pending and clear comment
      setContentStatus(contentId, 'pending')
      setRejectionComments(prev => {
        const newComments = { ...prev }
        delete newComments[contentId]
        return newComments
      })
      // Save to backend
      saveFeedback(contentId, 'pending')
    } else {
      // Open modal to add rejection comment
      setShowRejectModal(contentId)
      setRejectComment(rejectionComments[contentId] || '')
    }
  }

  // Confirm rejection with comment
  const confirmRejection = () => {
    if (showRejectModal) {
      setContentStatus(showRejectModal, 'rejected')
      setRejectionComments(prev => ({
        ...prev,
        [showRejectModal]: rejectComment
      }))
      // Save to backend with comment
      saveFeedback(showRejectModal, 'rejected', rejectComment)
      setShowRejectModal(null)
      setRejectComment('')
    }
  }

  const getArchetype = (archetypeId: string): Archetype | undefined => {
    return campaignState?.archetypes.find(a => a.id === archetypeId)
  }

  const getAngle = (angleId: string): Angle | undefined => {
    return campaignState?.angles.find(a => a.id === angleId)
  }

  const getPrompt = (promptId: string): ContentPrompt | undefined => {
    return campaignState?.prompts.find(p => p.id === promptId)
  }

  // Download ZIP with current filters
  const handleDownloadZip = async () => {
    if (downloading || filteredContent.length === 0) return

    setDownloading(true)
    try {
      const response = await fetch(`/api/v2/campaigns/${resolvedParams.id}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeFilter: activeTab,
          statusFilter: filterStatus,
          contentStatuses,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Error al descargar')
        return
      }

      // Get filename from header or generate one
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'contenido.zip'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading ZIP:', error)
      alert('Error al descargar el contenido')
    } finally {
      setDownloading(false)
    }
  }

  // First, filter only content that was approved for the client (from Studio)
  const clientApprovedOutputs = (campaignState?.outputs || []).filter(
    output => output.approvedForClient === true
  )

  const filteredContent = clientApprovedOutputs.filter(output => {
    // Filter by type
    if (activeTab === 'images' && output.type !== 'image') return false
    if (activeTab === 'videos' && output.type !== 'video') return false

    // Filter by client's approval status
    const status = contentStatuses[output.id] || 'pending'
    if (filterStatus !== 'all' && status !== filterStatus) return false

    return true
  })

  const stats = {
    total: clientApprovedOutputs.length,
    images: clientApprovedOutputs.filter(o => o.type === 'image').length,
    videos: clientApprovedOutputs.filter(o => o.type === 'video').length,
    approved: Object.values(contentStatuses).filter(s => s === 'approved').length,
    rejected: Object.values(contentStatuses).filter(s => s === 'rejected').length,
    pending: Object.values(contentStatuses).filter(s => s === 'pending').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-slate-400">Cargando galería...</p>
        </div>
      </div>
    )
  }

  if (!campaignState) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No se encontró la campaña</p>
          <Link href="/studio" className="text-violet-400 hover:text-violet-300">
            Volver al Studio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* CSS for flip animation */}
      <style jsx>{`
        .flip-card {
          perspective: 1000px;
        }
        .flip-card-inner {
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flip-card-inner.flipped {
          transform: rotateY(180deg);
        }
        .flip-card-front,
        .flip-card-back {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {campaignState.campaign.name}
                </h1>
                <p className="text-sm text-slate-500">
                  Galería de Contenido
                </p>
              </div>
            </div>

            {/* Stats badges */}
            <div className="hidden md:flex items-center gap-3">
              {/* Aprobados - Green gradient */}
              <div className="relative px-4 py-2 rounded-full overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/10 to-emerald-500/5" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />
                <span className="relative text-emerald-400/80 text-sm font-medium">
                  {stats.approved} Aprobados
                </span>
              </div>
              {/* Rechazados - Red gradient */}
              <div className="relative px-4 py-2 rounded-full overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-red-950/40 to-slate-900" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-rose-500/10 to-red-500/5" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/25 to-transparent" />
                <span className="relative text-red-400/80 text-sm font-medium">
                  {stats.rejected} Rechazados
                </span>
              </div>
              {/* Pendientes - Gray gradient */}
              <div className="relative px-4 py-2 rounded-full overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800/40 to-slate-900" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-slate-400/10 to-slate-500/5" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-400/25 to-transparent" />
                <span className="relative text-slate-400/80 text-sm font-medium">
                  {stats.pending} Pendientes
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Tabs and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Type tabs */}
          <div className="relative flex items-center gap-0.5 p-1 rounded-full overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

            <button
              onClick={() => setActiveTab('all')}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-violet-500/30 via-purple-500/40 to-violet-500/30 text-violet-100 shadow-inner'
                  : 'text-violet-300/70 hover:text-violet-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Todo ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'images'
                  ? 'bg-gradient-to-r from-violet-500/30 via-purple-500/40 to-violet-500/30 text-violet-100 shadow-inner'
                  : 'text-violet-300/70 hover:text-violet-100'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Imágenes ({stats.images})
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'videos'
                  ? 'bg-gradient-to-r from-violet-500/30 via-purple-500/40 to-violet-500/30 text-violet-100 shadow-inner'
                  : 'text-violet-300/70 hover:text-violet-100'
              }`}
            >
              <Video className="w-4 h-4" />
              Videos ({stats.videos})
            </button>
          </div>

          {/* Status filter and Download button */}
          <div className="flex items-center gap-3">
            {/* Status filter */}
            <div
              className="relative group"
              onMouseEnter={() => setShowFilterMenu(true)}
              onMouseLeave={() => setShowFilterMenu(false)}
            >
              <button className="group relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all overflow-hidden text-white shadow-lg hover:shadow-xl hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-violet-500/20 via-purple-500/30 to-violet-500/20" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
                <Filter className="relative w-4 h-4 text-violet-300" />
                <span className="relative text-violet-100">
                  {filterStatus === 'all' ? 'Todos los estados' :
                   filterStatus === 'approved' ? 'Aprobados' :
                   filterStatus === 'rejected' ? 'Rechazados' : 'Pendientes'}
                </span>
                <ChevronDown className={`relative w-4 h-4 text-violet-300 transition-transform duration-300 ${showFilterMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Invisible bridge to prevent gap issues */}
              <div className="absolute right-0 top-full h-2 w-full" />

              <div className={`absolute right-0 top-full mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10 z-50 overflow-hidden transition-all duration-300 origin-top ${
                showFilterMenu
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}>
                <div className="p-2">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => { setFilterStatus(status); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                        filterStatus === status
                          ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 font-medium'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {status === 'all' ? 'Todos los estados' :
                       status === 'approved' ? 'Aprobados' :
                       status === 'rejected' ? 'Rechazados' : 'Pendientes'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Download ZIP button */}
            <button
              onClick={handleDownloadZip}
              disabled={downloading || filteredContent.length === 0}
              className="group relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all overflow-hidden text-white shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-violet-500/20 via-purple-500/30 to-violet-500/20" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
              {downloading ? (
                <Loader2 className="relative w-4 h-4 text-violet-300 animate-spin" />
              ) : (
                <Download className="relative w-4 h-4 text-violet-300" />
              )}
              <span className="relative text-violet-100">
                {downloading ? 'Descargando...' : `Descargar (${filteredContent.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {filteredContent.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
              <ImageIcon className="w-7 h-7 text-slate-600" />
            </div>
            <h3 className="text-lg font-light text-white mb-2">Sin contenido</h3>
            <p className="text-slate-500 text-sm">
              No hay contenido que coincida con los filtros seleccionados
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map(content => {
              const isFlipped = flippedCards.has(content.id)
              const status = contentStatuses[content.id] || 'pending'
              const archetype = getArchetype(content.archetypeId)
              const angle = getAngle(content.angleId)
              const prompt = getPrompt(content.promptId)

              return (
                <div
                  key={content.id}
                  className="flip-card relative group"
                  style={{ height: '400px' }}
                >
                  <div className={`flip-card-inner absolute inset-0 ${isFlipped ? 'flipped' : ''}`}>
                    {/* Front - Content */}
                    <div className="flip-card-front absolute inset-0 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50">
                      {/* Content preview */}
                      <div
                        className="relative w-full h-full cursor-pointer"
                        onMouseEnter={() => handleMouseEnter(content)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => toggleFlip(content.id)}
                      >
                        {content.type === 'image' ? (
                          <Image
                            src={content.editedUrl || content.url}
                            alt="Generated content"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <video
                            src={content.editedUrl || content.url}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                          />
                        )}

                        {/* Type badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
                            content.type === 'image'
                              ? 'bg-violet-500/30 text-violet-200'
                              : 'bg-amber-500/30 text-amber-200'
                          }`}>
                            {content.type === 'image' ? (
                              <ImageIcon className="w-3 h-3 inline mr-1" />
                            ) : (
                              <Video className="w-3 h-3 inline mr-1" />
                            )}
                            {content.type === 'image' ? 'Imagen' : 'Video'}
                          </span>
                        </div>

                        {/* Status indicator */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
                            status === 'approved'
                              ? 'bg-emerald-500/30 text-emerald-200'
                              : status === 'rejected'
                              ? 'bg-red-500/30 text-red-200'
                              : 'bg-slate-500/30 text-slate-200'
                          }`}>
                            {status === 'approved' ? 'Aprobado' :
                             status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                          </span>
                        </div>

                        {/* Like/Dislike buttons - always visible at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                          {/* Rejection comment display */}
                          {status === 'rejected' && rejectionComments[content.id] && (
                            <div className="mb-2 p-2 bg-red-500/20 rounded-lg backdrop-blur-sm">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-red-300 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-red-200 line-clamp-2">{rejectionComments[content.id]}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-center gap-4">
                            {/* Like button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLike(content.id); }}
                              className={`p-2.5 rounded-full backdrop-blur-sm transition-all duration-200 active:scale-90 ${
                                status === 'approved'
                                  ? 'bg-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                              }`}
                            >
                              <ThumbsUp className={`w-5 h-5 transition-transform duration-200 ${status === 'approved' ? 'scale-110' : ''}`} />
                            </button>

                            {/* Dislike button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDislike(content.id); }}
                              className={`p-2.5 rounded-full backdrop-blur-sm transition-all duration-200 active:scale-90 ${
                                status === 'rejected'
                                  ? 'bg-red-500/30 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                              }`}
                            >
                              <ThumbsDown className={`w-5 h-5 transition-transform duration-200 ${status === 'rejected' ? 'scale-110' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Back - Logic/Info */}
                    <div
                      className="flip-card-back absolute inset-0 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 cursor-pointer"
                      onClick={() => toggleFlip(content.id)}
                    >
                      <div className="h-full flex flex-col p-5 overflow-y-auto">
                        {/* Archetype */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-violet-400" />
                            <span className="text-xs uppercase tracking-wider text-violet-400 font-semibold">
                              Arquetipo
                            </span>
                          </div>
                          <h4 className="text-white font-medium mb-1">{archetype?.name || 'N/A'}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {archetype?.summary || 'Sin descripción'}
                          </p>
                        </div>

                        {/* Angle */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                              Ángulo Creativo
                            </span>
                          </div>
                          <h4 className="text-white font-medium mb-1">{angle?.title || 'N/A'}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {angle?.description || 'Sin descripción'}
                          </p>
                        </div>

                        {/* Strategic Goal */}
                        {angle?.strategicGoal && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                                Objetivo
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-3">
                              {angle.strategicGoal}
                            </p>
                          </div>
                        )}

                        {/* Text Overlay */}
                        {prompt?.textOverlay && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                                Texto en imagen
                              </span>
                            </div>
                            {prompt.textOverlay.headline && (
                              <p className="text-sm text-white font-semibold mb-1">{prompt.textOverlay.headline}</p>
                            )}
                            {prompt.textOverlay.subheadline && (
                              <p className="text-xs text-slate-300">{prompt.textOverlay.subheadline}</p>
                            )}
                          </div>
                        )}

                        {/* Back hint */}
                        <div className="mt-auto pt-4 border-t border-slate-800">
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            Click para volver
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview Modal (shows on hover for enlarged view) */}
      {previewContent && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-all duration-300 ease-out ${
            previewVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: previewVisible ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)' }}
        >
          <div
            className={`relative max-w-4xl transition-all duration-300 ease-out ${
              previewVisible
                ? 'w-[80vw] h-[80vh] scale-100'
                : 'w-[40vw] h-[40vh] scale-75'
            }`}
          >
            {previewContent.type === 'image' ? (
              <Image
                src={previewContent.editedUrl || previewContent.url}
                alt="Preview"
                fill
                className="object-contain"
              />
            ) : (
              <video
                src={previewContent.editedUrl || previewContent.url}
                className="w-full h-full object-contain"
                autoPlay
                muted
                loop
              />
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Rechazar contenido</h3>
              <button
                onClick={() => { setShowRejectModal(null); setRejectComment(''); }}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="(OPCIONAL) Esta información se utiliza para entrenar y guiar mejor a los agentes"
                className="w-full h-28 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none transition-all"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <button
                onClick={() => { setShowRejectModal(null); setRejectComment(''); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRejection}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-colors"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
