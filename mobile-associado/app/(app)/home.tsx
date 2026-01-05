import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { useAuth } from '@/lib/auth'
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme'

const { width } = Dimensions.get('window')
const QR_SIZE = width * 0.65

export default function HomeScreen() {
  const { associado, refreshAssociado } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [brightness, setBrightness] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refreshAssociado()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return colors.success
      case 'inativo':
        return colors.error
      case 'pendente':
        return colors.warning
      default:
        return colors.textSecondary
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo'
      case 'inativo':
        return 'Inativo'
      case 'pendente':
        return 'Pendente'
      default:
        return status
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#007AFF', '#5856D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Olá,</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {associado?.nome?.split(' ')[0]}! 👋
              </Text>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(associado?.status || '') }]}>
                <Text style={styles.statusText}>{getStatusText(associado?.status || '')}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Card do QR Code */}
        <View style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <Ionicons name="qr-code" size={24} color={colors.primary} />
            <Text style={styles.qrTitle}>Seu Cartão Digital</Text>
          </View>

          <Text style={styles.qrInstruction}>
            Apresente este QR Code na portaria para acessar as dependências do clube
          </Text>

          {/* QR Code Container */}
          <TouchableOpacity
            style={[styles.qrContainer, brightness && styles.qrContainerBright]}
            onPress={() => setBrightness(!brightness)}
            activeOpacity={0.9}
          >
            {associado?.qr_code ? (
              <QRCode
                value={associado.qr_code}
                size={QR_SIZE}
                backgroundColor="white"
                color="#000000"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={80} color={colors.textTertiary} />
                <Text style={styles.qrPlaceholderText}>QR Code não disponível</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Info do Associado */}
          <View style={styles.associadoInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Título</Text>
              <Text style={styles.infoValue}>{associado?.numero_titulo || '-'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plano</Text>
              <Text style={styles.infoValue}>{associado?.plano?.nome || '-'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.brightnessHint} onPress={() => setBrightness(!brightness)}>
            <Ionicons
              name={brightness ? 'sunny' : 'sunny-outline'}
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.brightnessText}>
              {brightness ? 'Toque para diminuir brilho' : 'Toque no QR para aumentar brilho'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dicas de Uso */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dicas</Text>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.tipText}>Mantenha o celular com brilho alto</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.tipText}>Aproxime o QR Code do leitor</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.tipText}>Funciona mesmo sem internet</Text>
          </View>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.subhead,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: typography.title2,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.caption1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  qrCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  qrTitle: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
  },
  qrInstruction: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  qrContainer: {
    alignSelf: 'center',
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  qrContainerBright: {
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  qrPlaceholder: {
    width: QR_SIZE,
    height: QR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: typography.subhead,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  associadoInfo: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoRow: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.caption1,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
  },
  infoDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  brightnessHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  brightnessText: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
  },
  tipsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  tipsTitle: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
  },
})
