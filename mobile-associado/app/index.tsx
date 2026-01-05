import { Redirect } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { colors } from '@/lib/theme'

export default function Index() {
  const { associado, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (associado) {
    return <Redirect href="/(app)/home" />
  }

  return <Redirect href="/(auth)/login" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
})
