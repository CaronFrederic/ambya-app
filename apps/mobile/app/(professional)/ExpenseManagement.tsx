import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { Href } from "expo-router";

import { ProHeader } from "./components/ProHeader";

type Expense = {
  id: number;
  date: string; // yyyy-mm-dd
  category: string;
  description: string;
  amount: number;
  payment: "Mobile Money" | "Virement" | "Espèces";
  receiptUri?: string | null;
};

const COLORS = {
  bg: "#FAF7F2",
  brand: "#6B2737",
  text: "#3A3A3A",
  gold: "#D4AF6A",
  danger: "#dc2626",
  white: "#fff",
};

const DASHBOARD_HREF: Href = "/(professional)/dashboard";

export default function ExpenseManagementScreen() {
  const [showModal, setShowModal] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 1,
      date: "2026-01-05",
      category: "Produits",
      description: "Achat shampooing professionnel",
      amount: 15000,
      payment: "Mobile Money",
      receiptUri: null,
    },
    {
      id: 2,
      date: "2026-01-03",
      category: "Salaires",
      description: "Salaire Marie - Janvier",
      amount: 120000,
      payment: "Virement",
      receiptUri: null,
    },
    {
      id: 3,
      date: "2026-01-02",
      category: "Électricité",
      description: "Facture SEEG Décembre",
      amount: 25000,
      payment: "Espèces",
      receiptUri: null,
    },
    {
      id: 4,
      date: "2025-12-28",
      category: "Marketing",
      description: "Publicité Facebook",
      amount: 8000,
      payment: "Mobile Money",
      receiptUri: null,
    },
  ]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const [form, setForm] = useState<{
    date: string;
    category: string;
    amount: string;
    description: string;
    payment: Expense["payment"];
    receiptUri: string | null;
  }>({
    date: "2026-01-07",
    category: "Produits",
    amount: "",
    description: "",
    payment: "Espèces",
    receiptUri: null,
  });

  const resetForm = () => {
    setForm({
      date: "2026-01-07",
      category: "Produits",
      amount: "",
      description: "",
      payment: "Espèces",
      receiptUri: null,
    });
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const removeExpense = (id: number) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const pickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setForm((p) => ({ ...p, receiptUri: result.assets[0]?.uri ?? null }));
    }
  };

  const save = () => {
    const amt = Number(form.amount || 0);
    if (!amt || !form.description.trim()) return;

    const newExpense: Expense = {
      id: Math.max(0, ...expenses.map((e) => e.id)) + 1,
      date: form.date,
      category: form.category.trim() || "Autre",
      description: form.description.trim(),
      amount: amt,
      payment: form.payment,
      receiptUri: form.receiptUri,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <ProHeader
        title="Gestion des Dépenses"
        subtitle="Suivez toutes vos dépenses"
        backTo={DASHBOARD_HREF}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total dépenses</Text>
          <Text style={styles.totalValue}>{totalExpenses.toLocaleString()} FCFA</Text>
          <Text style={styles.totalHint}>Ce mois-ci</Text>
        </View>

        {/* Add */}
        <Pressable onPress={openModal} style={styles.primaryBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Ajouter une dépense</Text>
        </Pressable>

        {/* List */}
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

                  {!!e.receiptUri && (
                    <View style={styles.receiptInline}>
                      <Ionicons name="image-outline" size={14} color={COLORS.brand} />
                      <Text style={styles.receiptInlineText}>Reçu attaché</Text>
                    </View>
                  )}
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.amount}>-{e.amount.toLocaleString()} FCFA</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Pressable style={styles.actionBtn} onPress={() => removeExpense(e.id)}>
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                  <Text style={[styles.actionText, { color: COLORS.danger }]}>Supprimer</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* Modal Add Expense */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter une dépense</Text>
              <Pressable onPress={() => setShowModal(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                value={form.date}
                onChangeText={(v) => setForm((p) => ({ ...p, date: v }))}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                style={styles.input}
              />

              <Text style={styles.label}>Catégorie</Text>
              <TextInput
                value={form.category}
                onChangeText={(v) => setForm((p) => ({ ...p, category: v }))}
                placeholder="Produits, Salaires..."
                style={styles.input}
              />

              <Text style={styles.label}>Montant (FCFA) *</Text>
              <TextInput
                value={form.amount}
                onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))}
                placeholder="15000"
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                value={form.description}
                onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                placeholder="Achat 10 bouteilles..."
                style={[styles.input, { height: 96, textAlignVertical: "top" }]}
                multiline
              />

              <Text style={styles.label}>Mode de paiement</Text>
              <View style={styles.rowWrap}>
                {(["Espèces", "Mobile Money", "Virement"] as const).map((m) => {
                  const active = form.payment === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setForm((p) => ({ ...p, payment: m }))}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{m}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.sectionSep} />

              <Text style={styles.label}>Reçu / Preuve (optionnel)</Text>
              {!!form.receiptUri ? (
                <View style={styles.receiptBox}>
                  <Image source={{ uri: form.receiptUri }} style={styles.receiptImg} />
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                    <Pressable onPress={pickReceipt} style={[styles.secondaryBtn, { flex: 1 }]}>
                      <Ionicons name="image-outline" size={16} color={COLORS.text} />
                      <Text style={styles.secondaryText}>Changer</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setForm((p) => ({ ...p, receiptUri: null }))}
                      style={[styles.dangerBtn, { flex: 1 }]}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                      <Text style={styles.dangerText}>Retirer</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={pickReceipt} style={styles.uploadBtn}>
                  <Ionicons name="camera-outline" size={18} color="#fff" />
                  <Text style={styles.uploadText}>Ajouter une photo du reçu</Text>
                </Pressable>
              )}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <Pressable onPress={() => setShowModal(false)} style={[styles.secondaryBtn, { flex: 1 }]}>
                  <Text style={styles.secondaryText}>Annuler</Text>
                </Pressable>
                <Pressable
                  onPress={save}
                  style={[
                    styles.primaryBtn,
                    { flex: 1, paddingVertical: 12 },
                    (!form.description.trim() || !Number(form.amount || 0)) && { opacity: 0.55 },
                  ]}
                  disabled={!form.description.trim() || !Number(form.amount || 0)}
                >
                  <Text style={styles.primaryBtnText}>Enregistrer</Text>
                </Pressable>
              </View>

              <View style={{ height: 10 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  content: { padding: 18, paddingBottom: 28, gap: 12 },

  totalCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: COLORS.danger,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  totalLabel: { color: "rgba(255,255,255,0.9)" },
  totalValue: { color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 6 },
  totalHint: { color: "rgba(255,255,255,0.85)", marginTop: 6, fontSize: 12 },

  primaryBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  pill: { backgroundColor: "rgba(212,175,106,0.2)", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  pillText: { color: COLORS.brand, fontWeight: "800", fontSize: 12 },
  meta: { color: "rgba(58,58,58,0.6)", fontSize: 12 },
  desc: { color: COLORS.text, fontSize: 14, marginBottom: 4 },
  amount: { color: COLORS.danger, fontWeight: "900" },

  receiptInline: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  receiptInlineText: { color: COLORS.brand, fontWeight: "700", fontSize: 12 },

  cardActions: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(107,39,55,0.10)",
    flexDirection: "row",
    gap: 16,
  },
  actionBtn: { flexDirection: "row", gap: 6, alignItems: "center" },
  actionText: { color: COLORS.brand, fontWeight: "700", fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 18 },
  modalCard: { backgroundColor: "#fff", borderRadius: 22, padding: 16, maxHeight: "92%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: COLORS.brand },

  label: { color: COLORS.text, fontWeight: "800", marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
  },

  rowWrap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
  },
  chipActive: { backgroundColor: "rgba(107,39,55,0.10)", borderColor: COLORS.brand },
  chipText: { fontSize: 12, color: COLORS.text },
  chipTextActive: { fontWeight: "900", color: COLORS.brand },

  sectionSep: { height: 1, backgroundColor: "rgba(107,39,55,0.12)", marginTop: 14, marginBottom: 8 },

  uploadBtn: {
    marginTop: 2,
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadText: { color: "#fff", fontWeight: "800" },

  receiptBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.15)",
  },
  receiptImg: { width: "100%", height: 180, borderRadius: 14, backgroundColor: "#eee" },

  secondaryBtn: {
    backgroundColor: COLORS.bg,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryText: { color: COLORS.text, fontWeight: "800" },

  dangerBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  dangerText: { color: "#fff", fontWeight: "900" },
});