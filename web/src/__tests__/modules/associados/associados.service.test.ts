import { AssociadosService } from '@/modules/associados/services/associados.service'
import type { Associado, AssociadoFilters } from '@/modules/associados/types'

// Mock do repository
const mockRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByCpf: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getStats: jest.fn(),
}

const associadoBase: Associado = {
  id: 'assoc-1',
  numero_titulo: '202500001',
  nome: 'João Silva',
  cpf: '52998224725',
  plano: 'individual',
  status: 'ativo',
  created_at: '2025-01-01T00:00:00Z',
}

describe('AssociadosService', () => {
  let service: AssociadosService

  beforeEach(() => {
    service = new AssociadosService(mockRepository as any)
    jest.clearAllMocks()
  })

  // ============================================
  // Listar
  // ============================================
  describe('listar', () => {
    it('retorna lista de associados', async () => {
      mockRepository.findAll.mockResolvedValue([associadoBase])

      const result = await service.listar()

      expect(result).toHaveLength(1)
      expect(result[0].nome).toBe('João Silva')
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined)
    })

    it('passa filtros para o repository', async () => {
      const filters: AssociadoFilters = { status: 'ativo', search: 'João' }
      mockRepository.findAll.mockResolvedValue([])

      await service.listar(filters)

      expect(mockRepository.findAll).toHaveBeenCalledWith(filters)
    })
  })

  // ============================================
  // Buscar por ID
  // ============================================
  describe('buscarPorId', () => {
    it('retorna associado existente', async () => {
      mockRepository.findById.mockResolvedValue(associadoBase)

      const result = await service.buscarPorId('assoc-1')
      expect(result?.nome).toBe('João Silva')
    })

    it('retorna null se não encontrado', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await service.buscarPorId('inexistente')
      expect(result).toBeNull()
    })
  })

  // ============================================
  // Criar
  // ============================================
  describe('criar', () => {
    it('cria associado com dados válidos', async () => {
      mockRepository.findByCpf.mockResolvedValue(null)
      mockRepository.findAll.mockResolvedValue([])
      mockRepository.create.mockResolvedValue(associadoBase)

      const result = await service.criar({
        nome: 'João Silva',
        cpf: '529.982.247-25',
        plano: 'individual',
      })

      expect(result.nome).toBe('João Silva')
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cpf: '52998224725',
          status: 'ativo',
        })
      )
    })

    it('lança erro para CPF inválido', async () => {
      await expect(
        service.criar({ nome: 'João', cpf: '123.456.789-00', plano: 'individual' })
      ).rejects.toThrow('CPF inválido')
    })

    it('lança erro para CPF com dígitos iguais', async () => {
      await expect(
        service.criar({ nome: 'João', cpf: '111.111.111-11', plano: 'individual' })
      ).rejects.toThrow('CPF inválido')
    })

    it('lança erro para CPF já cadastrado', async () => {
      mockRepository.findByCpf.mockResolvedValue(associadoBase)

      await expect(
        service.criar({ nome: 'Outro', cpf: '529.982.247-25', plano: 'individual' })
      ).rejects.toThrow('CPF já cadastrado')
    })

    it('lança erro para nome vazio', async () => {
      mockRepository.findByCpf.mockResolvedValue(null)

      await expect(
        service.criar({ nome: '   ', cpf: '529.982.247-25', plano: 'individual' })
      ).rejects.toThrow('Nome é obrigatório')
    })
  })

  // ============================================
  // Atualizar
  // ============================================
  describe('atualizar', () => {
    it('atualiza dados com CPF válido', async () => {
      mockRepository.update.mockResolvedValue({ ...associadoBase, nome: 'João Atualizado' })

      const result = await service.atualizar('assoc-1', {
        nome: 'João Atualizado',
        cpf: '529.982.247-25',
        plano: 'individual',
      })

      expect(result.nome).toBe('João Atualizado')
      expect(mockRepository.update).toHaveBeenCalledWith(
        'assoc-1',
        expect.objectContaining({ cpf: '52998224725' })
      )
    })

    it('lança erro para CPF inválido na atualização', async () => {
      await expect(
        service.atualizar('assoc-1', { nome: 'João', cpf: '000.000.000-00', plano: 'individual' })
      ).rejects.toThrow('CPF inválido')
    })

    it('permite atualização sem CPF', async () => {
      mockRepository.update.mockResolvedValue({ ...associadoBase, nome: 'Novo Nome' })

      await service.atualizar('assoc-1', { nome: 'Novo Nome', plano: 'familiar' })

      expect(mockRepository.update).toHaveBeenCalled()
    })
  })

  // ============================================
  // Status
  // ============================================
  describe('mudança de status', () => {
    it('desativa associado', async () => {
      mockRepository.update.mockResolvedValue({ ...associadoBase, status: 'inativo' })
      const result = await service.desativar('assoc-1')
      expect(mockRepository.update).toHaveBeenCalledWith('assoc-1', { status: 'inativo' })
      expect(result.status).toBe('inativo')
    })

    it('reativa associado', async () => {
      mockRepository.update.mockResolvedValue({ ...associadoBase, status: 'ativo' })
      await service.reativar('assoc-1')
      expect(mockRepository.update).toHaveBeenCalledWith('assoc-1', { status: 'ativo' })
    })

    it('suspende associado', async () => {
      mockRepository.update.mockResolvedValue({ ...associadoBase, status: 'suspenso' })
      await service.suspender('assoc-1')
      expect(mockRepository.update).toHaveBeenCalledWith('assoc-1', { status: 'suspenso' })
    })
  })

  // ============================================
  // Excluir
  // ============================================
  describe('excluir', () => {
    it('exclui associado existente', async () => {
      mockRepository.findById.mockResolvedValue(associadoBase)
      mockRepository.delete.mockResolvedValue(undefined)

      await service.excluir('assoc-1')
      expect(mockRepository.delete).toHaveBeenCalledWith('assoc-1')
    })

    it('lança erro se associado não encontrado', async () => {
      mockRepository.findById.mockResolvedValue(null)
      await expect(service.excluir('inexistente')).rejects.toThrow('Associado não encontrado')
    })
  })

  // ============================================
  // Estatísticas
  // ============================================
  describe('obterEstatisticas', () => {
    it('retorna stats do repository', async () => {
      const stats = { total: 100, ativos: 80, inativos: 15, inadimplentes: 5 }
      mockRepository.getStats.mockResolvedValue(stats)

      const result = await service.obterEstatisticas()
      expect(result.total).toBe(100)
      expect(result.ativos).toBe(80)
    })
  })
})
