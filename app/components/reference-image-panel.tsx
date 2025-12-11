'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Image as ImageIcon, GripVertical, Plus, Trash2, Images, Sparkles, Upload } from 'lucide-react'
import type { ReferenceImage } from '@/lib/types/campaign-types'

interface ReferenceImagePanelProps {
  images: ReferenceImage[]
  isOpen: boolean
  onToggle: () => void
  onImageDragStart: (image: ReferenceImage) => void
  onAddImages?: (images: ReferenceImage[]) => void
  onRemoveImage?: (imageId: string) => void
}

export function ReferenceImagePanel({
  images,
  isOpen,
  onToggle,
  onImageDragStart,
  onAddImages,
  onRemoveImage,
}: ReferenceImagePanelProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-show on hover
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovering(true)
  }, [])

  // Auto-hide on mouse leave (with delay)
  const handleMouseLeave = useCallback(() => {
    if (!isPinned) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovering(false)
      }, 300) // Small delay before hiding
    }
  }, [isPinned])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, image: ReferenceImage) => {
    e.dataTransfer.setData('application/json', JSON.stringify(image))
    e.dataTransfer.effectAllowed = 'copy'
    onImageDragStart(image)
  }, [onImageDragStart])

  // Process image files (used by both drop and file input)
  const processImageFiles = useCallback((files: FileList | File[]) => {
    if (!onAddImages) return

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (!imageFiles.length) return

    setIsUploading(true)
    let processedCount = 0

    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        const img = new window.Image()
        img.onload = () => {
          const newImage: ReferenceImage = {
            id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            campaignId: '',
            filename: file.name,
            url: url,
            width: img.width,
            height: img.height,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          }
          onAddImages([newImage])
          processedCount++
          if (processedCount >= imageFiles.length) {
            setIsUploading(false)
          }
        }
        img.src = url
      }
      reader.readAsDataURL(file)
    })
  }, [onAddImages])

  // Handle file drop for adding new images
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)

    if (!onAddImages) return

    const files = e.dataTransfer.files
    if (!files.length) return

    processImageFiles(files)
  }, [onAddImages, processImageFiles])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files.length) return

    processImageFiles(files)

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [processImageFiles])

  // Trigger file input click
  const handleAddImagesClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const showPanel = isHovering || isPinned

  return (
    <>
      {/* Hidden file input for uploading images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Hover trigger zone - invisible area on the right edge */}
      <div
        className="fixed right-0 top-0 h-full w-4 z-40"
        onMouseEnter={handleMouseEnter}
      />

      {/* Collapsed indicator tab */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ease-out ${
          showPanel ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
        onMouseEnter={handleMouseEnter}
      >
        <div className="relative flex flex-col items-center gap-1 text-white px-2 py-4 rounded-l-2xl shadow-2xl cursor-pointer group overflow-hidden">
          {/* Background gradient like sidebar */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-violet-950/90" />
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-purple-500/10" />
          {/* Left border with gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/30 via-purple-500/50 to-violet-500/30" />
          {/* Hover effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/10 group-hover:to-purple-500/10 transition-all duration-300" />

          <Images className="relative w-5 h-5 text-violet-300" />
          <div
            className="relative text-xs font-semibold tracking-wide text-violet-200"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            REFERENCIAS
          </div>
          {images.length > 0 && (
            <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mt-1 shadow-lg shadow-violet-500/30">
              <span className="text-xs font-bold">{images.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-full z-50 transition-all duration-300 ease-out ${
          showPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative h-full w-80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Background gradient like sidebar */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-violet-950/90" />
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />
          {/* Left border with gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/20 via-purple-500/30 to-violet-500/20" />

          {/* Header */}
          <div className="relative p-5 border-b border-violet-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Images className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Referencias
                  </h3>
                  <p className="text-xs text-violet-300/70">
                    {images.length} imagen{images.length !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>

              {/* Pin button */}
              <button
                onClick={() => setIsPinned(!isPinned)}
                className={`p-2 rounded-lg transition-all ${
                  isPinned
                    ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50'
                    : 'text-slate-400 hover:bg-violet-500/10 hover:text-violet-300'
                }`}
                title={isPinned ? 'Desfijar panel' : 'Fijar panel'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Arrastra las imágenes hacia arquetipos, ángulos o prompts
            </p>
          </div>

          {/* Images Grid */}
          <div className="relative flex-1 overflow-y-auto p-4 custom-scrollbar">
            {images.length === 0 ? (
              <div
                onClick={handleAddImagesClick}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer hover:bg-slate-800/50 ${
                  isDraggingOver
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-700 hover:border-violet-500/50'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8 text-violet-400" />
                </div>
                <p className="text-base font-medium text-slate-300 mb-1">
                  Agregar imágenes
                </p>
                <p className="text-sm text-slate-500">
                  Haz clic o arrastra imágenes aquí
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, image)}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-slate-800 cursor-grab active:cursor-grabbing ring-2 ring-transparent hover:ring-violet-500/50 transition-all duration-200 shadow-lg"
                  >
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      draggable={false}
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    {/* Drag indicator */}
                    <div className="absolute top-2 left-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Image number badge */}
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>

                    {/* Delete button */}
                    {onRemoveImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveImage(image.id)
                        }}
                        className="absolute bottom-2 right-2 p-2 bg-red-500/90 backdrop-blur-sm rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Filename */}
                    <div className="absolute bottom-2 left-2 right-12 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <p className="text-xs font-medium text-white truncate">
                        {image.filename}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone for adding more images */}
            {images.length > 0 && onAddImages && (
              <div
                onClick={handleAddImagesClick}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true) }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleFileDrop}
                className={`mt-4 border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer hover:border-violet-500/50 hover:bg-slate-800/50 ${
                  isDraggingOver
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-700/50'
                } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
              >
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Agregar más imágenes</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer with tips */}
          <div className="relative p-4 border-t border-violet-500/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-violet-200 mb-0.5">
                  Tip: Drag & Drop
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Arrastra imágenes sobre cualquier elemento para asociarlas como referencia visual
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </>
  )
}

// Component to display the assigned reference image thumbnail
interface ReferenceImageThumbnailProps {
  image: ReferenceImage | null
  size?: 'sm' | 'md' | 'lg'
  onRemove?: () => void
  inherited?: boolean
  inheritedFrom?: 'archetype' | 'angle'
  className?: string
}

export function ReferenceImageThumbnail({
  image,
  size = 'sm',
  onRemove,
  inherited = false,
  inheritedFrom,
  className = '',
}: ReferenceImageThumbnailProps) {
  if (!image) return null

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div className={`relative group ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-lg overflow-hidden ring-2 ${
          inherited ? 'ring-dashed ring-purple-400/50' : 'ring-violet-500'
        } bg-slate-800 shadow-lg`}
        title={inherited ? `Heredada de ${inheritedFrom === 'archetype' ? 'arquetipo' : 'ángulo'}` : 'Imagen de referencia'}
      >
        <img
          src={image.url}
          alt={image.filename}
          className="w-full h-full object-cover"
        />
        {inherited && (
          <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
            <span className="text-[8px] text-purple-300 font-bold bg-slate-900/80 px-1.5 py-0.5 rounded">
              {inheritedFrom === 'archetype' ? 'ARQ' : 'ANG'}
            </span>
          </div>
        )}
      </div>
      {onRemove && !inherited && (
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// Drop zone component for receiving dragged images
interface ImageDropZoneProps {
  onDrop: (image: ReferenceImage) => void
  currentImage?: ReferenceImage | null
  inherited?: boolean
  inheritedFrom?: 'archetype' | 'angle'
  onRemove?: () => void
  label?: string
  size?: 'sm' | 'md'
}

export function ImageDropZone({
  onDrop,
  currentImage,
  inherited = false,
  inheritedFrom,
  onRemove,
  label = 'Ref. Image',
  size = 'sm',
}: ImageDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = e.dataTransfer.getData('application/json')
      if (data) {
        const image = JSON.parse(data) as ReferenceImage
        onDrop(image)
      }
    } catch (err) {
      console.error('Error parsing dropped image:', err)
    }
  }, [onDrop])

  const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14'

  if (currentImage) {
    return (
      <ReferenceImageThumbnail
        image={currentImage}
        size={size === 'sm' ? 'sm' : 'md'}
        onRemove={onRemove}
        inherited={inherited}
        inheritedFrom={inheritedFrom}
      />
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${sizeClasses} rounded-xl ${
        isDragOver
          ? 'bg-violet-500 scale-110 shadow-lg shadow-violet-300/50'
          : 'bg-slate-900 hover:bg-slate-800 shadow-sm'
      } flex items-center justify-center transition-all duration-200 cursor-pointer`}
      title={`Arrastra una imagen aquí para ${label}`}
    >
      <ImageIcon className={`${isDragOver ? 'text-white' : 'text-white/70'} w-4 h-4 transition-colors`} />
    </div>
  )
}
