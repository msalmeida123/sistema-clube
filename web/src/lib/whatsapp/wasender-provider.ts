// =====================================================
// WaSender Provider
// Implementação do WhatsApp via WaSender API
// =====================================================

import {
  WhatsAppProvider,
  ProviderConfig,
  SendMessagePayload,
  SendMessageResult,
  SessionStatus,
} from './provider'

export class WaSenderProvider implements WhatsAppProvider {
  readonly type = 'wasender' as const
  readonly config: ProviderConfig

  private get apiKey(): string {
    return this.config.wasender_api_key || ''
  }

  private get deviceId(): string {
    return this.config.wasender_device_id || ''
  }

  private get personalToken(): string {
    return this.config.wasender_personal_token || ''
  }

  constructor(config: ProviderConfig) {
    this.config = config
  }

  private formatPhone(phone: string): string {
    let numero = phone.replace(/\D/g, '')
    if (!numero.startsWith('55')) numero = '55' + numero
    return numero
  }

  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
    try {
      if (!this.apiKey) {
        return { success: false, error: 'API Key do WaSender não configurada' }
      }

      const to = this.formatPhone(payload.to)
      let body: any = { to }

      switch (payload.messageType) {
        case 'image':
          body.imageUrl = payload.mediaUrl
          if (payload.caption) body.caption = payload.caption
          break
        case 'video':
          body.videoUrl = payload.mediaUrl
          if (payload.caption) body.caption = payload.caption
          break
        case 'audio':
          body.audioUrl = payload.mediaUrl
          break
        case 'document':
          body.documentUrl = payload.mediaUrl
          if (payload.fileName) body.fileName = payload.fileName
          break
        default:
          body.text = payload.text
          break
      }

      const response = await fetch('https://www.wasenderapi.com/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000)
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.message || result.error || 'Erro ao enviar' }
      }

      return { success: true, messageId: result.messageId || result.id || 'sent' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async getSessionStatus(): Promise<SessionStatus> {
    try {
      if (!this.personalToken || !this.deviceId) {
        return { connected: false, status: 'not_configured' }
      }

      const response = await fetch(
        `https://www.wasenderapi.com/api/whatsapp-sessions/${this.deviceId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.personalToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const result = await response.json()
      const session = result.data || result

      return {
        connected: session.status === 'connected' || session.connected === true,
        phone: session.phone || session.phoneNumber,
        name: session.pushName || session.name,
        status: session.status || 'unknown'
      }
    } catch (error) {
      return { connected: false, status: 'error' }
    }
  }

  async connect(): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      if (!this.personalToken || !this.deviceId) {
        return { success: false, error: 'Personal Token e Device ID são necessários' }
      }

      // Primeiro, tentar conectar
      await fetch(
        `https://www.wasenderapi.com/api/whatsapp-sessions/${this.deviceId}/connect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.personalToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // Buscar QR Code
      const qrResponse = await fetch(
        `https://www.wasenderapi.com/api/whatsapp-sessions/${this.deviceId}/qrcode`,
        {
          headers: {
            'Authorization': `Bearer ${this.personalToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const qrResult = await qrResponse.json()
      const qrData = qrResult.data?.qrCode || qrResult.data?.qr || qrResult.qrCode || qrResult.qr

      return { success: true, qrCode: qrData || undefined }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `https://www.wasenderapi.com/api/whatsapp-sessions/${this.deviceId}/disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.personalToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return { success: response.ok }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async getProfilePicture(phone: string): Promise<string | null> {
    try {
      if (!this.apiKey) return null

      const numero = this.formatPhone(phone)
      const response = await fetch(
        `https://www.wasenderapi.com/api/contacts/${numero}/picture`,
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
          signal: AbortSignal.timeout(10000)
        }
      )

      if (!response.ok) return null
      const result = await response.json()
      return result.success && result.data?.imgUrl ? result.data.imgUrl : null
    } catch {
      return null
    }
  }
}
