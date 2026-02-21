import { useEffect, useState } from 'react'
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { Picker } from '@react-native-picker/picker'

import { useCountries } from '../src/api/config'
import { FALLBACK_COUNTRIES } from '../src/constants/countries'
import { colors, overlays } from '../src/theme/colors'
import { spacing } from '../src/theme/spacing'
import { radius } from '../src/theme/radius'
import { Stack } from '../src/components/Stack'

const logo = require('../assets/splash-logo.png') // idéalement PNG transparent

export default function IndexSplash() {
  const { data } = useCountries()
  const [selectedCode, setSelectedCode] = useState('GA')
  const [booting, setBooting] = useState(true)

  const countries = data?.length ? data : FALLBACK_COUNTRIES
  const selected = countries.find(c => c.code === selectedCode)
  const currency = selected?.currency ?? 'FCFA'

  useEffect(() => {
    const boot = async () => {
      const token = await SecureStore.getItemAsync('accessToken')
      const role = await SecureStore.getItemAsync('userRole')

      if (token && role) {
        if (role === 'PROFESSIONAL') return router.replace('/(professional)/dashboard')
        if (role === 'EMPLOYEE') return router.replace('/(employee)/dashboard')
        return router.replace('/(tabs)/appointments')
      }
      setBooting(false)
    }
    boot()
  }, [])

  const onContinue = async () => {
    await SecureStore.setItemAsync('countryCode', selectedCode)
    await SecureStore.setItemAsync('currency', currency)
    router.replace('/(auth)/login')
  }

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.premium} size="large" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
      <Image source={logo} resizeMode="contain" style={{ width: 240, height: 240, marginBottom: spacing.xl }} />

      <View style={{ width: '100%', maxWidth: 340 }}>
        <Stack gap={spacing.md}>
          <Text style={{ color: colors.premium, fontWeight: '500' }}>Sélectionnez votre pays</Text>

          <View style={{
            backgroundColor: overlays.white06,
            borderRadius: radius.full,
            borderWidth: 1,
            borderColor: overlays.premium20,
          }}>
            <Picker
              selectedValue={selectedCode}
              onValueChange={setSelectedCode}
              dropdownIconColor={colors.brandForeground}
              style={{ color: colors.brandForeground }}
            >
              {countries.map(c => <Picker.Item key={c.code} label={c.name} value={c.code} />)}
            </Picker>
          </View>

          <Text style={{ color: colors.premium, textAlign: 'center' }}>
            Devise: {currency}
          </Text>

          <Pressable
            onPress={onContinue}
            style={({ pressed }) => ({
              backgroundColor: colors.premium,
              borderRadius: radius.full,
              paddingVertical: 18,
              alignItems: 'center',
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Text style={{ color: colors.brand, fontWeight: '600' }}>Continuer</Text>
          </Pressable>
        </Stack>
      </View>
    </View>
  )
}
