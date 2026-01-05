import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button, TextInput } from '@/components'
import { useAuth } from '@/lib/auth'
import { colors, spacing, typography, borderRadius } from '@/lib/theme'

export default function LoginScreen() {
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ cpf?: string; senha?: string }>({})

  const { signIn } = useAuth()

  const validate = () => {
    const newErrors: { cpf?: string; senha?: string } = {}
    
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (!cpfLimpo) {
      newErrors.cpf = 'Digite seu CPF'
    } else if (cpfLimpo.length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos'
    }

    if (!senha) {
      newErrors.senha = 'Digite sua senha'
    } else if (senha.length < 6) {
      newErrors.senha = 'Senha deve ter no mínimo 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return

    setLoading(true)
    const result = await signIn(cpf, senha)
    setLoading(false)

    if (!result.success) {
      Alert.alert('Erro', result.error || 'Não foi possível fazer login')
    }
  }

  return (
    <View style={styles.container}>
      {/* Header com gradiente */}
      <LinearGradient
        colors={['#007AFF', '#5856D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Clube do Associado</Text>
            <Text style={styles.headerSubtitle}>Acesse sua área exclusiva</Text>
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
            <Text style={styles.welcomeText}>Bem-vindo!</Text>
            <Text style={styles.instructionText}>
              Entre com seu CPF e senha para acessar
            </Text>

            <TextInput
              label="CPF"
              placeholder="000.000.000-00"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              icon="person-outline"
              error={errors.cpf}
              mask="cpf"
            />

            <TextInput
              label="Senha"
              placeholder="Digite sua senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              icon="lock-closed-outline"
              error={errors.senha}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.loginButton}
            />
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Sua primeira senha é enviada por email ao se cadastrar no clube
            </Text>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
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
    marginBottom: spacing.xs,
  },
  instructionText: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  forgotPasswordText: {
    fontSize: typography.subhead,
    color: colors.primary,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    fontSize: typography.footnote,
    color: colors.textSecondary,
    flex: 1,
  },
})
