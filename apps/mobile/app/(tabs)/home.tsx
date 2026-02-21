// app/(tabs)/home.tsx
import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../src/components/Screen'
import { SectionTitle } from '../../src/components/SectionTitle'
import { OfferCard } from '../../src/components/OfferCard'
import { SalonListItem } from '../../src/components/SalonListItem'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

type Offer = {
  discount: string
  service: string
  salon: string
}

type Salon = {
  name: string
  rating: number
  duration: string
  distance?: string
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [nearMe, setNearMe] = useState(false)

  const categories = useMemo(
    () => ['Coiffure', 'Maquillage', 'Manucure', 'Massage', 'Fitness'],
    []
  )

  const offers: Offer[] = useMemo(
    () => [
      { discount: '-30%', service: 'Coiffure Premium', salon: 'Salon Élégance' },
      { discount: '-20%', service: 'Massage Relaxant', salon: 'Spa Wellness' },
    ],
    []
  )

  const topRated: Salon[] = useMemo(
    () => [
      { name: 'Salon Élégance', rating: 4.8, duration: '20-30 min', distance: '1.2 km' },
      { name: 'Beauty Lounge', rating: 4.7, duration: '20-30 min', distance: '2.5 km' },
      { name: 'Glam Studio', rating: 4.6, duration: '20-30 min', distance: '3.8 km' },
    ],
    []
  )

  const onSearchClick = () => router.push('../(screens)/search')
  const onOfferClick = () => router.push('../(screens)/salon')
  const onSalonSelect = () => router.push('../(screens)/salon')

  return (
    <Screen noPadding style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.content}
      >
        {/* STICKY HEADER */}
        <View style={styles.stickyHeader}>
          {/* Location + Near */}
          <View style={styles.topRow}>
            <View style={styles.location}>
              <Ionicons name="location-outline" size={16} color={colors.brand} />
              <Text style={styles.locationText} numberOfLines={1}>
                Libreville, Gabon
              </Text>
            </View>

            <Pressable
              onPress={() => setNearMe(v => !v)}
              style={[styles.nearBtn, nearMe ? styles.nearBtnOn : styles.nearBtnOff]}
            >
              <Ionicons
                name="navigate-outline"
                size={14}
                color={nearMe ? colors.brandForeground : colors.brand}
              />
              <Text style={[styles.nearBtnText, nearMe ? styles.nearBtnTextOn : styles.nearBtnTextOff]}>
                Près
              </Text>
            </Pressable>
          </View>

          {/* Search */}
          <Pressable onPress={onSearchClick} style={styles.searchBtn}>
            <Ionicons name="search-outline" size={18} color="rgba(107,39,55,0.50)" />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              Rechercher salon, service...
            </Text>
          </Pressable>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {categories.map(cat => {
              const active = selectedCategory === cat
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(prev => (prev === cat ? null : cat))}
                  style={[styles.chip, active ? styles.chipOn : styles.chipOff]}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextOn : styles.chipTextOff]}>
                    {cat}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {/* BODY */}
        <View style={styles.body}>
          {/* Offers */}
          <SectionTitle title="Offres du moment" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offersRow}
          >
            {offers.map((o, idx) => (
              <OfferCard
                key={idx}
                discount={o.discount}
                service={o.service}
                salon={o.salon}
                onPress={onOfferClick}
              />
            ))}
          </ScrollView>

          {/* Map placeholder when nearMe */}
          {nearMe && (
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapBox}>
                <Ionicons name="location" size={34} color={colors.brand} />
                <Text style={styles.mapText}>Carte interactive (UX mode)</Text>
              </View>
            </View>
          )}

          {/* Top rated */}
          <SectionTitle title="Les mieux notés" />
          <View style={styles.list}>
            {topRated.map((s, idx) => (
              <SalonListItem
                key={idx}
                name={s.name}
                rating={s.rating}
                duration={s.duration}
                distance={s.distance}
                showDistance={nearMe}
                onPress={onSalonSelect}
              />
            ))}
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },

  content: {
    paddingBottom: 24,
  },

  stickyHeader: {
    backgroundColor: colors.card,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },

  locationText: {
    color: colors.text,
    ...typography.small,
    fontWeight: '500',
  },

  nearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },

  nearBtnOff: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },

  nearBtnOn: {
    backgroundColor: colors.brand,
  },

  nearBtnText: {
    ...typography.small,
    fontWeight: '600',
  },

  nearBtnTextOff: {
    color: colors.brand,
  },

  nearBtnTextOn: {
    color: colors.brandForeground,
  },

  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },

  searchPlaceholder: {
    color: 'rgba(58,58,58,0.60)',
    ...typography.body,
  },

  chipsRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },

  chip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },

  chipOff: {
    backgroundColor: colors.background,
    borderColor: overlays.brand20,
  },

  chipOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },

  chipText: {
    ...typography.small,
    fontWeight: '500',
  },

  chipTextOff: {
    color: colors.text,
  },

  chipTextOn: {
    color: colors.brandForeground,
  },

  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  offersRow: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },

  mapPlaceholder: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },

  mapBox: {
    height: 180,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(107,39,55,0.06)',
    borderWidth: 2,
    borderColor: overlays.brand20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  mapText: {
    color: 'rgba(58,58,58,0.60)',
    ...typography.small,
  },

  list: {
    gap: spacing.md,
  },
})
