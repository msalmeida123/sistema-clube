import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigation } from '@react-navigation/native'

type Stats = {
  totalAssociados: number
  associadosAtivos: number
  dependentes: number
  mensalidadesPendentes: number
}

export default function HomeScreen() {
  const { usuario, signOut } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalAssociados: 0,
    associadosAtivos: 0,
    dependentes: 0,
    mensalidadesPendentes: 0,
  })
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation<any>()

  const carregarDados = async () => {
    // Total de associados
    const { count: totalAssociados } = await supabase
      .from('associados')
      .select('*', { count: 'exact', head: true })

    // Associados ativos
    const { count: associadosAtivos } = await supabase
      .from('associados')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo')

    // Dependentes
    const { count: dependentes } = await supabase
      .from('dependentes')
      .select('*', { count: 'exact', head: true })

    // Mensalidades pendentes
    const { count: mensalidadesPendentes } = await supabase
      .from('mensalidades')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')

    setStats({
      totalAssociados: totalAssociados || 0,
      associadosAtivos: associadosAtivos || 0,
      dependentes: dependentes || 0,
      mensalidadesPendentes: mensalidadesPendentes || 0,
    })
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await carregarDados()
    setRefreshing(false)
  }

  const menuItems = [
    { id: 'associados', label: 'Associados', icon: '👥', color: '#3b82f6', permissao: 'associados' },
    { id: 'dependentes', label: 'Dependentes', icon: '👨‍👩‍👧‍👦', color: '#8b5cf6', permissao: 'dependentes' },
    { id: 'financeiro', label: 'Financeiro', icon: '💰', color: '#10b981', permissao: 'financeiro' },
    { id: 'portaria', label: 'Portaria', icon: '🚪', color: '#f59e0b', permissao: 'portaria' },
    { id: 'compras', label: 'Compras', icon: '🛒', color: '#ef4444', permissao: 'compras' },
    { id: 'relatorios', label: 'Relatórios', icon: '📊', color: '#6366f1', permissao: 'relatorios' },
  ]

  const temPermissao = (permissao: string) => {
    if (usuario?.is_admin) return true
    return usuario?.permissoes?.includes(permissao)
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {usuario?.nome?.split(' ')[0]}!</Text>
          <Text style={styles.subtitle}>Bem-vindo ao Sistema Clube</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
          <Text style={[styles.statNumber, { color: '#1e40af' }]}>{stats.totalAssociados}</Text>
          <Text style={styles.statLabel}>Associados</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.statNumber, { color: '#166534' }]}>{stats.associadosAtivos}</Text>
          <Text style={styles.statLabel}>Ativos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f3e8ff' }]}>
          <Text style={[styles.statNumber, { color: '#7c3aed' }]}>{stats.dependentes}</Text>
          <Text style={styles.statLabel}>Dependentes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
          <Text style={[styles.statNumber, { color: '#b45309' }]}>{stats.mensalidadesPendentes}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
      </View>

      {/* Menu Grid */}
      <Text style={styles.sectionTitle}>Módulos</Text>
      <View style={styles.menuGrid}>
        {menuItems.filter(item => temPermissao(item.permissao)).map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.id)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.menuEmoji}>{item.icon}</Text>
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Admin Badge */}
      {usuario?.is_admin && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminText}>🛡️ Administrador</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItem: {
    width: '30%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuEmoji: {
    fontSize: 24,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  adminBadge: {
    margin: 20,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    alignItems: 'center',
  },
  adminText: {
    color: '#b45309',
    fontWeight: '600',
  },
})
