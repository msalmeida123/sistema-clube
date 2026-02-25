// Módulo Bar - exports públicos
export * from './types'
export * from './hooks/useBar'
export { barService } from './services/bar.service'
export {
  barCategoriasRepository,
  barProdutosRepository,
  barPedidosRepository,
  carteirinhaRepository,
  barNFCeRepository,
  barConfigNFCeRepository,
  barCaixaRepository
} from './repositories/bar.repository'
