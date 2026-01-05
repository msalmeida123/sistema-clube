import React, { useState } from 'react'
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, borderRadius, typography, spacing } from '@/lib/theme'

type TextInputProps = {
  label?: string
  placeholder?: string
  value: string
  onChangeText: (text: string) => void
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  error?: string
  icon?: keyof typeof Ionicons.glyphMap
  editable?: boolean
  style?: ViewStyle
  mask?: 'cpf' | 'phone'
}

export function TextInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  icon,
  editable = true,
  style,
  mask,
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChangeText = (text: string) => {
    let formatted = text

    if (mask === 'cpf') {
      // Remove tudo que não é número
      formatted = text.replace(/\D/g, '')
      // Aplica máscara CPF: 000.000.000-00
      if (formatted.length <= 11) {
        formatted = formatted.replace(/(\d{3})(\d)/, '$1.$2')
        formatted = formatted.replace(/(\d{3})(\d)/, '$1.$2')
        formatted = formatted.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      }
    } else if (mask === 'phone') {
      // Remove tudo que não é número
      formatted = text.replace(/\D/g, '')
      // Aplica máscara telefone: (00) 00000-0000
      if (formatted.length <= 11) {
        formatted = formatted.replace(/(\d{2})(\d)/, '($1) $2')
        formatted = formatted.replace(/(\d{5})(\d)/, '$1-$2')
      }
    }

    onChangeText(formatted)
  }

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.icon}
          />
        )}
        
        <RNTextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={handleChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.subhead,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    opacity: 0.7,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.body,
    color: colors.text,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  error: {
    fontSize: typography.footnote,
    color: colors.error,
    marginTop: spacing.xs,
  },
})
