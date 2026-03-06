import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen, TabPill, ReviewCard } from "../../src/components";
import { colors, overlays } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { radius } from "../../src/theme/radius";
import { typography } from "../../src/theme/typography";
import { useBooking } from "../../src/providers/BookingProvider";
import { useSalonDetails } from "../../src/api/discovery";

type TabKey = "about" | "services" | "reviews";
type CartItem = {
  id: string;
  name: string;
  price: number;
  duration?: number;
  quantity: number;
};

function formatFCFA(v: number) {
  return `${v.toLocaleString("fr-FR")} FCFA`;
}

export default function SalonDetailScreen() {
  const params = useLocalSearchParams<{ salonId?: string }>();
  const salonId = params.salonId;
  const { data, isLoading } = useSalonDetails(salonId);

  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const { setCart: setBookingCart, patch } = useBooking();

  const servicesByCategory = data?.servicesByCategory ?? {};
  const gallery = data?.galleryImageUrls ?? [];
  const currentImage = gallery[activeImageIndex] ?? data?.coverImageUrl;

  const openLink = (url?: string) => {
    if (!url) return;
    Linking.openURL(url);
  };

  const moveImage = (delta: number) => {
    if (!gallery.length) return;
    setActiveImageIndex(
      (prev) => (prev + delta + gallery.length) % gallery.length,
    );
  };

  const addToCart = (service: {
    id: string;
    name: string;
    price: number;
    durationMin: number;
  }) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === service.id);
      if (!found)
        return [
          ...prev,
          {
            id: service.id,
            name: service.name,
            price: service.price,
            duration: service.durationMin,
            quantity: 1,
          },
        ];
      return prev.map((x) =>
        x.id === service.id ? { ...x, quantity: x.quantity + 1 } : x,
      );
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === serviceId);
      if (!found) return prev;
      if (found.quantity <= 1) return prev.filter((x) => x.id !== serviceId);
      return prev.map((x) =>
        x.id === serviceId ? { ...x, quantity: x.quantity - 1 } : x,
      );
    });
  };

  const totalItems = useMemo(
    () => cart.reduce((sum, x) => sum + x.quantity, 0),
    [cart],
  );
  const totalPrice = useMemo(
    () => cart.reduce((sum, x) => sum + x.price * x.quantity, 0),
    [cart],
  );

  return (
    <Screen noPadding style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {currentImage ? (
          <View style={styles.heroWrap}>
            <Image source={{ uri: currentImage }} style={styles.heroImage} />

            <View style={styles.heroTopRow}>
              <View style={styles.openPill}>
                <Text style={styles.openPillText}>Ouvert</Text>
              </View>
              <Pressable style={styles.iconCircle}>
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={colors.brand}
                />
              </Pressable>
            </View>

            <Pressable
              style={[styles.iconCircle, styles.backBtn]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={18} color={colors.brand} />
            </Pressable>
            <Pressable
              style={[styles.iconCircle, styles.prevBtn]}
              onPress={() => moveImage(-1)}
            >
              <Ionicons name="chevron-back" size={18} color={colors.brand} />
            </Pressable>
            <Pressable
              style={[styles.iconCircle, styles.nextBtn]}
              onPress={() => moveImage(1)}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.brand} />
            </Pressable>

            <View style={styles.heroBottomRow}>
              <Text style={styles.heroLabel}>Intérieur du salon</Text>
              <Text style={styles.heroCount}>
                {Math.min(activeImageIndex + 1, Math.max(gallery.length, 1))} /{" "}
                {Math.max(gallery.length, 1)}
              </Text>
            </View>
          </View>
        ) : null}

        {gallery.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}
          >
            {gallery.map((url, index) => (
              <Pressable
                key={`${url}-${index}`}
                onPress={() => setActiveImageIndex(index)}
                style={[
                  styles.thumbWrap,
                  activeImageIndex === index
                    ? styles.thumbWrapActive
                    : undefined,
                ]}
              >
                <Image source={{ uri: url }} style={styles.thumbImage} />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {isLoading ? <Text style={styles.loading}>Chargement...</Text> : null}

        <View style={styles.infoCard}>
          <Text style={styles.salonTitle}>{data?.name ?? "-"}</Text>

          <View style={styles.metaSocialRow}>
            <Text style={styles.metaText}>
              ⭐ {data?.rating?.toFixed(1) ?? "4.5"} ({data?.reviewCount ?? 0}+)
            </Text>
            <View style={styles.socialRow}>
              <Pressable
                style={styles.socialBtn}
                onPress={() => openLink(data?.socialLinks?.instagram)}
              >
                <Ionicons
                  name="logo-instagram"
                  size={16}
                  color={colors.brand}
                />
              </Pressable>
              <Pressable
                style={styles.socialBtn}
                onPress={() => openLink(data?.socialLinks?.facebook)}
              >
                <Ionicons name="logo-facebook" size={16} color={colors.brand} />
              </Pressable>
              <Pressable
                style={styles.socialBtn}
                onPress={() => openLink(data?.socialLinks?.tiktok)}
              >
                <Ionicons name="logo-tiktok" size={16} color={colors.brand} />
              </Pressable>
              <Pressable
                style={styles.socialBtn}
                onPress={() => openLink(data?.socialLinks?.website)}
              >
                <Ionicons name="globe-outline" size={16} color={colors.brand} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.metaText}>
            {[data?.address, data?.city, data?.country]
              .filter(Boolean)
              .join(", ")}
          </Text>
        </View>

        <View style={styles.tabsRow}>
          <TabPill
            label="À propos"
            active={activeTab === "about"}
            onPress={() => setActiveTab("about")}
          />
          <TabPill
            label="Services"
            active={activeTab === "services"}
            onPress={() => setActiveTab("services")}
          />
          <TabPill
            label="Avis clients"
            active={activeTab === "reviews"}
            onPress={() => setActiveTab("reviews")}
          />
        </View>

        {activeTab === "about" && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Description du salon</Text>
            <Text style={styles.paragraph}>
              {data?.description || "Description indisponible pour le moment."}
            </Text>

            <Text style={styles.blockTitle}>Équipe</Text>
            {(data?.employees ?? []).map((employee) => (
              <Text key={employee.id} style={styles.paragraph}>
                • {employee.displayName}
              </Text>
            ))}
          </View>
        )}

        {activeTab === "services" && (
          <View style={{ gap: spacing.md }}>
            {Object.entries(servicesByCategory).map(([category, services]) => {
              const expanded = expandedCategory === category;
              return (
                <View key={category} style={styles.accordion}>
                  <Pressable
                    onPress={() =>
                      setExpandedCategory(expanded ? null : category)
                    }
                    style={styles.accordionHeader}
                  >
                    <Text style={styles.accordionTitle}>{category}</Text>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={colors.brand}
                    />
                  </Pressable>
                  {expanded && (
                    <View style={{ gap: spacing.sm }}>
                      {services.map((service) => {
                        const qty =
                          cart.find((x) => x.id === service.id)?.quantity ?? 0;
                        return (
                          <View key={service.id} style={styles.serviceRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.serviceName}>
                                {service.name}
                              </Text>
                              <Text style={styles.serviceMeta}>
                                Durée: {service.durationMin} min
                              </Text>
                              <Text style={styles.servicePrice}>
                                {formatFCFA(service.price)}
                              </Text>
                            </View>
                            <View style={styles.qtyWrap}>
                              {qty > 0 ? (
                                <Pressable
                                  onPress={() => removeFromCart(service.id)}
                                  style={styles.qtyBtnGhost}
                                >
                                  <Text>−</Text>
                                </Pressable>
                              ) : null}
                              {qty > 0 ? <Text>{qty}</Text> : null}
                              <Pressable
                                onPress={() => addToCart(service)}
                                style={styles.qtyBtn}
                              >
                                <Text style={{ color: "#fff" }}>+</Text>
                              </Pressable>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {activeTab === "reviews" && (
          <View style={{ gap: spacing.md }}>
            {(data?.reviews ?? []).length === 0 ? (
              <Text>Aucun avis pour le moment.</Text>
            ) : null}
            {(data?.reviews ?? []).map((review) => (
              <ReviewCard
                key={review.id}
                name={review.author}
                stars={review.rating}
                text={review.comment}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {totalItems > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartSmall}>{totalItems} service(s)</Text>
            <Text style={styles.cartTotal}>{formatFCFA(totalPrice)}</Text>
          </View>
          <Pressable
            onPress={() => {
              setBookingCart(cart);
              patch({ salonId: data?.id, salonName: data?.name });
              router.push("/(screens)/recap");
            }}
            style={styles.cartCta}
          >
            <Text style={styles.cartCtaText}>Voir le récap</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { gap: spacing.md, paddingBottom: 120 },
  heroWrap: { position: "relative" },
  heroImage: { width: "100%", height: 250 },
  heroTopRow: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  openPill: {
    backgroundColor: "#21B35A",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  openPillText: { color: "#fff", fontWeight: "700" },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: { position: "absolute", left: spacing.md, top: 58 },
  prevBtn: { position: "absolute", left: spacing.md, top: 122 },
  nextBtn: { position: "absolute", right: spacing.md, top: 122 },
  heroBottomRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroLabel: { color: "#fff", fontWeight: "700" },
  heroCount: { color: "#fff", fontWeight: "700" },
  galleryRow: { gap: spacing.sm, paddingHorizontal: spacing.md },
  thumbWrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    padding: 2,
  },
  thumbWrapActive: { borderColor: colors.brand },
  thumbImage: { width: 58, height: 58, borderRadius: radius.md },
  loading: {
    color: colors.textMuted,
    ...typography.small,
    paddingHorizontal: spacing.lg,
  },
  infoCard: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  salonTitle: { color: colors.text, ...typography.h2 },
  metaSocialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  socialRow: { flexDirection: "row", gap: spacing.xs },
  socialBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: overlays.brand20,
    backgroundColor: colors.card,
  },
  metaText: { color: colors.textMuted },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  block: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  blockTitle: { color: colors.text, ...typography.body, fontWeight: "700" },
  paragraph: { color: colors.textMuted, ...typography.small },
  accordion: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: overlays.brand20,
    marginHorizontal: spacing.lg,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accordionTitle: { color: colors.text, fontWeight: "700" },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  serviceName: { color: colors.text, fontWeight: "600" },
  serviceMeta: { color: colors.textMuted, fontSize: 12 },
  servicePrice: { color: colors.brand, fontWeight: "700", marginTop: 4 },
  qtyWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  qtyBtnGhost: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: overlays.brand20,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.brand,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartSmall: { color: "rgba(255,255,255,0.85)" },
  cartTotal: { color: colors.brandForeground, ...typography.h3 },
  cartCta: {
    backgroundColor: colors.brandForeground,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cartCtaText: { color: colors.brand, fontWeight: "700" },
});
