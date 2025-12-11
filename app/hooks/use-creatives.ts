import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

interface Creative {
  id: string
  name: string
  file_url: string
  file_type: string
  angle?: string
  destination?: string
  format?: string
  campaign?: string
  status: string
  notes?: string
  status_history?: any
  created_at: string
  updated_at: string
  user_id?: string
}

interface CreateCreativeData {
  name: string
  angle?: string
  destination?: string
  format?: string
  campaign?: string
  file: File
}

interface UpdateCreativeData {
  id: string
  status?: string
  notes?: string
}

async function fetchCreatives(): Promise<Creative[]> {
  const response = await fetch('/api/creatives')

  if (!response.ok) {
    throw new Error('Error fetching creatives')
  }

  return response.json()
}

async function createCreative(data: CreateCreativeData): Promise<Creative> {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('file', data.file)
  if (data.angle) formData.append('angle', data.angle)
  if (data.destination) formData.append('destination', data.destination)
  if (data.format) formData.append('format', data.format)
  if (data.campaign) formData.append('campaign', data.campaign)

  const response = await fetch('/api/creatives', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error creating creative')
  }

  return response.json()
}

async function updateCreative(data: UpdateCreativeData): Promise<Creative> {
  const response = await fetch('/api/creatives', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error updating creative')
  }

  return response.json()
}

async function deleteCreative(id: string): Promise<void> {
  const response = await fetch('/api/creatives', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error deleting creative')
  }
}

// Hook para obtener creativos
export function useCreatives() {
  return useQuery({
    queryKey: ['creatives'],
    queryFn: fetchCreatives,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

// Hook para crear creativo
export function useCreateCreative() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCreative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] })
      toast({
        title: 'Creativo creado',
        description: 'El creativo se ha subido exitosamente',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Hook para actualizar creativo
export function useUpdateCreative() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCreative,
    onMutate: async (updatedCreative) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ['creatives'] })

      // Snapshot del estado anterior
      const previousCreatives = queryClient.getQueryData<Creative[]>(['creatives'])

      // Optimistic update
      queryClient.setQueryData<Creative[]>(['creatives'], (old) => {
        if (!old) return []
        return old.map((creative) =>
          creative.id === updatedCreative.id
            ? { ...creative, ...updatedCreative }
            : creative
        )
      })

      return { previousCreatives }
    },
    onError: (error: Error, _variables, context) => {
      // Revertir en caso de error
      if (context?.previousCreatives) {
        queryClient.setQueryData(['creatives'], context.previousCreatives)
      }
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      toast({
        title: 'Actualizado',
        description: 'El creativo se ha actualizado exitosamente',
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] })
    },
  })
}

// Hook para eliminar creativo
export function useDeleteCreative() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCreative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] })
      toast({
        title: 'Eliminado',
        description: 'El creativo se ha eliminado exitosamente',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
