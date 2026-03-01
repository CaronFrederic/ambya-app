import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Href, router } from "expo-router";
import { ProHeader } from "./components/ProHeader";
import { formatFCFA, formatDateFR } from "./utils/format";

const COLORS = { bg: "#FAF7F2", text: "#3A3A3A", primary: "#6B2737", gold: "#D4AF6A" };

type Status = "completed" | "cancelled" | "no-show";
type Booking = {
  id: number;
  date: string;
  client: string;
  phone: string;
  services: string;
  employee: string;
  amount: number;
  status: Status;
};

export default function BookingHistoryScreen() {
  const [filter, setFilter] = useState<"all" | Status>("all");

  const bookings: Booking[] = useMemo(
    () => [
      { id: 1, date: "2026-01-05", client: "Marie Kouassi", phone: "+241 77 11 22 33", services: "Tresses Nattes", employee: "Sophie", amount: 25000, status: "completed" },
      { id: 2, date: "2026-01-04", client: "Jean Bongo", phone: "+241 77 44 55 66", services: "Coupe homme", employee: "Paul", amount: 8000, status: "completed" },
      { id: 3, date: "2026-01-03", client: "Laura Martin", phone: "+241 77 77 88 99", services: "Coloration", employee: "Marie", amount: 45000, status: "cancelled" },
      { id: 4, date: "2025-12-28", client: "Emma Dubois", phone: "+241 77 00 11 22", services: "Massage", employee: "Jean", amount: 18000, status: "no-show" },
    ],
    []
  );

  const filtered = bookings.filter((b) => (filter === "all" ? true : b.status === filter));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ProHeader title="Historique des Réservations" subtitle="Toutes vos réservations" backTo="/(professional)/dashboard" />

      <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
          {[
            { id: "all", label: "Tous" },
            { id: "completed", label: "Terminé" },
            { id: "cancelled", label: "Annulé" },
            { id: "no-show", label: "No-show" },
          ].map((p) => {
            const active = filter === (p.id as any);
            return (
              <Pressable key={p.id} onPress={() => setFilter(p.id as any)} style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}>
                <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextIdle]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable style={[styles.primaryBtn, { backgroundColor: "#16A34A" }]}>
          <Text style={styles.primaryBtnText}>⬇︎ Exporter en Excel</Text>
        </Pressable>

        <View style={{ gap: 10, marginTop: 12 }}>
          {filtered.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Text style={styles.title}>{b.client}</Text>
                    <View style={[styles.badge, b.status === "completed" ? styles.badgeOk : b.status === "cancelled" ? styles.badgeWarn : styles.badgeBad]}>
                      <Text style={styles.badgeText}>
                        {b.status === "completed" ? "Terminé" : b.status === "cancelled" ? "Annulé" : "No-show"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sub}>{b.phone}</Text>
                  <Text style={[styles.title, { fontSize: 13, marginTop: 6 }]}>{b.services}</Text>

                  <Text style={styles.mini}>👤 {b.employee}  •  📅 {formatDateFR(b.date)}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.amount}>{formatFCFA(b.amount).replace(" FCFA", "")}</Text>
                  <Text style={styles.mini}>FCFA</Text>
                </View>
              </View>

              <Pressable
                onPress={() => router.push({ pathname: "/(professional)/client-details", params: { client: b.client }, } satisfies Href)}
                style={styles.detailsBtn}
              >
                <Text style={styles.detailsBtnText}>Voir détails</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  pillActive: { backgroundColor: COLORS.primary },
  pillIdle: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },
  pillText: { fontSize: 13, fontWeight: "800" },
  pillTextActive: { color: "#FFF" },
  pillTextIdle: { color: COLORS.text },

  primaryBtn: { paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  primaryBtnText: { color: "#FFF", fontWeight: "900" },

  card: { backgroundColor: "#FFF", borderRadius: 18, padding: 14 },
  title: { color: COLORS.text, fontWeight: "900", fontSize: 14 },
  sub: { color: "rgba(58,58,58,0.6)", fontWeight: "700" },
  mini: { color: "rgba(58,58,58,0.5)", fontWeight: "700", marginTop: 8, fontSize: 11 },
  amount: { color: COLORS.primary, fontWeight: "900", fontSize: 18 },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontWeight: "900", fontSize: 11, color: COLORS.text },
  badgeOk: { backgroundColor: "rgba(34,197,94,0.16)" },
  badgeWarn: { backgroundColor: "rgba(249,115,22,0.16)" },
  badgeBad: { backgroundColor: "rgba(220,38,38,0.16)" },

  detailsBtn: { marginTop: 12, backgroundColor: "rgba(107,39,55,0.06)", paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  detailsBtnText: { color: COLORS.primary, fontWeight: "900" },
});