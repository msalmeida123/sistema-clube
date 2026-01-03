// Hook de Toast/Notificações compartilhado
'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  const show = useCallback((
    type: ToastType,
    message: string,
    options?: ToastOptions
  ) => {
    const { description, duration = 4000, action } = options || {}

    const toastOptions = {
      description,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined
    }

    switch (type) {
      case 'success':
        toast.success(message, toastOptions)
        break
      case 'error':
        toast.error(message, toastOptions)
        break
      case 'warning':
        toast.warning(message, toastOptions)
        break
      case 'info':
        toast.info(message, toastOptions)
        break
    }
  }, [])

  const success = useCallback((message: string, options?: ToastOptions) => {
    show('success', message, options)
  }, [show])

  const error = useCallback((message: string, options?: ToastOptions) => {
    show('error', message, options)
  }, [show])

  const warning = useCallback((message: string, options?: ToastOptions) => {
    show('warning', message, options)
  }, [show])

  const info = useCallback((message: string, options?: ToastOptions) => {
    show('info', message, options)
  }, [show])

  const promise = useCallback(<T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return toast.promise(promise, messages)
  }, [])

  return {
    show,
    success,
    error,
    warning,
    info,
    promise,
  }
}
