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
import { Input } from "../../src/components/Input";
import { useBooking } from "../../src/providers/BookingProvider";
import { createAppointmentsFromCart } from "../../src/api/appointments";
import {
  createPaymentMethod,
  usePaymentMethods,
} from "../../src/api/paymentMethods";

import { colors, overlays } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { radius } from "../../src/theme/radius";
import { typography } from "../../src/theme/typography";

function formatFCFA(v: number) {
  return `${v.toLocaleString("fr-FR")} FCFA`;
}

export default function PaymentScreen() {
  const { draft } = useBooking();
  const qc = useQueryClient();

  const [method, setMethod] = useState<"card" | "mobile_money" | "cash">(
    draft.paymentMethod ?? "card",
  );
  const { data: paymentMethods = [] } = usePaymentMethods(true);

  const cards = paymentMethods.filter((m) => m.type === "CARD" && m.isActive);
  const momos = paymentMethods.filter((m) => m.type === "MOMO" && m.isActive);

  const [useSavedCard, setUseSavedCard] = useState(cards.length > 0);
  const [useSavedMomo, setUseSavedMomo] = useState(momos.length > 0);
  const [saveNewCard, setSaveNewCard] = useState(true);
  const [saveNewMomo, setSaveNewMomo] = useState(true);
  const [momoProvider, setMomoProvider] = useState("MTN");
  const [momoPhone, setMomoPhone] = useState("");

  const defaultCard = cards.find((c) => c.isDefault) ?? cards[0];
  const defaultMomo = momos.find((m) => m.isDefault) ?? momos[0];

  useEffect(() => {
    if (cards.length > 0) {
      setUseSavedCard(true);
    }
  }, [cards.length]);

  useEffect(() => {
    if (momos.length > 0) {
      setUseSavedMomo(true);
    }
  }, [momos.length]);

  const totalAmount = useMemo(
    () =>
      draft.cart.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0,
      ),
    [draft.cart],
  );

  const startAtIso = useMemo(() => {
    if (!draft.selectedDateIso || !draft.time) return null;
    return `${draft.selectedDateIso}T${draft.time}:00.000Z`;
  }, [draft.selectedDateIso, draft.time]);

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!draft.salonId) throw new Error("Salon non sélectionné");
      if (!startAtIso) throw new Error("Créneau non sélectionné");

      return createAppointmentsFromCart({
        salonId: draft.salonId,
        startAt: startAtIso,
        employeeId: draft.selectedEmployeeId,
        paymentMethod: method === "cash" ? "CASH" : method === "mobile_money" ? "MOMO" : "CARD",
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
          totalAmount: String(result?.totalAmount ?? totalAmount),
          paymentStatus: String(result?.payment?.status ?? "CREATED"),
          paymentMethod: String(result?.payment?.method ?? "CASH"),
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
    if (method === "card") {
      if (useSavedCard && defaultCard) {
        bookingMutation.mutate();
        return;
      }

      router.push({
        pathname: "/(screens)/card-payment-details",
        params: {
          amount: String(totalAmount),
          saveCard: saveNewCard ? "1" : "0",
          paymentMethod: "CARD",
        },
      });
      return;
    }

    if (method === "mobile_money" && !useSavedMomo && saveNewMomo) {
      if (!momoPhone.trim()) {
        Alert.alert(
          "Informations manquantes",
          "Veuillez renseigner le numéro Mobile Money.",
        );
        return;
      }

      try {
        await createPaymentMethod({
          type: "MOMO",
          provider: momoProvider,
          phone: momoPhone.trim(),
          label: `Mobile Money ${momoProvider}`,
          isDefault: true,
        });
        await qc.invalidateQueries({ queryKey: ["me", "payment-methods"] });
      } catch (error: any) {
        Alert.alert(
          "Impossible d’enregistrer le moyen de paiement",
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
        <Text style={styles.blockTitle}>Choisissez votre mode de paiement</Text>

        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <MethodRow
            icon="card-outline"
            title="Carte bancaire"
            subtitle="Paiement beta interne immediat"
            active={method === "card"}
            onPress={() => setMethod("card")}
          />
          <MethodRow
            icon="phone-portrait-outline"
            title="Mobile Money"
            subtitle="Paiement via opérateur"
            active={method === "mobile_money"}
            onPress={() => setMethod("mobile_money")}
          />
          <MethodRow
            icon="cash-outline"
            title="Payer sur place"
            subtitle="En espèces au salon"
            active={method === "cash"}
            onPress={() => setMethod("cash")}
          />
        </View>

        {method === "card" && cards.length > 0 && (
          <View style={styles.savedBox}>
            <Text style={styles.savedTitle}>Carte déjà enregistrée</Text>
            <Pressable
              style={styles.radioRow}
              onPress={() => setUseSavedCard(true)}
            >
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
            <Pressable
              style={styles.radioRow}
              onPress={() => setUseSavedCard(false)}
            >
              <Ionicons
                name={!useSavedCard ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={colors.brand}
              />
              <Text style={styles.savedText}>Utiliser une nouvelle carte</Text>
            </Pressable>
            {!useSavedCard && (
              <Pressable
                style={styles.radioRow}
                onPress={() => setSaveNewCard((v) => !v)}
              >
                <Ionicons
                  name={saveNewCard ? "checkbox" : "square-outline"}
                  size={18}
                  color={colors.brand}
                />
                <Text style={styles.savedText}>
                  Enregistrer pour les prochaines fois
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {method === "mobile_money" && momos.length > 0 && (
          <View style={styles.savedBox}>
            <Text style={styles.savedTitle}>Mobile Money enregistré</Text>
            <Pressable
              style={styles.radioRow}
              onPress={() => setUseSavedMomo(true)}
            >
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
            <Pressable
              style={styles.radioRow}
              onPress={() => setUseSavedMomo(false)}
            >
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
        )}

        {method === "mobile_money" && (!useSavedMomo || momos.length === 0) && (
          <View style={styles.savedBox}>
            <Text style={styles.savedTitle}>Nouveau Mobile Money</Text>
            <Input
              placeholder="Opérateur (MTN, Airtel...)"
              value={momoProvider}
              onChangeText={setMomoProvider}
            />
            <View style={{ height: spacing.sm }} />
            <Input
              placeholder="Numéro"
              value={momoPhone}
              onChangeText={setMomoPhone}
              keyboardType="phone-pad"
            />
            <Pressable
              style={styles.radioRow}
              onPress={() => setSaveNewMomo((v) => !v)}
            >
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
        )}

        <View style={styles.recapBox}>
          <Text style={styles.recapTitle}>Récapitulatif</Text>
          {draft.cart.map((it) => (
            <View key={it.id} style={styles.recapRow}>
              <Text style={styles.recapLabel} numberOfLines={1}>
                {it.name} x{it.quantity || 1}
              </Text>
              <View style={styles.priceWrap}>
                {it.originalPrice && it.originalPrice > it.price ? (
                  <Text style={styles.oldPrice}>
                    {formatFCFA(it.originalPrice * (it.quantity || 1))}
                  </Text>
                ) : null}
                <Text style={styles.recapLabel}>
                  {formatFCFA(it.price * (it.quantity || 1))}
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.recapRow}>
            <Text style={styles.recapStrong}>Montant total</Text>
            <Text style={styles.recapPrice}>{formatFCFA(totalAmount)}</Text>
          </View>
          <Text style={styles.recapSub}>
            Créneau: {draft.selectedDateIso} {draft.time ?? "-"}
          </Text>
          <Text style={styles.recapSub}>Salon: {draft.salonName ?? "-"}</Text>
          <Text style={styles.recapSub}>
            Le salon doit encore confirmer le rendez-vous apres cette etape.
          </Text>
        </View>

        <View style={{ height: 24 }} />

        <Button
          title={
            method === "card"
              ? "Continuer vers carte"
              : "Confirmer la réservation"
          }
          onPress={onConfirm}
          disabled={
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
  icon: any;
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
  blockTitle: {
    color: colors.text,
    ...typography.body,
    fontWeight: "600",
    marginBottom: spacing.md,
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
  priceWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  oldPrice: {
    color: colors.textMuted,
    ...typography.small,
    textDecorationLine: "line-through",
  },
  recapStrong: { color: colors.text, ...typography.body, fontWeight: "700" },
  recapPrice: { color: colors.brand, ...typography.h3 },
  recapSub: { color: colors.textMuted, ...typography.small },
  divider: {
    height: 1,
    backgroundColor: overlays.brand10,
    marginVertical: spacing.md,
  },
});
