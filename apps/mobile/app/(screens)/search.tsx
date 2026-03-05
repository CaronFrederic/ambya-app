import { useMemo, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'

import { Screen } from '../../src/components/Screen'
import { Header } from '../../src/components/Header'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { useSearchDiscovery, useHomeDiscovery } from '../../src/api/discovery'
import { spacing } from '../../src/theme/spacing'
import { colors } from '../../src/theme/colors'

export default function Search() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const { data: categoriesData } = useHomeDiscovery({ city: 'Libreville', country: 'Gabon' })
  const categories = categoriesData?.categories ?? []

  const debouncedQuery = useMemo(() => query.trim(), [query])
  const { data, isLoading } = useSearchDiscovery({
    q: debouncedQuery || undefined,
    city: 'Libreville',
    country: 'Gabon',
    category: category ?? undefined,
  })

  return (
    <Screen>
      <Header title="Recherche" subtitle="Trouve un salon près de toi" />

      <View style={{ gap: spacing.md }}>
        <Input placeholder="Rechercher un salon ou un service..." value={query} onChangeText={setQuery} />

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
          <Card><Text>Chargement...</Text></Card>
        ) : (
          (data?.items ?? []).map((item) => (
            <Card key={item.id}>
              <Pressable
                onPress={() => router.push({ pathname: '/(screens)/salon', params: { salonId: item.id } })}
                style={{ gap: spacing.xs }}
              >
                <Text style={{ fontWeight: '700', color: colors.text }}>{item.name}</Text>
                <Text style={{ color: colors.textMuted }}>
                  {[item.city, item.country].filter(Boolean).join(', ')}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {item.highlights.slice(0, 3).map((h) => h.name).join(' • ')}
                </Text>
              </Pressable>
            </Card>
          ))
        )}
      </View>
    </Screen>
  )
}
