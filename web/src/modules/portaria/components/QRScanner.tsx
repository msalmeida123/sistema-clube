// Componente Scanner QR - Responsável APENAS por input de QR Code
'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { QrCode, Keyboard } from 'lucide-react'

interface QRScannerProps {
  onScan: (qrcode: string) => void
  loading?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export function QRScanner({ 
  onScan, 
  loading, 
  placeholder = 'Aguardando leitura do QR Code...',
  autoFocus = true 
}: QRScannerProps) {
  const [value, setValue] = useState('')
  const [mode, setMode] = useState<'scanner' | 'manual'>('scanner')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto focus no input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus, mode])

  // Detectar leitura de QR Code (geralmente termina com Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      onScan(value.trim())
      setValue('')
    }
  }

  const handleManualSubmit = () => {
    if (value.trim()) {
      onScan(value.trim())
      setValue('')
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs Scanner/Manual */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'scanner' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('scanner')}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Scanner
        </Button>
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('manual')}
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Manual
        </Button>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'scanner' ? placeholder : 'Digite o número do título...'}
          disabled={loading}
          className="text-lg py-6"
          autoComplete="off"
        />
        {mode === 'manual' && (
          <Button 
            onClick={handleManualSubmit} 
            disabled={loading || !value.trim()}
            className="px-8"
          >
            Buscar
          </Button>
        )}
      </div>

      {/* Indicador de modo scanner */}
      {mode === 'scanner' && (
        <p className="text-sm text-muted-foreground text-center">
          🔍 Aponte o leitor para o QR Code da carteirinha
        </p>
      )}
    </div>
  )
}
