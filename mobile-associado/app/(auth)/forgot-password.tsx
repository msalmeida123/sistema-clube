import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button, TextInput } from '@/components'
import { useAuth } from '@/lib/auth'
import { colors, spacing, typography, borderRadius } from '@/lib/theme'

export default function ForgotPasswordScreen() {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [emailMascarado, setEmailMascarado] = useState('')
  const [error, setError] = useState('')

  const { resetPassword } = useAuth()

  const handleResetPassword = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '')
    
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      setError('Digite um CPF válido')
      return
    }

    setLoading(true)
    setError('')
    
    const result = await resetPassword(cpf)
    setLoading(false)

    if (result.success) {
      setSuccess(true)
      setEmailMascarado(result.email || '')
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível recuperar a senha')
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#34C759', '#30D158']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <Ionicons name="mail" size={60} color="#FFFFFF" />
              </View>
              <Text style={styles.headerTitle}>Email Enviado!</Text>
              <Text style={styles.headerSubtitle}>Verifique sua caixa de entrada</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.successContainer}>
          <View style={styles.card}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            </View>
            
            <Text style={styles.successTitle}>Tudo certo!</Text>
            <Text style={styles.successText}>
              Enviamos um link de recuperação para:
            </Text>
            <Text style={styles.emailText}>{emailMascarado}</Text>
            
            <Text style={styles.instructionText}>
              Clique no link do email para criar uma nova senha. 
              O link expira em 1 hora.
            </Text>

            <Button
              title="Voltar para Login"
              onPress={() => router.replace('/(auth)/login')}
              size="lg"
              style={styles.backButton}
            />

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResetPassword}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={styles.resendText}>Reenviar email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF9500', '#FF6B00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backArrow}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Ionicons name="key" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Esqueceu a Senha?</Text>
            <Text style={styles.headerSubtitle}>Vamos te ajudar a recuperar</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Formulário */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.welcomeText}>Recuperar Senha</Text>
            <Text style={styles.descriptionText}>
              Digite seu CPF cadastrado e enviaremos um link para redefinir sua senha no email registrado.
            </Text>

            <TextInput
              label="CPF"
              placeholder="000.000.000-00"
              value={cpf}
              onChangeText={(text) => {
                setCpf(text)
                setError('')
              }}
              keyboardType="numeric"
              icon="person-outline"
              error={error}
              mask="cpf"
            />

            <Button
              title="Enviar Email de Recuperação"
              onPress={handleResetPassword}
              loading={loading}
              size="lg"
              style={styles.submitButton}
            />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelText}>Voltar para Login</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={24} color={colors.success} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Processo Seguro</Text>
                <Text style={styles.infoDescription}>
                  O link é válido por 1 hora e só pode ser usado uma vez
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={24} color={colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Verifique o Spam</Text>
                <Text style={styles.infoDescription}>
                  Se não encontrar o email, verifique a pasta de spam
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backArrow: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    padding: spacing.sm,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.title1,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.subhead,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    flex: 1,
    marginTop: -spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  welcomeText: {
    fontSize: typography.title2,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  cancelText: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.subhead,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  
  // Success styles
  successContainer: {
    flex: 1,
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: typography.title2,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emailText: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  instructionText: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  backButton: {
    marginTop: spacing.sm,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  resendText: {
    fontSize: typography.subhead,
    color: colors.primary,
    fontWeight: '500',
  },
})
