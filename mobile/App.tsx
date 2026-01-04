import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ActivityIndicator, View, Text } from 'react-native'
import { AuthProvider, useAuth } from './src/contexts/AuthContext'

// Screens
import LoginScreen from './src/screens/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import AssociadosScreen from './src/screens/AssociadosScreen'
import PortariaScreen from './src/screens/PortariaScreen'
import PortariaSaunaScreen from './src/screens/PortariaSaunaScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ icon }: { icon: string }) {
  return (
    <Text style={{ fontSize: 20 }}>{icon}</Text>
  )
}

function TabNavigator() {
  const { usuario } = useAuth()

  const temPermissao = (permissao: string) => {
    if (usuario?.is_admin) return true
    return usuario?.permissoes?.includes(permissao)
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#1f2937',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Início',
          tabBarIcon: () => <TabIcon icon="🏠" />,
          headerShown: false,
        }}
      />
      {temPermissao('associados') && (
        <Tab.Screen
          name="associados"
          component={AssociadosScreen}
          options={{
            title: 'Associados',
            tabBarIcon: () => <TabIcon icon="👥" />,
          }}
        />
      )}
      {temPermissao('portaria') && (
        <Tab.Screen
          name="portaria"
          component={PortariaScreen}
          options={{
            title: 'Portaria',
            tabBarIcon: () => <TabIcon icon="🚪" />,
          }}
        />
      )}
      {temPermissao('portaria_sauna') && (
        <Tab.Screen
          name="portaria_sauna"
          component={PortariaSaunaScreen}
          options={{
            title: 'Sauna',
            tabBarIcon: () => <TabIcon icon="🧖" />,
            headerTitle: 'Portaria Sauna',
          }}
        />
      )}
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </NavigationContainer>
  )
}
