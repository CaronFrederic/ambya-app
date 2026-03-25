import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

import { OfferCard } from "../../src/components/OfferCard";
import { SalonListItem } from "../../src/components/SalonListItem";
import { Screen } from "../../src/components/Screen";
import { SectionTitle } from "../../src/components/SectionTitle";
import { useHomeDiscovery } from "../../src/api/discovery";
import { useCountries } from "../../src/api/config";
import { useMeSummary } from "../../src/api/me";
import { FALLBACK_COUNTRIES } from "../../src/constants/countries";
import { colors, overlays } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [fallbackCountry, setFallbackCountry] = useState<string | undefined>(
    undefined,
  );
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentLocationLabel, setCurrentLocationLabel] = useState<
    string | null
  >(null);

  const { data: countriesData } = useCountries();
  const { data: me } = useMeSummary(true);

  useEffect(() => {
    const loadCountry = async () => {
      const countryCode = await SecureStore.getItemAsync("countryCode");
      const countries = countriesData?.length
        ? countriesData
        : FALLBACK_COUNTRIES;
      const selectedCountry = countries.find((item) => item.code === countryCode);
      setFallbackCountry(selectedCountry?.name);
    };

    void loadCountry();
  }, [countriesData]);

  const location = useMemo(
    () => ({
      city: nearMeEnabled ? undefined : me?.profile?.city ?? undefined,
      country: me?.profile?.country ?? fallbackCountry,
    }),
    [fallbackCountry, me?.profile?.city, me?.profile?.country, nearMeEnabled],
  );

  const { data, isLoading } = useHomeDiscovery({
    city: location.city,
    country: location.country,
    category: selectedCategory ?? undefined,
    nearMe: nearMeEnabled,
    latitude: currentPosition?.latitude ?? null,
    longitude: currentPosition?.longitude ?? null,
  });

  const categories = data?.categories ?? [];
  const offers = data?.offers ?? [];
  const topRated = data?.topRatedSalons ?? [];
  const mapSalons = data?.mapSalons ?? [];

  const displayedLocation =
    currentLocationLabel ??
    ([location.city, location.country].filter(Boolean).join(", ") ||
      "Votre pays");

  const mapRegion = useMemo(() => {
    if (currentPosition) {
      return {
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        latitudeDelta: 0.32,
        longitudeDelta: 0.32,
      };
    }

    if (mapSalons[0]) {
      return {
        latitude: mapSalons[0].latitude,
        longitude: mapSalons[0].longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
    }

    return null;
  }, [currentPosition, mapSalons]);

  async function toggleNearMe() {
    if (nearMeEnabled) {
      setNearMeEnabled(false);
      setCurrentPosition(null);
      setCurrentLocationLabel(null);
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Position indisponible",
          "Autorisez la localisation pour afficher les salons proches.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCurrentPosition(nextPosition);
      setNearMeEnabled(true);

      const places = await Location.reverseGeocodeAsync(nextPosition);
      const firstPlace = places[0];
      const label = [firstPlace?.city, firstPlace?.country]
        .filter(Boolean)
        .join(", ");
      setCurrentLocationLabel(label || "Autour de moi");
    } catch {
      Alert.alert(
        "Position indisponible",
        "Impossible de recuperer votre position pour le moment.",
      );
    }
  }

  function openSalon(salonId: string) {
    router.push({
      pathname: "/(screens)/salon",
      params: { salonId },
    });
  }

  return (
    <Screen noPadding style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.stickyHeader}>
          <View style={styles.topRow}>
            <View style={styles.location}>
              <Ionicons
                name="location-outline"
                size={15}
                color={colors.brand}
              />
              <Text style={styles.locationText}>{displayedLocation}</Text>
            </View>

            <Pressable
              onPress={toggleNearMe}
              style={[
                styles.nearButton,
                nearMeEnabled ? styles.nearButtonActive : styles.nearButtonIdle,
              ]}
            >
              <Text
                style={[
                  styles.nearButtonText,
                  nearMeEnabled
                    ? styles.nearButtonTextActive
                    : styles.nearButtonTextIdle,
                ]}
              >
                Pres
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push("/(screens)/search")}
            style={styles.searchBtn}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color="rgba(107,39,55,0.45)"
            />
            <Text style={styles.searchPlaceholder}>
              Rechercher salon, service...
            </Text>
          </Pressable>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() =>
                    setSelectedCategory((prev) => (prev === cat ? null : cat))
                  }
                  style={[styles.chip, active ? styles.chipOn : styles.chipOff]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active ? styles.chipTextOn : styles.chipTextOff,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.body}>
          <SectionTitle title="Selections du moment" />
          {isLoading ? (
            <Text style={styles.loading}>Chargement...</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.offersRow}
            >
              {offers.map((offer) => (
                <OfferCard
                  key={`${offer.salonId}-${offer.serviceId}`}
                  badgeLabel={offer.highlightLabel ?? "Selection"}
                  service={offer.serviceName}
                  salon={offer.salonName}
                  width={190}
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
            </ScrollView>
          )}

          {nearMeEnabled && mapRegion && mapSalons.length ? (
            <View style={styles.mapCard}>
              <MapView style={styles.map} initialRegion={mapRegion}>
                {currentPosition ? (
                  <Marker
                    coordinate={currentPosition}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={styles.userMarkerWrap}>
                      <View style={styles.userMarkerOuter}>
                        <View style={styles.userMarkerInner} />
                      </View>
                    </View>
                  </Marker>
                ) : null}
                {mapSalons.map((salon) => (
                  <Marker
                    key={salon.id}
                    coordinate={{
                      latitude: salon.latitude,
                      longitude: salon.longitude,
                    }}
                    onPress={() => openSalon(salon.id)}
                  >
                    <Pressable
                      onPress={() => openSalon(salon.id)}
                      style={styles.salonMarker}
                    >
                      <Text style={styles.salonMarkerText} numberOfLines={1}>
                        {salon.name}
                      </Text>
                      {typeof salon.distanceKm === "number" ? (
                        <Text style={styles.salonMarkerMeta}>
                          a {salon.distanceKm.toFixed(1)} km
                        </Text>
                      ) : null}
                    </Pressable>
                  </Marker>
                ))}
              </MapView>
            </View>
          ) : null}

          <SectionTitle title="Les mieux notes" />
          <View style={styles.list}>
            {topRated.map((salon) => (
              <SalonListItem
                key={salon.id}
                name={salon.name}
                city={salon.city}
                country={salon.country}
                rating={salon.rating}
                duration={salon.duration}
                distance={
                  typeof salon.distanceKm === "number"
                    ? `${salon.distanceKm.toFixed(1)} km`
                    : undefined
                }
                showDistance={nearMeEnabled}
                onPress={() => openSalon(salon.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  stickyHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  location: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  locationText: {
    color: colors.text,
    ...typography.small,
    fontWeight: "500",
    flexShrink: 1,
  },
  nearButton: {
    minWidth: 60,
    height: 38,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  nearButtonIdle: {
    backgroundColor: colors.card,
    borderColor: overlays.brand20,
  },
  nearButtonActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  nearButtonText: {
    ...typography.small,
    fontWeight: "700",
  },
  nearButtonTextIdle: {
    color: colors.brand,
  },
  nearButtonTextActive: {
    color: colors.brandForeground,
  },
  searchBtn: {
    backgroundColor: "#F7F3EE",
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    height: 46,
    borderWidth: 1,
    borderColor: overlays.brand10,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchPlaceholder: {
    color: "rgba(107,39,55,0.55)",
    ...typography.small,
  },
  chipsRow: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipOff: {
    backgroundColor: colors.card,
    borderColor: overlays.brand20,
  },
  chipOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: { ...typography.small, fontWeight: "500" },
  chipTextOff: { color: colors.brand },
  chipTextOn: { color: colors.brandForeground },
  body: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  offersRow: { gap: spacing.md, paddingRight: spacing.lg },
  list: { gap: spacing.md },
  loading: { color: colors.textMuted, ...typography.small },
  mapCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: overlays.brand20,
    backgroundColor: colors.card,
  },
  map: {
    width: "100%",
    height: 190,
  },
  userMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  userMarkerOuter: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "rgba(107,39,55,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  userMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.card,
  },
  salonMarker: {
    maxWidth: 152,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: overlays.brand20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  salonMarkerText: {
    color: colors.brand,
    ...typography.small,
    fontWeight: "700",
  },
  salonMarkerMeta: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },
});

