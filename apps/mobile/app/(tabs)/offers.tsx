import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";

import { Screen } from "../../src/components/Screen";
import { OfferListItem } from "../../src/components/OfferListItem";
import { useHomeDiscovery } from "../../src/api/discovery";

import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { radius } from "../../src/theme/radius";
import { typography } from "../../src/theme/typography";

export default function Offers() {
  const { data, isLoading } = useHomeDiscovery();
  const offers = data?.offers ?? [];

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offres spéciales</Text>
        <Text style={styles.headerSubtitle}>
          Profitez de nos meilleures promotions
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        {isLoading ? <Text style={styles.loading}>Chargement…</Text> : null}

        <View style={styles.list}>
          {offers.map((offer) => (
            <OfferListItem
              key={`${offer.salonId}-${offer.serviceId}`}
              title={offer.serviceName}
              salonName={offer.salonName}
              discountPercent={offer.discountPercent}
              price={offer.discountedPrice}
              originalPrice={offer.originalPrice}
              onPress={() =>
                router.push({
                  pathname: "/(screens)/salon",
                  params: {
                    salonId: offer.salonId,
                    offerServiceId: offer.serviceId,
                    offerPrice: String(offer.discountedPrice),
                  },
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
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
    fontWeight: "700",
  },

  headerSubtitle: {
    color: colors.premium,
    marginTop: spacing.xs,
    ...typography.small,
    fontWeight: "500",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 110,
  },

  list: {
    gap: spacing.md,
  },

  loading: {
    color: colors.textMuted,
    ...typography.small,
    marginBottom: spacing.md,
  },
});
