import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from "react-native";
import { ProHeader } from "./components/ProHeader";
import { formatFCFA, formatDateFR, formatTimeFR } from "./utils/format";

type Method = "all" | "mobile-money" | "card" | "cash";
type TxStatus = "paid" | "pending";

type Tx = {
  id: number;
  date: string; // "YYYY-MM-DD HH:mm"
  client: string;
  services: string;
  amount: number;
  method: Exclude<Method, "all">;
  status: TxStatus;
};

const COLORS = {
  bg: "#FAF7F2",
  text: "#3A3A3A",
  primary: "#6B2737",
  gold: "#D4AF6A",
};

export default function CashRegisterScreen() {
  const [activeFilter, setActiveFilter] = useState<Method>("all");
  const [selectedDate, setSelectedDate] = useState("2026-01-07");

  const transactions: Tx[] = useMemo(
    () => [
      { id: 1, date: "2026-01-07 14:30", client: "Marie Kouassi", services: "Tresses + Manucure", amount: 35000, method: "mobile-money", status: "paid" },
      { id: 2, date: "2026-01-07 11:15", client: "Sophie Mbongo", services: "Massage relaxant", amount: 18000, method: "card", status: "paid" },
      { id: 3, date: "2026-01-07 09:00", client: "Jean Bongo", services: "Coupe homme", amount: 8000, method: "cash", status: "paid" },
      { id: 4, date: "2026-01-07 16:00", client: "Laura Martin", services: "Coloration", amount: 45000, method: "mobile-money", status: "pending" },
      { id: 5, date: "2026-01-06 15:00", client: "Anna Dupont", services: "Pédicure", amount: 12000, method: "mobile-money", status: "paid" },
      { id: 6, date: "2026-01-06 10:30", client: "Marc Kouadio", services: "Massage", amount: 25000, method: "cash", status: "paid" },
    ],
    []
  );

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const dateOnly = t.date.split(" ")[0];
      const dateMatch = dateOnly === selectedDate;
      const methodMatch = activeFilter === "all" || t.method === activeFilter;
      return dateMatch && methodMatch;
    });
  }, [transactions, selectedDate, activeFilter]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, t) => {
        if (t.status !== "paid") return acc;
        acc.total += t.amount;
        if (t.method === "mobile-money") acc.mobileMoney += t.amount;
        if (t.method === "card") acc.card += t.amount;
        if (t.method === "cash") acc.cash += t.amount;
        return acc;
      },
      { total: 0, mobileMoney: 0, card: 0, cash: 0 }
    );
  }, [filtered]);

  return (
    <View style={styles.screen}>
      <ProHeader title="Caisse & Transactions" subtitle="Suivi des paiements" backTo="/(professional)/dashboard" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Filtrer par date</Text>
        <TextInput
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="rgba(58,58,58,0.4)"
          style={styles.input}
        />

        <View style={styles.hero}>
          <Text style={styles.heroSub}>Total encaissé le {formatDateFR(selectedDate)}</Text>
          <Text style={styles.heroTitle}>{formatFCFA(totals.total)}</Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Mobile Money</Text>
            <Text style={styles.statValue}>{totals.mobileMoney.toLocaleString("fr-FR")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cartes</Text>
            <Text style={styles.statValue}>{totals.card.toLocaleString("fr-FR")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Espèces</Text>
            <Text style={styles.statValue}>{totals.cash.toLocaleString("fr-FR")}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Filtres</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
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
                onPress={() => setActiveFilter(p.id as Method)}
                style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
              >
                <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextIdle]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Transactions</Text>
        {filtered.map((t) => (
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
                      {t.method === "mobile-money" ? "Mobile Money" : t.method === "card" ? "Carte" : "Espèces"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.amount}>{formatFCFA(t.amount)}</Text>
                <View style={[styles.badge, t.status === "paid" ? styles.badgePaid : styles.badgePending]}>
                  <Text style={[styles.badgeText, t.status === "paid" ? styles.badgePaidText : styles.badgePendingText]}>
                    {t.status === "paid" ? "Payé" : "En attente"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 18 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "600", marginBottom: 8 },
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

  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 14, marginBottom: 10 },
  pills: { gap: 8, paddingBottom: 6 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  pillActive: { backgroundColor: COLORS.primary },
  pillIdle: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },
  pillText: { fontSize: 13, fontWeight: "700" },
  pillTextActive: { color: "#FFF" },
  pillTextIdle: { color: COLORS.text },

  card: { backgroundColor: "#FFF", borderRadius: 18, padding: 14, marginBottom: 10 },
  cardRow: { flexDirection: "row", gap: 12 },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  cardSub: { color: "rgba(58,58,58,0.6)", fontSize: 12, marginTop: 4, marginBottom: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mini: { color: "rgba(58,58,58,0.55)", fontSize: 11, fontWeight: "600" },

  amount: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginBottom: 6 },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700", color: COLORS.text },
  badgePaid: { backgroundColor: "rgba(34,197,94,0.18)" },
  badgePaidText: { color: "#15803d" },
  badgePending: { backgroundColor: "rgba(249,115,22,0.18)" },
  badgePendingText: { color: "#c2410c" },
});