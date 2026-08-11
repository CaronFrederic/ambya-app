import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, overlays } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/radius";
import { typography } from "../theme/typography";

type Props = {
  name: string;
  city?: string | null;
  country?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  duration: string;
  distance?: string;
  showDistance?: boolean;
  onPress?: () => void;
};

export function SalonListItem({
  name,
  city,
  country,
  rating,
  reviewCount,
  duration,
  distance,
  showDistance,
  onPress,
}: Props) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <View style={styles.left}>
        <LinearGradient
          colors={[colors.brand, colors.premium]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        />

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>

            {showDistance && !!distance && (
              <View style={styles.distancePill}>
                <Text style={styles.distanceText}>à {distance}</Text>
              </View>
            )}
          </View>

          <RatingMeta rating={rating} reviewCount={reviewCount} />

          {city || country ? (
            <View style={styles.metaRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color="rgba(107,39,55,0.60)"
              />
              <Text style={styles.durationText}>
                {[city, country].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color="rgba(107,39,55,0.60)"
            />
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="rgba(107,39,55,0.40)" />
    </Pressable>
  );
}

function RatingMeta({
  rating,
  reviewCount,
}: {
  rating?: number | null;
  reviewCount?: number | null;
}) {
  const hasReview =
    typeof reviewCount === "number" &&
    reviewCount > 0 &&
    typeof rating === "number" &&
    Number.isFinite(rating) &&
    rating > 0;

  if (!hasReview) {
    return (
      <View style={styles.metaRow}>
        <Text style={styles.newBadge}>Nouveau</Text>
      </View>
    );
  }

  const formattedRating = rating.toFixed(1).replace(".", ",");
  const reviewLabel = reviewCount > 1 ? "avis" : "avis";

  return (
    <View style={styles.metaRow}>
      <Ionicons name="star" size={14} color={colors.premium} />
      <Text style={styles.metaText}>
        {formattedRating} · {reviewCount} {reviewLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  left: {
    flexDirection: "row",
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },

  name: {
    color: colors.text,
    ...typography.small,
    fontWeight: "600",
    flex: 1,
  },

  distancePill: {
    backgroundColor: overlays.premium20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },

  distanceText: {
    color: colors.brand,
    ...typography.small,
    fontWeight: "500",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },

  metaText: {
    color: colors.text,
    ...typography.small,
    fontWeight: "500",
  },

  newBadge: {
    color: colors.brand,
    ...typography.small,
    fontWeight: "700",
  },

  durationText: {
    color: "rgba(107,39,55,0.60)",
    ...typography.small,
    fontWeight: "500",
  },
});
