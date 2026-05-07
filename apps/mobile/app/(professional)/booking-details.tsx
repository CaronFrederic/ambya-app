import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ProHeader } from "./components/ProHeader";
import { formatFCFA } from "./utils/format";
import {
  getAppointmentHistoryDetails,
  type AppointmentHistoryDetails,
} from "../../src/api/appointments";

const COLORS = {
  bg: "#FAF7F2",
  text: "#3A3A3A",
  primary: "#6B2737",
};

type Status = "COMPLETED" | "CANCELLED" | "NO_SHOW";

function asString(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

async function getAccessToken(): Promise<string> {
  const token = await SecureStore.getItemAsync("accessToken");
  if (!token) throw new Error("Utilisateur non authentifié.");
  return token;
}

function getStatusLabel(status: string) {
  if (status === "COMPLETED") return "Terminé";
  if (status === "CANCELLED") return "Annulé";
  if (status === "NO_SHOW") return "No-show";
  return status;
}

function formatLongDateFR(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date non renseignée";

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimeFR(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Heure non renseignée";

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingDetailsScreen() {
  const params = useLocalSearchParams();
  const appointmentId = asString(params.id);

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<AppointmentHistoryDetails | null>(null);

  const loadDetails = async () => {
    try {
      setLoading(true);

      if (!appointmentId) {
        throw new Error("Identifiant de réservation manquant.");
      }

      const token = await getAccessToken();
      const data = await getAppointmentHistoryDetails(token, appointmentId);

      setBooking(data);
    } catch (error) {
      console.error("Booking details load error:", error);
      Alert.alert(
        "Chargement impossible",
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [appointmentId]);

  const statusColor = useMemo(() => {
    if (booking?.status === "COMPLETED") {
      return {
        bg: "rgba(34,197,94,0.16)",
        text: "#15803D",
      };
    }

    if (booking?.status === "CANCELLED") {
      return {
        bg: "rgba(249,115,22,0.16)",
        text: "#C2410C",
      };
    }

    return {
      bg: "rgba(220,38,38,0.16)",
      text: "#B91C1C",
    };
  }, [booking?.status]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ProHeader
        title="Détails de la réservation"
        subtitle={appointmentId ? `Réservation #${appointmentId.slice(0, 8)}` : ""}
        backTo="/(professional)/booking-history"
      />

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Chargement des détails...</Text>
        </View>
      ) : !booking ? (
        <View style={styles.loaderWrap}>
          <Text style={styles.emptyTitle}>Réservation introuvable</Text>
          <Pressable
            onPress={() => router.push("/(professional)/booking-history")}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Retour à l'historique</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statusWrap}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {getStatusLabel(booking.status)}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{booking.clientName}</Text>

            <View style={styles.infoLine}>
              <Text style={styles.infoIcon}>☎️</Text>
              <Text style={styles.infoText}>
                {booking.clientPhone ?? "Non renseigné"}
              </Text>
            </View>

            {booking.clientEmail ? (
              <View style={styles.infoLine}>
                <Text style={styles.infoIcon}>✉️</Text>
                <Text style={styles.infoText}>{booking.clientEmail}</Text>
              </View>
            ) : null}

            <Text style={styles.mainText}>Service : {booking.servicesLabel}</Text>

            {booking.serviceDescription ? (
              <Text style={styles.mutedText}>{booking.serviceDescription}</Text>
            ) : null}

            <Text style={styles.mutedText}>
              Employé(e) : {booking.employeeName ?? "Non assigné"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Date et heure</Text>

            <View style={styles.infoLine}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoText}>{formatLongDateFR(booking.startAt)}</Text>
            </View>

            <View style={styles.infoLine}>
              <Text style={styles.infoIcon}>🕒</Text>
              <Text style={styles.infoText}>{formatTimeFR(booking.startAt)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Durée de la prestation</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Durée prévue</Text>
              <Text style={styles.value}>{booking.durationLabel}</Text>
            </View>

            <View style={styles.separator} />

            {booking.actualDurationLabel ? (
              <View style={styles.row}>
                <Text style={styles.label}>Durée réelle</Text>
                <Text style={[styles.value, { color: COLORS.primary }]}>
                  {booking.actualDurationLabel}
                </Text>
              </View>
            ) : (
              <Text style={styles.italicText}>Prestation non effectuée</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Informations de paiement</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Moyen de paiement</Text>
              <Text style={styles.value}>{booking.paymentMethod}</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.row}>
              <Text style={styles.label}>Type de paiement</Text>
              <Text
                style={[
                  styles.value,
                  {
                    color:
                      booking.paymentType === "Paiement complet"
                        ? "#15803D"
                        : booking.paymentType === "Acompte versé"
                          ? "#B45309"
                          : "#B91C1C",
                  },
                ]}
              >
                {booking.paymentType}
              </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.row}>
              <Text style={styles.label}>Montant total</Text>
              <Text style={styles.value}>{formatFCFA(booking.amount)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Montant payé</Text>
              <Text style={[styles.value, { color: COLORS.primary }]}>
                {formatFCFA(booking.paidAmount)}
              </Text>
            </View>

            {booking.remainingAmount > 0 ? (
              <>
                <View style={styles.separator} />
                <View style={styles.row}>
                  <Text style={styles.label}>Reste à payer</Text>
                  <Text style={[styles.value, { color: "#DC2626" }]}>
                    {formatFCFA(booking.remainingAmount)}
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {booking.clientAllergies || booking.clientComments ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations client</Text>

              {booking.clientAllergies ? (
                <>
                  <Text style={styles.label}>Allergies / sensibilités</Text>
                  <Text style={styles.mainText}>{booking.clientAllergies}</Text>
                </>
              ) : null}

              {booking.clientComments ? (
                <>
                  <View style={styles.separator} />
                  <Text style={styles.label}>Commentaires</Text>
                  <Text style={styles.mainText}>{booking.clientComments}</Text>
                </>
              ) : null}
            </View>
          ) : null}

          {booking.paymentType === "Acompte versé" && booking.remainingAmount > 0 ? (
            <View style={[styles.notice, styles.noticeWarn]}>
              <Text style={styles.noticeTitle}>⚠️ Acompte versé</Text>
              <Text style={styles.noticeText}>
                Un acompte de {formatFCFA(booking.paidAmount)} a été versé. Le
                solde de {formatFCFA(booking.remainingAmount)} reste à régler.
              </Text>
            </View>
          ) : null}

          {booking.paymentType === "Paiement complet" ? (
            <View style={[styles.notice, styles.noticeSuccess]}>
              <Text style={styles.noticeTitle}>✅ Paiement complet</Text>
              <Text style={styles.noticeText}>
                Le montant total de {formatFCFA(booking.amount)} a été réglé.
              </Text>
            </View>
          ) : null}

          {booking.note ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Note interne</Text>
              <Text style={styles.mainText}>{booking.note}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(professional)/client-details",
                  params: {
                    id: booking.clientId,
                    client: booking.clientName,
                  },
                })
              }
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Voir le profil client</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(professional)/booking-history")}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Retour à l'historique</Text>
            </Pressable>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  loaderText: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  content: {
    padding: 18,
  },

  statusWrap: {
    alignItems: "center",
    marginBottom: 18,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "900",
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 14,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  infoIcon: {
    width: 24,
    fontSize: 17,
  },
  infoText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  mainText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
    lineHeight: 20,
  },
  mutedText: {
    color: "rgba(58,58,58,0.6)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    lineHeight: 19,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginVertical: 5,
  },
  label: {
    color: "rgba(58,58,58,0.6)",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  value: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(107,39,55,0.1)",
    marginVertical: 10,
  },
  italicText: {
    color: "rgba(58,58,58,0.55)",
    fontSize: 13,
    fontWeight: "700",
    fontStyle: "italic",
  },

  notice: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  noticeSuccess: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  noticeWarn: {
    backgroundColor: "#FEFCE8",
    borderColor: "#FEF08A",
  },
  noticeTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
  },
  noticeText: {
    color: "rgba(58,58,58,0.7)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },

  actions: {
    gap: 12,
    marginTop: 4,
  },
  secondaryBtn: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFF",
    fontWeight: "900",
  },

  emptyTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 8,
  },
});