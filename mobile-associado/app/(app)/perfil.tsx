import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components'
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme'

export default function PerfilScreen() {
  const { associado, signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            await signOut()
            setLoading(false)
          },
        },
      ]
    )
  }

  const formatarCPF = (cpf: string) => {
    if (!cpf) return '-'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatarTelefone = (tel: string) => {
    if (!tel) return '-'
    const nums = tel.replace(/\D/g, '')
    if (nums.length === 11) {
      return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return tel
  }

  const menuItems = [
    {
      icon: 'document-text-outline',
      title: 'Meus Documentos',
      subtitle: 'Contratos e declarações',
      onPress: () => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve'),
    },
    {
      icon: 'people-outline',
      title: 'Dependentes',
      subtitle: 'Gerenciar dependentes',
      onPress: () => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notificações',
      subtitle: 'Configurar alertas',
      onPress: () => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Ajuda',
      subtitle: 'Dúvidas frequentes',
      onPress: () => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve'),
    },
  ]

  return (
    <View style={styles.container}>
      {/* Header com foto */}
      <LinearGradient
        colors={['#5856D6', '#AF52DE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              {associado?.foto_url ? (
                <Image source={{ uri: associado.foto_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {associado?.nome?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                </View>
              )}
              <View style={styles.statusDot} />
            </View>
            <Text style={styles.userName} numberOfLines={1}>{associado?.nome}</Text>
            <Text style={styles.userTitle}>Título: {associado?.numero_titulo || '-'}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Informações Pessoais */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações Pessoais</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="card-outline" size={22} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>CPF</Text>
              <Text style={styles.infoValue}>{formatarCPF(associado?.cpf || '')}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={22} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{associado?.email || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={22} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{formatarTelefone(associado?.telefone || '')}</Text>
            </View>
          </View>

          <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
            <Ionicons name="pricetag-outline" size={22} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Plano</Text>
              <Text style={styles.infoValue}>{associado?.plano?.nome || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.card}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={22} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botão de Logout */}
        <Button
          title="Sair da Conta"
          onPress={handleLogout}
          variant="danger"
          loading={loading}
          icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
          style={styles.logoutButton}
        />

        {/* Versão */}
        <Text style={styles.version}>Versão 1.0.0</Text>
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
    paddingBottom: spacing.xl,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: typography.title2,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },
  userTitle: {
    fontSize: typography.subhead,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.caption1,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: '500',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.caption1,
    color: colors.textTertiary,
    marginTop: spacing.lg,
  },
})
