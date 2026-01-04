import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Armario = {
  id: string
  numero: number
  status: string
  qr_code: string
}

type UsoAtivo = {
  id: string
  armario: Armario
  associado?: { id: string; nome: string; cpf: string }
  dependente?: { id: string; nome: string }
  data_entrada: string
  carteirinha_retida: boolean
  chave_entregue: boolean
}

type Pessoa = {
  id: string
  nome: string
  cpf: string
  tipo: 'associado' | 'dependente'
  status: string
  foto_url?: string
}

export default function PortariaSaunaScreen() {
  const { usuario } = useAuth()
  const [tab, setTab] = useState<'entrada' | 'saida' | 'armarios'>('entrada')
  const [busca, setBusca] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [pessoa, setPessoa] = useState<Pessoa | null>(null)
  const [armarioSelecionado, setArmarioSelecionado] = useState<Armario | null>(null)
  const [armariosDisponiveis, setArmariosDisponiveis] = useState<Armario[]>([])
  const [usosAtivos, setUsosAtivos] = useState<UsoAtivo[]>([])
  const [modalDevolucao, setModalDevolucao] = useState(false)
  const [usoParaDevolucao, setUsoParaDevolucao] = useState<UsoAtivo | null>(null)
  const [chavePerdida, setChavePerdida] = useState(false)
  const [valorMulta, setValorMulta] = useState('50.00')

  useEffect(() => {
    carregarArmariosDisponiveis()
    carregarUsosAtivos()
  }, [])

  const carregarArmariosDisponiveis = async () => {
    const { data } = await supabase
      .from('armarios_sauna')
      .select('*')
      .eq('status', 'disponivel')
      .order('numero')
    
    setArmariosDisponiveis(data || [])
  }

  const carregarUsosAtivos = async () => {
    const { data } = await supabase
      .from('uso_armarios_sauna')
      .select(`
        *,
        armario:armarios_sauna(*),
        associado:associados(id, nome, cpf),
        dependente:dependentes(id, nome)
      `)
      .is('data_saida', null)
      .order('data_entrada', { ascending: false })
    
    setUsosAtivos(data || [])
  }

  const buscarPessoa = async () => {
    if (!busca.trim()) {
      Alert.alert('Atenção', 'Digite o CPF ou código do cartão')
      return
    }

    setLoading(true)
    setPessoa(null)

    // Buscar associado
    const { data: associado } = await supabase
      .from('associados')
      .select('id, nome, cpf, status')
      .or(`cpf.eq.${busca},codigo_cartao.eq.${busca}`)
      .single()

    if (associado) {
      setPessoa({
        id: associado.id,
        nome: associado.nome,
        cpf: associado.cpf,
        tipo: 'associado',
        status: associado.status,
      })
      setLoading(false)
      return
    }

    // Buscar dependente
    const { data: dependente } = await supabase
      .from('dependentes')
      .select('id, nome, cpf, status')
      .or(`cpf.eq.${busca},codigo_cartao.eq.${busca}`)
      .single()

    if (dependente) {
      setPessoa({
        id: dependente.id,
        nome: dependente.nome,
        cpf: dependente.cpf || '',
        tipo: 'dependente',
        status: dependente.status,
      })
      setLoading(false)
      return
    }

    Alert.alert('Não encontrado', 'Nenhum associado ou dependente encontrado')
    setLoading(false)
  }

  const buscarPorQRCode = async () => {
    if (!qrCode.trim()) {
      Alert.alert('Atenção', 'Escaneie ou digite o QR Code do armário')
      return
    }

    setLoading(true)

    const { data: armario } = await supabase
      .from('armarios_sauna')
      .select('*')
      .eq('qr_code', qrCode)
      .single()

    if (armario) {
      if (armario.status === 'disponivel') {
        setArmarioSelecionado(armario)
        Alert.alert('Armário Disponível', `Armário ${armario.numero} selecionado`)
      } else {
        Alert.alert('Armário Ocupado', `Armário ${armario.numero} já está em uso`)
      }
    } else {
      Alert.alert('Erro', 'QR Code não encontrado')
    }

    setLoading(false)
    setQrCode('')
  }

  const registrarEntrada = async () => {
    if (!pessoa) {
      Alert.alert('Erro', 'Busque um associado primeiro')
      return
    }

    if (!armarioSelecionado) {
      Alert.alert('Erro', 'Selecione um armário')
      return
    }

    if (pessoa.status !== 'ativo') {
      Alert.alert('Erro', 'Associado com cadastro inativo')
      return
    }

    // Verificar se já está usando um armário
    const { data: usoExistente } = await supabase
      .from('uso_armarios_sauna')
      .select('id')
      .eq(pessoa.tipo === 'associado' ? 'associado_id' : 'dependente_id', pessoa.id)
      .is('data_saida', null)
      .single()

    if (usoExistente) {
      Alert.alert('Atenção', 'Esta pessoa já está usando um armário')
      return
    }

    setLoading(true)

    // Registrar uso
    const { error: usoError } = await supabase
      .from('uso_armarios_sauna')
      .insert({
        armario_id: armarioSelecionado.id,
        associado_id: pessoa.tipo === 'associado' ? pessoa.id : null,
        dependente_id: pessoa.tipo === 'dependente' ? pessoa.id : null,
        carteirinha_retida: true,
        chave_entregue: true,
        usuario_entrada_id: usuario?.id,
      })

    if (usoError) {
      Alert.alert('Erro', usoError.message)
      setLoading(false)
      return
    }

    // Atualizar status do armário
    await supabase
      .from('armarios_sauna')
      .update({ status: 'ocupado', updated_at: new Date().toISOString() })
      .eq('id', armarioSelecionado.id)

    Alert.alert(
      '✅ Entrada Registrada',
      `${pessoa.nome}\nArmário: ${armarioSelecionado.numero}\n\n📋 Carteirinha retida\n🔑 Chave entregue`
    )

    // Limpar e recarregar
    setPessoa(null)
    setArmarioSelecionado(null)
    setBusca('')
    carregarArmariosDisponiveis()
    carregarUsosAtivos()
    setLoading(false)
  }

  const abrirModalDevolucao = (uso: UsoAtivo) => {
    setUsoParaDevolucao(uso)
    setChavePerdida(false)
    setValorMulta('50.00')
    setModalDevolucao(true)
  }

  const registrarSaida = async () => {
    if (!usoParaDevolucao) return

    setLoading(true)

    // Atualizar uso
    const { error: usoError } = await supabase
      .from('uso_armarios_sauna')
      .update({
        data_saida: new Date().toISOString(),
        chave_devolvida: !chavePerdida,
        chave_perdida: chavePerdida,
        valor_multa: chavePerdida ? parseFloat(valorMulta) : 0,
        usuario_saida_id: usuario?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', usoParaDevolucao.id)

    if (usoError) {
      Alert.alert('Erro', usoError.message)
      setLoading(false)
      return
    }

    // Liberar armário (ou colocar em manutenção se chave perdida)
    await supabase
      .from('armarios_sauna')
      .update({ 
        status: chavePerdida ? 'manutencao' : 'disponivel',
        updated_at: new Date().toISOString()
      })
      .eq('id', usoParaDevolucao.armario.id)

    // Se chave perdida, criar multa
    if (chavePerdida) {
      const associadoId = usoParaDevolucao.associado?.id || null
      
      await supabase
        .from('multas_sauna')
        .insert({
          uso_armario_id: usoParaDevolucao.id,
          associado_id: associadoId,
          valor: parseFloat(valorMulta),
          descricao: `Chave perdida - Armário ${usoParaDevolucao.armario.numero}`,
          status: 'pendente',
        })

      Alert.alert(
        '⚠️ Saída com Multa',
        `${usoParaDevolucao.associado?.nome || usoParaDevolucao.dependente?.nome}\n\n🔑 Chave PERDIDA\n💰 Multa: R$ ${valorMulta}\n📋 Carteirinha devolvida`
      )
    } else {
      Alert.alert(
        '✅ Saída Registrada',
        `${usoParaDevolucao.associado?.nome || usoParaDevolucao.dependente?.nome}\n\n🔑 Chave devolvida\n📋 Carteirinha devolvida`
      )
    }

    setModalDevolucao(false)
    setUsoParaDevolucao(null)
    carregarArmariosDisponiveis()
    carregarUsosAtivos()
    setLoading(false)
  }

  const formatarHora = (data: string) => {
    return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const renderArmarioDisponivel = ({ item }: { item: Armario }) => (
    <TouchableOpacity
      style={[
        styles.armarioItem,
        armarioSelecionado?.id === item.id && styles.armarioSelecionado
      ]}
      onPress={() => setArmarioSelecionado(item)}
    >
      <Text style={styles.armarioNumero}>{item.numero}</Text>
    </TouchableOpacity>
  )

  const renderUsoAtivo = ({ item }: { item: UsoAtivo }) => (
    <TouchableOpacity 
      style={styles.usoCard}
      onPress={() => abrirModalDevolucao(item)}
    >
      <View style={styles.usoHeader}>
        <View style={styles.armarioBadge}>
          <Text style={styles.armarioBadgeText}>{item.armario.numero}</Text>
        </View>
        <View style={styles.usoInfo}>
          <Text style={styles.usoNome}>
            {item.associado?.nome || item.dependente?.nome}
          </Text>
          <Text style={styles.usoHora}>
            Entrada: {formatarHora(item.data_entrada)}
          </Text>
        </View>
        <View style={styles.usoStatus}>
          <Text style={styles.usoStatusText}>📋🔑</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'entrada' && styles.tabAtiva]}
          onPress={() => setTab('entrada')}
        >
          <Text style={[styles.tabText, tab === 'entrada' && styles.tabTextAtiva]}>
            🚶 Entrada
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'saida' && styles.tabAtiva]}
          onPress={() => setTab('saida')}
        >
          <Text style={[styles.tabText, tab === 'saida' && styles.tabTextAtiva]}>
            🚪 Saída ({usosAtivos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'armarios' && styles.tabAtiva]}
          onPress={() => setTab('armarios')}
        >
          <Text style={[styles.tabText, tab === 'armarios' && styles.tabTextAtiva]}>
            🗄️ Armários
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Entrada */}
      {tab === 'entrada' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>1. Identificar Pessoa</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="CPF ou código do cartão"
              placeholderTextColor="#9ca3af"
              value={busca}
              onChangeText={setBusca}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.searchButton} onPress={buscarPessoa}>
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </View>

          {pessoa && (
            <View style={[
              styles.pessoaCard,
              pessoa.status !== 'ativo' && styles.pessoaInativa
            ]}>
              <View style={styles.pessoaAvatar}>
                <Text style={styles.pessoaAvatarText}>
                  {pessoa.nome.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.pessoaInfo}>
                <Text style={styles.pessoaNome}>{pessoa.nome}</Text>
                <Text style={styles.pessoaTipo}>
                  {pessoa.tipo === 'associado' ? '👤 Associado' : '👥 Dependente'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: pessoa.status === 'ativo' ? '#dcfce7' : '#fee2e2' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: pessoa.status === 'ativo' ? '#166534' : '#dc2626' }
                ]}>
                  {pessoa.status}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>2. Selecionar Armário</Text>
          
          <View style={styles.qrRow}>
            <TextInput
              style={styles.qrInput}
              placeholder="QR Code do armário"
              placeholderTextColor="#9ca3af"
              value={qrCode}
              onChangeText={setQrCode}
            />
            <TouchableOpacity style={styles.qrButton} onPress={buscarPorQRCode}>
              <Text style={styles.qrButtonText}>📷</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subTitle}>Ou selecione:</Text>
          <FlatList
            data={armariosDisponiveis}
            renderItem={renderArmarioDisponivel}
            keyExtractor={item => item.id}
            numColumns={5}
            scrollEnabled={false}
            contentContainerStyle={styles.armariosGrid}
          />

          {armarioSelecionado && (
            <View style={styles.armarioSelecionadoInfo}>
              <Text style={styles.armarioSelecionadoText}>
                Armário selecionado: {armarioSelecionado.numero}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.confirmarButton,
              (!pessoa || !armarioSelecionado || pessoa.status !== 'ativo') && styles.buttonDisabled
            ]}
            onPress={registrarEntrada}
            disabled={!pessoa || !armarioSelecionado || pessoa.status !== 'ativo' || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmarButtonText}>
                ✅ Confirmar Entrada
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>📋 Procedimento:</Text>
            <Text style={styles.infoText}>1. Reter carteirinha do associado</Text>
            <Text style={styles.infoText}>2. Entregar chave do armário</Text>
            <Text style={styles.infoText}>3. Confirmar entrada no sistema</Text>
          </View>
        </ScrollView>
      )}

      {/* Tab Saída */}
      {tab === 'saida' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            Armários em Uso ({usosAtivos.length})
          </Text>
          <Text style={styles.subTitle}>Toque para registrar saída</Text>
          
          <FlatList
            data={usosAtivos}
            renderItem={renderUsoAtivo}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.usosList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum armário em uso</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Tab Armários */}
      {tab === 'armarios' && (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Status dos Armários</Text>
          
          <View style={styles.legendaContainer}>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaCor, { backgroundColor: '#dcfce7' }]} />
              <Text style={styles.legendaText}>Disponível</Text>
            </View>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaCor, { backgroundColor: '#fee2e2' }]} />
              <Text style={styles.legendaText}>Ocupado</Text>
            </View>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaCor, { backgroundColor: '#fef3c7' }]} />
              <Text style={styles.legendaText}>Manutenção</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{armariosDisponiveis.length}</Text>
              <Text style={styles.statLabel}>Disponíveis</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{usosAtivos.length}</Text>
              <Text style={styles.statLabel}>Ocupados</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Modal Devolução */}
      <Modal visible={modalDevolucao} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚪 Registrar Saída</Text>
            
            {usoParaDevolucao && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalNome}>
                    {usoParaDevolucao.associado?.nome || usoParaDevolucao.dependente?.nome}
                  </Text>
                  <Text style={styles.modalArmario}>
                    Armário: {usoParaDevolucao.armario.numero}
                  </Text>
                  <Text style={styles.modalHora}>
                    Entrada: {formatarHora(usoParaDevolucao.data_entrada)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.checkboxRow, chavePerdida && styles.checkboxAtivo]}
                  onPress={() => setChavePerdida(!chavePerdida)}
                >
                  <View style={[styles.checkbox, chavePerdida && styles.checkboxMarcado]}>
                    {chavePerdida && <Text style={styles.checkboxIcon}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>🔑 Chave perdida</Text>
                </TouchableOpacity>

                {chavePerdida && (
                  <View style={styles.multaContainer}>
                    <Text style={styles.multaLabel}>Valor da multa (R$):</Text>
                    <TextInput
                      style={styles.multaInput}
                      value={valorMulta}
                      onChangeText={setValorMulta}
                      keyboardType="decimal-pad"
                    />
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelar}
                    onPress={() => setModalDevolucao(false)}
                  >
                    <Text style={styles.modalCancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalConfirmar, chavePerdida && styles.modalConfirmarAlerta]}
                    onPress={registrarSaida}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalConfirmarText}>
                        {chavePerdida ? '⚠️ Confirmar com Multa' : '✅ Confirmar Saída'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabAtiva: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabTextAtiva: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 8,
  },
  subTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pessoaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  pessoaInativa: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  pessoaAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pessoaAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  pessoaInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pessoaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  pessoaTipo: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  qrRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  qrInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qrButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  qrButtonText: {
    fontSize: 24,
  },
  armariosGrid: {
    gap: 8,
  },
  armarioItem: {
    width: 56,
    height: 56,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  armarioSelecionado: {
    backgroundColor: '#3b82f6',
  },
  armarioNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
  },
  armarioSelecionadoInfo: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  armarioSelecionadoText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  confirmarButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  confirmarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  infoTitle: {
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    color: '#3b82f6',
    marginBottom: 4,
  },
  usosList: {
    paddingBottom: 20,
  },
  usoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  usoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  armarioBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  armarioBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b45309',
  },
  usoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  usoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  usoHora: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  usoStatus: {
    alignItems: 'center',
  },
  usoStatusText: {
    fontSize: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  legendaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendaCor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalArmario: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  modalHora: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  checkboxAtivo: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxMarcado: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  checkboxIcon: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  multaContainer: {
    marginBottom: 16,
  },
  multaLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  multaInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelar: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelarText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  modalConfirmar: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  modalConfirmarAlerta: {
    backgroundColor: '#ef4444',
  },
  modalConfirmarText: {
    color: '#fff',
    fontWeight: '600',
  },
})
