import React, { useEffect, useMemo, useState } from "react";
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
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { Href } from "expo-router";

import { ProHeader } from "./components/ProHeader";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  type ApiExpense,
} from "../../src/api/expenses";
import * as SecureStore from "expo-secure-store";

type Expense = {
  id: string;
  date: string;
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

async function getAccessToken(): Promise<string> {
  const token = await SecureStore.getItemAsync("accessToken");
  if (!token) {
    throw new Error("Utilisateur non authentifié.");
  }
  return token;
}

function formatDateToYmd(value: string) {
  return value.slice(0, 10);
}

function mapApiExpenseToUi(expense: ApiExpense): Expense {
  return {
    id: expense.id,
    date: formatDateToYmd(expense.expenseDate),
    category: expense.category,
    description: expense.description ?? "",
    amount: expense.amount,
    payment: "Espèces",
    receiptUri: expense.receiptUrl ?? null,
  };
}

export default function ExpenseManagementScreen() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>([]);

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

  const toast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

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

  const loadExpenses = async () => {
    const token = await getAccessToken();
    const data = await getExpenses(token);
    setExpenses(data.map(mapApiExpenseToUi));
  };

  const initialLoad = async () => {
    try {
      setLoading(true);
      await loadExpenses();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadExpenses();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erreur de rafraîchissement.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  const removeExpense = async (id: string) => {
    try {
      const token = await getAccessToken();
      await deleteExpense(token, id);
      await loadExpenses();
      toast("Dépense supprimée");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erreur lors de la suppression.");
    }
  };

  const pickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast("Permission galerie refusée.");
      return;
    }

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

  const save = async () => {
    const amt = Number(form.amount || 0);

    if (!amt || !form.description.trim()) {
      toast("Le montant et la description sont requis.");
      return;
    }

    try {
      setSubmitting(true);
      const token = await getAccessToken();

      await createExpense(token, {
        category: form.category.trim() || "Autre",
        description: form.description.trim(),
        amount: amt,
        expenseDate: new Date(`${form.date}T00:00:00.000Z`).toISOString(),
      });

      await loadExpenses();
      setShowModal(false);
      toast("Dépense ajoutée ✅");

      if (form.payment !== "Espèces" || form.receiptUri) {
        toast("Le mode de paiement et le reçu ne sont pas encore sauvegardés côté backend.");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProHeader
        title="Gestion des Dépenses"
        subtitle="Suivez toutes vos dépenses"
        backTo={DASHBOARD_HREF}
      />

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Text style={styles.loaderText}>Chargement des dépenses...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total dépenses</Text>
            <Text style={styles.totalValue}>
              {totalExpenses.toLocaleString()} FCFA
            </Text>
            <Text style={styles.totalHint}>Ce mois-ci</Text>
          </View>

          <Pressable onPress={openModal} style={styles.primaryBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Ajouter une dépense</Text>
          </Pressable>

          <View style={{ gap: 10 }}>
            {expenses.map((e) => (
              <View key={e.id} style={styles.card}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>{e.category}</Text>
                      </View>
                      <Text style={styles.meta}>{e.date}</Text>
                    </View>

                    <Text style={styles.desc}>{e.description}</Text>
                    <Text style={styles.meta}>{e.payment}</Text>

                    {!!e.receiptUri && (
                      <View style={styles.receiptInline}>
                        <Ionicons
                          name="image-outline"
                          size={14}
                          color={COLORS.brand}
                        />
                        <Text style={styles.receiptInlineText}>Reçu attaché</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.amount}>
                      -{e.amount.toLocaleString()} FCFA
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => removeExpense(e.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={14}
                      color={COLORS.danger}
                    />
                    <Text style={[styles.actionText, { color: COLORS.danger }]}>
                      Supprimer
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      )}

      <Modal visible={toastVisible} transparent animationType="fade">
        <View style={styles.toastWrap}>
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
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
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {m}
                      </Text>
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
                    <Pressable
                      onPress={pickReceipt}
                      style={[styles.secondaryBtn, { flex: 1 }]}
                    >
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
                <Pressable
                  onPress={() => setShowModal(false)}
                  style={[styles.secondaryBtn, { flex: 1 }]}
                >
                  <Text style={styles.secondaryText}>Annuler</Text>
                </Pressable>
                <Pressable
                  onPress={save}
                  style={[
                    styles.primaryBtn,
                    { flex: 1, paddingVertical: 12 },
                    submitting && { opacity: 0.6 },
                    (!form.description.trim() || !Number(form.amount || 0)) && {
                      opacity: 0.55,
                    },
                  ]}
                  disabled={
                    submitting ||
                    !form.description.trim() ||
                    !Number(form.amount || 0)
                  }
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Enregistrer</Text>
                  )}
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

  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    color: COLORS.brand,
    fontWeight: "700",
  },

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
  pill: {
    backgroundColor: "rgba(212,175,106,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillText: { color: COLORS.brand, fontWeight: "800", fontSize: 12 },
  meta: { color: "rgba(58,58,58,0.6)", fontSize: 12 },
  desc: { color: COLORS.text, fontSize: 14, marginBottom: 4 },
  amount: { color: COLORS.danger, fontWeight: "900" },

  receiptInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  receiptInlineText: {
    color: COLORS.brand,
    fontWeight: "700",
    fontSize: 12,
  },

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

  toastWrap: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 90,
  },
  toast: {
    backgroundColor: COLORS.brand,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  toastText: { color: "#fff", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
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
  chipActive: {
    backgroundColor: "rgba(107,39,55,0.10)",
    borderColor: COLORS.brand,
  },
  chipText: { fontSize: 12, color: COLORS.text },
  chipTextActive: { fontWeight: "900", color: COLORS.brand },

  sectionSep: {
    height: 1,
    backgroundColor: "rgba(107,39,55,0.12)",
    marginTop: 14,
    marginBottom: 8,
  },

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
  receiptImg: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: "#eee",
  },

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