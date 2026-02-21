import { WaSenderProvider } from '@/lib/whatsapp/wasender-provider'
import { ProviderConfig } from '@/lib/whatsapp/provider'

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

const baseConfig: ProviderConfig = {
  id: 'prov-1',
  nome: 'WaSender Test',
  tipo: 'wasender',
  ativo: true,
  is_default: true,
  wasender_api_key: 'test-api-key',
  wasender_device_id: 'dev-123',
  wasender_personal_token: 'token-456',
}

describe('WaSenderProvider', () => {
  let provider: WaSenderProvider

  beforeEach(() => {
    provider = new WaSenderProvider(baseConfig)
    mockFetch.mockReset()
  })

  // ============================================
  // Propriedades
  // ============================================
  describe('propriedades', () => {
    it('type é "wasender"', () => {
      expect(provider.type).toBe('wasender')
    })

    it('config contém dados completos', () => {
      expect(provider.config.id).toBe('prov-1')
      expect(provider.config.nome).toBe('WaSender Test')
      expect(provider.config.wasender_api_key).toBe('test-api-key')
    })
  })

  // ============================================
  // sendMessage
  // ============================================
  describe('sendMessage', () => {
    it('envia mensagem de texto com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: 'msg-001' }),
      })

      const result = await provider.sendMessage({
        to: '11999887766',
        text: 'Olá!',
        messageType: 'text',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg-001')

      // Verifica chamada fetch
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.wasenderapi.com/api/send-message',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      )

      // Verifica body enviado
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.to).toBe('5511999887766') // Prefixo 55 adicionado
      expect(body.text).toBe('Olá!')
    })

    it('formata telefone adicionando prefixo 55', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: 'msg-002' }),
      })

      await provider.sendMessage({ to: '11999887766', text: 'test' })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.to).toBe('5511999887766')
    })

    it('não duplica prefixo 55 se já presente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: 'msg-003' }),
      })

      await provider.sendMessage({ to: '5511999887766', text: 'test' })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.to).toBe('5511999887766')
    })

    it('remove formatação do telefone', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: 'msg-004' }),
      })

      await provider.sendMessage({ to: '(11) 99988-7766', text: 'test' })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.to).toBe('5511999887766')
    })

    it('envia imagem com caption', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: 'msg-img' }),
      })

      await provider.sendMessage({
        to: '11999887766',
        messageType: 'image',
        mediaUrl: 'https://example.com/photo.jpg',
        caption: 'Foto do evento',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.imageUrl).toBe('https://example.com/photo.jpg')
      expect(body.caption).toBe('Foto do evento')
      expect(body.text).toBeUndefined()
    })

    it('envia vídeo com caption', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: 'msg-vid' }),
      })

      await provider.sendMessage({
        to: '11999887766',
        messageType: 'video',
        mediaUrl: 'https://example.com/video.mp4',
        caption: 'Vídeo',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.videoUrl).toBe('https://example.com/video.mp4')
      expect(body.caption).toBe('Vídeo')
    })

    it('envia áudio', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: 'msg-aud' }),
      })

      await provider.sendMessage({
        to: '11999887766',
        messageType: 'audio',
        mediaUrl: 'https://example.com/audio.ogg',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.audioUrl).toBe('https://example.com/audio.ogg')
    })

    it('envia documento com fileName', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: 'msg-doc' }),
      })

      await provider.sendMessage({
        to: '11999887766',
        messageType: 'document',
        mediaUrl: 'https://example.com/doc.pdf',
        fileName: 'contrato.pdf',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.documentUrl).toBe('https://example.com/doc.pdf')
      expect(body.fileName).toBe('contrato.pdf')
    })

    it('retorna erro se API key não configurada', async () => {
      const providerSemKey = new WaSenderProvider({
        ...baseConfig,
        wasender_api_key: undefined,
      })

      const result = await providerSemKey.sendMessage({
        to: '11999887766',
        text: 'test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('API Key')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('retorna erro quando API responde com erro', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid number' }),
      })

      const result = await provider.sendMessage({
        to: '11999887766',
        text: 'test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid number')
    })

    it('retorna erro quando fetch falha (rede)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await provider.sendMessage({
        to: '11999887766',
        text: 'test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  // ============================================
  // getSessionStatus
  // ============================================
  describe('getSessionStatus', () => {
    it('retorna connected quando sessão está ativa', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            status: 'connected',
            phone: '5511999887766',
            pushName: 'Clube',
          },
        }),
      })

      const status = await provider.getSessionStatus()

      expect(status.connected).toBe(true)
      expect(status.phone).toBe('5511999887766')
      expect(status.name).toBe('Clube')
    })

    it('retorna not_configured sem token/deviceId', async () => {
      const providerSemConfig = new WaSenderProvider({
        ...baseConfig,
        wasender_personal_token: undefined,
        wasender_device_id: undefined,
      })

      const status = await providerSemConfig.getSessionStatus()

      expect(status.connected).toBe(false)
      expect(status.status).toBe('not_configured')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('retorna error quando fetch falha', async () => {
      mockFetch.mockRejectedValueOnce(new Error('timeout'))

      const status = await provider.getSessionStatus()

      expect(status.connected).toBe(false)
      expect(status.status).toBe('error')
    })
  })

  // ============================================
  // connect
  // ============================================
  describe('connect', () => {
    it('retorna QR code com sucesso', async () => {
      // Mock connect call
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      // Mock QR code call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { qrCode: 'base64-qr-data' } }),
      })

      const result = await provider.connect()

      expect(result.success).toBe(true)
      expect(result.qrCode).toBe('base64-qr-data')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('retorna erro sem personal token', async () => {
      const providerSemToken = new WaSenderProvider({
        ...baseConfig,
        wasender_personal_token: undefined,
      })

      const result = await providerSemToken.connect()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Personal Token')
    })

    it('retorna erro quando fetch falha', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const result = await provider.connect()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection refused')
    })
  })

  // ============================================
  // disconnect
  // ============================================
  describe('disconnect', () => {
    it('desconecta com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const result = await provider.disconnect()

      expect(result.success).toBe(true)
    })

    it('retorna erro quando falha', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const result = await provider.disconnect()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Server error')
    })
  })

  // ============================================
  // getProfilePicture
  // ============================================
  describe('getProfilePicture', () => {
    it('retorna URL da foto', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { imgUrl: 'https://example.com/pic.jpg' } }),
      })

      const url = await provider.getProfilePicture('11999887766')
      expect(url).toBe('https://example.com/pic.jpg')
    })

    it('retorna null sem API key', async () => {
      const providerSemKey = new WaSenderProvider({
        ...baseConfig,
        wasender_api_key: undefined,
      })

      const url = await providerSemKey.getProfilePicture('11999887766')
      expect(url).toBeNull()
    })

    it('retorna null quando API responde sem foto', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      })

      const url = await provider.getProfilePicture('11999887766')
      expect(url).toBeNull()
    })

    it('retorna null em caso de erro', async () => {
      mockFetch.mockRejectedValueOnce(new Error('timeout'))

      const url = await provider.getProfilePicture('11999887766')
      expect(url).toBeNull()
    })
  })
})
