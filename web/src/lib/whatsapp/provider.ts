// =====================================================
// WhatsApp Provider Interface
// Interface unificada para WaSender e Meta Cloud API
// =====================================================

export type ProviderType = 'wasender' | 'meta'

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'template' | 'interactive'

export interface SendMessagePayload {
  to: string
  text?: string
  messageType?: MessageType
  mediaUrl?: string
  fileName?: string
  caption?: string
  // Meta-specific
  templateName?: string
  templateLanguage?: string
  templateComponents?: any[]
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface MediaUploadResult {
  success: boolean
  mediaId?: string
  url?: string
  error?: string
}

export interface TemplateInfo {
  id: string
  name: string
  language: string
  category: string
  status: string
  components: any[]
}

export interface SessionStatus {
  connected: boolean
  phone?: string
  name?: string
  status: string
  qrCode?: string
}

export interface ProviderConfig {
  id: string
  nome: string
  tipo: ProviderType
  ativo: boolean
  is_default: boolean
  // WaSender
  wasender_api_key?: string
  wasender_device_id?: string
  wasender_personal_token?: string
  // Meta
  meta_app_id?: string
  meta_app_secret?: string
  meta_access_token?: string
  meta_phone_number_id?: string
  meta_waba_id?: string
  meta_verify_token?: string
  meta_catalog_id?: string
  // Meta
  telefone?: string
  nome_exibicao?: string
  status?: string
}

export interface WhatsAppProvider {
  readonly type: ProviderType
  readonly config: ProviderConfig

  // Core messaging
  sendMessage(payload: SendMessagePayload): Promise<SendMessageResult>
  
  // Session management (WaSender only uses QR, Meta uses tokens)
  getSessionStatus(): Promise<SessionStatus>
  connect(): Promise<{ success: boolean; qrCode?: string; error?: string }>
  disconnect(): Promise<{ success: boolean; error?: string }>

  // Media
  uploadMedia?(file: Buffer, mimeType: string, fileName: string): Promise<MediaUploadResult>
  downloadMedia?(mediaId: string): Promise<{ url: string } | null>

  // Templates (Meta only)
  listTemplates?(): Promise<TemplateInfo[]>
  sendTemplate?(to: string, templateName: string, language: string, components?: any[]): Promise<SendMessageResult>

  // Catalog (Meta only)
  getCatalog?(): Promise<any>

  // Contact info
  getProfilePicture?(phone: string): Promise<string | null>
}
