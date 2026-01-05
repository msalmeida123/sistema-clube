import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, borderRadius, spacing, shadows, typography } from '@/lib/theme'

type CardProps = {
  children: React.ReactNode
  title?: string
  subtitle?: string
  style?: ViewStyle
  variant?: 'default' | 'elevated' | 'outlined'
}

export function Card({ children, title, subtitle, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.card, styles[variant], style]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  default: {
    ...shadows.sm,
  },
  elevated: {
    ...shadows.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.subhead,
    color: colors.textSecondary,
    marginTop: 2,
  },
})
