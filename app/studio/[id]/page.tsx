'use client'

import { useState, useEffect, use, useMemo, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Users,
  Target,
  FileText,
  Image,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Eye,
  Play,
  Folder,
  FolderOpen,
  Layers,
  Zap,
  ExternalLink,
  Check,
  Images,
  Download,
  Send,
  X,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ReferenceImagePanel, ImageDropZone } from '@/components/reference-image-panel'
import InlineImageEditor from '@/components/InlineImageEditor'
import type { ReferenceImage } from '@/lib/types/campaign-types'

// Types
interface Campaign {
  id: string
  name: string
  description: string
  brief: string
  objective: string
  category: string
  platforms: string[]
  status: string
  createdAt: string
  referenceImages?: ReferenceImage[]
}

interface Archetype {
  id: string
  name: string
  summary: string
  mainMotivation: string
  painPoints: string[]
  desires: string[]
  emotionalTrigger: string
  selected: boolean
  referenceImageId?: string
}

interface Angle {
  id: string
  archetypeId: string
  title: string
  description: string
  strategicGoal: string
  imagesRequested: number
  videosRequested: number
  referenceImageId?: string
}

interface ContentPrompt {
  id: string
  angleId: string
  archetypeId: string
  type: 'image' | 'video'
  text: string
  selectedToProduce: boolean
  status: string
  outputUrl?: string
  referenceImageId?: string
  suggestedTitle?: string
  suggestedSubtitle?: string
}

interface GeneratedContent {
  id: string
  promptId: string
  archetypeId: string
  angleId: string
  type: 'image' | 'video'
  url: string
  createdAt: string
  approvedForClient?: boolean
  approvedForClientAt?: string
}

interface CampaignState {
  campaign: Campaign
  referenceImages: ReferenceImage[]
  archetypes: Archetype[]
  angles: Angle[]
  prompts: ContentPrompt[]
  outputs: GeneratedContent[]
}

// Steps
const STEPS = [
  { id: 'archetypes', label: 'Arquetipos', icon: Users, description: 'Generar perfiles de cliente' },
  { id: 'angles', label: 'Ángulos', icon: Target, description: 'Crear ángulos creativos' },
  { id: 'prompts', label: 'Prompts', icon: FileText, description: 'Generar prompts de contenido' },
  { id: 'production', label: 'Producción', icon: Sparkles, description: 'Producir imágenes y videos' },
  { id: 'editor', label: 'Editor', icon: Pencil, description: 'Editar textos y overlays' },
  { id: 'results', label: 'Resultados', icon: Layers, description: 'Ver contenido generado' },
  { id: 'gallery', label: 'Galería', icon: Images, description: 'Galería de contenido' },
]

// Color palette for archetypes
const ARCHETYPE_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100' },
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', badge: 'bg-pink-100' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100' },
]

export default function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [state, setState] = useState<CampaignState | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [maxReachedStep, setMaxReachedStep] = useState(0) // Track the furthest step reached
  const [initialStepSet, setInitialStepSet] = useState(false) // Track if initial step from URL was applied

  // Selection states
  const [selectedArchetypes, setSelectedArchetypes] = useState<Set<string>>(new Set())
  const [angleConfigs, setAngleConfigs] = useState<Map<string, { images: number; videos: number }>>(
    new Map()
  )
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set())

  // Expanded states for tree view
  const [expandedArchetypes, setExpandedArchetypes] = useState<Set<string>>(new Set())
  const [expandedAngles, setExpandedAngles] = useState<Set<string>>(new Set())

  // Reference images panel state
  const [isRefImagePanelOpen, setIsRefImagePanelOpen] = useState(true)
  const [draggingImage, setDraggingImage] = useState<ReferenceImage | null>(null)

  // Drag & drop approval states
  const [draggingContent, setDraggingContent] = useState<GeneratedContent | null>(null)
  const [isOverApprovalZone, setIsOverApprovalZone] = useState(false)
  const [approvedForClientIds, setApprovedForClientIds] = useState<Set<string>>(new Set())

  // Editor step states
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [editedPromptIds, setEditedPromptIds] = useState<Set<string>>(new Set())

  // Hover preview states
  const [previewContent, setPreviewContent] = useState<GeneratedContent | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Hover preview handlers
  const handlePreviewMouseEnter = (content: GeneratedContent) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }
    hoverTimerRef.current = setTimeout(() => {
      setPreviewContent(content)
      setTimeout(() => setPreviewVisible(true), 50)
    }, 1000)
  }

  const handlePreviewMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setPreviewVisible(false)
    setTimeout(() => setPreviewContent(null), 300)
  }

  // Get reference image by ID from campaign's reference images
  const getReferenceImageById = useCallback((imageId: string | undefined): ReferenceImage | null => {
    if (!imageId || !state?.referenceImages) return null
    return state.referenceImages.find(img => img.id === imageId) || null
  }, [state?.referenceImages])

  // Get effective reference image for a prompt (cascade: prompt → angle → archetype)
  const getEffectiveReferenceImage = useCallback((promptId: string): { image: ReferenceImage | null; inheritedFrom?: 'archetype' | 'angle' } => {
    const prompt = state?.prompts.find(p => p.id === promptId)
    if (!prompt) return { image: null }

    // Check prompt level first
    if (prompt.referenceImageId) {
      const img = getReferenceImageById(prompt.referenceImageId)
      if (img) return { image: img }
    }

    // Check angle level
    const angle = state?.angles.find(a => a.id === prompt.angleId)
    if (angle?.referenceImageId) {
      const img = getReferenceImageById(angle.referenceImageId)
      if (img) return { image: img, inheritedFrom: 'angle' }
    }

    // Check archetype level
    const archetype = state?.archetypes.find(a => a.id === prompt.archetypeId)
    if (archetype?.referenceImageId) {
      const img = getReferenceImageById(archetype.referenceImageId)
      if (img) return { image: img, inheritedFrom: 'archetype' }
    }

    return { image: null }
  }, [state, getReferenceImageById])

  // Get effective reference image for an angle (cascade: angle → archetype)
  const getEffectiveReferenceImageForAngle = useCallback((angleId: string): { image: ReferenceImage | null; inheritedFrom?: 'archetype' } => {
    const angle = state?.angles.find(a => a.id === angleId)
    if (!angle) return { image: null }

    // Check angle level first
    if (angle.referenceImageId) {
      const img = getReferenceImageById(angle.referenceImageId)
      if (img) return { image: img }
    }

    // Check archetype level
    const archetype = state?.archetypes.find(a => a.id === angle.archetypeId)
    if (archetype?.referenceImageId) {
      const img = getReferenceImageById(archetype.referenceImageId)
      if (img) return { image: img, inheritedFrom: 'archetype' }
    }

    return { image: null }
  }, [state, getReferenceImageById])

  // Handler to assign reference image to archetype
  const handleAssignArchetypeReferenceImage = useCallback(async (archetypeId: string, image: ReferenceImage | null) => {
    try {
      await fetch(`/api/v2/campaigns/${id}/reference-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'archetype',
          targetId: archetypeId,
          referenceImageId: image?.id || null,
        }),
      })
      await fetchCampaign()
    } catch (err) {
      console.error('Error assigning reference image:', err)
    }
  }, [id])

  // Handler to assign reference image to angle
  const handleAssignAngleReferenceImage = useCallback(async (angleId: string, image: ReferenceImage | null) => {
    try {
      await fetch(`/api/v2/campaigns/${id}/reference-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'angle',
          targetId: angleId,
          referenceImageId: image?.id || null,
        }),
      })
      await fetchCampaign()
    } catch (err) {
      console.error('Error assigning reference image:', err)
    }
  }, [id])

  // Handler to assign reference image to prompt
  const handleAssignPromptReferenceImage = useCallback(async (promptId: string, image: ReferenceImage | null) => {
    try {
      await fetch(`/api/v2/campaigns/${id}/reference-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'prompt',
          targetId: promptId,
          referenceImageId: image?.id || null,
        }),
      })
      await fetchCampaign()
    } catch (err) {
      console.error('Error assigning reference image:', err)
    }
  }, [id])

  // Handler to update prompt text
  const handleUpdatePromptText = useCallback(async (promptId: string, newText: string) => {
    try {
      const response = await fetch(`/api/v2/campaigns/${id}/prompts/${promptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
      })

      if (response.ok) {
        // Update local state immediately
        setState(prev => {
          if (!prev) return prev
          return {
            ...prev,
            prompts: prev.prompts.map(p =>
              p.id === promptId ? { ...p, text: newText } : p
            ),
          }
        })
      } else {
        console.error('Error updating prompt:', await response.text())
      }
    } catch (err) {
      console.error('Error updating prompt text:', err)
    }
  }, [id])

  // Handler to add new reference images to campaign
  const handleAddReferenceImages = useCallback(async (newImages: ReferenceImage[]) => {
    // Persist each image to the server and update local state
    for (const img of newImages) {
      try {
        const response = await fetch(`/api/v2/campaigns/${id}/reference-images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...img, campaignId: id }),
        })

        if (response.ok) {
          // Update local state after successful server persist
          setState(prev => {
            if (!prev) return prev
            return {
              ...prev,
              referenceImages: [...prev.referenceImages, { ...img, campaignId: id }],
            }
          })
        } else {
          console.error('Error persisting image:', await response.text())
        }
      } catch (err) {
        console.error('Error adding reference image:', err)
      }
    }
  }, [id])

  // Handler to remove reference image from campaign
  const handleRemoveReferenceImage = useCallback(async (imageId: string) => {
    try {
      await fetch(`/api/v2/campaigns/${id}/reference-images?imageId=${imageId}`, {
        method: 'DELETE',
      })
      await fetchCampaign()
    } catch (err) {
      console.error('Error removing reference image:', err)
    }
  }, [id])

  // Create archetype color map
  const archetypeColorMap = useMemo(() => {
    const map = new Map<string, typeof ARCHETYPE_COLORS[0]>()
    state?.archetypes.forEach((arch, index) => {
      map.set(arch.id, ARCHETYPE_COLORS[index % ARCHETYPE_COLORS.length])
    })
    return map
  }, [state?.archetypes])

  // Group angles by archetype
  const anglesByArchetype = useMemo(() => {
    const map = new Map<string, Angle[]>()
    state?.angles.forEach((angle) => {
      const existing = map.get(angle.archetypeId) || []
      existing.push(angle)
      map.set(angle.archetypeId, existing)
    })
    return map
  }, [state?.angles])

  // Group prompts by angle
  const promptsByAngle = useMemo(() => {
    const map = new Map<string, ContentPrompt[]>()
    state?.prompts.forEach((prompt) => {
      const existing = map.get(prompt.angleId) || []
      existing.push(prompt)
      map.set(prompt.angleId, existing)
    })
    return map
  }, [state?.prompts])

  // Group outputs by archetype and angle
  const outputsByArchetype = useMemo(() => {
    const map = new Map<string, Map<string, GeneratedContent[]>>()
    state?.outputs.forEach((output) => {
      if (!map.has(output.archetypeId)) {
        map.set(output.archetypeId, new Map())
      }
      const angleMap = map.get(output.archetypeId)!
      const existing = angleMap.get(output.angleId) || []
      existing.push(output)
      angleMap.set(output.angleId, existing)
    })
    return map
  }, [state?.outputs])

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/v2/campaigns/${id}`)
      const data = await res.json()

      if (data.success) {
        setState(data.data)

        // Initialize selections from state
        const selected = new Set<string>(
          data.data.archetypes?.filter((a: Archetype) => a.selected).map((a: Archetype) => a.id) || []
        )
        setSelectedArchetypes(selected)

        // Initialize all prompts as selected by default
        const allPromptIds = new Set<string>(data.data.prompts?.map((p: ContentPrompt) => p.id) || [])
        setSelectedPrompts(allPromptIds)

        // Expand all archetypes by default
        const allArchIds = new Set<string>(data.data.archetypes?.map((a: Archetype) => a.id) || [])
        setExpandedArchetypes(allArchIds)

        // Calculate the maximum step reached based on existing data
        let calculatedMaxStep = 0
        if (data.data.archetypes?.length > 0) calculatedMaxStep = 1
        if (data.data.angles?.length > 0) calculatedMaxStep = 2
        if (data.data.prompts?.length > 0) calculatedMaxStep = 3
        if (data.data.outputs?.length > 0) calculatedMaxStep = 4

        // Set maxReachedStep to the highest step with data
        setMaxReachedStep(calculatedMaxStep)

        // Determine current step (where to show the user)
        // If first load, show the current progress step
        // Keep user at their current step if they've already been navigating
        if (loading && !initialStepSet) {
          // Check if URL has step parameter
          const stepParam = searchParams.get('step')
          if (stepParam === 'gallery') {
            // Navigate directly to gallery (step 5)
            setCurrentStep(5)
            setInitialStepSet(true)
          } else if (data.data.outputs?.length > 0) {
            setCurrentStep(4)
          } else if (data.data.prompts?.length > 0) {
            setCurrentStep(3)
          } else if (data.data.angles?.length > 0) {
            setCurrentStep(2)
          } else if (data.data.archetypes?.length > 0) {
            setCurrentStep(1)
          } else {
            setCurrentStep(0)
          }
        }
      } else {
        setError('Campaña no encontrada')
      }
    } catch (err) {
      setError('Error cargando campaña')
    } finally {
      setLoading(false)
    }
  }

  // Get archetype by ID
  const getArchetype = (id: string) => state?.archetypes.find((a) => a.id === id)

  // Get angle by ID
  const getAngle = (id: string) => state?.angles.find((a) => a.id === id)

  // Navigation helpers
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToNextStep = () => {
    const galleryStepIndex = STEPS.findIndex(s => s.id === 'gallery')
    const canGoNext = currentStep < maxReachedStep || currentStep < galleryStepIndex
    if (canGoNext && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  // STEP 1: Generate Archetypes
  const handleGenerateArchetypes = async () => {
    setActionLoading('archetypes')
    setError('')

    try {
      const res = await fetch(`/api/v2/campaigns/${id}/archetypes/generate`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        await fetchCampaign()
        setCurrentStep(1)
        setMaxReachedStep((prev) => Math.max(prev, 1))
      } else {
        setError(data.error || 'Error generando arquetipos')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setActionLoading(null)
    }
  }

  // STEP 2: Generate Angles
  const handleGenerateAngles = async () => {
    if (selectedArchetypes.size === 0) {
      setError('Selecciona al menos un arquetipo')
      return
    }

    setActionLoading('angles')
    setError('')

    try {
      // First select archetypes
      await fetch(`/api/v2/campaigns/${id}/archetypes/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedIds: Array.from(selectedArchetypes) }),
      })

      // Then generate angles
      const res = await fetch(`/api/v2/campaigns/${id}/angles/generate`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        await fetchCampaign()
        setCurrentStep(2)
        setMaxReachedStep((prev) => Math.max(prev, 2))
      } else {
        setError(data.error || 'Error generando ángulos')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setActionLoading(null)
    }
  }

  // STEP 3: Generate Prompts
  const handleGeneratePrompts = async () => {
    // Configure angles with values from user config (default to 0 if not configured)
    const configs: { angleId: string; imagesRequested: number; videosRequested: number }[] = []
    state?.angles.forEach((angle) => {
      const config = angleConfigs.get(angle.id) || { images: 0, videos: 0 }
      // Only include angles that have at least one image or video requested
      if (config.images > 0 || config.videos > 0) {
        configs.push({
          angleId: angle.id,
          imagesRequested: config.images,
          videosRequested: config.videos,
        })
      }
    })

    // Validate that at least one angle has content configured
    if (configs.length === 0) {
      setError('Configura al menos un ángulo con imágenes o videos para continuar')
      return
    }

    await fetch(`/api/v2/campaigns/${id}/angles/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs }),
    })

    setActionLoading('prompts')
    setError('')

    try {
      const res = await fetch(`/api/v2/campaigns/${id}/prompts/generate`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        await fetchCampaign()
        setCurrentStep(3)
        setMaxReachedStep((prev) => Math.max(prev, 3))
      } else {
        setError(data.error || 'Error generando prompts')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setActionLoading(null)
    }
  }

  // STEP 4: Produce Content
  const handleProduceContent = async () => {
    if (selectedPrompts.size === 0) {
      setError('Selecciona al menos un prompt para producir')
      return
    }

    setActionLoading('produce')
    setError('')

    try {
      const res = await fetch(`/api/v2/campaigns/${id}/prompts/produce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptIds: Array.from(selectedPrompts) }),
      })
      const data = await res.json()

      if (data.success) {
        await fetchCampaign()
        setCurrentStep(4) // Go to Editor
        setMaxReachedStep((prev) => Math.max(prev, 5)) // Allow navigation up to Results
      } else {
        setError(data.error || 'Error produciendo contenido')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setActionLoading(null)
    }
  }

  // Check production status
  const handleCheckStatus = async () => {
    setActionLoading('check')

    try {
      const res = await fetch(`/api/v2/campaigns/${id}/outputs/check`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        await fetchCampaign()
      }
    } catch (err) {
      console.error('Error checking status:', err)
    } finally {
      setActionLoading(null)
    }
  }

  // Download images as ZIP
  const handleDownloadImagesZip = async () => {
    const images = outputs.filter(o => o.type === 'image')
    if (images.length === 0) return

    setActionLoading('download-images')

    try {
      // Dynamic import JSZip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Download each image through proxy and add to zip
      const downloadPromises = images.map(async (img, index) => {
        try {
          // Use proxy to avoid CORS issues
          const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(img.url)}`
          const response = await fetch(proxyUrl)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          const blob = await response.blob()
          const extension = img.url.split('.').pop()?.split('?')[0] || 'png'
          zip.file(`imagen_${index + 1}.${extension}`, blob)
        } catch (err) {
          console.error(`Error downloading image ${index + 1}:`, err)
        }
      })

      await Promise.all(downloadPromises)

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${state?.campaign.name || 'imagenes'}_galeria.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error creating ZIP:', err)
      setError('Error al crear el archivo ZIP')
    } finally {
      setActionLoading(null)
    }
  }

  // Download videos as ZIP
  const handleDownloadVideosZip = async () => {
    const videos = outputs.filter(o => o.type === 'video')
    if (videos.length === 0) return

    setActionLoading('download-videos')

    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      const downloadPromises = videos.map(async (vid, index) => {
        try {
          // Use proxy to avoid CORS issues
          const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(vid.url)}`
          const response = await fetch(proxyUrl)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          const blob = await response.blob()
          const extension = vid.url.split('.').pop()?.split('?')[0] || 'mp4'
          zip.file(`video_${index + 1}.${extension}`, blob)
        } catch (err) {
          console.error(`Error downloading video ${index + 1}:`, err)
        }
      })

      await Promise.all(downloadPromises)

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${state?.campaign.name || 'videos'}_galeria.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error creating ZIP:', err)
      setError('Error al crear el archivo ZIP')
    } finally {
      setActionLoading(null)
    }
  }

  // Handle drag start for content approval
  const handleContentDragStart = (e: React.DragEvent, content: GeneratedContent) => {
    setDraggingContent(content)
    e.dataTransfer.setData('text/plain', content.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Handle drag end
  const handleContentDragEnd = () => {
    setDraggingContent(null)
    setIsOverApprovalZone(false)
  }

  // Handle drop on approval zone
  const handleApprovalDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsOverApprovalZone(false)

    if (!draggingContent) return

    try {
      setActionLoading('approving')
      const response = await fetch(`/api/v2/campaigns/${id}/outputs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputIds: [draggingContent.id],
          approved: true,
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Update local state
        setApprovedForClientIds(prev => new Set([...prev, draggingContent.id]))
        // Update state
        if (state) {
          const updatedOutputs = state.outputs.map(o =>
            o.id === draggingContent.id
              ? { ...o, approvedForClient: true, approvedForClientAt: new Date().toISOString() }
              : o
          )
          setState({ ...state, outputs: updatedOutputs })
        }
      }
    } catch (err) {
      console.error('Error approving content:', err)
      setError('Error al aprobar contenido')
    } finally {
      setActionLoading(null)
      setDraggingContent(null)
    }
  }

  // Remove content from approved
  const handleRemoveFromApproved = async (contentId: string) => {
    try {
      setActionLoading('removing')
      const response = await fetch(`/api/v2/campaigns/${id}/outputs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputIds: [contentId],
          approved: false,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setApprovedForClientIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(contentId)
          return newSet
        })
        // Update state
        if (state) {
          const updatedOutputs = state.outputs.map(o =>
            o.id === contentId
              ? { ...o, approvedForClient: false, approvedForClientAt: undefined }
              : o
          )
          setState({ ...state, outputs: updatedOutputs })
        }
      }
    } catch (err) {
      console.error('Error removing content:', err)
      setError('Error al remover contenido')
    } finally {
      setActionLoading(null)
    }
  }

  // Initialize approved IDs from state
  useEffect(() => {
    if (state?.outputs) {
      const approved = new Set(
        state.outputs.filter(o => o.approvedForClient).map(o => o.id)
      )
      setApprovedForClientIds(approved)
    }
  }, [state?.outputs])

  // Toggle archetype expansion
  const toggleArchetypeExpansion = (archId: string) => {
    const newSet = new Set(expandedArchetypes)
    if (newSet.has(archId)) {
      newSet.delete(archId)
    } else {
      newSet.add(archId)
    }
    setExpandedArchetypes(newSet)
  }

  // Toggle angle expansion
  const toggleAngleExpansion = (angleId: string) => {
    const newSet = new Set(expandedAngles)
    if (newSet.has(angleId)) {
      newSet.delete(angleId)
    } else {
      newSet.add(angleId)
    }
    setExpandedAngles(newSet)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando campaña...</p>
        </div>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaña no encontrada</h2>
          <p className="text-gray-700 mb-6">La campaña que buscas no existe o ha sido eliminada.</p>
          <Link href="/studio">
            <Button size="lg">Volver al Studio</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { campaign, archetypes, angles, prompts, outputs } = state

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/studio"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
                <p className="text-sm text-gray-600">{campaign.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {campaign.category}
              </Badge>
              {campaign.platforms.map((p) => (
                <Badge key={p} variant="secondary" className="text-xs">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps - Horizontal Timeline with Bidirectional Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isCompleted = index < maxReachedStep
              const isCurrent = index === currentStep
              const isResultsStep = step.id === 'results' // Results is always accessible
              const isGalleryStep = step.id === 'gallery' // Gallery is always accessible
              const isAlwaysAccessible = isResultsStep || isGalleryStep
              const isReachable = index <= maxReachedStep || isAlwaysAccessible
              const isFuture = index > maxReachedStep && !isAlwaysAccessible

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => isReachable && setCurrentStep(index)}
                    disabled={!isReachable}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      isCompleted && !isCurrent
                        ? 'text-green-700'
                        : isCurrent
                        ? 'text-blue-700'
                        : isAlwaysAccessible && !isCurrent
                        ? 'text-violet-600'
                        : isFuture
                        ? 'text-gray-400'
                        : 'text-gray-600'
                    } ${isReachable ? 'hover:bg-gray-50 cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-60'}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted && !isCurrent
                          ? 'bg-green-100 ring-2 ring-green-200'
                          : isCurrent
                          ? 'bg-blue-100 ring-2 ring-blue-300 shadow-lg'
                          : isAlwaysAccessible && !isCurrent
                          ? 'bg-violet-100 ring-2 ring-violet-200'
                          : isReachable
                          ? 'bg-gray-100 ring-1 ring-gray-200'
                          : 'bg-gray-100'
                      }`}
                    >
                      {isCompleted && !isCurrent ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon className={`w-6 h-6 ${isCurrent ? 'animate-pulse' : ''}`} />
                      )}
                    </div>
                    <span className="text-xs font-medium">{step.label}</span>
                    {isReachable && !isCurrent && (
                      <span className="text-[10px] text-gray-500">Click para ver</span>
                    )}
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded transition-all ${
                        index < maxReachedStep ? 'bg-green-300' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 pb-24">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 0: Generate Archetypes */}
        {currentStep === 0 && (
          <div className="max-w-2xl mx-auto">
            {/* Main Card with gradient background */}
            <div className="group relative rounded-2xl overflow-hidden shadow-xl shadow-violet-200/50">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50/80 to-indigo-100/60" />

              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/40 to-transparent" />

              <div className="relative p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-300/50">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800 mb-1">
                    Generar Arquetipos
                  </h2>
                  <p className="text-slate-600 text-sm">
                    La IA analizará tu brief y generará 15 arquetipos de cliente únicos
                  </p>
                </div>

                {/* Brief Card */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-5 border border-white/50 shadow-sm">
                  <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-violet-500" />
                    Brief de la campaña
                  </h4>
                  <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {campaign.brief}
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="group/stat relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-purple-50 to-violet-100/60" />
                    <div className="absolute inset-0 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-transparent via-white/40 to-transparent" />
                    <div className="relative p-3 text-center">
                      <div className="text-2xl font-bold text-violet-700 mb-0.5">15</div>
                      <div className="text-[10px] text-violet-600 font-medium uppercase tracking-wide">Arquetipos</div>
                    </div>
                  </div>
                  <div className="group/stat relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-green-50 to-emerald-100/60" />
                    <div className="absolute inset-0 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-transparent via-white/40 to-transparent" />
                    <div className="relative p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-700 mb-0.5">5</div>
                      <div className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">Ángulos/Arq.</div>
                    </div>
                  </div>
                  <div className="group/stat relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-sky-50 to-cyan-100/60" />
                    <div className="absolute inset-0 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-transparent via-white/40 to-transparent" />
                    <div className="relative p-3 text-center">
                      <div className="text-2xl font-bold text-cyan-700 mb-0.5">∞</div>
                      <div className="text-[10px] text-cyan-600 font-medium uppercase tracking-wide">Contenido</div>
                    </div>
                  </div>
                </div>

                {/* CTA Button with dark gradient like sidebar */}
                <button
                  onClick={handleGenerateArchetypes}
                  disabled={actionLoading === 'archetypes'}
                  className={`group relative w-full py-3.5 rounded-xl text-sm font-light transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden ${
                    actionLoading === 'archetypes'
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'text-white shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/40 hover:scale-[1.01]'
                  }`}
                >
                  {/* Background gradient like sidebar */}
                  {actionLoading !== 'archetypes' && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-violet-500/20 via-purple-500/30 to-violet-500/20" />
                      {/* Top border glow */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
                    </>
                  )}
                  {actionLoading === 'archetypes' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando arquetipos...
                    </>
                  ) : (
                    <>
                      <Sparkles className="relative w-4 h-4 text-violet-300" />
                      <span className="relative text-violet-100">Generar Arquetipos con Meduzia</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Select Archetypes - Clean Style with Gradients */}
        {currentStep === 1 && (
          <div className="min-h-screen -mx-6 -mt-6 px-8 py-10 bg-white">
            {/* Header Section */}
            <div className="max-w-6xl mx-auto mb-10">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium tracking-wide uppercase mb-2">
                    Arquetipos generados
                  </p>
                  <h1 className="text-4xl font-light text-slate-900 tracking-tight">
                    Selecciona tus arquetipos
                  </h1>
                  <p className="text-slate-600 mt-2 text-lg font-light">
                    Elige los perfiles de cliente para crear ángulos creativos personalizados.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (selectedArchetypes.size === archetypes.length) {
                        setSelectedArchetypes(new Set())
                      } else {
                        setSelectedArchetypes(new Set(archetypes.map((a) => a.id)))
                      }
                    }}
                    className="px-5 py-2.5 text-sm font-light text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all"
                  >
                    {selectedArchetypes.size === archetypes.length
                      ? 'Deseleccionar todos'
                      : 'Seleccionar todos'}
                  </button>
                  <div className="relative px-5 py-2.5 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                    <span className="relative text-sm font-light text-violet-100">
                      {selectedArchetypes.size} / {archetypes.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {archetypes.map((arch, index) => {
                  const isSelected = selectedArchetypes.has(arch.id)
                  // Alternar entre diferentes degradados suaves
                  const gradients = [
                    'from-rose-50 via-pink-50/80 to-rose-100/60',
                    'from-violet-50 via-purple-50/80 to-violet-100/60',
                    'from-blue-50 via-indigo-50/80 to-blue-100/60',
                    'from-amber-50 via-orange-50/80 to-amber-100/60',
                    'from-emerald-50 via-green-50/80 to-emerald-100/60',
                    'from-cyan-50 via-sky-50/80 to-cyan-100/60',
                  ]
                  const gradient = gradients[index % gradients.length]

                  return (
                    <div
                      key={arch.id}
                      onClick={() => {
                        const newSet = new Set(selectedArchetypes)
                        if (newSet.has(arch.id)) {
                          newSet.delete(arch.id)
                        } else {
                          newSet.add(arch.id)
                        }
                        setSelectedArchetypes(newSet)
                      }}
                      className={`group relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
                        isSelected
                          ? 'ring-2 ring-violet-400 shadow-xl shadow-violet-200/50 scale-[1.02]'
                          : 'shadow-md shadow-slate-200/80 hover:shadow-lg hover:shadow-slate-300/80 hover:scale-[1.01]'
                      }`}
                    >
                      {/* Gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/40 to-transparent" />

                      <div className="relative p-4">
                        {/* Header: Number + Reference Image + Checkbox */}
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-300/50'
                              : 'bg-white/80 text-slate-700 shadow-sm'
                          }`}>
                            {index + 1}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Reference Image Drop Zone */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <ImageDropZone
                                currentImage={getReferenceImageById(arch.referenceImageId)}
                                onDrop={(img) => handleAssignArchetypeReferenceImage(arch.id, img)}
                                onRemove={() => handleAssignArchetypeReferenceImage(arch.id, null)}
                                label="arquetipo"
                                size="sm"
                              />
                            </div>

                            {/* Checkbox */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md'
                                : 'bg-white/80 border-2 border-slate-300 group-hover:border-violet-300'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className={`text-base font-semibold mb-1.5 leading-snug transition-colors ${
                          isSelected ? 'text-violet-900' : 'text-slate-800'
                        }`}>
                          {arch.name}
                        </h3>

                        {/* Summary */}
                        <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-2">
                          {arch.summary}
                        </p>

                        {/* Motivation Box */}
                        {arch.mainMotivation && (
                          <div className={`p-2.5 rounded-xl transition-all ${
                            isSelected
                              ? 'bg-violet-500/10 border border-violet-200/50'
                              : 'bg-white/60 border border-slate-200/50'
                          }`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${
                              isSelected ? 'text-violet-600' : 'text-slate-500'
                            }`}>
                              Motivación principal
                            </p>
                            <p className={`text-sm leading-snug ${isSelected ? 'text-violet-800' : 'text-slate-700'}`}>
                              {arch.mainMotivation.length > 55 ? arch.mainMotivation.slice(0, 55) + '...' : arch.mainMotivation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="max-w-6xl mx-auto mt-10 flex justify-end">
              <button
                onClick={handleGenerateAngles}
                disabled={actionLoading === 'angles' || selectedArchetypes.size === 0}
                className={`group relative flex items-center gap-3 px-8 py-3.5 rounded-full text-sm font-light transition-all overflow-hidden ${
                  actionLoading === 'angles' || selectedArchetypes.size === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                }`}
              >
                {actionLoading !== 'angles' && selectedArchetypes.size > 0 && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-violet-500/20 via-purple-500/30 to-violet-500/20" />
                  </>
                )}
                {actionLoading === 'angles' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando ángulos...
                  </>
                ) : (
                  <>
                    <span className="relative text-violet-100">Generar {selectedArchetypes.size * 5} Ángulos</span>
                    <ChevronRight className="relative w-4 h-4 text-violet-300 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Configure Angles - Grouped by Archetype */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Configurar Ángulos</h2>
                <p className="text-gray-600 text-lg mt-1">
                  Define cuántas imágenes y videos quieres generar por cada ángulo
                </p>
              </div>
              {/* Badge with dark gradient like sidebar */}
              <div className="relative px-5 py-2.5 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
                <span className="relative text-base font-semibold text-violet-100">
                  {angles.length} ángulos en {archetypes.filter((a) => a.selected).length} arquetipos
                </span>
              </div>
            </div>

            {/* Grouped by Archetype */}
            {Array.from(anglesByArchetype.entries()).map(([archId, archAngles]) => {
              const archetype = getArchetype(archId)
              if (!archetype) return null
              const colors = archetypeColorMap.get(archId) || ARCHETYPE_COLORS[0]
              const isExpanded = expandedArchetypes.has(archId)

              return (
                <Card key={archId} className={`border-2 ${colors.border} overflow-hidden shadow-sm`}>
                  <div
                    className={`${colors.bg} px-6 py-5 cursor-pointer`}
                    onClick={() => toggleArchetypeExpansion(archId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <FolderOpen className={`w-6 h-6 ${colors.text}`} />
                        ) : (
                          <Folder className={`w-6 h-6 ${colors.text}`} />
                        )}
                        <div>
                          <h3 className={`text-lg font-bold ${colors.text}`}>{archetype.name}</h3>
                          <p className="text-sm text-gray-700 font-medium">{archAngles.length} ángulos creativos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Apply to all angles inputs */}
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Aplicar a todos:</span>
                          <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200">
                            <Image className="w-3.5 h-3.5 text-blue-600" />
                            <input
                              type="number"
                              min="0"
                              max="10"
                              placeholder="0"
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0
                                const newConfigs = new Map(angleConfigs)
                                archAngles.forEach((angle) => {
                                  const currentConfig = newConfigs.get(angle.id) || { images: 0, videos: 0 }
                                  newConfigs.set(angle.id, { ...currentConfig, images: value })
                                })
                                setAngleConfigs(newConfigs)
                              }}
                              className="w-10 h-7 text-center font-semibold text-sm bg-transparent border-none outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-200">
                            <Video className="w-3.5 h-3.5 text-purple-600" />
                            <input
                              type="number"
                              min="0"
                              max="5"
                              placeholder="0"
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0
                                const newConfigs = new Map(angleConfigs)
                                archAngles.forEach((angle) => {
                                  const currentConfig = newConfigs.get(angle.id) || { images: 0, videos: 0 }
                                  newConfigs.set(angle.id, { ...currentConfig, videos: value })
                                })
                                setAngleConfigs(newConfigs)
                              }}
                              className="w-10 h-7 text-center font-semibold text-sm bg-transparent border-none outline-none"
                            />
                          </div>
                        </div>
                        {/* Reference Image for Archetype */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <ImageDropZone
                            currentImage={getReferenceImageById(archetype.referenceImageId)}
                            onDrop={(img) => handleAssignArchetypeReferenceImage(archId, img)}
                            onRemove={() => handleAssignArchetypeReferenceImage(archId, null)}
                            label="arquetipo"
                            size="md"
                          />
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 ${colors.text} transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="p-5 space-y-4 bg-gray-50/50">
                      {archAngles.map((angle, index) => {
                        const config = angleConfigs.get(angle.id) || { images: 0, videos: 0 }
                        const effectiveAngleImage = getEffectiveReferenceImageForAngle(angle.id)
                        return (
                          <div
                            key={angle.id}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between gap-6">
                              {/* Angle info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold overflow-hidden">
                                    <span className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                                    <span className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                                    <Target className="relative w-3 h-3 text-violet-300" />
                                    <span className="relative text-white">Ángulo {index + 1}</span>
                                  </span>
                                  {/* Show inherited reference image indicator */}
                                  {effectiveAngleImage.inheritedFrom && (
                                    <span className="text-xs text-purple-600 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-full">
                                      <ImageIcon className="w-3 h-3" />
                                      Heredada de arquetipo
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">{angle.title}</h4>
                                <p className="text-base text-gray-600 leading-relaxed">{angle.description}</p>
                              </div>
                              {/* Controls - right aligned, vertically centered */}
                              <div className="flex items-center gap-4">
                                {/* Reference Image for Angle */}
                                <ImageDropZone
                                  currentImage={effectiveAngleImage.image}
                                  inherited={!!effectiveAngleImage.inheritedFrom}
                                  inheritedFrom={effectiveAngleImage.inheritedFrom}
                                  onDrop={(img) => handleAssignAngleReferenceImage(angle.id, img)}
                                  onRemove={() => handleAssignAngleReferenceImage(angle.id, null)}
                                  label="ángulo"
                                  size="md"
                                />
                                {/* Images input */}
                                <div className="flex items-center gap-3 bg-blue-50 px-5 py-3 rounded-xl border border-blue-200">
                                  <Image className="w-6 h-6 text-blue-600" />
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={config.images}
                                    onChange={(e) => {
                                      const newConfigs = new Map(angleConfigs)
                                      newConfigs.set(angle.id, {
                                        ...config,
                                        images: parseInt(e.target.value) || 0,
                                      })
                                      setAngleConfigs(newConfigs)
                                    }}
                                    className="w-14 h-10 text-center font-bold text-xl bg-transparent border-none outline-none focus:ring-0"
                                  />
                                </div>
                                {/* Videos input */}
                                <div className="flex items-center gap-3 bg-purple-50 px-5 py-3 rounded-xl border border-purple-200">
                                  <Video className="w-6 h-6 text-purple-600" />
                                  <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={config.videos}
                                    onChange={(e) => {
                                      const newConfigs = new Map(angleConfigs)
                                      newConfigs.set(angle.id, {
                                        ...config,
                                        videos: parseInt(e.target.value) || 0,
                                      })
                                      setAngleConfigs(newConfigs)
                                    }}
                                    className="w-14 h-10 text-center font-bold text-xl bg-transparent border-none outline-none focus:ring-0"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  )}
                </Card>
              )
            })}

            <div className="flex justify-end pt-4">
              <button
                onClick={handleGeneratePrompts}
                disabled={actionLoading === 'prompts'}
                className={`group relative flex items-center gap-3 px-8 py-3.5 rounded-full text-sm font-light transition-all overflow-hidden ${
                  actionLoading === 'prompts'
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                }`}
              >
                {actionLoading !== 'prompts' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-violet-500/20 via-purple-500/30 to-violet-500/20" />
                  </>
                )}
                {actionLoading === 'prompts' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando prompts...
                  </>
                ) : (
                  <>
                    <FileText className="relative w-4 h-4 text-violet-300" />
                    <span className="relative text-violet-100">Generar Prompts</span>
                    <ChevronRight className="relative w-4 h-4 text-violet-300" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Prompts - Hierarchical View */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Seleccionar Prompts</h2>
                <p className="text-gray-700">
                  Elige los prompts que quieres enviar a producción
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (selectedPrompts.size === prompts.length) {
                      setSelectedPrompts(new Set())
                    } else {
                      setSelectedPrompts(new Set(prompts.map((p) => p.id)))
                    }
                  }}
                  className="px-5 py-2.5 text-sm font-light text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all"
                >
                  {selectedPrompts.size === prompts.length
                    ? 'Deseleccionar todos'
                    : 'Seleccionar todos'}
                </button>
                <div className="relative px-5 py-2.5 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                  <span className="relative text-sm font-light text-violet-100">
                    {selectedPrompts.size} / {prompts.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Hierarchical Tree: Archetype > Angle > Prompts */}
            {archetypes
              .filter((a) => a.selected)
              .map((archetype) => {
                const colors = archetypeColorMap.get(archetype.id) || ARCHETYPE_COLORS[0]
                const archAngles = anglesByArchetype.get(archetype.id) || []
                const isArchExpanded = expandedArchetypes.has(archetype.id)

                return (
                  <Card key={archetype.id} className={`border-2 ${colors.border} overflow-hidden`}>
                    {/* Archetype Header */}
                    <div
                      className={`${colors.bg} px-5 py-4 cursor-pointer`}
                      onClick={() => toggleArchetypeExpansion(archetype.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className={`w-5 h-5 ${colors.text}`} />
                          <div>
                            <h3 className={`font-semibold ${colors.text}`}>{archetype.name}</h3>
                            <p className="text-sm text-gray-700">
                              {archAngles.filter(a => (promptsByAngle.get(a.id)?.length || 0) > 0).length} ángulos ·{' '}
                              {archAngles.reduce(
                                (acc, a) => acc + (promptsByAngle.get(a.id)?.length || 0),
                                0
                              )}{' '}
                              prompts
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 ${colors.text} transition-transform ${
                            isArchExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {isArchExpanded && (
                      <CardContent className="p-4 space-y-4">
                        {archAngles
                          .filter((angle) => {
                            // Only show angles that have prompts
                            const anglePrompts = promptsByAngle.get(angle.id) || []
                            return anglePrompts.length > 0
                          })
                          .map((angle, angleIndex) => {
                          const anglePrompts = promptsByAngle.get(angle.id) || []
                          const isAngleExpanded = expandedAngles.has(angle.id)
                          const imagePrompts = anglePrompts.filter((p) => p.type === 'image')
                          const videoPrompts = anglePrompts.filter((p) => p.type === 'video')
                          const effectiveAngleImg = getEffectiveReferenceImageForAngle(angle.id)

                          return (
                            <div key={angle.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              {/* Angle Header */}
                              <div
                                className="bg-gradient-to-r from-slate-50 to-slate-100/80 px-5 py-4 cursor-pointer"
                                onClick={() => toggleAngleExpansion(angle.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {/* Icon with hamburger menu gradient */}
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                                      <Target className="relative w-5 h-5 text-violet-300" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs font-semibold tracking-wide shadow-sm">
                                          Ángulo {angleIndex + 1}
                                        </span>
                                        <span className="font-semibold text-slate-800 text-lg">
                                          {angle.title}
                                        </span>
                                        {effectiveAngleImg.inheritedFrom && (
                                          <span className="text-[10px] text-purple-500 flex items-center gap-0.5">
                                            <ImageIcon className="w-2.5 h-2.5" />
                                            De arquetipo
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                                        {imagePrompts.length} imágenes · {videoPrompts.length} videos
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {/* Reference Image for Angle in Step 3 */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <ImageDropZone
                                        currentImage={effectiveAngleImg.image}
                                        inherited={!!effectiveAngleImg.inheritedFrom}
                                        inheritedFrom={effectiveAngleImg.inheritedFrom}
                                        onDrop={(img) => handleAssignAngleReferenceImage(angle.id, img)}
                                        onRemove={() => handleAssignAngleReferenceImage(angle.id, null)}
                                        label="ángulo"
                                        size="sm"
                                      />
                                    </div>
                                    <ChevronDown
                                      className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                                        isAngleExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>

                              {isAngleExpanded && (
                                <div className="p-3 space-y-2">
                                  {/* Image Prompts */}
                                  {imagePrompts.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium px-2">
                                        <Image className="w-3 h-3" />
                                        Imágenes
                                      </div>
                                      {imagePrompts.map((prompt) => {
                                        const effectiveImg = getEffectiveReferenceImage(prompt.id)
                                        return (
                                          <PromptItem
                                            key={prompt.id}
                                            prompt={prompt}
                                            isSelected={selectedPrompts.has(prompt.id)}
                                            onToggle={() => {
                                              const newSet = new Set(selectedPrompts)
                                              if (newSet.has(prompt.id)) {
                                                newSet.delete(prompt.id)
                                              } else {
                                                newSet.add(prompt.id)
                                              }
                                              setSelectedPrompts(newSet)
                                            }}
                                            onUpdatePrompt={handleUpdatePromptText}
                                            effectiveImage={effectiveImg.image}
                                            inherited={!!effectiveImg.inheritedFrom}
                                            inheritedFrom={effectiveImg.inheritedFrom}
                                            onImageDrop={(img) => handleAssignPromptReferenceImage(prompt.id, img)}
                                            onImageRemove={() => handleAssignPromptReferenceImage(prompt.id, null)}
                                          />
                                        )
                                      })}
                                    </div>
                                  )}

                                  {/* Video Prompts */}
                                  {videoPrompts.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium px-2 mt-2">
                                        <Video className="w-3 h-3" />
                                        Videos
                                      </div>
                                      {videoPrompts.map((prompt) => {
                                        const effectiveImg = getEffectiveReferenceImage(prompt.id)
                                        return (
                                          <PromptItem
                                            key={prompt.id}
                                            prompt={prompt}
                                            isSelected={selectedPrompts.has(prompt.id)}
                                            onToggle={() => {
                                              const newSet = new Set(selectedPrompts)
                                              if (newSet.has(prompt.id)) {
                                                newSet.delete(prompt.id)
                                              } else {
                                                newSet.add(prompt.id)
                                              }
                                              setSelectedPrompts(newSet)
                                            }}
                                            onUpdatePrompt={handleUpdatePromptText}
                                            effectiveImage={effectiveImg.image}
                                            inherited={!!effectiveImg.inheritedFrom}
                                            inheritedFrom={effectiveImg.inheritedFrom}
                                            onImageDrop={(img) => handleAssignPromptReferenceImage(prompt.id, img)}
                                            onImageRemove={() => handleAssignPromptReferenceImage(prompt.id, null)}
                                          />
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </CardContent>
                    )}
                  </Card>
                )
              })}

            {/* Action Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 font-medium">
                    {prompts.filter((p) => p.type === 'image' && selectedPrompts.has(p.id)).length}{' '}
                    imágenes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-700 font-medium">
                    {prompts.filter((p) => p.type === 'video' && selectedPrompts.has(p.id)).length}{' '}
                    videos
                  </span>
                </div>
              </div>
              <Button
                onClick={handleProduceContent}
                disabled={actionLoading === 'produce' || selectedPrompts.size === 0}
                size="lg"
                className="gap-3 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {actionLoading === 'produce' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando a producción...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Producir {selectedPrompts.size} Contenidos
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Editor - Editar textos y overlays */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {/* Modal del editor inline - aparece sobre el contenido */}
            {editingPromptId && (() => {
              const prompt = prompts.find(p => p.id === editingPromptId)
              if (!prompt || !prompt.outputUrl) return null
              return (
                <InlineImageEditor
                  imageUrl={prompt.outputUrl}
                  initialTitle={prompt.suggestedTitle || '50% OFF'}
                  initialSubtitle={prompt.suggestedSubtitle || 'Tu próxima aventura'}
                  campaignId={id}
                  promptId={prompt.id}
                  onSave={(finalImageUrl) => {
                    console.log('[Editor] Imagen guardada:', finalImageUrl)
                    // Update both the prompt's outputUrl and the corresponding output's url
                    setState(prev => {
                      if (!prev) return prev
                      return {
                        ...prev,
                        prompts: prev.prompts.map(p =>
                          p.id === editingPromptId
                            ? { ...p, outputUrl: finalImageUrl }
                            : p
                        ),
                        outputs: prev.outputs.map(o =>
                          o.promptId === editingPromptId
                            ? { ...o, url: finalImageUrl }
                            : o
                        )
                      }
                    })
                    setEditedPromptIds(prev => new Set(prev).add(editingPromptId))
                    setEditingPromptId(null)
                  }}
                  onCancel={() => setEditingPromptId(null)}
                />
              )
            })()}

            {/* Lista de imágenes para editar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Editor de Imágenes</h2>
                <p className="text-gray-700">
                  Haz clic en una imagen para agregar texto y ajustar el diseño
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Botón actualizar si hay prompts en proceso */}
                {prompts.some(p => p.status === 'queued' || p.status === 'generating') && (
                  <Button
                    variant="outline"
                    onClick={handleCheckStatus}
                    disabled={actionLoading === 'check'}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${actionLoading === 'check' ? 'animate-spin' : ''}`} />
                    Actualizar estado
                  </Button>
                )}
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {prompts.filter(p => p.outputUrl && p.type === 'image').length} imágenes listas
                </Badge>
                {prompts.filter(p => (p.status === 'queued' || p.status === 'generating') && p.type === 'image').length > 0 && (
                  <Badge variant="outline" className="text-lg px-4 py-2 border-amber-500 text-amber-600">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {prompts.filter(p => (p.status === 'queued' || p.status === 'generating') && p.type === 'image').length} generando...
                  </Badge>
                )}
              </div>
            </div>

            {/* Grid de imágenes para editar - oculta las ya editadas */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {prompts
                .filter(p => p.outputUrl && p.type === 'image' && !editedPromptIds.has(p.id))
                .map((prompt) => {
                  const isEdited = editedPromptIds.has(prompt.id)
                  const angle = angles.find(a => a.id === prompt.angleId)
                  const archetype = archetypes.find(a => a.id === prompt.archetypeId)

                  return (
                    <div
                      key={prompt.id}
                      className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:shadow-violet-500/20 rounded-xl ${
                        isEdited ? 'ring-2 ring-green-500' : ''
                      }`}
                      onClick={() => setEditingPromptId(prompt.id)}
                    >
                      {/* Background gradient like sidebar */}
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-violet-950/90 rounded-xl" />
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 rounded-xl" />
                      {/* Border with gradient */}
                      <div className="absolute inset-0 rounded-xl border border-violet-500/20" />

                      <div className="relative">
                        <div className="relative aspect-square m-2 rounded-lg overflow-hidden">
                          <img
                            src={prompt.outputUrl}
                            alt={prompt.suggestedTitle || 'Imagen generada'}
                            className="w-full h-full object-cover"
                          />
                          {isEdited && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-green-500 text-white">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Editado
                              </Badge>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center">
                            <div className="opacity-0 hover:opacity-100 transition-opacity">
                              <Button variant="secondary" size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700 text-white border-0">
                                <Pencil className="w-4 h-4" />
                                Editar
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="px-3 pb-3 pt-1">
                          <div className="text-sm font-semibold text-white truncate">
                            {prompt.suggestedTitle || 'Sin título'}
                          </div>
                          <div className="text-xs text-violet-300/70 truncate">
                            {archetype?.name} • {angle?.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Mensaje cuando no hay imágenes listas pero hay en proceso */}
            {prompts.filter(p => p.outputUrl && p.type === 'image').length === 0 &&
             prompts.filter(p => (p.status === 'queued' || p.status === 'generating') && p.type === 'image').length > 0 && (
              <Card className="p-12 text-center border-amber-200 bg-amber-50">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-amber-500 animate-spin" />
                <h3 className="text-lg font-semibold text-amber-700 mb-2">
                  Generando imágenes...
                </h3>
                <p className="text-amber-600 mb-4">
                  {prompts.filter(p => (p.status === 'queued' || p.status === 'generating') && p.type === 'image').length} imágenes en proceso de generación.
                  <br />Presiona "Actualizar estado" para ver el progreso.
                </p>
                <Button
                  variant="outline"
                  onClick={handleCheckStatus}
                  disabled={actionLoading === 'check'}
                  className="gap-2 border-amber-500 text-amber-700 hover:bg-amber-100"
                >
                  <RefreshCw className={`w-4 h-4 ${actionLoading === 'check' ? 'animate-spin' : ''}`} />
                  Actualizar estado
                </Button>
              </Card>
            )}

            {/* Mensaje cuando no hay imágenes en absoluto */}
            {prompts.filter(p => p.outputUrl && p.type === 'image').length === 0 &&
             prompts.filter(p => (p.status === 'queued' || p.status === 'generating') && p.type === 'image').length === 0 && (
              <Card className="p-12 text-center">
                <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No hay imágenes para editar
                </h3>
                <p className="text-gray-500 mb-4">
                  Primero genera imágenes en el paso de Producción
                </p>
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Ir a Producción
                </Button>
              </Card>
            )}

            {/* Resumen y botón para continuar */}
            {prompts.filter(p => p.outputUrl && p.type === 'image').length > 0 && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-green-600">{editedPromptIds.size}</span> de{' '}
                  <span className="font-semibold">{prompts.filter(p => p.outputUrl && p.type === 'image').length}</span>{' '}
                  imágenes editadas
                </div>
                <Button
                  onClick={() => setCurrentStep(5)}
                  className="gap-2"
                >
                  Continuar a Resultados
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Results - Hierarchical Gallery */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Contenido Generado</h2>
                <p className="text-gray-700">
                  Visualiza todo el contenido organizado por arquetipo y ángulo
                </p>
              </div>
              <div className="flex items-center gap-3">
                {prompts.some((p) => p.status === 'queued' || p.status === 'generating') && (
                  <Button
                    variant="outline"
                    onClick={handleCheckStatus}
                    disabled={actionLoading === 'check'}
                    className="gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${actionLoading === 'check' ? 'animate-spin' : ''}`}
                    />
                    Actualizar estado
                  </Button>
                )}
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {outputs.length} archivos generados
                </Badge>
              </div>
            </div>

            {/* Stats - Dark Minimal Design with Hamburger Menu Gradient */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  value: outputs.filter((o) => o.type === 'image').length,
                  label: 'Imágenes',
                  icon: Image
                },
                {
                  value: outputs.filter((o) => o.type === 'video').length,
                  label: 'Videos',
                  icon: Video
                },
                {
                  value: prompts.filter((p) => p.status === 'queued' || p.status === 'generating').length,
                  label: 'En proceso',
                  icon: Loader2,
                  spinning: prompts.some((p) => p.status === 'queued' || p.status === 'generating')
                },
                {
                  value: prompts.filter((p) => p.status === 'failed').length,
                  label: 'Fallidos',
                  icon: AlertCircle
                },
              ].map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div
                    key={i}
                    className="group relative rounded-xl overflow-hidden"
                  >
                    {/* Hamburger menu gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                    {/* Top border glow */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

                    <div className="relative p-5 flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-semibold text-white">{stat.value}</p>
                        <p className="text-sm text-violet-200/60 mt-1">{stat.label}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Icon className={`w-5 h-5 text-violet-300 ${stat.spinning ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Hierarchical Results View */}
            {archetypes
              .filter((a) => {
                // Only show archetypes that have content
                const archOutputs = outputsByArchetype.get(a.id)
                const archAngles = anglesByArchetype.get(a.id) || []
                const totalOutputs = archAngles.reduce((acc, angle) => {
                  return acc + (archOutputs?.get(angle.id)?.length || 0)
                }, 0)
                return a.selected && totalOutputs > 0
              })
              .map((archetype) => {
                const colors = archetypeColorMap.get(archetype.id) || ARCHETYPE_COLORS[0]
                const archAngles = anglesByArchetype.get(archetype.id) || []
                const isArchExpanded = expandedArchetypes.has(archetype.id)
                const archOutputs = outputsByArchetype.get(archetype.id)
                const totalArchOutputs = archAngles.reduce((acc, angle) => {
                  return acc + (archOutputs?.get(angle.id)?.length || 0)
                }, 0)
                // Count only angles with content
                const anglesWithContent = archAngles.filter((angle) => {
                  return (archOutputs?.get(angle.id)?.length || 0) > 0
                }).length

                return (
                  <Card key={archetype.id} className={`border-2 ${colors.border} overflow-hidden`}>
                    {/* Archetype Header */}
                    <div
                      className={`${colors.bg} px-5 py-4 cursor-pointer`}
                      onClick={() => toggleArchetypeExpansion(archetype.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className={`w-6 h-6 ${colors.text}`} />
                          <div>
                            <h3 className={`text-lg font-semibold ${colors.text}`}>
                              {archetype.name}
                            </h3>
                            <p className="text-sm text-gray-700">
                              {anglesWithContent} ángulos · {totalArchOutputs} contenidos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${colors.badge} ${colors.text}`}>
                            {totalArchOutputs} archivos
                          </Badge>
                          <ChevronDown
                            className={`w-5 h-5 ${colors.text} transition-transform ${
                              isArchExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {isArchExpanded && (
                      <CardContent className="p-4 space-y-4">
                        {archAngles
                          .filter((angle) => {
                            // Only show angles that have outputs (content generated)
                            const angleOutputs = archOutputs?.get(angle.id) || []
                            return angleOutputs.length > 0
                          })
                          .map((angle, angleIndex) => {
                          const angleOutputs = archOutputs?.get(angle.id) || []
                          const anglePromptsList = promptsByAngle.get(angle.id) || []
                          const isAngleExpanded = expandedAngles.has(angle.id)

                          return (
                            <div key={angle.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              {/* Angle Header */}
                              <div
                                className="bg-gradient-to-r from-slate-50 to-slate-100/80 px-5 py-4 cursor-pointer"
                                onClick={() => toggleAngleExpansion(angle.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {/* Icon with hamburger menu gradient */}
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                                      <Target className="relative w-5 h-5 text-violet-300" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs font-semibold tracking-wide shadow-sm">
                                          Ángulo {angleIndex + 1}
                                        </span>
                                        <span className="font-semibold text-slate-800 text-lg">{angle.title}</span>
                                      </div>
                                      <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                                        {angle.description}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="relative px-4 py-2 rounded-full overflow-hidden">
                                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600" />
                                      <span className="relative text-sm font-semibold text-white">
                                        {angleOutputs.length} contenidos
                                      </span>
                                    </div>
                                    <ChevronDown
                                      className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                                        isAngleExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>

                              {isAngleExpanded && (
                                <div className="p-4">
                                  {/* Gallery */}
                                  {angleOutputs.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {angleOutputs.map((output) => (
                                        <a
                                          key={output.id}
                                          href={output.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                        >
                                          {output.type === 'image' ? (
                                            <img
                                              src={output.url}
                                              alt="Generated content"
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                              <Play className="w-12 h-12 text-white" />
                                            </div>
                                          )}
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                          <Badge
                                            className={`absolute top-2 left-2 ${
                                              output.type === 'image'
                                                ? 'bg-blue-500'
                                                : 'bg-purple-500'
                                            }`}
                                          >
                                            {output.type === 'image' ? (
                                              <Image className="w-3 h-3" />
                                            ) : (
                                              <Video className="w-3 h-3" />
                                            )}
                                          </Badge>
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-gray-600">
                                      {anglePromptsList.some((p) => p.status === 'generating') ? (
                                        <div className="flex items-center justify-center gap-2">
                                          <Loader2 className="w-5 h-5 animate-spin" />
                                          Generando contenido...
                                        </div>
                                      ) : (
                                        'No hay contenido generado para este ángulo'
                                      )}
                                    </div>
                                  )}

                                  {/* Prompts Status */}
                                  <div className="mt-4 pt-4 border-t">
                                    <h5 className="text-xs font-medium text-gray-700 mb-2">
                                      Estado de los prompts:
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                      {anglePromptsList.map((prompt, i) => (
                                        <Badge
                                          key={prompt.id}
                                          variant="outline"
                                          className={`text-xs ${
                                            prompt.status === 'done'
                                              ? 'border-green-300 text-green-700 bg-green-50'
                                              : prompt.status === 'generating'
                                              ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                                              : prompt.status === 'failed'
                                              ? 'border-red-300 text-red-700 bg-red-50'
                                              : ''
                                          }`}
                                        >
                                          {prompt.type === 'image' ? '🖼️' : '🎬'} #{i + 1}:{' '}
                                          {prompt.status}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </CardContent>
                    )}
                  </Card>
                )
              })}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-8 pb-4">
              {/* Ir a Campañas Button */}
              <Link href="/studio">
                <button
                  className="group relative flex items-center gap-3 px-8 py-4 rounded-full text-sm font-medium transition-all overflow-hidden text-white shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                >
                  {/* Background gradient like sidebar/hamburger menu */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-violet-500/20 via-purple-500/30 to-violet-500/20" />
                  {/* Top border glow */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

                  <Layers className="relative w-5 h-5 text-violet-300" />
                  <span className="relative text-violet-100">Ir a Campañas</span>
                  <ChevronRight className="relative w-5 h-5 text-violet-300 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Step 6: Gallery - Content Gallery with Drag Scroll */}
        {currentStep === 6 && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Galería de Contenido</h2>
                <p className="text-gray-600">
                  {outputs.filter(o => o.type === 'image').length} imágenes · {outputs.filter(o => o.type === 'video').length} videos
                </p>
              </div>
            </div>

            {/* Main content grid - Gallery left, Actions right */}
            <div className="flex gap-6">
              {/* Left column - Galleries with max width */}
              <div className="flex-1 min-w-0 max-w-[calc(100%-320px)] space-y-8">
                {/* Images Gallery */}
                {outputs.filter(o => o.type === 'image').length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-slate-900 via-violet-600 to-purple-500 bg-clip-text text-transparent">
                      IMÁGENES
                    </h3>
                <div className="relative group/gallery">
                  {/* Scroll indicator - Right edge */}
                  <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none opacity-80 group-hover/gallery:opacity-100 transition-opacity flex items-center justify-end pr-2">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center animate-pulse">
                      <ChevronRight className="w-5 h-5 text-violet-500" />
                    </div>
                  </div>
                <div
                  className="gallery-scroll-container overflow-x-auto pb-4 cursor-grab active:cursor-grabbing scroll-smooth"
                  onMouseDown={(e) => {
                    const container = e.currentTarget
                    container.dataset.isDown = 'true'
                    container.dataset.startX = String(e.pageX - container.offsetLeft)
                    container.dataset.scrollLeft = String(container.scrollLeft)
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.dataset.isDown = 'false'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.dataset.isDown = 'false'
                  }}
                  onMouseMove={(e) => {
                    const container = e.currentTarget
                    if (container.dataset.isDown !== 'true') return
                    e.preventDefault()
                    const x = e.pageX - container.offsetLeft
                    const walk = (x - Number(container.dataset.startX)) * 2
                    container.scrollLeft = Number(container.dataset.scrollLeft) - walk
                  }}
                >
                  <div className="flex gap-3" style={{ height: 'calc(180px * 2 + 12px)' }}>
                    {/* Create columns of 2 images */}
                    {(() => {
                      const images = outputs.filter(o => o.type === 'image')
                      const columns: GeneratedContent[][] = []
                      for (let i = 0; i < images.length; i += 2) {
                        columns.push(images.slice(i, i + 2))
                      }
                      return columns.map((column, colIndex) => (
                        <div key={colIndex} className="flex flex-col gap-3 flex-shrink-0">
                          {column.map((output) => {
                            const isApproved = approvedForClientIds.has(output.id)
                            return (
                              <div
                                key={output.id}
                                draggable={!isApproved}
                                onDragStart={(e) => !isApproved && handleContentDragStart(e, output)}
                                onDragEnd={handleContentDragEnd}
                                onMouseEnter={() => handlePreviewMouseEnter(output)}
                                onMouseLeave={handlePreviewMouseLeave}
                                className={`relative w-[240px] h-[180px] rounded-xl overflow-hidden bg-slate-100 transition-all cursor-grab active:cursor-grabbing ${
                                  isApproved
                                    ? 'ring-2 ring-emerald-500 opacity-60'
                                    : 'hover:ring-2 hover:ring-violet-400'
                                } ${draggingContent?.id === output.id ? 'opacity-50 scale-95' : ''}`}
                              >
                                <img
                                  src={output.url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  draggable={false}
                                />
                                {/* Approved badge */}
                                {isApproved && (
                                  <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}
                                {/* Drag hint */}
                                {!isApproved && (
                                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md opacity-0 hover:opacity-100 transition-opacity">
                                    Arrastra para aprobar
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))
                    })()}
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Videos Gallery */}
            {outputs.filter(o => o.type === 'video').length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-slate-900 via-violet-600 to-purple-500 bg-clip-text text-transparent">
                  VIDEOS
                </h3>
                <div className="relative group/gallery">
                  {/* Scroll indicator - Right edge */}
                  <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none opacity-80 group-hover/gallery:opacity-100 transition-opacity flex items-center justify-end pr-2">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center animate-pulse">
                      <ChevronRight className="w-5 h-5 text-violet-500" />
                    </div>
                  </div>
                <div
                  className="gallery-scroll-container overflow-x-auto pb-4 cursor-grab active:cursor-grabbing scroll-smooth"
                  onMouseDown={(e) => {
                    const container = e.currentTarget
                    container.dataset.isDown = 'true'
                    container.dataset.startX = String(e.pageX - container.offsetLeft)
                    container.dataset.scrollLeft = String(container.scrollLeft)
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.dataset.isDown = 'false'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.dataset.isDown = 'false'
                  }}
                  onMouseMove={(e) => {
                    const container = e.currentTarget
                    if (container.dataset.isDown !== 'true') return
                    e.preventDefault()
                    const x = e.pageX - container.offsetLeft
                    const walk = (x - Number(container.dataset.startX)) * 2
                    container.scrollLeft = Number(container.dataset.scrollLeft) - walk
                  }}
                >
                  <div className="flex gap-3" style={{ height: 'calc(180px * 2 + 12px)' }}>
                    {/* Create columns of 2 videos */}
                    {(() => {
                      const videos = outputs.filter(o => o.type === 'video')
                      const columns: GeneratedContent[][] = []
                      for (let i = 0; i < videos.length; i += 2) {
                        columns.push(videos.slice(i, i + 2))
                      }
                      return columns.map((column, colIndex) => (
                        <div key={colIndex} className="flex flex-col gap-3 flex-shrink-0">
                          {column.map((output) => {
                            const isApproved = approvedForClientIds.has(output.id)
                            return (
                              <div
                                key={output.id}
                                draggable={!isApproved}
                                onDragStart={(e) => !isApproved && handleContentDragStart(e, output)}
                                onDragEnd={handleContentDragEnd}
                                onMouseEnter={() => handlePreviewMouseEnter(output)}
                                onMouseLeave={handlePreviewMouseLeave}
                                className={`relative w-[240px] h-[180px] rounded-xl overflow-hidden bg-slate-900 transition-all cursor-grab active:cursor-grabbing group ${
                                  isApproved
                                    ? 'ring-2 ring-emerald-500 opacity-60'
                                    : 'hover:ring-2 hover:ring-violet-400'
                                } ${draggingContent?.id === output.id ? 'opacity-50 scale-95' : ''}`}
                              >
                                <video
                                  src={output.url}
                                  className="w-full h-full object-cover"
                                  muted
                                  loop
                                  onMouseEnter={(e) => e.currentTarget.play()}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.pause()
                                    e.currentTarget.currentTime = 0
                                  }}
                                  draggable={false}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none">
                                  <Play className="w-10 h-10 text-white/80 group-hover:scale-110 transition-transform" />
                                </div>
                                {/* Approved badge */}
                                {isApproved && (
                                  <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full z-10">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}
                                {/* Drag hint */}
                                {!isApproved && (
                                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    Arrastra para aprobar
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))
                    })()}
                  </div>
                </div>
                </div>
              </div>
            )}
              </div>

              {/* Right column - Actions Panel (fixed width) */}
              <div className="w-[280px] flex-shrink-0 space-y-6 sticky top-4 self-start">
                {/* Download Buttons */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Descargas</h4>
                  {outputs.filter(o => o.type === 'image').length > 0 && (
                    <button
                      onClick={handleDownloadImagesZip}
                      disabled={actionLoading === 'download-images'}
                      className="group relative flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-violet-500/20 via-purple-500/30 to-violet-500/20" />
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
                      {actionLoading === 'download-images' ? (
                        <Loader2 className="relative w-4 h-4 text-violet-300 animate-spin" />
                      ) : (
                        <Download className="relative w-4 h-4 text-violet-300" />
                      )}
                      <span className="relative text-violet-100">Imágenes ZIP</span>
                    </button>
                  )}
                  {outputs.filter(o => o.type === 'video').length > 0 && (
                    <button
                      onClick={handleDownloadVideosZip}
                      disabled={actionLoading === 'download-videos'}
                      className="group relative flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-violet-500/20 via-purple-500/30 to-violet-500/20" />
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
                      {actionLoading === 'download-videos' ? (
                        <Loader2 className="relative w-4 h-4 text-violet-300 animate-spin" />
                      ) : (
                        <Download className="relative w-4 h-4 text-violet-300" />
                      )}
                      <span className="relative text-violet-100">Videos ZIP</span>
                    </button>
                  )}
                </div>

                {/* Approval Drop Zone - Vertical */}
                {outputs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Aprobar para Cliente</h4>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsOverApprovalZone(true)
                      }}
                      onDragLeave={() => setIsOverApprovalZone(false)}
                      onDrop={handleApprovalDrop}
                      className={`relative min-h-[300px] rounded-2xl border-2 border-dashed transition-all duration-300 ${
                        isOverApprovalZone
                          ? 'border-emerald-500 bg-emerald-50 scale-[1.02]'
                          : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                      } ${draggingContent ? 'ring-2 ring-emerald-300' : ''}`}
                    >
                      <div className="p-4">
                        {approvedForClientIds.size === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[280px]">
                            <Send className={`w-10 h-10 mb-3 transition-colors ${
                              isOverApprovalZone ? 'text-emerald-500' : 'text-slate-400'
                            }`} />
                            <p className={`text-center text-sm font-medium ${
                              isOverApprovalZone ? 'text-emerald-600' : 'text-slate-500'
                            }`}>
                              {isOverApprovalZone ? '¡Suelta!' : 'Arrastra aquí'}
                            </p>
                            <p className="text-slate-400 text-xs mt-1 text-center">
                              Para enviar a galería
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Approved items - vertical list */}
                            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                              {outputs
                                .filter(o => approvedForClientIds.has(o.id))
                                .map((content) => (
                                  <div
                                    key={content.id}
                                    className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group"
                                  >
                                    {content.type === 'image' ? (
                                      <img
                                        src={content.url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <video
                                        src={content.url}
                                        className="w-full h-full object-cover"
                                        muted
                                      />
                                    )}
                                    <button
                                      onClick={() => handleRemoveFromApproved(content.id)}
                                      className="absolute top-2 right-2 bg-black/40 text-white/70 p-1.5 rounded-full hover:bg-red-500/80 hover:text-white transition-all"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded">
                                      {content.type === 'image' ? 'IMG' : 'VID'}
                                    </div>
                                  </div>
                                ))}
                            </div>
                            <p className="text-emerald-600 text-sm font-medium text-center">
                              {approvedForClientIds.size} aprobado{approvedForClientIds.size !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                      {draggingContent && (
                        <div className={`absolute inset-0 rounded-2xl transition-all pointer-events-none ${
                          isOverApprovalZone ? 'bg-emerald-500/20' : 'bg-slate-500/10'
                        }`} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Empty State */}
            {outputs.length === 0 && (
              <div className="text-center py-16">
                <Images className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay contenido generado todavía</p>
                <p className="text-gray-400 text-sm">Genera contenido en el paso de Producción</p>
              </div>
            )}

            {/* Go to Campaigns Button */}
            <div className="flex justify-center pt-8 pb-4">
              <Link href="/studio">
                <button
                  className="group relative flex items-center gap-3 px-8 py-4 rounded-full text-sm font-medium transition-all overflow-hidden text-white shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                >
                  {/* Background gradient like sidebar/hamburger menu */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/20 to-violet-500/10" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-violet-500/20 via-purple-500/30 to-violet-500/20" />
                  {/* Top border glow */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

                  <Layers className="relative w-5 h-5 text-violet-300" />
                  <span className="relative text-violet-100">Ir a Campañas</span>
                  <ChevronRight className="relative w-5 h-5 text-violet-300 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Floating Navigation Bar - Minimal */}
      {maxReachedStep > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2.5 shadow-lg border border-slate-200/50">
            {/* Left Arrow */}
            <button
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                currentStep === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50'
              }`}
              title={currentStep > 0 ? STEPS[currentStep - 1].label : ''}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              {STEPS.map((step, index) => {
                const isResultsStep = step.id === 'results'
                const isGalleryStep = step.id === 'gallery'
                const isAlwaysAccessible = isResultsStep || isGalleryStep
                const isReachable = index <= maxReachedStep || isAlwaysAccessible
                return (
                <button
                  key={step.id}
                  onClick={() => isReachable && setCurrentStep(index)}
                  disabled={!isReachable}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    index === currentStep
                      ? 'bg-violet-600 scale-125 shadow-sm shadow-violet-300'
                      : isAlwaysAccessible
                      ? 'bg-violet-400 hover:scale-110'
                      : index <= maxReachedStep
                      ? 'bg-emerald-400 hover:scale-110'
                      : 'bg-slate-200'
                  }`}
                  title={step.label}
                />
              )
              })}
            </div>

            {/* Right Arrow */}
            {(() => {
              const galleryStepIndex = STEPS.findIndex(s => s.id === 'gallery')
              const canGoNext = currentStep < maxReachedStep || currentStep < galleryStepIndex
              const isDisabled = !canGoNext || currentStep >= STEPS.length - 1
              return (
                <button
                  onClick={goToNextStep}
                  disabled={isDisabled}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    isDisabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50'
                  }`}
                  title={!isDisabled && currentStep < STEPS.length - 1 ? STEPS[currentStep + 1].label : ''}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )
            })()}
          </div>
        </div>
      )}

      {/* Reference Images Panel - Always visible when there are reference images */}
      {state?.referenceImages && state.referenceImages.length > 0 && (
        <ReferenceImagePanel
          images={state.referenceImages}
          isOpen={isRefImagePanelOpen}
          onToggle={() => setIsRefImagePanelOpen(!isRefImagePanelOpen)}
          onImageDragStart={(img) => setDraggingImage(img)}
          onAddImages={handleAddReferenceImages}
          onRemoveImage={handleRemoveReferenceImage}
        />
      )}

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
              <img
                src={previewContent.url}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={previewContent.url}
                className="w-full h-full object-contain"
                autoPlay
                muted
                loop
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Prompt Item Component
function PromptItem({
  prompt,
  isSelected,
  onToggle,
  onUpdatePrompt,
  effectiveImage,
  inherited,
  inheritedFrom,
  onImageDrop,
  onImageRemove,
}: {
  prompt: ContentPrompt
  isSelected: boolean
  onToggle: () => void
  onUpdatePrompt?: (promptId: string, newText: string) => void
  effectiveImage?: ReferenceImage | null
  inherited?: boolean
  inheritedFrom?: 'archetype' | 'angle'
  onImageDrop?: (image: ReferenceImage) => void
  onImageRemove?: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(prompt.text)
  const isDisabled = prompt.status !== 'draft'

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
    if (isEditing) {
      setIsEditing(false)
      setEditedText(prompt.text)
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setIsExpanded(true)
  }

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onUpdatePrompt && editedText !== prompt.text) {
      onUpdatePrompt(prompt.id, editedText)
    }
    setIsEditing(false)
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditedText(prompt.text)
    setIsEditing(false)
  }

  return (
    <div
      onClick={() => !isDisabled && !isEditing && onToggle()}
      className={`p-3 rounded-lg transition-all ${!isEditing ? 'cursor-pointer' : ''} ${
        isDisabled
          ? prompt.status === 'done'
            ? 'bg-green-50 border border-green-200'
            : prompt.status === 'generating'
            ? 'bg-yellow-50 border border-yellow-200'
            : prompt.status === 'failed'
            ? 'bg-red-50 border border-red-200'
            : 'bg-gray-50'
          : isSelected
          ? 'bg-blue-50 border-2 border-blue-300'
          : 'bg-white border border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {!isDisabled && <Checkbox checked={isSelected} />}
        {prompt.status === 'generating' && (
          <Loader2 className="w-4 h-4 animate-spin text-yellow-600 flex-shrink-0 mt-0.5" />
        )}
        {prompt.status === 'done' && (
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
        )}
        {prompt.status === 'failed' && (
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-2 text-sm text-gray-800 border border-gray-300 rounded-md focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
                rows={8}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={`text-sm text-gray-800 ${isExpanded ? '' : 'line-clamp-2'}`}>
                {prompt.text}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleExpandToggle}
                  className="text-xs text-violet-600 hover:text-violet-800 hover:underline inline-flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Ver más
                    </>
                  )}
                </button>
                {!isDisabled && onUpdatePrompt && (
                  <button
                    onClick={handleEditClick}
                    className="text-xs text-gray-500 hover:text-gray-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar
                  </button>
                )}
                {prompt.outputUrl && (
                  <a
                    href={prompt.outputUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="w-3 h-3" />
                    Ver resultado
                  </a>
                )}
              </div>
            </>
          )}
          {inherited && inheritedFrom && (
            <span className="text-[10px] text-purple-500 flex items-center gap-0.5 mt-1">
              <ImageIcon className="w-2.5 h-2.5" />
              Ref de {inheritedFrom === 'archetype' ? 'arquetipo' : 'ángulo'}
            </span>
          )}
        </div>
        {/* Reference Image Drop Zone for Prompt */}
        {onImageDrop && (
          <div onClick={(e) => e.stopPropagation()}>
            <ImageDropZone
              currentImage={effectiveImage || null}
              inherited={inherited}
              inheritedFrom={inheritedFrom}
              onDrop={onImageDrop}
              onRemove={onImageRemove}
              label="prompt"
              size="sm"
            />
          </div>
        )}
        <Badge
          variant="outline"
          className={`text-xs flex-shrink-0 ${
            prompt.type === 'image' ? 'text-blue-600' : 'text-purple-600'
          }`}
        >
          {prompt.type === 'image' ? <Image className="w-3 h-3" /> : <Video className="w-3 h-3" />}
        </Badge>
      </div>
    </div>
  )
}
