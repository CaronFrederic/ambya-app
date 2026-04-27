import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Href, router } from "expo-router";
import { ProHeader } from "./components/ProHeader";
import { formatFCFA, formatDateFR } from "./utils/format";
import {
  getAppointmentHistory,
  type AppointmentHistoryItem,
} from "../../src/api/appointments";
import * as SecureStore from "expo-secure-store";
const COLORS = {
  bg: "#FAF7F2",
  text: "#3A3A3A",
  primary: "#6B2737",
  gold: "#D4AF6A",
};
import { Alert, Linking } from "react-native";
import { getAppointmentHistoryExportUrl } from "../../src/api/appointments";



type Status = "completed" | "cancelled" | "no-show";

type Booking = {
  id: string;
  date: string;
  clientId: string;
  client: string;
  phone: string;
  services: string;
  employee: string;
  amount: number;
  status: Status;
};

async function getAccessToken(): Promise<string> {
  const token = await SecureStore.getItemAsync("accessToken");
  if (!token) {
    throw new Error("Utilisateur non authentifié.");
  }
  return token;
}

function mapApiAppointmentToBooking(item: AppointmentHistoryItem): Booking | null {
  if (item.status !== "COMPLETED" && item.status !== "CANCELLED" && item.status !== "NO_SHOW") {
    return null;
  }

  return {
    id: item.id,
    date: item.startAt,
    clientId: item.clientId,
    client: item.clientName,
    phone: item.clientPhone ?? "Non renseigné",
    services: item.servicesLabel,
    employee: item.employeeName ?? "Non assigné",
    amount: item.amount,
    status:
      item.status === "COMPLETED"
        ? "completed"
        : item.status === "CANCELLED"
        ? "cancelled"
        : "no-show",
  };
}

export default function BookingHistoryScreen() {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [exporting, setExporting] = useState(false);

const handleExportExcel = async () => {
  try {
    setExporting(true);

    const url = await getAppointmentHistoryExportUrl(filter);
    await Linking.openURL(url);
  } catch (error) {
    console.error("Booking history export error:", error);
    Alert.alert(
      "Export impossible",
      error instanceof Error ? error.message : "Une erreur est survenue."
    );
  } finally {
    setExporting(false);
  }
};


  const loadHistory = async (currentFilter?: "all" | Status) => {
    const token = await getAccessToken();

    const data = await getAppointmentHistory(token, {
      status: currentFilter ?? filter,
    });

    const mapped = data
      .map(mapApiAppointmentToBooking)
      .filter((item): item is Booking => item !== null);

    setBookings(mapped);
  };

  const initialLoad = async () => {
    try {
      setLoading(true);
      await loadHistory(filter);
    } catch (error) {
      console.error("Booking history load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadHistory(filter);
    } catch (error) {
      console.error("Booking history refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadHistory(filter).catch((error) => {
        console.error("Booking history filter reload error:", error);
      });
    }
  }, [filter]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => (filter === "all" ? true : b.status === filter));
  }, [bookings, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ProHeader
        title="Historique des Réservations"
        subtitle="Toutes vos réservations"
        backTo="/(professional)/dashboard"
      />

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Chargement de l'historique...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 18 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
          >
            {[
              { id: "all", label: "Tous" },
              { id: "completed", label: "Terminé" },
              { id: "cancelled", label: "Annulé" },
              { id: "no-show", label: "No-show" },
            ].map((p) => {
              const active = filter === (p.id as "all" | Status);

              return (
                <Pressable
                  key={p.id}
                  onPress={() => setFilter(p.id as "all" | Status)}
                  style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      active ? styles.pillTextActive : styles.pillTextIdle,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
  onPress={handleExportExcel}
  disabled={exporting}
  style={[
    styles.primaryBtn,
    { backgroundColor: "#16A34A", opacity: exporting ? 0.7 : 1 },
  ]}
>
  <Text style={styles.primaryBtnText}>
    {exporting ? "Export en cours..." : "⬇︎ Exporter en Excel"}
  </Text>
</Pressable>

          <View style={{ gap: 10, marginTop: 12 }}>
            {filtered.map((b) => (
              <View key={b.id} style={styles.card}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <Text style={styles.title}>{b.client}</Text>
                      <View
                        style={[
                          styles.badge,
                          b.status === "completed"
                            ? styles.badgeOk
                            : b.status === "cancelled"
                            ? styles.badgeWarn
                            : styles.badgeBad,
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {b.status === "completed"
                            ? "Terminé"
                            : b.status === "cancelled"
                            ? "Annulé"
                            : "No-show"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.sub}>{b.phone}</Text>
                    <Text style={[styles.title, { fontSize: 13, marginTop: 6 }]}>
                      {b.services}
                    </Text>

                    <Text style={styles.mini}>
                      👤 {b.employee} • 📅 {formatDateFR(b.date)}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.amount}>
                      {formatFCFA(b.amount).replace(" FCFA", "")}
                    </Text>
                    <Text style={styles.mini}>FCFA</Text>
                  </View>
                </View>

                {/* <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(professional)/client-details",
                      params: {
                        id: b.clientId,
                        client: b.client,
                      },
                    } satisfies Href)
                  }
                  style={styles.detailsBtn}
                >
                  <Text style={styles.detailsBtnText}>Voir détails</Text>
                </Pressable> */}
              </View>
            ))}

            {filtered.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aucune réservation trouvée</Text>
                <Text style={styles.emptySub}>
                  Aucune réservation ne correspond au filtre sélectionné.
                </Text>
              </View>
            )}
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
  },
  loaderText: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  pillActive: { backgroundColor: COLORS.primary },
  pillIdle: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
  },
  pillText: { fontSize: 13, fontWeight: "800" },
  pillTextActive: { color: "#FFF" },
  pillTextIdle: { color: COLORS.text },

  primaryBtn: { paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  primaryBtnText: { color: "#FFF", fontWeight: "900" },

  card: { backgroundColor: "#FFF", borderRadius: 18, padding: 14 },
  title: { color: COLORS.text, fontWeight: "900", fontSize: 14 },
  sub: { color: "rgba(58,58,58,0.6)", fontWeight: "700" },
  mini: {
    color: "rgba(58,58,58,0.5)",
    fontWeight: "700",
    marginTop: 8,
    fontSize: 11,
  },
  amount: { color: COLORS.primary, fontWeight: "900", fontSize: 18 },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontWeight: "900", fontSize: 11, color: COLORS.text },
  badgeOk: { backgroundColor: "rgba(34,197,94,0.16)" },
  badgeWarn: { backgroundColor: "rgba(249,115,22,0.16)" },
  badgeBad: { backgroundColor: "rgba(220,38,38,0.16)" },

  detailsBtn: {
    marginTop: 12,
    backgroundColor: "rgba(107,39,55,0.06)",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  detailsBtnText: { color: COLORS.primary, fontWeight: "900" },

  emptyCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
  },
  emptyTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 15,
  },
  emptySub: {
    color: "rgba(58,58,58,0.6)",
    marginTop: 6,
    textAlign: "center",
  },
});