import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
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
