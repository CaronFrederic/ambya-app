import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Screen, Card, Input, Button } from "../../src/components";
import { useBooking } from "../../src/providers/BookingProvider";
import { createAppointmentsFromCart } from "../../src/api/appointments";
import { createPaymentMethod } from "../../src/api/paymentMethods";
import { colors, overlays } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { radius } from "../../src/theme/radius";
import { typography } from "../../src/theme/typography";

function formatFCFA(v: number) {
  return `${v.toLocaleString("fr-FR")} FCFA`;
}

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  const parts = digits.match(/.{1,4}/g) ?? [];
  return parts.join(" ");
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function detectBrand(digits: string) {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5])/.test(digits) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(digits))
    return "Mastercard";
  return "Card";
}

export default function CardPaymentDetailsScreen() {
  const params = useLocalSearchParams<{ amount?: string; saveCard?: string }>();
  const { draft } = useBooking();
  const qc = useQueryClient();

  const amount = useMemo(() => {
    const n = Number(params.amount);
    return Number.isFinite(n) && n > 0 ? n : 15000;
  }, [params.amount]);

  const saveCard = params.saveCard === "1";

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holderName, setHolderName] = useState("");

  const canPay =
    cardNumber.replace(/\D/g, "").length === 16 &&
    expiry.replace(/\D/g, "").length >= 4 &&
    cvv.replace(/\D/g, "").length >= 3;

  const startAtIso = useMemo(() => {
    if (!draft.selectedDateIso || !draft.time) return null;
    return `${draft.selectedDateIso}T${draft.time}:00.000Z`;
  }, [draft.selectedDateIso, draft.time]);

  const effectiveEmployeeId = useMemo(() => {
    const raw = draft.selectedEmployeeId?.trim();
    return raw ? raw : undefined;
  }, [draft.selectedEmployeeId]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!draft.salonId) throw new Error("Salon non selectionne");
      if (!startAtIso) throw new Error("Creneau non selectionne");
      if (new Date(startAtIso).getTime() <= Date.now()) {
        throw new Error("Le creneau selectionne n est plus disponible.");
      }

      const result = await createAppointmentsFromCart({
        salonId: draft.salonId,
        startAt: startAtIso,
        employeeId: effectiveEmployeeId,
        paymentMethod: "CARD",
        items: draft.cart.map((item) => ({
          serviceId: item.id,
          quantity: item.quantity || 1,
        })),
      });

      if (saveCard) {
        const digits = cardNumber.replace(/\D/g, "");
        await createPaymentMethod({
          type: "CARD",
          provider: detectBrand(digits),
          last4: digits.slice(-4),
          label: holderName.trim() || undefined,
          isDefault: true,
        });
      }

      return result;
    },
    onSuccess: async (result: any) => {
      await qc.invalidateQueries({ queryKey: ["appointments"] });
      await qc.invalidateQueries({ queryKey: ["me", "payment-methods"] });
      router.replace({
        pathname: "/(screens)/booking-success",
        params: {
          salonName: draft.salonName ?? "",
          serviceLabel: draft.cart.map((item) => item.name).join(" + "),
          dateIso: draft.selectedDateIso ?? "",
          timeLabel: draft.time ?? "",
          totalAmount: String(result?.totalAmount ?? amount),
          paymentStatus: String(result?.payment?.status ?? "SUCCEEDED"),
          paymentMethod: String(result?.payment?.method ?? "CARD"),
        },
      });
    },
    onError: (error: any) => {
      Alert.alert("Paiement refuse", error?.message ?? "Erreur inconnue");
    },
  });

  const onPay = () => mutation.mutate();

  return (
    <Screen noPadding style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={10}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.brandForeground}
            />
          </Pressable>
          <Text style={styles.headerTitle}>Paiement beta par carte</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: spacing.md }}>
            <View>
              <Text style={styles.label}>Titulaire (optionnel)</Text>
              <Input
                placeholder="Nom du titulaire"
                value={holderName}
                onChangeText={setHolderName}
              />
            </View>

            <View>
              <Text style={styles.label}>Numero de carte</Text>
              <Input
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Date d expiration</Text>
                <Input
                  placeholder="MM/AA"
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                  keyboardType="number-pad"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>CVV</Text>
                <Input
                  placeholder="123"
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                  keyboardType="number-pad"
                  secureTextEntry
                />
              </View>
            </View>

            {saveCard ? (
              <Text style={styles.saveHint}>
                Cette carte sera enregistree pour vos prochains paiements.
              </Text>
            ) : null}

            <Text style={styles.saveHint}>
              Le salon devra encore confirmer le rendez-vous apres ce paiement beta.
            </Text>

            <Card style={styles.amountCard}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Montant a payer</Text>
                <Text style={styles.amountValue}>{formatFCFA(amount)}</Text>
              </View>
            </Card>
          </View>
        </ScrollView>

        <View style={styles.bottomCta}>
          <Button
            title={mutation.isPending ? "Traitement..." : `Valider ${formatFCFA(amount)}`}
            onPress={onPay}
            disabled={!canPay || mutation.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  headerTitle: { color: colors.brandForeground, ...typography.h2 },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 140,
  },
  label: {
    color: colors.text,
    ...typography.small,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  row2: { flexDirection: "row", gap: spacing.md },
  saveHint: { color: colors.textMuted, ...typography.small },
  amountCard: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  amountLabel: { color: colors.text, ...typography.small, fontWeight: "600" },
  amountValue: { color: colors.brand, ...typography.h3, fontWeight: "800" },
  bottomCta: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
