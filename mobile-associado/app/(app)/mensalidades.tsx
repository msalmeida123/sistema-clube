import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme'

type Mensalidade = {
  id: string
  mes_referencia: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: string
  forma_pagamento?: string
}

export default function MensalidadesScreen() {
  const { associado } = useAuth()
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'pagas'>('todas')

  useEffect(() => {
    carregarMensalidades()
  }, [])

  const carregarMensalidades = async () => {
    if (!associado) return

    const { data, error } = await supabase
      .from('mensalidades')
      .select('*')
      .eq('associado_id', associado.id)
      .order('data_vencimento', { ascending: false })
      .limit(24)

    if (data && !error) {
      setMensalidades(data)
    }
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await carregarMensalidades()
    setRefreshing(false)
  }

  const filtrarMensalidades = () => {
    switch (filtro) {
      case 'pendentes':
        return mensalidades.filter(m => m.status === 'pendente' || m.status === 'atrasado')
      case 'pagas':
        return mensalidades.filter(m => m.status === 'pago')
      default:
        return mensalidades
    }
  }

  const getStatusConfig = (status: string, dataVencimento: string) => {
    const hoje = new Date()
    const vencimento = new Date(dataVencimento)
    const isVencido = vencimento < hoje && status === 'pendente'

    if (status === 'pago') {
      return { color: colors.success, icon: 'checkmark-circle', text: 'Pago' }
    }
    if (isVencido || status === 'atrasado') {
      return { color: colors.error, icon: 'alert-circle', text: 'Atrasado' }
    }
    return { color: colors.warning, icon: 'time', text: 'Pendente' }
  }

  const formatarMes = (mesReferencia: string) => {
    const [ano, mes] = mesReferencia.split('-')
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return `${meses[parseInt(mes) - 1]} ${ano}`
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Calcular totais
  const totalPendente = mensalidades
    .filter(m => m.status === 'pendente' || m.status === 'atrasado')
    .reduce((acc, m) => acc + m.valor, 0)

  const totalAtrasado = mensalidades
    .filter(m => {
      const isVencido = new Date(m.data_vencimento) < new Date()
      return (m.status === 'pendente' && isVencido) || m.status === 'atrasado'
    })
    .reduce((acc, m) => acc + m.valor, 0)

  const mensalidadesFiltradas = filtrarMensalidades()

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#34C759', '#30D158']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mensalidades</Text>
            <Text style={styles.headerSubtitle}>Acompanhe seus pagamentos</Text>
          </View>

          {/* Cards de resumo */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Pendente</Text>
              <Text style={styles.summaryValue}>{formatarValor(totalPendente)}</Text>
            </View>
            {totalAtrasado > 0 && (
              <View style={[styles.summaryCard, styles.summaryCardDanger]}>
                <Text style={styles.summaryLabel}>Em Atraso</Text>
                <Text style={styles.summaryValue}>{formatarValor(totalAtrasado)}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filtro === 'todas' && styles.filterButtonActive]}
          onPress={() => setFiltro('todas')}
        >
          <Text style={[styles.filterText, filtro === 'todas' && styles.filterTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filtro === 'pendentes' && styles.filterButtonActive]}
          onPress={() => setFiltro('pendentes')}
        >
          <Text style={[styles.filterText, filtro === 'pendentes' && styles.filterTextActive]}>
            Pendentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filtro === 'pagas' && styles.filterButtonActive]}
          onPress={() => setFiltro('pagas')}
        >
          <Text style={[styles.filterText, filtro === 'pagas' && styles.filterTextActive]}>
            Pagas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Mensalidades */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {mensalidadesFiltradas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Nenhuma mensalidade encontrada</Text>
            </View>
          ) : (
            mensalidadesFiltradas.map((mensalidade) => {
              const statusConfig = getStatusConfig(mensalidade.status, mensalidade.data_vencimento)
              
              return (
                <View key={mensalidade.id} style={styles.mensalidadeCard}>
                  <View style={styles.mensalidadeHeader}>
                    <View>
                      <Text style={styles.mesReferencia}>
                        {formatarMes(mensalidade.mes_referencia)}
                      </Text>
                      <Text style={styles.vencimento}>
                        Venc: {formatarData(mensalidade.data_vencimento)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                      <Ionicons
                        name={statusConfig.icon as any}
                        size={16}
                        color={statusConfig.color}
                      />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.text}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.mensalidadeFooter}>
                    <Text style={styles.valor}>{formatarValor(mensalidade.valor)}</Text>
                    {mensalidade.data_pagamento && (
                      <Text style={styles.dataPagamento}>
                        Pago em {formatarData(mensalidade.data_pagamento)}
                      </Text>
                    )}
                  </View>
                </View>
              )
            })
          )}

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Pagamentos</Text>
              <Text style={styles.infoText}>
                Para efetuar pagamentos, dirija-se à secretaria do clube ou utilize 
                o boleto enviado por email.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingBottom: spacing.lg,
  },
  headerContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerTitle: {
    fontSize: typography.title1,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: typography.subhead,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  summaryCardDanger: {
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
  },
  summaryLabel: {
    fontSize: typography.caption1,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  summaryValue: {
    fontSize: typography.title3,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  mensalidadeCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  mensalidadeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mesReferencia: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
  },
  vencimento: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: typography.caption1,
    fontWeight: '600',
  },
  mensalidadeFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valor: {
    fontSize: typography.title3,
    fontWeight: '700',
    color: colors.text,
  },
  dataPagamento: {
    fontSize: typography.footnote,
    color: colors.success,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.subhead,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
    lineHeight: 18,
  },
})
