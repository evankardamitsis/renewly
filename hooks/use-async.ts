import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (promise: Promise<T>, successMessage?: string) => {
      setState({ data: null, loading: true, error: null })
      try {
        const data = await promise
        setState({ data, loading: false, error: null })
        if (successMessage) {
          toast.success(successMessage)
        }
        return data
      } catch (error) {
        setState({ data: null, loading: false, error: error as Error })
        toast.error(error instanceof Error ? error.message : 'An error occurred')
        throw error
      }
    },
    []
  )

  return { ...state, execute }
} 