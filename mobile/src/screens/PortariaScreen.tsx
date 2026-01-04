import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { supabase } from '../lib/supabase'

type Pessoa = {
  id: string
  nome: string
  tipo: 'associado' | 'dependente'
  foto_url?: string
  status: string
  associado?: {
    nome: string
    status: string
  }
}

export default function PortariaScreen() {
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [pessoa, setPessoa] = useState<Pessoa | null>(null)
  const [registrando, setRegistrando] = useState(false)

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
      .select('id, nome, status')
      .or(`cpf.eq.${busca},codigo_cartao.eq.${busca}`)
      .single()

    if (associado) {
      setPessoa({
        id: associado.id,
        nome: associado.nome,
        tipo: 'associado',
        status: associado.status,
      })
      setLoading(false)
      return
    }

    // Buscar dependente
    const { data: dependente } = await supabase
      .from('dependentes')
      .select('id, nome, status, associado:associados(nome, status)')
      .or(`cpf.eq.${busca},codigo_cartao.eq.${busca}`)
      .single()

    if (dependente) {
      setPessoa({
        id: dependente.id,
        nome: dependente.nome,
        tipo: 'dependente',
        status: dependente.status,
        associado: dependente.associado,
      })
      setLoading(false)
      return
    }

    Alert.alert('Não encontrado', 'Nenhum associado ou dependente encontrado com este CPF/cartão')
    setLoading(false)
  }

  const registrarAcesso = async (tipo: 'entrada' | 'saida') => {
    if (!pessoa) return

    setRegistrando(true)

    const { error } = await supabase.from('registros_acesso').insert({
      pessoa_id: pessoa.id,
      tipo_pessoa: pessoa.tipo,
      tipo_registro: tipo,
      data_hora: new Date().toISOString(),
    })

    setRegistrando(false)

    if (error) {
      Alert.alert('Erro', 'Não foi possível registrar o acesso')
      return
    }

    Alert.alert(
      '✅ Acesso Registrado',
      `${tipo === 'entrada' ? 'Entrada' : 'Saída'} de ${pessoa.nome} registrada com sucesso!`
    )

    // Limpar busca
    setBusca('')
    setPessoa(null)
  }

  const getStatusInfo = () => {
    if (!pessoa) return null

    const isAtivo = pessoa.status === 'ativo'
    const titularAtivo = pessoa.tipo === 'dependente' ? pessoa.associado?.status === 'ativo' : true

    if (!isAtivo || !titularAtivo) {
      return {
        permitido: false,
        mensagem: pessoa.tipo === 'dependente' && !titularAtivo
          ? 'Titular com pendências'
          : 'Cadastro inativo',
        cor: '#ef4444',
      }
    }

    return {
      permitido: true,
      mensagem: 'Acesso Liberado',
      cor: '#10b981',
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚪 Controle de Acesso</Text>
        <Text style={styles.subtitle}>Digite o CPF ou passe o cartão</Text>
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="CPF ou código do cartão"
          placeholderTextColor="#9ca3af"
          value={busca}
          onChangeText={setBusca}
          keyboardType="numeric"
          onSubmitEditing={buscarPessoa}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={buscarPessoa}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Resultado */}
      {pessoa && (
        <View style={styles.resultCard}>
          <View style={styles.personInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {pessoa.nome.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.personDetails}>
              <Text style={styles.personName}>{pessoa.nome}</Text>
              <Text style={styles.personType}>
                {pessoa.tipo === 'associado' ? '👤 Associado' : '👥 Dependente'}
              </Text>
              {pessoa.tipo === 'dependente' && pessoa.associado && (
                <Text style={styles.titularInfo}>
                  Titular: {pessoa.associado.nome}
                </Text>
              )}
            </View>
          </View>

          {/* Status */}
          <View style={[styles.statusBanner, { backgroundColor: statusInfo?.cor + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo?.cor }]}>
              {statusInfo?.permitido ? '✅' : '❌'} {statusInfo?.mensagem}
            </Text>
          </View>

          {/* Botões de Ação */}
          {statusInfo?.permitido && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.entradaButton]}
                onPress={() => registrarAcesso('entrada')}
                disabled={registrando}
              >
                {registrando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.actionEmoji}>🚶‍♂️➡️</Text>
                    <Text style={styles.actionText}>Entrada</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.saidaButton]}
                onPress={() => registrarAcesso('saida')}
                disabled={registrando}
              >
                {registrando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.actionEmoji}>⬅️🚶‍♂️</Text>
                    <Text style={styles.actionText}>Saída</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resultCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  personDetails: {
    marginLeft: 16,
    flex: 1,
  },
  personName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  personType: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  titularInfo: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  entradaButton: {
    backgroundColor: '#10b981',
  },
  saidaButton: {
    backgroundColor: '#f59e0b',
  },
  actionEmoji: {
    fontSize: 32,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
})
