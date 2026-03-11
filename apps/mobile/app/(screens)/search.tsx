import { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { SalonListItem } from '../../src/components/SalonListItem'
import { useSearchDiscovery, useHomeDiscovery } from '../../src/api/discovery'
import { useCountries } from '../../src/api/config'
import { FALLBACK_COUNTRIES } from '../../src/constants/countries'
import { useMeSummary } from '../../src/api/me'
import { spacing } from '../../src/theme/spacing'
import { colors } from '../../src/theme/colors'

export default function Search() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [country, setCountry] = useState<string | undefined>(undefined)

  const { data: countriesData } = useCountries()
  const { data: me } = useMeSummary(true)

  useEffect(() => {
    const loadCountry = async () => {
      const countryCode = await SecureStore.getItemAsync('countryCode')
      const countries = countriesData?.length ? countriesData : FALLBACK_COUNTRIES
      const selectedCountry = countries.find((item) => item.code === countryCode)
      setCountry(selectedCountry?.name)
    }

    void loadCountry()
  }, [countriesData])

  const { data: categoriesData } = useHomeDiscovery({ country })
  const categories = categoriesData?.categories ?? []

  const debouncedQuery = useMemo(() => query.trim(), [query])
  const { data, isLoading } = useSearchDiscovery({
    q: debouncedQuery || undefined,
    category: category ?? undefined,
    preferredCity: me?.profile?.city ?? undefined,
    preferredCountry: me?.profile?.country ?? country,
  })

  return (
    <Screen scroll keyboard>
      <Header title="Recherche" subtitle="Trouve un salon dans ton pays" />

      <View style={{ gap: spacing.md }}>
        <Input
          placeholder="Rechercher un salon, service, ville ou pays..."
          value={query}
          onChangeText={setQuery}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory((prev) => (prev === cat ? null : cat))}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: category === cat ? colors.brand : 'rgba(107,39,55,0.2)',
                backgroundColor: category === cat ? colors.brand : '#fff',
              }}
            >
              <Text style={{ color: category === cat ? '#fff' : colors.text }}>{cat}</Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <Card>
            <Text>Chargement...</Text>
          </Card>
        ) : null}

        {(data?.items ?? []).map((item) => (
          <SalonListItem
            key={item.id}
            name={item.name}
            city={item.city}
            country={item.country}
            rating={item.rating}
            duration={
              item.highlights[0]?.durationMin
                ? `${item.highlights[0].durationMin} min`
                : '30 min'
            }
            onPress={() =>
              router.push({ pathname: '/(screens)/salon', params: { salonId: item.id } })
            }
          />
        ))}
      </View>
    </Screen>
  )
}
