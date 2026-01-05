import { Platform } from 'react-native'

// Cores do tema
export const colors = {
  // Cores principais
  primary: '#007AFF', // iOS Blue
  primaryDark: '#0055CC',
  secondary: '#5856D6', // Purple
  
  // Backgrounds
  background: '#F2F2F7', // iOS Light Gray
  backgroundDark: '#000000',
  card: '#FFFFFF',
  cardDark: '#1C1C1E',
  
  // Textos
  text: '#000000',
  textDark: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  
  // Status
  success: '#34C759', // iOS Green
  warning: '#FF9500', // iOS Orange
  error: '#FF3B30', // iOS Red
  info: '#5AC8FA', // iOS Teal
  
  // Borders
  border: '#C6C6C8',
  borderDark: '#38383A',
  
  // Outros
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: 'rgba(0, 0, 0, 0.1)',
}

// Tipografia
export const typography = {
  // iOS San Francisco / Android Roboto
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  
  // Tamanhos
  largeTitle: 34,
  title1: 28,
  title2: 22,
  title3: 20,
  headline: 17,
  body: 17,
  callout: 16,
  subhead: 15,
  footnote: 13,
  caption1: 12,
  caption2: 11,
}

// Espaçamentos
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

// Raios de borda
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}

// Sombras
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
}
