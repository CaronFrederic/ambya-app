import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../src/components/Screen'
import { SectionTitle } from '../../src/components/SectionTitle'
import { OfferCard } from '../../src/components/OfferCard'
import { SalonListItem } from '../../src/components/SalonListItem'
import { useHomeDiscovery } from '../../src/api/discovery'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data, isLoading } = useHomeDiscovery({
    city: 'Libreville',
    country: 'Gabon',
    category: selectedCategory ?? undefined,
  })

  const categories = data?.categories ?? []
  const offers = data?.offers ?? []
  const topRated = data?.topRatedSalons ?? []

  return (
    <Screen noPadding style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]} contentContainerStyle={styles.content}>
        <View style={styles.stickyHeader}>
          <View style={styles.topRow}>
            <View style={styles.location}>
              <Ionicons name="location-outline" size={16} color={colors.brand} />
              <Text style={styles.locationText}>Libreville, Gabon</Text>
            </View>
          </View>

          <Pressable onPress={() => router.push('/(screens)/search')} style={styles.searchBtn}>
            <Ionicons name="search-outline" size={18} color="rgba(107,39,55,0.50)" />
            <Text style={styles.searchPlaceholder}>Rechercher salon, service...</Text>
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {categories.map((cat) => {
              const active = selectedCategory === cat
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory((prev) => (prev === cat ? null : cat))}
                  style={[styles.chip, active ? styles.chipOn : styles.chipOff]}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextOn : styles.chipTextOff]}>{cat}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        <View style={styles.body}>
          <SectionTitle title="Offres du moment" />
          {isLoading ? (
            <Text style={styles.loading}>Chargement…</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersRow}>
              {offers.map((offer) => (
                <OfferCard
                  key={`${offer.salonId}-${offer.serviceName}`}
                  discount={`-${offer.discountPercent}%`}
                  service={offer.serviceName}
                  salon={offer.salonName}
                  onPress={() =>
                    router.push({
                      pathname: '/(screens)/salon',
                      params: { salonId: offer.salonId },
                    })
                  }
                />
              ))}
            </ScrollView>
          )}

          <SectionTitle title="Les mieux notés" />
          <View style={styles.list}>
            {topRated.map((salon) => (
              <SalonListItem
                key={salon.id}
                name={salon.name}
                rating={salon.rating}
                duration={salon.duration}
                onPress={() =>
                  router.push({
                    pathname: '/(screens)/salon',
                    params: { salonId: salon.id },
                  })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  stickyHeader: { backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  location: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  locationText: { color: colors.text, ...typography.body, fontWeight: '600' },
  searchBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    height: 48,
    borderWidth: 1,
    borderColor: overlays.brand20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchPlaceholder: { color: colors.textMuted, ...typography.body },
  chipsRow: { gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1 },
  chipOff: { backgroundColor: colors.card, borderColor: overlays.brand20 },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { ...typography.small, fontWeight: '600' },
  chipTextOff: { color: colors.text },
  chipTextOn: { color: colors.brandForeground },
  body: { paddingHorizontal: spacing.lg, gap: spacing.md },
  offersRow: { gap: spacing.md },
  list: { gap: spacing.md },
  loading: { color: colors.textMuted, ...typography.small },
})
