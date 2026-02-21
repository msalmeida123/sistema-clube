import { PortariaService } from '@/modules/portaria/services/portaria.service'
import type { PessoaAcesso, LocalAcesso, RegistroAcesso } from '@/modules/portaria/types'

// Mock do repository
const mockRepository = {
  findAssociadoByQRCode: jest.fn(),
  findDependenteByQRCode: jest.fn(),
  checkAdimplencia: jest.fn(),
  checkExameMedico: jest.fn(),
  getUltimoRegistro: jest.fn(),
  createRegistro: jest.fn(),
  findRegistros: jest.fn(),
  getStats: jest.fn(),
}

const associadoAtivo = {
  id: 'assoc-1',
  nome: 'João Silva',
  foto_url: 'https://example.com/foto.jpg',
  status: 'ativo',
  numero_titulo: '202500001',
}

const dependenteAtivo = {
  id: 'dep-1',
  nome: 'Maria Silva',
  foto_url: null,
  status: 'ativo',
  associados: {
    id: 'assoc-1',
    nome: 'João Silva',
    status: 'ativo',
  },
}

const registroBase: RegistroAcesso = {
  id: 'reg-1',
  pessoa_id: 'assoc-1',
  pessoa_nome: 'João Silva',
  tipo_pessoa: 'associado',
  tipo: 'entrada',
  local: 'clube',
  data_hora: '2025-01-15T10:00:00Z',
  created_at: '2025-01-15T10:00:00Z',
}

describe('PortariaService', () => {
  let service: PortariaService

  beforeEach(() => {
    service = new PortariaService(mockRepository as any)
    jest.clearAllMocks()
  })

  // ============================================
  // Validação de Acesso - Associado
  // ============================================
  describe('validarAcesso - Associado', () => {
    it('permite acesso de associado ativo e adimplente', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(associadoAtivo)
      mockRepository.checkAdimplencia.mockResolvedValue(true)

      const result = await service.validarAcesso('qr-assoc-1', 'clube')

      expect(result.permitido).toBe(true)
      expect(result.pessoa?.nome).toBe('João Silva')
      expect(result.pessoa?.tipo).toBe('associado')
    })

    it('bloqueia associado inativo', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue({
        ...associadoAtivo,
        status: 'inativo',
      })

      const result = await service.validarAcesso('qr-assoc-1', 'clube')

      expect(result.permitido).toBe(false)
      expect(result.motivo).toContain('inativo')
    })

    it('bloqueia associado suspenso', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue({
        ...associadoAtivo,
        status: 'suspenso',
      })

      const result = await service.validarAcesso('qr-assoc-1', 'clube')

      expect(result.permitido).toBe(false)
      expect(result.motivo).toContain('suspenso')
    })

    it('gera alerta para inadimplente mas permite acesso', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(associadoAtivo)
      mockRepository.checkAdimplencia.mockResolvedValue(false)

      const result = await service.validarAcesso('qr-assoc-1', 'clube')

      expect(result.permitido).toBe(true)
      expect(result.alertas).toBeDefined()
      expect(result.alertas!.some(a => a.includes('atraso'))).toBe(true)
    })

    it('exige exame médico para academia', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(associadoAtivo)
      mockRepository.checkAdimplencia.mockResolvedValue(true)
      mockRepository.checkExameMedico.mockResolvedValue(false)

      const result = await service.validarAcesso('qr-assoc-1', 'academia')

      expect(result.permitido).toBe(false)
      expect(result.motivo).toContain('Exame médico')
    })

    it('exige exame médico para piscina', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(associadoAtivo)
      mockRepository.checkAdimplencia.mockResolvedValue(true)
      mockRepository.checkExameMedico.mockResolvedValue(false)

      const result = await service.validarAcesso('qr-assoc-1', 'piscina')

      expect(result.permitido).toBe(false)
      expect(result.motivo).toContain('Exame médico')
    })

    it('permite acesso à academia com exame válido', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(associadoAtivo)
      mockRepository.checkAdimplencia.mockResolvedValue(true)
      mockRepository.checkExameMedico.mockResolvedValue(true)

      const result = await service.validarAcesso('qr-assoc-1', 'academia')

      expect(result.permitido).toBe(true)
    })

    it('não exige exame médico para acesso ao clube', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(associadoAtivo)
      mockRepository.checkAdimplencia.mockResolvedValue(true)

      const result = await service.validarAcesso('qr-assoc-1', 'clube')

      expect(result.permitido).toBe(true)
      expect(mockRepository.checkExameMedico).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // Validação de Acesso - Dependente
  // ============================================
  describe('validarAcesso - Dependente', () => {
    it('permite acesso de dependente ativo com titular ativo', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(null)
      mockRepository.findDependenteByQRCode.mockResolvedValue(dependenteAtivo)
      mockRepository.checkAdimplencia.mockResolvedValue(true)

      const result = await service.validarAcesso('qr-dep-1', 'clube')

      expect(result.permitido).toBe(true)
      expect(result.pessoa?.tipo).toBe('dependente')
      expect(result.pessoa?.nome).toBe('Maria Silva')
      expect(result.pessoa?.titular_nome).toBe('João Silva')
    })

    it('bloqueia dependente inativo', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(null)
      mockRepository.findDependenteByQRCode.mockResolvedValue({
        ...dependenteAtivo,
        status: 'inativo',
      })

      const result = await service.validarAcesso('qr-dep-1', 'clube')

      expect(result.permitido).toBe(false)
      expect(result.motivo).toContain('Dependente')
      expect(result.motivo).toContain('inativo')
    })

    it('bloqueia se titular está inativo', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(null)
      mockRepository.findDependenteByQRCode.mockResolvedValue({
        ...dependenteAtivo,
        associados: { ...dependenteAtivo.associados, status: 'inativo' },
      })

      const result = await service.validarAcesso('qr-dep-1', 'clube')

      expect(result.permitido).toBe(false)
      expect(result.motivo).toContain('Titular')
    })

    it('gera alerta quando titular inadimplente', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(null)
      mockRepository.findDependenteByQRCode.mockResolvedValue(dependenteAtivo)
      mockRepository.checkAdimplencia.mockResolvedValue(false)

      const result = await service.validarAcesso('qr-dep-1', 'clube')

      expect(result.permitido).toBe(true)
      expect(result.alertas).toBeDefined()
      expect(result.alertas!.some(a => a.includes('Titular'))).toBe(true)
    })

    it('exige exame médico de dependente para piscina', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(null)
      mockRepository.findDependenteByQRCode.mockResolvedValue(dependenteAtivo)
      mockRepository.checkAdimplencia.mockResolvedValue(true)
      mockRepository.checkExameMedico.mockResolvedValue(false)

      const result = await service.validarAcesso('qr-dep-1', 'piscina')

      expect(result.permitido).toBe(false)
      expect(result.motivo).toContain('Exame médico')
    })
  })

  // ============================================
  // QR Code não reconhecido
  // ============================================
  describe('validarAcesso - QR Code inválido', () => {
    it('retorna não permitido para QR desconhecido', async () => {
      mockRepository.findAssociadoByQRCode.mockResolvedValue(null)
      mockRepository.findDependenteByQRCode.mockResolvedValue(null)

      const result = await service.validarAcesso('qr-invalido', 'clube')

      expect(result.permitido).toBe(false)
      expect(result.motivo).toContain('QR Code não reconhecido')
    })
  })

  // ============================================
  // Registro de Acesso
  // ============================================
  describe('registrarAcesso', () => {
    const pessoa: PessoaAcesso = {
      id: 'assoc-1',
      nome: 'João Silva',
      foto_url: 'https://example.com/foto.jpg',
      tipo: 'associado',
      status: 'ativo',
      pode_acessar: true,
    }

    it('registra entrada se não há registro anterior', async () => {
      mockRepository.getUltimoRegistro.mockResolvedValue(null)
      mockRepository.createRegistro.mockResolvedValue(registroBase)

      const result = await service.registrarAcesso(pessoa, 'clube', 'user-1', 'Admin')

      expect(mockRepository.createRegistro).toHaveBeenCalledWith(
        expect.objectContaining({
          pessoa_id: 'assoc-1',
          tipo: 'entrada',
          local: 'clube',
        })
      )
      expect(result.id).toBe('reg-1')
    })

    it('registra saída se último registro foi entrada', async () => {
      mockRepository.getUltimoRegistro.mockResolvedValue({ tipo: 'entrada' })
      mockRepository.createRegistro.mockResolvedValue({ ...registroBase, tipo: 'saida' })

      await service.registrarAcesso(pessoa, 'clube')

      expect(mockRepository.createRegistro).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'saida' })
      )
    })

    it('registra entrada se último registro foi saída', async () => {
      mockRepository.getUltimoRegistro.mockResolvedValue({ tipo: 'saida' })
      mockRepository.createRegistro.mockResolvedValue(registroBase)

      await service.registrarAcesso(pessoa, 'clube')

      expect(mockRepository.createRegistro).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'entrada' })
      )
    })
  })

  // ============================================
  // Registro direto de entrada/saída
  // ============================================
  describe('registrarEntrada / registrarSaida', () => {
    const pessoa: PessoaAcesso = {
      id: 'assoc-1',
      nome: 'João Silva',
      tipo: 'associado',
      status: 'ativo',
      pode_acessar: true,
    }

    it('registrarEntrada força tipo "entrada"', async () => {
      mockRepository.createRegistro.mockResolvedValue(registroBase)

      await service.registrarEntrada(pessoa, 'academia', 'user-1', 'Admin')

      expect(mockRepository.createRegistro).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'entrada',
          local: 'academia',
          usuario_id: 'user-1',
          usuario_nome: 'Admin',
        })
      )
    })

    it('registrarSaida força tipo "saida"', async () => {
      mockRepository.createRegistro.mockResolvedValue({ ...registroBase, tipo: 'saida' })

      await service.registrarSaida(pessoa, 'piscina')

      expect(mockRepository.createRegistro).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'saida', local: 'piscina' })
      )
    })
  })

  // ============================================
  // Listar presentes
  // ============================================
  describe('listarPresentes', () => {
    it('retorna apenas pessoas com última ação = entrada', async () => {
      const registros: RegistroAcesso[] = [
        { ...registroBase, pessoa_id: 'p1', tipo: 'entrada', data_hora: '2025-01-15T10:00:00Z' },
        { ...registroBase, pessoa_id: 'p1', tipo: 'saida', data_hora: '2025-01-15T11:00:00Z' },
        { ...registroBase, pessoa_id: 'p2', tipo: 'entrada', data_hora: '2025-01-15T09:00:00Z' },
      ]
      mockRepository.findRegistros.mockResolvedValue(registros)

      const presentes = await service.listarPresentes('clube')

      // p1 saiu (último registro = saída), p2 está presente (último = entrada)
      expect(presentes).toHaveLength(1)
      expect(presentes[0].pessoa_id).toBe('p2')
    })

    it('retorna vazio se ninguém está presente', async () => {
      const registros: RegistroAcesso[] = [
        { ...registroBase, pessoa_id: 'p1', tipo: 'entrada', data_hora: '2025-01-15T08:00:00Z' },
        { ...registroBase, pessoa_id: 'p1', tipo: 'saida', data_hora: '2025-01-15T12:00:00Z' },
      ]
      mockRepository.findRegistros.mockResolvedValue(registros)

      const presentes = await service.listarPresentes('clube')
      expect(presentes).toHaveLength(0)
    })

    it('retorna vazio quando não há registros', async () => {
      mockRepository.findRegistros.mockResolvedValue([])

      const presentes = await service.listarPresentes('academia')
      expect(presentes).toHaveLength(0)
    })

    it('considera múltiplas pessoas independentemente', async () => {
      const registros: RegistroAcesso[] = [
        { ...registroBase, pessoa_id: 'p1', tipo: 'entrada', data_hora: '2025-01-15T08:00:00Z' },
        { ...registroBase, pessoa_id: 'p2', tipo: 'entrada', data_hora: '2025-01-15T09:00:00Z' },
        { ...registroBase, pessoa_id: 'p3', tipo: 'entrada', data_hora: '2025-01-15T10:00:00Z' },
        { ...registroBase, pessoa_id: 'p3', tipo: 'saida', data_hora: '2025-01-15T11:00:00Z' },
      ]
      mockRepository.findRegistros.mockResolvedValue(registros)

      const presentes = await service.listarPresentes('piscina')

      expect(presentes).toHaveLength(2)
      const ids = presentes.map(p => p.pessoa_id)
      expect(ids).toContain('p1')
      expect(ids).toContain('p2')
      expect(ids).not.toContain('p3')
    })
  })

  // ============================================
  // Consultas
  // ============================================
  describe('listarRegistros', () => {
    it('delega para repository.findRegistros', async () => {
      mockRepository.findRegistros.mockResolvedValue([registroBase])

      const result = await service.listarRegistros({ local: 'clube' })

      expect(result).toHaveLength(1)
      expect(mockRepository.findRegistros).toHaveBeenCalledWith({ local: 'clube' })
    })
  })

  describe('obterEstatisticas', () => {
    it('delega para repository.getStats', async () => {
      const stats = { entradas_hoje: 10, saidas_hoje: 5, presentes_agora: 5, acessos_semana: 50 }
      mockRepository.getStats.mockResolvedValue(stats)

      const result = await service.obterEstatisticas('clube')

      expect(result.entradas_hoje).toBe(10)
      expect(mockRepository.getStats).toHaveBeenCalledWith('clube')
    })
  })
})
