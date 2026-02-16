import { Tabs } from 'expo-router'
import { colors } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // 🎨 Branding Ambya
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingTop: spacing.xs,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="search" options={{ title: 'Recherche' }} />
      <Tabs.Screen name="salon" options={{ title: 'Salon' }} />
      <Tabs.Screen name="appointments" options={{ title: 'RDV' }} />
      <Tabs.Screen name="payment" options={{ title: 'Paiement' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />

      {/* Ces écrans ne doivent PAS être dans la tab bar */}
      <Tabs.Screen name="create-appointment" options={{ href: null }} />
      <Tabs.Screen name="assign-employee" options={{ href: null }} />
    </Tabs>
  )
}
