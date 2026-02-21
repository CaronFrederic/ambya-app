import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'

import { Screen } from '../../src/components/Screen'
import { OfferListItem } from '../../src/components/OfferListItem'

import { colors } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

export default function Offers() {
  const offers = [
    {
      id: '1',
      title: 'Coiffure\nPremium',
      salon: 'Salon Élégance',
      discount: 30,
      price: 15000,
      original: 21000,
    },
    {
      id: '2',
      title: 'Massage\nRelaxant',
      salon: 'Spa Wellness',
      discount: 20,
      price: 20000,
      original: 25000,
    },
    {
      id: '3',
      title: 'Manucure +\nPédicure',
      salon: 'Beauty Lounge',
      discount: 25,
      price: 18000,
      original: 24000,
    },
  ]

  const onOfferPress = () => {
    // selon ton flow: l’offre ouvre la page salon
    router.push('../(screens)/salon')
  }

  return (
    <Screen noPadding style={styles.screen}>
      {/* Header bordeaux */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offres spéciales</Text>
        <Text style={styles.headerSubtitle}>Profitez de nos meilleures promotions</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        <View style={styles.list}>
          {offers.map(o => (
            <OfferListItem
              key={o.id}
              title={o.title}
              salonName={o.salon}
              discountPercent={o.discount}
              price={o.price}
              originalPrice={o.original}
              onPress={onOfferPress}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },

  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },

  headerTitle: {
    color: colors.brandForeground,
    ...typography.h2,
    fontWeight: '700',
  },

  headerSubtitle: {
    color: colors.premium,
    marginTop: spacing.xs,
    ...typography.small,
    fontWeight: '500',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 110, // marge tabbar (comme capture)
  },

  list: {
    gap: spacing.md,
  },
})
