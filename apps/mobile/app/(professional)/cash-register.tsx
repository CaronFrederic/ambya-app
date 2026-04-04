import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { ProHeader } from "./components/ProHeader";
import { formatFCFA, formatDateFR, formatTimeFR } from "./utils/format";
import {
  getCashRegister,
  type CashMethod,
  type CashRegisterResponse,
} from "../../src/api/cash-register";
import * as SecureStore from "expo-secure-store";
const COLORS = {
  bg: "#FAF7F2",
  text: "#3A3A3A",
  primary: "#6B2737",
  gold: "#D4AF6A",
};

async function getAccessToken(): Promise<string> {
   const token = await SecureStore.getItemAsync("accessToken");
  if (!token) {
    throw new Error("Utilisateur non authentifié.");
  }
  return token;
}

function PaymentDonutChart({
  data,
  size = 180,
  strokeWidth = 34,
}: {
  data: { name: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

  let cumulative = 0;

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {data.map((item, index) => {
          const segment = (item.value / total) * circumference;
          const strokeDasharray = `${segment} ${circumference - segment}`;
          const rotation = (cumulative / total) * 360 - 90;
          cumulative += item.value;

          return (
            <Circle
              key={`${item.name}-${index}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeLinecap="butt"
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const EMPTY_DATA: CashRegisterResponse = {
  date: "",
  totals: {
    total: 0,
    mobileMoney: 0,
    card: 0,
    cash: 0,
  },
  transactions: [],
  breakdown: [
    { name: "Part salon", value: 65, color: "#6B2737" },
    { name: "Commission AMBYA", value: 15, color: "#D4AF6A" },
    { name: "Frais transaction", value: 5, color: "#8B8B8B" },
  ],
  meta: {
    count: 0,
    paidCount: 0,
    pendingCount: 0,
    paidTotal: 0,
  },
};

export default function CashRegisterScreen() {
  const [activeFilter, setActiveFilter] = useState<CashMethod>("all");
  const [selectedDate, setSelectedDate] = useState("2026-01-07");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [data, setData] = useState<CashRegisterResponse>(EMPTY_DATA);

  const loadCashRegister = async (date: string, method: CashMethod) => {
    const token = await getAccessToken();
    const response = await getCashRegister(token, { date, method });
    setData(response);
  };

  const initialLoad = async () => {
    try {
      setLoading(true);
      await loadCashRegister(selectedDate, activeFilter);
    } catch (error) {
      console.error("Cash register load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadCashRegister(selectedDate, activeFilter);
    } catch (error) {
      console.error("Cash register refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadCashRegister(selectedDate, activeFilter).catch((error) => {
        console.error("Cash register filter reload error:", error);
      });
    }
  }, [selectedDate, activeFilter]);

  return (
    <View style={styles.screen}>
      <ProHeader
        title="Caisse & Transactions"
        subtitle="Suivi des paiements"
        backTo="/(professional)/dashboard"
      />

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Chargement de la caisse...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.label}>Filtrer par date</Text>
          <TextInput
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="rgba(58,58,58,0.4)"
            style={styles.input}
          />

          <View style={styles.hero}>
            <Text style={styles.heroSub}>
              Total encaissé le {formatDateFR(selectedDate)}
            </Text>
            <Text style={styles.heroTitle}>{formatFCFA(data.totals.total)}</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Mobile Money</Text>
              <Text style={styles.statValue}>
                {data.totals.mobileMoney.toLocaleString("fr-FR")}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Cartes</Text>
              <Text style={styles.statValue}>
                {data.totals.card.toLocaleString("fr-FR")}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Espèces</Text>
              <Text style={styles.statValue}>
                {data.totals.cash.toLocaleString("fr-FR")}
              </Text>
            </View>
          </View>

          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>Répartition des paiements</Text>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="rgba(107,39,55,0.55)"
              />
            </View>

            <View style={styles.breakdownChartWrap}>
              <PaymentDonutChart data={data.breakdown} />
            </View>

            <View style={styles.breakdownLegend}>
              {data.breakdown.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.legendLabel}>{item.name}</Text>
                    <Text style={styles.legendValue}>{item.value}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Filtres</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pills}
          >
            {[
              { id: "all", label: "Tous" },
              { id: "mobile-money", label: "Mobile Money" },
              { id: "card", label: "Carte" },
              { id: "cash", label: "Espèces" },
            ].map((p) => {
              const active = activeFilter === p.id;

              return (
                <Pressable
                  key={p.id}
                  onPress={() => setActiveFilter(p.id as CashMethod)}
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

          <Text style={styles.sectionTitle}>Transactions</Text>

          {data.transactions.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{t.client}</Text>
                  <Text style={styles.cardSub}>{t.services}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.mini}>{formatTimeFR(t.date)}</Text>

                    <View
                      style={[
                        styles.badge,
                        t.method === "mobile-money"
                          ? { backgroundColor: "rgba(107,39,55,0.12)" }
                          : t.method === "card"
                          ? { backgroundColor: "rgba(212,175,106,0.22)" }
                          : { backgroundColor: "rgba(0,0,0,0.06)" },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {t.method === "mobile-money"
                          ? "Mobile Money"
                          : t.method === "card"
                          ? "Carte"
                          : "Espèces"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.amount}>{formatFCFA(t.amount)}</Text>
                  <View
                    style={[
                      styles.badge,
                      t.status === "paid" ? styles.badgePaid : styles.badgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        t.status === "paid"
                          ? styles.badgePaidText
                          : styles.badgePendingText,
                      ]}
                    >
                      {t.status === "paid" ? "Payé" : "En attente"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {data.transactions.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aucune transaction trouvée</Text>
              <Text style={styles.emptySub}>
                Aucun paiement ne correspond à la date ou au filtre sélectionné.
              </Text>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 18 },

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

  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "rgba(107,39,55,0.2)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },
  hero: {
    marginTop: 14,
    borderRadius: 22,
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  heroSub: { color: "rgba(255,255,255,0.9)", fontSize: 12, marginBottom: 6 },
  heroTitle: { color: "#FFF", fontSize: 26, fontWeight: "800" },

  statRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: "#FFF", borderRadius: 18, padding: 12 },
  statLabel: { color: "rgba(58,58,58,0.6)", fontSize: 11, marginBottom: 6 },
  statValue: { color: COLORS.text, fontSize: 14, fontWeight: "700" },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 10,
  },
  pills: { gap: 8, paddingBottom: 6 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  pillActive: { backgroundColor: COLORS.primary },
  pillIdle: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
  },
  pillText: { fontSize: 13, fontWeight: "700" },
  pillTextActive: { color: "#FFF" },
  pillTextIdle: { color: COLORS.text },

  card: { backgroundColor: "#FFF", borderRadius: 18, padding: 14, marginBottom: 10 },
  cardRow: { flexDirection: "row", gap: 12 },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  cardSub: {
    color: "rgba(58,58,58,0.6)",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mini: {
    color: "rgba(58,58,58,0.55)",
    fontSize: 11,
    fontWeight: "600",
  },

  amount: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginBottom: 6 },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700", color: COLORS.text },
  badgePaid: { backgroundColor: "rgba(34,197,94,0.18)" },
  badgePaidText: { color: "#15803d" },
  badgePending: { backgroundColor: "rgba(249,115,22,0.18)" },
  badgePendingText: { color: "#c2410c" },

  breakdownCard: {
    marginTop: 16,
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.08)",
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  breakdownTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  breakdownChartWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  breakdownLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  legendItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginTop: 3,
  },
  legendLabel: {
    color: COLORS.text,
    fontSize: 12,
  },
  legendValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },

  emptyCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
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