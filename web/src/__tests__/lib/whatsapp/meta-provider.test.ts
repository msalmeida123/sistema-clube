import { MetaCloudProvider } from '@/lib/whatsapp/meta-provider'
import { ProviderConfig } from '@/lib/whatsapp/provider'

const mockFetch = jest.fn()
global.fetch = mockFetch

const baseConfig: ProviderConfig = {
  id: 'prov-meta-1',
  nome: 'Meta Cloud Test',
  tipo: 'meta',
  ativo: true,
  is_default: false,
  meta_access_token: 'test-access-token',
  meta_phone_number_id: 'phone-123',
  meta_waba_id: 'waba-456',
  meta_catalog_id: 'catalog-789',
}

describe('MetaCloudProvider', () => {
  let provider: MetaCloudProvider

  beforeEach(() => {
    provider = new MetaCloudProvider(baseConfig)
    mockFetch.mockReset()
  })

  // ============================================
  // Propriedades
  // ============================================
  describe('propriedades', () => {
    it('type é "meta"', () => {
      expect(provider.type).toBe('meta')
    })

    it('config contém dados completos', () => {
      expect(provider.config.id).toBe('prov-meta-1')
      expect(provider.config.meta_access_token).toBe('test-access-token')
      expect(provider.config.meta_phone_number_id).toBe('phone-123')
    })
  })

  // ============================================
  // sendMessage
  // ============================================
  describe('sendMessage', () => {
    it('envia texto com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.abc123' }] }),
      })

      const result = await provider.sendMessage({
        to: '11999887766',
        text: 'Olá via Meta!',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('wamid.abc123')

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.messaging_product).toBe('whatsapp')
      expect(body.to).toBe('5511999887766')
      expect(body.type).toBe('text')
      expect(body.text.body).toBe('Olá via Meta!')
      expect(body.text.preview_url).toBe(true)
    })

    it('envia imagem via link', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.img001' }] }),
      })

      await provider.sendMessage({
        to: '11999887766',
        messageType: 'image',
        mediaUrl: 'https://example.com/photo.jpg',
        caption: 'Foto',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('image')
      expect(body.image.link).toBe('https://example.com/photo.jpg')
      expect(body.image.caption).toBe('Foto')
    })

    it('envia imagem via media ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.img002' }] }),
      })

      await provider.sendMessage({
        to: '11999887766',
        messageType: 'image',
        mediaUrl: 'media-id-123',
        caption: 'Foto',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.image.id).toBe('media-id-123')
    })

    it('envia vídeo', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.vid001' }] }),
      })

      await provider.sendMessage({
        to: '11999887766',
        messageType: 'video',
        mediaUrl: 'https://example.com/video.mp4',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('video')
      expect(body.video.link).toBe('https://example.com/video.mp4')
    })

    it('envia áudio', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.aud001' }] }),
      })

      await provider.sendMessage({
        to: '11999887766',
        messageType: 'audio',
        mediaUrl: 'https://example.com/audio.ogg',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('audio')
      expect(body.audio.link).toBe('https://example.com/audio.ogg')
    })

    it('envia documento com filename', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.doc001' }] }),
      })

      await provider.sendMessage({
        to: '11999887766',
        messageType: 'document',
        mediaUrl: 'https://example.com/doc.pdf',
        fileName: 'contrato.pdf',
        caption: 'Seu contrato',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('document')
      expect(body.document.link).toBe('https://example.com/doc.pdf')
      expect(body.document.filename).toBe('contrato.pdf')
      expect(body.document.caption).toBe('Seu contrato')
    })

    it('envia template', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.tpl001' }] }),
      })

      await provider.sendMessage({
        to: '11999887766',
        messageType: 'template',
        templateName: 'hello_world',
        templateLanguage: 'pt_BR',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('template')
      expect(body.template.name).toBe('hello_world')
      expect(body.template.language.code).toBe('pt_BR')
    })

    it('retorna erro sem access token', async () => {
      const providerSemToken = new MetaCloudProvider({
        ...baseConfig,
        meta_access_token: undefined,
      })

      const result = await providerSemToken.sendMessage({
        to: '11999887766',
        text: 'test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Access Token')
    })

    it('retorna erro quando API Meta falha', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid parameter' } }),
      })

      const result = await provider.sendMessage({
        to: '11999887766',
        text: 'test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid parameter')
    })
  })

  // ============================================
  // getSessionStatus
  // ============================================
  describe('getSessionStatus', () => {
    it('retorna connected com info do número', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          display_phone_number: '+55 11 99988-7766',
          verified_name: 'Clube Recreativo',
          quality_rating: 'GREEN',
        }),
      })

      const status = await provider.getSessionStatus()

      expect(status.connected).toBe(true)
      expect(status.phone).toBe('+55 11 99988-7766')
      expect(status.name).toBe('Clube Recreativo')
      expect(status.status).toContain('GREEN')
    })

    it('retorna not_configured sem token', async () => {
      const providerSemConfig = new MetaCloudProvider({
        ...baseConfig,
        meta_access_token: undefined,
      })

      const status = await providerSemConfig.getSessionStatus()

      expect(status.connected).toBe(false)
      expect(status.status).toBe('not_configured')
    })

    it('detecta token expirado', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: '401 Unauthorized' } }),
      })

      const status = await provider.getSessionStatus()

      expect(status.connected).toBe(false)
      expect(status.status).toBe('token_expired')
    })
  })

  // ============================================
  // connect / disconnect
  // ============================================
  describe('connect', () => {
    it('retorna sucesso se sessão está conectada', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          display_phone_number: '+5511999887766',
          verified_name: 'Test',
        }),
      })

      const result = await provider.connect()
      expect(result.success).toBe(true)
    })

    it('retorna erro se token inválido', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: '401 Unauthorized' } }),
      })

      const result = await provider.connect()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Token inválido')
    })
  })

  describe('disconnect', () => {
    it('sempre retorna sucesso (Meta não precisa desconectar)', async () => {
      const result = await provider.disconnect()
      expect(result.success).toBe(true)
    })
  })

  // ============================================
  // listTemplates
  // ============================================
  describe('listTemplates', () => {
    it('lista templates do WABA', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'tpl-1',
              name: 'hello_world',
              language: 'pt_BR',
              category: 'UTILITY',
              status: 'APPROVED',
              components: [{ type: 'BODY', text: 'Olá {{1}}!' }],
            },
          ],
        }),
      })

      const templates = await provider.listTemplates()

      expect(templates).toHaveLength(1)
      expect(templates[0].name).toBe('hello_world')
      expect(templates[0].status).toBe('APPROVED')
    })

    it('retorna array vazio sem waba_id', async () => {
      const providerSemWaba = new MetaCloudProvider({
        ...baseConfig,
        meta_waba_id: undefined,
      })

      const templates = await providerSemWaba.listTemplates()
      expect(templates).toEqual([])
    })

    it('retorna array vazio em caso de erro', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'))

      const templates = await provider.listTemplates()
      expect(templates).toEqual([])
    })
  })

  // ============================================
  // markAsRead
  // ============================================
  describe('markAsRead', () => {
    it('marca mensagem como lida', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await provider.markAsRead('wamid.abc123')
      expect(result).toBe(true)

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.status).toBe('read')
      expect(body.message_id).toBe('wamid.abc123')
    })

    it('retorna false em caso de erro', async () => {
      mockFetch.mockRejectedValueOnce(new Error('error'))

      const result = await provider.markAsRead('wamid.abc123')
      expect(result).toBe(false)
    })
  })

  // ============================================
  // getProfilePicture
  // ============================================
  describe('getProfilePicture', () => {
    it('sempre retorna null (Meta não suporta)', async () => {
      const result = await provider.getProfilePicture('11999887766')
      expect(result).toBeNull()
    })
  })
})
