import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProHeader } from "./components/ProHeader";

type ReportType = "compte-resultat" | "rapport-mensuel";
type PeriodType = "Ce mois" | "Mois dernier" | "Cette année" | "Personnalisé";

export default function AccountingReports() {
  const [reportType, setReportType] = useState<ReportType>("compte-resultat");
  const [periodType, setPeriodType] = useState<PeriodType>("Ce mois");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showExport, setShowExport] = useState(false);

  const computedTitle = useMemo(() => {
    const base = reportType === "compte-resultat" ? "Compte de Résultat" : "Rapport Mensuel";
    return `${base} — ${periodType}`;
  }, [reportType, periodType]);

  return (
    <View style={styles.container}>
      <ProHeader title="Comptabilité & Rapports" subtitle="Normes SYSCOHADA" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Paramètres</Text>

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
            <Ionicons name="sparkles-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Générer le rapport</Text>
          </Pressable>
        </View>

        {/* Preview (UI only) */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={styles.sectionTitle}>{computedTitle}</Text>
            <Pressable onPress={() => setShowExport(true)} style={styles.smallBtn}>
              <Ionicons name="download-outline" size={16} color="#6B2737" />
              <Text style={styles.smallBtnText}>Exporter</Text>
            </Pressable>
          </View>

          {reportType === "compte-resultat" ? (
            <>
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
            </>
          ) : (
            <View style={[styles.box, { backgroundColor: "#FAF7F2" }]}>
              <RowKV k="CA total" v="970 000 FCFA" vColor="#6B2737" />
              <RowKV k="Charges totales" v="630 000 FCFA" vColor="#b91c1c" />
              <RowKV k="Résultat" v="340 000 FCFA" vColor="#15803d" />
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Export modal */}
      <Modal visible={showExport} transparent animationType="fade" onRequestClose={() => setShowExport(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Exporter</Text>
              <Pressable onPress={() => setShowExport(false)}>
                <Ionicons name="close" size={22} color="#3A3A3A" />
              </Pressable>
            </View>

            <Pressable style={[styles.exportBtn, { backgroundColor: "#dc2626" }]}>
              <Ionicons name="document-text-outline" size={18} color="#fff" />
              <Text style={styles.exportText}>PDF</Text>
            </Pressable>

            <Pressable style={[styles.exportBtn, { backgroundColor: "#16a34a" }]}>
              <Ionicons name="grid-outline" size={18} color="#fff" />
              <Text style={styles.exportText}>Excel</Text>
            </Pressable>

            <Pressable onPress={() => setShowExport(false)} style={[styles.secondaryBtn, { marginTop: 12 }]}>
              <Text style={styles.secondaryText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  content: { padding: 18, paddingBottom: 32, gap: 12 },

  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10 },
  sectionTitle: { color: "#6B2737", fontSize: 16, fontWeight: "900" },

  label: { color: "#3A3A3A", fontWeight: "900", marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#FAF7F2", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },

  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 6 },

  chip: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },
  chipActive: { backgroundColor: "rgba(107,39,55,0.10)", borderColor: "#6B2737" },
  chipText: { color: "#3A3A3A", fontSize: 12 },
  chipTextActive: { color: "#6B2737", fontWeight: "900" },

  primaryBtn: { marginTop: 14, backgroundColor: "#6B2737", borderRadius: 999, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  smallLabel: { color: "rgba(58,58,58,0.6)", fontWeight: "800", marginBottom: 8 },
  box: { borderRadius: 14, padding: 12 },
  sep: { height: 2, backgroundColor: "rgba(107,39,55,0.2)", marginTop: 12, marginBottom: 12 },

  smallBtn: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: "rgba(107,39,55,0.08)", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999 },
  smallBtnText: { color: "#6B2737", fontWeight: "900", fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 18 },
  modalCard: { backgroundColor: "#fff", borderRadius: 22, padding: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#6B2737" },

  exportBtn: { borderRadius: 999, paddingVertical: 14, flexDirection: "row", justifyContent: "center", gap: 8, alignItems: "center", marginTop: 10 },
  exportText: { color: "#fff", fontWeight: "900" },

  secondaryBtn: { backgroundColor: "#FAF7F2", borderRadius: 999, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#3A3A3A", fontWeight: "900" },
});