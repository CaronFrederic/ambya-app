import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Screen = "pro-dashboard";
type Props = { navigate: (screen: Screen) => void };

export function AccountingReports({ navigate }: Props) {
  const [reportType, setReportType] = useState<"compte-resultat" | "rapport-mensuel">("compte-resultat");
  const [periodType, setPeriodType] = useState<"Ce mois" | "Mois dernier" | "Cette année" | "Personnalisé">("Ce mois");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigate("pro-dashboard")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Comptabilité & Rapports</Text>
        <Text style={styles.headerSub}>Normes SYSCOHADA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>Type de rapport</Text>

          <View style={styles.row}>
            <Chip label="Compte de Résultat" active={reportType === "compte-resultat"} onPress={() => setReportType("compte-resultat")} />
            <Chip label="Rapport Mensuel" active={reportType === "rapport-mensuel"} onPress={() => setReportType("rapport-mensuel")} />
          </View>

          <Text style={styles.label}>Période</Text>
          <View style={styles.row}>
            {(["Ce mois", "Mois dernier", "Cette année", "Personnalisé"] as const).map((p) => (
              <Chip key={p} label={p} active={periodType === p} onPress={() => setPeriodType(p)} />
            ))}
          </View>

          {periodType === "Personnalisé" && (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TextInput value={startDate} onChangeText={setStartDate} placeholder="Début YYYY-MM-DD" style={[styles.input, { flex: 1 }]} />
              <TextInput value={endDate} onChangeText={setEndDate} placeholder="Fin YYYY-MM-DD" style={[styles.input, { flex: 1 }]} />
            </View>
          )}

          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Générer le rapport</Text>
          </Pressable>
        </View>

        {reportType === "compte-resultat" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Compte de Résultat - Janvier 2026</Text>

            <Text style={styles.smallLabel}>Classe 7 - Revenus</Text>
            <View style={[styles.box, { backgroundColor: "#dcfce7" }]}>
              <RowKV k="Ventes de services" v="850 000 FCFA" vColor="#15803d" />
              <RowKV k="Produits vendus" v="120 000 FCFA" vColor="#15803d" small />
            </View>

            <Text style={[styles.smallLabel, { marginTop: 14 }]}>Classe 6 - Charges</Text>
            <View style={[styles.box, { backgroundColor: "#fee2e2" }]}>
              <RowKV k="Achats de produits" v="180 000 FCFA" vColor="#b91c1c" />
              <RowKV k="Salaires" v="360 000 FCFA" vColor="#b91c1c" />
              <RowKV k="Autres charges" v="90 000 FCFA" vColor="#b91c1c" small />
            </View>

            <View style={styles.sep} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
              <View>
                <Text style={{ color: "#3A3A3A", fontWeight: "900", fontSize: 16 }}>Résultat Net</Text>
                <Text style={{ color: "rgba(58,58,58,0.6)", fontSize: 12, fontStyle: "italic" }}>Estimation prévisionnelle</Text>
              </View>
              <Text style={{ color: "#D4AF6A", fontWeight: "900", fontSize: 22 }}>340 000 FCFA</Text>
            </View>
            <Text style={{ color: "#16a34a", textAlign: "right", marginTop: 6, fontWeight: "700" }}>+35% vs mois dernier</Text>

            <View style={[styles.sep, { marginTop: 16 }]} />
            <Text style={{ color: "rgba(58,58,58,0.6)", fontSize: 12, marginBottom: 10 }}>Évolution mensuelle</Text>

            <View style={styles.bars}>
              {[45, 60, 55, 70, 65, 80, 75].map((h, i) => (
                <View key={i} style={[styles.bar, { height: `${h}%` as any }]} />
              ))}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={styles.axis}>Juil</Text>
              <Text style={styles.axis}>Jan</Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable style={[styles.exportBtn, { backgroundColor: "#dc2626" }]}>
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.exportText}>PDF</Text>
          </Pressable>
          <Pressable style={[styles.exportBtn, { backgroundColor: "#16a34a" }]}>
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.exportText}>Excel</Text>
          </Pressable>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function RowKV({ k, v, vColor, small }: { k: string; v: string; vColor: string; small?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: small ? 0 : 6 }}>
      <Text style={{ color: "#3A3A3A", fontSize: small ? 12 : 14 }}>{k}</Text>
      <Text style={{ color: vColor, fontWeight: "900", fontSize: small ? 12 : 14 }}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },
  header: { backgroundColor: "#6B2737", paddingTop: 52, paddingBottom: 18, paddingHorizontal: 18 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  headerSub: { color: "rgba(255,255,255,0.8)", marginTop: 6, fontSize: 13 },

  content: { padding: 18, paddingBottom: 32, gap: 12 },

  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10 },
  label: { color: "#3A3A3A", fontWeight: "900", marginBottom: 6 },
  input: { backgroundColor: "#FAF7F2", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },

  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  chip: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },
  chipActive: { backgroundColor: "rgba(107,39,55,0.10)", borderColor: "#6B2737" },
  chipText: { color: "#3A3A3A", fontSize: 12 },
  chipTextActive: { color: "#6B2737", fontWeight: "900" },

  primaryBtn: { marginTop: 8, backgroundColor: "#6B2737", borderRadius: 999, paddingVertical: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  sectionTitle: { color: "#6B2737", fontSize: 16, fontWeight: "900", marginBottom: 10 },
  smallLabel: { color: "rgba(58,58,58,0.6)", fontWeight: "800", marginBottom: 8 },
  box: { borderRadius: 14, padding: 12 },
  sep: { height: 2, backgroundColor: "rgba(107,39,55,0.2)", marginTop: 12, marginBottom: 12 },

  bars: { height: 120, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bar: { flex: 1, backgroundColor: "#6B2737", borderTopLeftRadius: 8, borderTopRightRadius: 8, opacity: 0.85 },
  axis: { color: "rgba(58,58,58,0.4)", fontSize: 12 },

  exportBtn: { flex: 1, borderRadius: 999, paddingVertical: 14, flexDirection: "row", justifyContent: "center", gap: 8, alignItems: "center" },
  exportText: { color: "#fff", fontWeight: "900" },
});