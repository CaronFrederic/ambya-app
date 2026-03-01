import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ProHeader } from "./components/ProHeader";

const COLORS = { bg: "#FAF7F2", text: "#3A3A3A", primary: "#6B2737", gold: "#D4AF6A" };

export default function ClientDetailsScreen() {
  const params = useLocalSearchParams<{ client?: string }>();
  const clientName = params.client ?? "Marie Kouassi";

  const [depositExempt, setDepositExempt] = useState(false);

  return (
<View style={{ flex: 1, backgroundColor: COLORS.bg }}>
  <ProHeader title="Fiche Client" backTo="/(professional)/dashboard" />

      <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={styles.avatar}>
              <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 18 }}>{clientName.slice(0, 1)}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>{clientName}</Text>
              <View style={styles.pillGold}>
                <Text style={styles.pillGoldText}>⭐ Client régulier</Text>
              </View>
              <Text style={styles.sub}>📞 +241 77 11 22 33</Text>
              <Text style={styles.mini}>Cliente depuis le 12 Oct 2025</Text>
            </View>
          </View>
        </View>

        {/* Deposit */}
        <View style={[styles.card, { borderWidth: 2, borderColor: "rgba(212,175,106,0.35)" }]}>
          <Text style={styles.sectionTitle}>Gestion Acompte</Text>

          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Dispenser ce client de l'acompte</Text>
              <Text style={styles.mini}>Le client pourra payer entièrement sur place</Text>
            </View>
            <Switch value={depositExempt} onValueChange={setDepositExempt} />
          </View>

          <View style={[styles.notice, depositExempt ? styles.noticeGold : styles.noticeGray]}>
            <Text style={[styles.noticeText, depositExempt ? styles.noticeGoldText : styles.noticeGrayText]}>
              {depositExempt ? "🔓 Ce client est dispensé d'acompte" : "🔒 Ce client doit régler un acompte de 30%"}
            </Text>
          </View>

          <View style={styles.grid2}>
            <MiniKpi label="Acomptes réglés" value="3" />
            <MiniKpi label="Total acomptes" value="21 000 FCFA" />
          </View>
        </View>

        {/* Allergy */}
        <View style={styles.alert}>
          <Text style={styles.alertTitle}>⚠️ Allergie aux produits chimiques forts</Text>
          <Text style={styles.alertSub}>Privilégier les produits naturels et bio</Text>
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Statistiques Client</Text>
          <View style={styles.grid2}>
            <Kpi number="8" label="RDV réservés" />
            <Kpi number="185K" label="CA généré" accent={COLORS.gold} />
            <Kpi number="23K" label="Panier moyen" />
            <Kpi number="0%" label="✓ No-show" accent="#16A34A" bg="rgba(34,197,94,0.12)" />
          </View>

          <Text style={[styles.mini, { marginTop: 12 }]}>Dernière visite</Text>
          <Text style={styles.title}>Il y a 12 jours</Text>
        </View>

        {/* Preferred services */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⭐ Services préférés (Top 3)</Text>
          {[
            { name: "Tresses Nattes", count: 4 },
            { name: "Manucure Classique", count: 2 },
            { name: "Brushing", count: 2 },
          ].map((s, idx) => (
            <View key={s.name} style={styles.rankRow}>
              <View style={styles.rank}>
                <Text style={{ color: "#FFF", fontWeight: "900" }}>{idx + 1}</Text>
              </View>
              <Text style={[styles.title, { flex: 1 }]}>{s.name}</Text>
              <Text style={[styles.title, { color: COLORS.primary }]}>{s.count}×</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Créer un RDV pour ce client</Text>
          </Pressable>
          <Pressable style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Envoyer une notification</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function Kpi({ number, label, accent, bg }: { number: string; label: string; accent?: string; bg?: string }) {
  return (
    <View style={[styles.kpi, bg ? { backgroundColor: bg } : undefined]}>
      <Text style={[styles.kpiNumber, accent ? { color: accent } : undefined]}>{number}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniKpi}>
      <Text style={styles.mini}>{label}</Text>
      <Text style={styles.title}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFF", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(107,39,55,0.12)", marginBottom: 12 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(107,39,55,0.12)", alignItems: "center", justifyContent: "center" },
  h1: { color: COLORS.primary, fontWeight: "900", fontSize: 20, marginBottom: 6 },
  pillGold: { alignSelf: "flex-start", backgroundColor: "rgba(212,175,106,0.2)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6 },
  pillGoldText: { color: COLORS.primary, fontWeight: "900", fontSize: 11 },
  sub: { color: COLORS.text, fontWeight: "700" },
  mini: { color: "rgba(58,58,58,0.55)", fontWeight: "700", marginTop: 4, fontSize: 12 },

  sectionTitle: { color: COLORS.text, fontWeight: "900", marginBottom: 10, fontSize: 14 },
  title: { color: COLORS.text, fontWeight: "900" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },

  notice: { marginTop: 12, borderRadius: 14, padding: 12, borderWidth: 1 },
  noticeText: { fontWeight: "900" },
  noticeGold: { backgroundColor: "rgba(212,175,106,0.2)", borderColor: "rgba(212,175,106,0.35)" },
  noticeGoldText: { color: COLORS.primary },
  noticeGray: { backgroundColor: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.1)" },
  noticeGrayText: { color: "rgba(0,0,0,0.6)" },

  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  kpi: { width: "48%", backgroundColor: "rgba(107,39,55,0.06)", borderRadius: 14, padding: 12 },
  kpiNumber: { color: COLORS.primary, fontWeight: "900", fontSize: 18 },
  kpiLabel: { color: "rgba(58,58,58,0.55)", fontWeight: "700", marginTop: 6, fontSize: 12 },
  miniKpi: { width: "48%", backgroundColor: "rgba(107,39,55,0.06)", borderRadius: 14, padding: 12 },

  alert: { backgroundColor: "rgba(220,38,38,0.12)", borderWidth: 2, borderColor: "rgba(220,38,38,0.35)", borderRadius: 18, padding: 14, marginBottom: 12 },
  alertTitle: { color: "#991B1B", fontWeight: "900", marginBottom: 6 },
  alertSub: { color: "#B91C1C", fontStyle: "italic", fontWeight: "700" },

  rankRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(107,39,55,0.06)", borderRadius: 14, padding: 12, marginTop: 10 },
  rank: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },

  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  primaryBtnText: { color: "#FFF", fontWeight: "900" },
  outlineBtn: { borderWidth: 2, borderColor: COLORS.primary, paddingVertical: 14, borderRadius: 999, alignItems: "center", backgroundColor: "#FFF" },
  outlineBtnText: { color: COLORS.primary, fontWeight: "900" },
});