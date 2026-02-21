import { createProvider } from '@/lib/whatsapp/factory'
import { ProviderConfig } from '@/lib/whatsapp/provider'
import { WaSenderProvider } from '@/lib/whatsapp/wasender-provider'

// Não testamos funções que dependem do Supabase diretamente (getDefaultProvider, etc.)
// porque exigiriam mock complexo do createClient. Testamos a lógica pura do factory.

const wasenderConfig: ProviderConfig = {
  id: 'prov-1',
  nome: 'WaSender Principal',
  tipo: 'wasender',
  ativo: true,
  is_default: true,
  wasender_api_key: 'key-123',
  wasender_device_id: 'dev-456',
  wasender_personal_token: 'token-789',
}

const metaConfig: ProviderConfig = {
  id: 'prov-2',
  nome: 'Meta Cloud',
  tipo: 'meta',
  ativo: true,
  is_default: false,
  meta_access_token: 'meta-token',
  meta_phone_number_id: 'phone-id',
  meta_waba_id: 'waba-id',
}

describe('WhatsApp Factory - createProvider', () => {
  it('cria WaSenderProvider para tipo "wasender"', () => {
    const provider = createProvider(wasenderConfig)

    expect(provider).toBeInstanceOf(WaSenderProvider)
    expect(provider.type).toBe('wasender')
    expect(provider.config.id).toBe('prov-1')
  })

  it('cria MetaCloudProvider para tipo "meta"', () => {
    const provider = createProvider(metaConfig)

    expect(provider.type).toBe('meta')
    expect(provider.config.id).toBe('prov-2')
  })

  it('lança erro para tipo desconhecido', () => {
    const invalidConfig = { ...wasenderConfig, tipo: 'telegram' as any }

    expect(() => createProvider(invalidConfig)).toThrow('não suportado')
  })

  it('provider criado mantém acesso à config completa', () => {
    const provider = createProvider(wasenderConfig)

    expect(provider.config.wasender_api_key).toBe('key-123')
    expect(provider.config.wasender_device_id).toBe('dev-456')
    expect(provider.config.nome).toBe('WaSender Principal')
  })

  it('provider criado tem métodos de envio', () => {
    const provider = createProvider(wasenderConfig)

    expect(typeof provider.sendMessage).toBe('function')
    expect(typeof provider.getSessionStatus).toBe('function')
    expect(typeof provider.connect).toBe('function')
    expect(typeof provider.disconnect).toBe('function')
  })
})
