import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Screen = "pro-dashboard";
type Props = { navigate: (screen: Screen) => void };

type Expense = {
  id: number;
  date: string; // yyyy-mm-dd
  category: string;
  description: string;
  amount: number;
  payment: "Mobile Money" | "Virement" | "Espèces";
};

export function ExpenseManagement({ navigate }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, date: "2026-01-05", category: "Produits", description: "Achat shampooing professionnel", amount: 15000, payment: "Mobile Money" },
    { id: 2, date: "2026-01-03", category: "Salaires", description: "Salaire Marie - Janvier", amount: 120000, payment: "Virement" },
    { id: 3, date: "2026-01-02", category: "Électricité", description: "Facture SEEG Décembre", amount: 25000, payment: "Espèces" },
    { id: 4, date: "2025-12-28", category: "Marketing", description: "Publicité Facebook", amount: 8000, payment: "Mobile Money" },
  ]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  // form (UI only)
  const [form, setForm] = useState({ date: "2026-01-07", category: "Produits", amount: "", description: "", payment: "Espèces" as Expense["payment"] });

  const save = () => {
    const amt = Number(form.amount || 0);
    if (!amt || !form.description.trim()) return;

    const newExpense: Expense = {
      id: Math.max(0, ...expenses.map((e) => e.id)) + 1,
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      amount: amt,
      payment: form.payment,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigate("pro-dashboard")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Gestion des Dépenses</Text>
        <Text style={styles.headerSub}>Suivez toutes vos dépenses</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total dépenses</Text>
          <Text style={styles.totalValue}>{totalExpenses.toLocaleString()} FCFA</Text>
          <Text style={styles.totalHint}>Ce mois-ci</Text>
        </View>

        <Pressable onPress={() => setShowModal(true)} style={styles.primaryBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Ajouter une dépense</Text>
        </Pressable>

        <View style={{ gap: 10 }}>
          {expenses.map((e) => (
            <View key={e.id} style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>{e.category}</Text>
                    </View>
                    <Text style={styles.meta}>{e.date}</Text>
                  </View>
                  <Text style={styles.desc}>{e.description}</Text>
                  <Text style={styles.meta}>{e.payment}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.amount}>-{e.amount.toLocaleString()} FCFA</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Pressable style={styles.actionBtn}>
                  <Ionicons name="create-outline" size={14} color="#6B2737" />
                  <Text style={styles.actionText}>Modifier</Text>
                </Pressable>
                <Pressable style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={14} color="#dc2626" />
                  <Text style={[styles.actionText, { color: "#dc2626" }]}>Supprimer</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ajouter une dépense</Text>

            <Text style={styles.label}>Date</Text>
            <TextInput value={form.date} onChangeText={(v) => setForm((p) => ({ ...p, date: v }))} placeholder="YYYY-MM-DD" style={styles.input} />

            <Text style={styles.label}>Catégorie</Text>
            <TextInput value={form.category} onChangeText={(v) => setForm((p) => ({ ...p, category: v }))} placeholder="Produits, Salaires..." style={styles.input} />

            <Text style={styles.label}>Montant (FCFA)</Text>
            <TextInput value={form.amount} onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))} placeholder="15000" keyboardType="numeric" style={styles.input} />

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={form.description}
              onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
              placeholder="Achat 10 bouteilles..."
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              multiline
            />

            <Text style={styles.label}>Mode de paiement</Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {(["Espèces", "Mobile Money", "Virement"] as const).map((m) => {
                const active = form.payment === m;
                return (
                  <Pressable key={m} onPress={() => setForm((p) => ({ ...p, payment: m }))} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{m}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable onPress={() => setShowModal(false)} style={[styles.secondaryBtn, { flex: 1 }]}>
                <Text style={styles.secondaryText}>Annuler</Text>
              </Pressable>
              <Pressable onPress={save} style={[styles.primaryBtn, { flex: 1 }]}>
                <Text style={styles.primaryBtnText}>Enregistrer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },
  header: { backgroundColor: "#6B2737", paddingTop: 52, paddingBottom: 18, paddingHorizontal: 18 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", marginTop: 6, fontSize: 13 },

  content: { padding: 18, paddingBottom: 32, gap: 12 },

  totalCard: { borderRadius: 22, padding: 16, backgroundColor: "#dc2626", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 14 },
  totalLabel: { color: "rgba(255,255,255,0.9)" },
  totalValue: { color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 6 },
  totalHint: { color: "rgba(255,255,255,0.85)", marginTop: 6, fontSize: 12 },

  primaryBtn: { backgroundColor: "#6B2737", borderRadius: 999, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10 },
  pill: { backgroundColor: "rgba(212,175,106,0.2)", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  pillText: { color: "#6B2737", fontWeight: "800", fontSize: 12 },
  meta: { color: "rgba(58,58,58,0.6)", fontSize: 12 },
  desc: { color: "#3A3A3A", fontSize: 14, marginBottom: 4 },
  amount: { color: "#dc2626", fontWeight: "900" },

  cardActions: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(107,39,55,0.10)", flexDirection: "row", gap: 16 },
  actionBtn: { flexDirection: "row", gap: 6, alignItems: "center" },
  actionText: { color: "#6B2737", fontWeight: "700", fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 18 },
  modalCard: { backgroundColor: "#fff", borderRadius: 22, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#6B2737", marginBottom: 10 },

  label: { color: "#3A3A3A", fontWeight: "800", marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: "#FAF7F2", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },

  chip: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },
  chipActive: { backgroundColor: "rgba(107,39,55,0.10)", borderColor: "#6B2737" },
  chipText: { fontSize: 12, color: "#3A3A3A" },
  chipTextActive: { fontWeight: "900", color: "#6B2737" },

  secondaryBtn: { backgroundColor: "#FAF7F2", borderRadius: 999, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#3A3A3A", fontWeight: "800" },
});