// =====================================================
// Meta Cloud API Provider
// Implementação do WhatsApp via API Oficial da Meta
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// =====================================================

import {
  WhatsAppProvider,
  ProviderConfig,
  SendMessagePayload,
  SendMessageResult,
  MediaUploadResult,
  SessionStatus,
  TemplateInfo,
} from './provider'

const META_API_VERSION = 'v21.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

export class MetaCloudProvider implements WhatsAppProvider {
  readonly type = 'meta' as const
  readonly config: ProviderConfig

  private get accessToken(): string {
    return this.config.meta_access_token || ''
  }

  private get phoneNumberId(): string {
    return this.config.meta_phone_number_id || ''
  }

  private get wabaId(): string {
    return this.config.meta_waba_id || ''
  }

  constructor(config: ProviderConfig) {
    this.config = config
  }

  private formatPhone(phone: string): string {
    // Meta espera formato internacional sem "+" (ex: 5511999999999)
    let numero = phone.replace(/\D/g, '')
    if (!numero.startsWith('55')) numero = '55' + numero
    return numero
  }

  private async apiCall(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${META_API_BASE}${endpoint}`
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(30000)
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    const result = await response.json()

    if (!response.ok) {
      const errorMsg = result.error?.message || result.error?.error_user_msg || 'Erro na API Meta'
      throw new Error(`Meta API Error (${response.status}): ${errorMsg}`)
    }

    return result
  }

  // ==========================================
  // ENVIO DE MENSAGENS
  // ==========================================

  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        return { success: false, error: 'Access Token e Phone Number ID são obrigatórios' }
      }

      const to = this.formatPhone(payload.to)

      // Se é template, usar método específico
      if (payload.messageType === 'template' && payload.templateName) {
        return this.sendTemplate(to, payload.templateName, payload.templateLanguage || 'pt_BR', payload.templateComponents)
      }

      let messageBody: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to
      }

      switch (payload.messageType) {
        case 'image':
          messageBody.type = 'image'
          messageBody.image = payload.mediaUrl?.startsWith('http')
            ? { link: payload.mediaUrl, caption: payload.caption }
            : { id: payload.mediaUrl, caption: payload.caption }
          break

        case 'video':
          messageBody.type = 'video'
          messageBody.video = payload.mediaUrl?.startsWith('http')
            ? { link: payload.mediaUrl, caption: payload.caption }
            : { id: payload.mediaUrl, caption: payload.caption }
          break

        case 'audio':
          messageBody.type = 'audio'
          messageBody.audio = payload.mediaUrl?.startsWith('http')
            ? { link: payload.mediaUrl }
            : { id: payload.mediaUrl }
          break

        case 'document':
          messageBody.type = 'document'
          messageBody.document = payload.mediaUrl?.startsWith('http')
            ? { link: payload.mediaUrl, filename: payload.fileName, caption: payload.caption }
            : { id: payload.mediaUrl, filename: payload.fileName, caption: payload.caption }
          break

        case 'interactive':
          messageBody.type = 'interactive'
          messageBody.interactive = payload.templateComponents // Reused for interactive payload
          break

        default:
          messageBody.type = 'text'
          messageBody.text = { 
            preview_url: true, 
            body: payload.text 
          }
          break
      }

      const result = await this.apiCall(`/${this.phoneNumberId}/messages`, 'POST', messageBody)

      return {
        success: true,
        messageId: result.messages?.[0]?.id || result.id
      }
    } catch (error: any) {
      console.error('Erro Meta sendMessage:', error)
      return { success: false, error: error.message }
    }
  }

  // ==========================================
  // TEMPLATES
  // ==========================================

  async sendTemplate(
    to: string,
    templateName: string,
    language: string = 'pt_BR',
    components?: any[]
  ): Promise<SendMessageResult> {
    try {
      const messageBody: any = {
        messaging_product: 'whatsapp',
        to: this.formatPhone(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: language }
        }
      }

      if (components && components.length > 0) {
        messageBody.template.components = components
      }

      const result = await this.apiCall(`/${this.phoneNumberId}/messages`, 'POST', messageBody)

      return {
        success: true,
        messageId: result.messages?.[0]?.id
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async listTemplates(): Promise<TemplateInfo[]> {
    try {
      if (!this.wabaId) return []

      const result = await this.apiCall(`/${this.wabaId}/message_templates?limit=100`)

      return (result.data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        language: t.language,
        category: t.category,
        status: t.status,
        components: t.components || []
      }))
    } catch (error) {
      console.error('Erro ao listar templates:', error)
      return []
    }
  }

  // ==========================================
  // MÍDIA
  // ==========================================

  async uploadMedia(file: Buffer, mimeType: string, fileName: string): Promise<MediaUploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', new Blob([new Uint8Array(file)], { type: mimeType }), fileName)
      formData.append('messaging_product', 'whatsapp')
      formData.append('type', mimeType)

      const response = await fetch(`${META_API_BASE}/${this.phoneNumberId}/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: formData,
        signal: AbortSignal.timeout(60000)
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error?.message || 'Erro no upload' }
      }

      return { success: true, mediaId: result.id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async downloadMedia(mediaId: string): Promise<{ url: string } | null> {
    try {
      const result = await this.apiCall(`/${mediaId}`)
      return result.url ? { url: result.url } : null
    } catch {
      return null
    }
  }

  // ==========================================
  // CATÁLOGO
  // ==========================================

  async getCatalog(): Promise<any> {
    try {
      if (!this.config.meta_catalog_id) return null
      return await this.apiCall(`/${this.config.meta_catalog_id}/products?limit=100`)
    } catch (error) {
      console.error('Erro ao buscar catálogo:', error)
      return null
    }
  }

  // ==========================================
  // SESSÃO (Meta não usa QR Code)
  // ==========================================

  async getSessionStatus(): Promise<SessionStatus> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        return { connected: false, status: 'not_configured' }
      }

      // Verificar se o token é válido buscando info do número
      const result = await this.apiCall(`/${this.phoneNumberId}`)

      return {
        connected: true,
        phone: result.display_phone_number || result.verified_name,
        name: result.verified_name || result.display_phone_number,
        status: result.quality_rating ? `connected (quality: ${result.quality_rating})` : 'connected'
      }
    } catch (error: any) {
      return {
        connected: false,
        status: error.message?.includes('401') ? 'token_expired' : 'error'
      }
    }
  }

  async connect(): Promise<{ success: boolean; error?: string }> {
    // Meta Cloud API não precisa de QR Code - só validar token
    const status = await this.getSessionStatus()
    if (status.connected) {
      return { success: true }
    }
    return { success: false, error: 'Token inválido ou Phone Number ID incorreto. Verifique as configurações.' }
  }

  async disconnect(): Promise<{ success: boolean; error?: string }> {
    // Na Meta Cloud API, "desconectar" é apenas desativar o provider
    return { success: true }
  }

  // ==========================================
  // PERFIL
  // ==========================================

  async getProfilePicture(phone: string): Promise<string | null> {
    // Meta Cloud API não tem endpoint público de foto de perfil
    return null
  }

  // ==========================================
  // MARK AS READ
  // ==========================================

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.apiCall(`/${this.phoneNumberId}/messages`, 'POST', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
      return true
    } catch {
      return false
    }
  }
}
