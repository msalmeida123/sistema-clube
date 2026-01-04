import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'

type Associado = {
  id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  status: string
  plano?: { nome: string }
}

export default function AssociadosScreen() {
  const [associados, setAssociados] = useState<Associado[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busca, setBusca] = useState('')

  const carregarAssociados = async () => {
    let query = supabase
      .from('associados')
      .select('*, plano:planos(nome)')
      .order('nome')
      .limit(50)

    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,cpf.ilike.%${busca}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      setAssociados(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarAssociados()
  }, [busca])

  const onRefresh = async () => {
    setRefreshing(true)
    await carregarAssociados()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return '#10b981'
      case 'inativo': return '#ef4444'
      case 'pendente': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const renderAssociado = ({ item }: { item: Associado }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.nome?.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.cpf}>{item.cpf}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      {item.plano && (
        <View style={styles.planoContainer}>
          <Text style={styles.planoLabel}>Plano:</Text>
          <Text style={styles.planoNome}>{item.plano.nome}</Text>
        </View>
      )}
      <View style={styles.contatos}>
        {item.telefone && <Text style={styles.contato}>📱 {item.telefone}</Text>}
        {item.email && <Text style={styles.contato}>✉️ {item.email}</Text>}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou CPF..."
          placeholderTextColor="#9ca3af"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Carregando associados...</Text>
        </View>
      ) : (
        <FlatList
          data={associados}
          renderItem={renderAssociado}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum associado encontrado</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cpf: {
    fontSize: 14,
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
  planoContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  planoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  planoNome: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 4,
  },
  contatos: {
    marginTop: 8,
  },
  contato: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
})
