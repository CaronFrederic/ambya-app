import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Screen } from "../../src/components/Screen";
import { Button } from "../../src/components/Button";
import { InfoHint } from "../../src/components/InfoHint";
import { Input } from "../../src/components/Input";
import { useBooking } from "../../src/providers/BookingProvider";
import { useOfflineStatus } from "../../src/providers/OfflineProvider";
import { createAppointmentsFromCart } from "../../src/api/appointments";
import {
  createPaymentMethod,
  usePaymentMethods,
} from "../../src/api/paymentMethods";
import { requireOnlineAction } from "../../src/offline/guard";
import {
  buildGabonPhoneHint,
  formatGabonPhone,
  GABON_MOBILE_MONEY_PROVIDERS,
  getGabonNationalPhoneDigits,
  isValidGabonPhone,
} from "../../src/constants/countries";

import { colors, overlays } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { radius } from "../../src/theme/radius";
import { typography } from "../../src/theme/typography";

function formatFCFA(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function getCartItemLabel(item: { name?: string }, index: number) {
  const label = item.name?.trim();
  return label || `Prestation ${index + 1}`;
}

export default function PaymentScreen() {
  const { draft, patch } = useBooking();
  const qc = useQueryClient();
  const { isOffline } = useOfflineStatus();

  const [method, setMethod] = useState<"card" | "mobile_money" | "cash">(
    draft.paymentMethod ?? "card",
  );
  const [paymentChoice, setPaymentChoice] = useState<"full" | "deposit">(
    draft.depositEnabled ? draft.paymentChoice ?? "deposit" : "full",
  );
  const { data: paymentMethods = [] } = usePaymentMethods(true);

  const cards = paymentMethods.filter((item) => item.type === "CARD" && item.isActive);
  const momos = paymentMethods.filter((item) => item.type === "MOMO" && item.isActive);

  const [useSavedCard, setUseSavedCard] = useState(cards.length > 0);
  const [useSavedMomo, setUseSavedMomo] = useState(momos.length > 0);
  const [saveNewCard, setSaveNewCard] = useState(true);
  const [saveNewMomo, setSaveNewMomo] = useState(true);
  const [momoProvider, setMomoProvider] = useState<string>(
    draft.operator ?? GABON_MOBILE_MONEY_PROVIDERS[0],
  );
  const [momoPhone, setMomoPhone] = useState("");

  const defaultCard = cards.find((card) => card.isDefault) ?? cards[0];
  const defaultMomo = momos.find((momo) => momo.isDefault) ?? momos[0];

  useEffect(() => {
    if (cards.length > 0) setUseSavedCard(true);
  }, [cards.length]);

  useEffect(() => {
    if (momos.length > 0) setUseSavedMomo(true);
  }, [momos.length]);

  useEffect(() => {
    patch({
      paymentMethod: method,
      paymentChoice,
      operator: method === "mobile_money" ? momoProvider : undefined,
    });
  }, [method, momoProvider, patch, paymentChoice]);

  const totalAmount = useMemo(
    () =>
      draft.cart.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0,
      ),
    [draft.cart],
  );

  const depositAmount = useMemo(() => {
    if (!draft.depositEnabled) return totalAmount;
    return Math.round(totalAmount * ((draft.depositPercentage ?? 30) / 100));
  }, [draft.depositEnabled, draft.depositPercentage, totalAmount]);

  const amountDue = paymentChoice === "deposit" ? depositAmount : totalAmount;

  const startAtIso = useMemo(() => {
    if (!draft.selectedDateIso || !draft.time) return null;
    return `${draft.selectedDateIso}T${draft.time}:00.000Z`;
  }, [draft.selectedDateIso, draft.time]);

  const effectiveEmployeeId = useMemo(() => {
    const raw = draft.selectedEmployeeId?.trim();
    return raw ? raw : undefined;
  }, [draft.selectedEmployeeId]);

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!draft.salonId) throw new Error("Salon non sélectionné.");
      if (!startAtIso) throw new Error("Créneau non sélectionné.");
      if (new Date(startAtIso).getTime() <= Date.now()) {
        throw new Error("Le créneau sélectionné n’est plus disponible.");
      }

      return createAppointmentsFromCart({
        salonId: draft.salonId,
        startAt: startAtIso,
        employeeId: effectiveEmployeeId,
        paymentMethod:
          method === "cash" ? "CASH" : method === "mobile_money" ? "MOMO" : "CARD",
        items: draft.cart.map((item) => ({
          serviceId: item.id,
          quantity: item.quantity || 1,
        })),
      });
    },
    onSuccess: async (result: any) => {
      await qc.invalidateQueries({ queryKey: ["appointments"] });
      router.replace({
        pathname: "/(screens)/booking-success",
        params: {
          salonName: draft.salonName ?? "",
          serviceLabel: draft.cart.map((item) => item.name).join(" + "),
          dateIso: draft.selectedDateIso ?? "",
          timeLabel: draft.time ?? "",
          totalAmount: String(amountDue),
          paymentStatus: String(result?.payment?.status ?? "CREATED"),
          paymentMethod: String(result?.payment?.method ?? "CASH"),
          paymentChoice,
          depositPercentage: String(draft.depositPercentage ?? 30),
        },
      });
    },
    onError: (error: any) => {
      Alert.alert(
        "Impossible de réserver",
        error?.message ?? "Erreur inconnue",
      );
    },
  });

  const onConfirm = async () => {
    if (!requireOnlineAction("finaliser une réservation")) return;

    if (method === "card") {
      if (useSavedCard && defaultCard) {
        bookingMutation.mutate();
        return;
      }

      router.push({
        pathname: "/(screens)/card-payment-details",
        params: {
          amount: String(amountDue),
          saveCard: saveNewCard ? "1" : "0",
          paymentMethod: "CARD",
          paymentChoice,
          depositPercentage: String(draft.depositPercentage ?? 30),
        },
      });
      return;
    }

    if (method === "mobile_money" && !useSavedMomo && saveNewMomo) {
      if (!momoPhone.trim() || !isValidGabonPhone(momoPhone)) {
        Alert.alert(
          "Informations manquantes",
          "Renseignez un numéro Mobile Money gabonais valide.",
        );
        return;
      }

      try {
        await createPaymentMethod({
          type: "MOMO",
          provider: momoProvider,
          phone: getGabonNationalPhoneDigits(momoPhone).trim(),
          label: `Mobile Money ${momoProvider}`,
          isDefault: true,
        });
        await qc.invalidateQueries({ queryKey: ["me", "payment-methods"] });
      } catch (error: any) {
        Alert.alert(
          "Impossible d'enregistrer le moyen de paiement",
          error?.message ?? "Erreur inconnue",
        );
        return;
      }
    }

    bookingMutation.mutate();
  };

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons
            name="arrow-back"
            size={22}
            color="#fff"
            onPress={() => router.back()}
          />
        </View>
        <Text style={styles.headerTitle}>Mode de paiement</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Choisissez votre mode de paiement</Text>
        </View>

        {draft.depositEnabled ? (
          <View style={styles.choiceBox}>
            <View style={styles.rowTitle}>
              <Text style={styles.choiceTitle}>Comment souhaitez-vous régler ?</Text>
              <InfoHint text="Le salon autorise l’acompte sur cette réservation. Vous pouvez régler l’acompte maintenant ou payer la totalité tout de suite." />
            </View>

            <Pressable
              onPress={() => setPaymentChoice("deposit")}
              style={[
                styles.choiceRow,
                paymentChoice === "deposit" ? styles.choiceRowActive : undefined,
              ]}
            >
              <View style={styles.choiceTextWrap}>
                <Text style={styles.choiceLabel}>
                  Payer un acompte ({draft.depositPercentage ?? 30}%)
                </Text>
                <Text style={styles.choiceHint}>
                  {formatFCFA(depositAmount)} maintenant, le reste au salon.
                </Text>
              </View>
              <Ionicons
                name={
                  paymentChoice === "deposit"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={18}
                color={colors.brand}
              />
            </Pressable>

            <Pressable
              onPress={() => setPaymentChoice("full")}
              style={[
                styles.choiceRow,
                paymentChoice === "full" ? styles.choiceRowActive : undefined,
              ]}
            >
              <View style={styles.choiceTextWrap}>
                <Text style={styles.choiceLabel}>Payer la totalité</Text>
                <Text style={styles.choiceHint}>
                  {formatFCFA(totalAmount)} réglés maintenant.
                </Text>
              </View>
              <Ionicons
                name={
                  paymentChoice === "full"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={18}
                color={colors.brand}
              />
            </Pressable>
          </View>
        ) : null}

        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <MethodRow
            icon="card-outline"
            title="Carte bancaire"
            subtitle="Paiement immédiat (bêta)"
            active={method === "card"}
            onPress={() => setMethod("card")}
          />
          <MethodRow
            icon="phone-portrait-outline"
            title="Mobile Money"
            subtitle="Choisissez un opérateur gabonais"
            active={method === "mobile_money"}
            onPress={() => setMethod("mobile_money")}
          />
          <MethodRow
            icon="cash-outline"
            title="Payer sur place"
            subtitle="Règlement au salon"
            active={method === "cash"}
            onPress={() => setMethod("cash")}
          />
        </View>

        {method === "card" && cards.length > 0 ? (
          <View style={styles.savedBox}>
            <Text style={styles.savedTitle}>Carte déjà enregistrée</Text>
            <Pressable style={styles.radioRow} onPress={() => setUseSavedCard(true)}>
              <Ionicons
                name={useSavedCard ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={colors.brand}
              />
              <Text style={styles.savedText}>
                Utiliser la carte {defaultCard?.provider ?? "Carte"} ••••{" "}
                {defaultCard?.last4 ?? "----"}
              </Text>
            </Pressable>
            <Pressable style={styles.radioRow} onPress={() => setUseSavedCard(false)}>
              <Ionicons
                name={!useSavedCard ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={colors.brand}
              />
              <Text style={styles.savedText}>Utiliser une nouvelle carte</Text>
            </Pressable>
            {!useSavedCard ? (
              <Pressable style={styles.radioRow} onPress={() => setSaveNewCard((value) => !value)}>
                <Ionicons
                  name={saveNewCard ? "checkbox" : "square-outline"}
                  size={18}
                  color={colors.brand}
                />
                <Text style={styles.savedText}>
                  Enregistrer pour les prochaines fois
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {method === "mobile_money" && momos.length > 0 ? (
          <View style={styles.savedBox}>
            <Text style={styles.savedTitle}>Compte Mobile Money enregistré</Text>
            <Pressable style={styles.radioRow} onPress={() => setUseSavedMomo(true)}>
              <Ionicons
                name={useSavedMomo ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={colors.brand}
              />
              <Text style={styles.savedText}>
                Utiliser {defaultMomo?.provider ?? "Mobile Money"}{" "}
                {defaultMomo?.phone ?? ""}
              </Text>
            </Pressable>
            <Pressable style={styles.radioRow} onPress={() => setUseSavedMomo(false)}>
              <Ionicons
                name={!useSavedMomo ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={colors.brand}
              />
              <Text style={styles.savedText}>
                Utiliser un nouveau compte Mobile Money
              </Text>
            </Pressable>
          </View>
        ) : null}

        {method === "mobile_money" && (!useSavedMomo || momos.length === 0) ? (
          <View style={styles.savedBox}>
            <View style={styles.rowTitle}>
              <Text style={styles.savedTitle}>Nouveau Mobile Money</Text>
              <InfoHint text="Choisissez l’opérateur utilisé pour finaliser le paiement côté client." />
            </View>

            <View style={styles.providerWrap}>
              {GABON_MOBILE_MONEY_PROVIDERS.map((provider) => {
                const active = provider === momoProvider;
                return (
                  <Pressable
                    key={provider}
                    onPress={() => setMomoProvider(provider)}
                    style={[
                      styles.providerChip,
                      active ? styles.providerChipActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.providerChipText,
                        active ? styles.providerChipTextActive : undefined,
                      ]}
                    >
                      {provider}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Input
              label="Numéro Mobile Money"
              placeholder="01 23 45 67"
              value={formatGabonPhone(momoPhone)}
              onChangeText={(value) => setMomoPhone(getGabonNationalPhoneDigits(value))}
              keyboardType="phone-pad"
              hint={buildGabonPhoneHint()}
            />

            <Pressable style={styles.radioRow} onPress={() => setSaveNewMomo((value) => !value)}>
              <Ionicons
                name={saveNewMomo ? "checkbox" : "square-outline"}
                size={18}
                color={colors.brand}
              />
              <Text style={styles.savedText}>
                Enregistrer ce moyen de paiement
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.recapBox}>
          <Text style={styles.recapTitle}>Récapitulatif</Text>
          {draft.cart.map((item, index) => {
            const quantity = item.quantity || 1;
            const duration = item.duration ? `${item.duration} min` : null;

            return (
              <View key={item.id} style={styles.recapItemRow}>
                <View style={styles.recapItemCopy}>
                  <Text style={styles.recapItemName} numberOfLines={2}>
                    {getCartItemLabel(item, index)}
                  </Text>
                  <Text style={styles.recapItemMeta}>
                    {[
                      quantity > 1 ? `Quantité : ${quantity}` : null,
                      duration,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Prestation sélectionnée"}
                  </Text>
                </View>
                <View style={styles.priceWrap}>
                {item.originalPrice && item.originalPrice > item.price ? (
                  <Text style={styles.oldPrice}>
                    {formatFCFA(item.originalPrice * quantity)}
                  </Text>
                ) : null}
                <Text style={styles.recapItemPrice}>
                  {formatFCFA(item.price * quantity)}
                </Text>
              </View>
            </View>
            );
          })}
          <View style={styles.divider} />
          <View style={styles.recapRow}>
            <Text style={styles.recapStrong}>Montant total</Text>
            <Text style={styles.recapPrice}>{formatFCFA(totalAmount)}</Text>
          </View>
          {draft.depositEnabled ? (
            <View style={styles.recapRow}>
              <Text style={styles.recapStrong}>
                {paymentChoice === "deposit" ? "Acompte à payer" : "Montant à payer"}
              </Text>
              <Text style={styles.recapPrice}>{formatFCFA(amountDue)}</Text>
            </View>
          ) : null}
          <Text style={styles.recapSub}>
            Créneau : {draft.selectedDateIso} {draft.time ?? "-"}
          </Text>
          <Text style={styles.recapSub}>Salon : {draft.salonName ?? "-"}</Text>
          <View style={styles.inlineInfo}>
            <Text style={styles.recapSub}>
              Le salon doit encore confirmer votre rendez-vous après cette étape.
            </Text>
            <InfoHint text="Remboursement possible si l’annulation est faite au moins 24h avant le rendez-vous, selon la politique du salon." />
          </View>
        </View>

        <View style={{ height: 24 }} />

        <Button
          title={
            method === "card"
              ? `Continuer avec ${formatFCFA(amountDue)}`
              : "Confirmer la réservation"
          }
          onPress={onConfirm}
          disabled={
            isOffline ||
            bookingMutation.isPending ||
            !draft.salonId ||
            !startAtIso ||
            draft.cart.length === 0
          }
        />
      </ScrollView>
    </Screen>
  );
}

function MethodRow({
  icon,
  title,
  subtitle,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.cardBox, active ? styles.activeBorder : styles.idleBorder]}
    >
      <View style={styles.methodTop}>
        <Ionicons name={icon} size={22} color={colors.brand} />
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>{title}</Text>
          <Text style={styles.methodSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { marginBottom: spacing.md },
  headerTitle: { color: colors.brandForeground, ...typography.h2 },
  content: { padding: spacing.lg },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  blockTitle: {
    color: colors.text,
    ...typography.body,
    fontWeight: "600",
  },
  choiceBox: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: overlays.brand20,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  rowTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  choiceTitle: {
    color: colors.text,
    ...typography.body,
    fontWeight: "700",
    flex: 1,
  },
  choiceRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  choiceRowActive: {
    borderColor: colors.brand,
    backgroundColor: overlays.brand05,
  },
  choiceTextWrap: {
    flex: 1,
  },
  choiceLabel: {
    color: colors.text,
    ...typography.body,
    fontWeight: "700",
  },
  choiceHint: {
    marginTop: 4,
    color: colors.textMuted,
    ...typography.small,
  },
  cardBox: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  methodTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  methodTitle: { color: colors.text, ...typography.body, fontWeight: "600" },
  methodSubtitle: {
    color: colors.textMuted,
    ...typography.small,
    marginTop: 2,
  },
  idleBorder: { borderWidth: 1, borderColor: overlays.brand20 },
  activeBorder: {
    borderWidth: 2,
    borderColor: colors.brand,
    backgroundColor: overlays.brand05,
  },
  savedBox: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: overlays.brand20,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  savedTitle: { color: colors.text, ...typography.small, fontWeight: "700" },
  radioRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  savedText: { color: colors.textMuted, ...typography.small },
  providerWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  providerChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  providerChipActive: {
    borderColor: colors.brand,
    backgroundColor: overlays.brand05,
  },
  providerChipText: {
    color: colors.text,
    ...typography.small,
    fontWeight: "700",
  },
  providerChipTextActive: {
    color: colors.brand,
  },
  recapBox: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  recapTitle: {
    color: colors.text,
    ...typography.body,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  recapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  recapLabel: { color: colors.textMuted, ...typography.small, flex: 1 },
  recapItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  recapItemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  recapItemName: {
    color: colors.text,
    ...typography.small,
    fontWeight: "800",
  },
  recapItemMeta: {
    color: colors.textMuted,
    ...typography.small,
  },
  priceWrap: { alignItems: "flex-end", gap: 2 },
  recapItemPrice: {
    color: colors.text,
    ...typography.small,
    fontWeight: "800",
  },
  oldPrice: {
    color: colors.textMuted,
    ...typography.small,
    textDecorationLine: "line-through",
  },
  recapStrong: { color: colors.text, ...typography.body, fontWeight: "700" },
  recapPrice: { color: colors.brand, ...typography.h3 },
  inlineInfo: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  recapSub: { color: colors.textMuted, ...typography.small, flex: 1 },
  divider: {
    height: 1,
    backgroundColor: overlays.brand10,
    marginVertical: spacing.md,
  },
});
