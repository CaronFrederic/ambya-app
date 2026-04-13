import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { ProHeader } from "./components/ProHeader";
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  getPromotionStats,
  type PromotionItem,
  type PromotionStats,
  type PromotionType,
} from "../../src/api/promotions";

const COLORS = { bg: "#FAF7F2", text: "#3A3A3A", primary: "#6B2737", gold: "#D4AF6A" };

type Promo = PromotionItem;

export default function PromotionsScreen() {
  const [showModal, setShowModal] = useState(false);

  const [promotions, setPromotions] = useState<Promo[]>([]);
  const [stats, setStats] = useState<PromotionStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "percentage" as PromotionType,
    value: "",
    servicesText: "Tous les services",
    startDate: "",
    endDate: "",
  });

  const activeCount = promotions.filter((p) => p.status === "active").length;

  const resetForm = () => {
    setForm({
      title: "",
      type: "percentage",
      value: "",
      servicesText: "Tous les services",
      startDate: "",
      endDate: "",
    });
  };

  const loadData = async () => {
    const [promoData, statsData] = await Promise.all([
      getPromotions(),
      getPromotionStats(),
    ]);

    setPromotions(promoData);
    setStats(statsData);
  };

  const initialLoad = async () => {
    try {
      setLoading(true);
      await loadData();
    } catch (error) {
      console.error("Promotions load error:", error);
      Alert.alert(
        "Chargement impossible",
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
    } catch (error) {
      console.error("Promotions refresh error:", error);
      Alert.alert(
        "Rafraîchissement impossible",
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  const handleCreatePromotion = async () => {
    const value = Number(form.value);

    if (!form.title.trim()) {
      Alert.alert("Validation", "Le nom de la promotion est requis.");
      return;
    }

    if (!value || value <= 0) {
      Alert.alert("Validation", "La valeur doit être supérieure à 0.");
      return;
    }

    if (!form.startDate.trim() || !form.endDate.trim()) {
      Alert.alert("Validation", "Les dates de début et de fin sont requises.");
      return;
    }

    try {
      setSubmitting(true);

      await createPromotion({
        title: form.title.trim(),
        type: form.type,
        value,
        startDate: form.startDate.trim(),
        endDate: form.endDate.trim(),
        appliesToAllServices: true,
      });

      await loadData();
      setShowModal(false);
      resetForm();

      Alert.alert("Succès", "Promotion créée avec succès.");
    } catch (error) {
      console.error("Create promotion error:", error);
      Alert.alert(
        "Création impossible",
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    try {
      await deletePromotion(id);
      await loadData();
      Alert.alert("Succès", "Promotion supprimée.");
    } catch (error) {
      console.error("Delete promotion error:", error);
      Alert.alert(
        "Suppression impossible",
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ProHeader
        title="Promotions & Offres"
        subtitle="Attirez plus de clients"
        backTo="/(professional)/dashboard"
      />

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Chargement des promotions...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 18 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.statsRow}>
            <Stat
              number={String(stats?.appointmentsViaPromos ?? 0)}
              label="RDV via promos"
              color={COLORS.primary}
            />
            <Stat
              number={`${Math.round((stats?.revenueGenerated ?? 0) / 1000)}K`}
              label="CA généré"
              color={COLORS.gold}
            />
            <Stat
              number={`${stats?.conversionRate ?? 0}%`}
              label="Conversion"
              color="#16A34A"
            />
          </View>

          <Pressable onPress={() => setShowModal(true)} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>＋ Créer une promotion</Text>
          </Pressable>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Promotions</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{activeCount} actives</Text>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            {promotions.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.card,
                  {
                    borderLeftColor:
                      p.status === "active"
                        ? "#22C55E"
                        : "rgba(0,0,0,0.2)",
                  },
                ]}
              >
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.cardTitle}>{p.name}</Text>
                      <View
                        style={[
                          styles.badge,
                          p.status === "active" ? styles.badgeActive : styles.badgeExpired,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            p.status === "active"
                              ? styles.badgeActiveText
                              : styles.badgeExpiredText,
                          ]}
                        >
                          {p.status === "active" ? "Active" : "Expirée"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardSub}>{p.services}</Text>
                    <Text style={styles.cardMini}>
                      Du {new Date(p.start).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(p.end).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.promoValue}>
                      {p.type === "percentage"
                        ? `${p.value}%`
                        : `${p.value.toLocaleString("fr-FR")}`}
                    </Text>
                    <Text style={styles.cardMini}>
                      {p.type === "percentage" ? "Réduction" : "FCFA"}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() =>
                      Alert.alert(
                        "Bientôt disponible",
                        "La modification de promotion sera branchée ensuite."
                      )
                    }
                  >
                    <Text style={styles.actionBtnText}>✎ Modifier</Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionBtnDanger}
                    onPress={() => handleDeletePromotion(p.id)}
                  >
                    <Text style={styles.actionBtnDangerText}>🗑 Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {promotions.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aucune promotion trouvée</Text>
                <Text style={styles.emptySub}>
                  Crée ta première promotion pour attirer plus de clients.
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Créer une promotion</Text>

            <Field label="Nom de la promotion">
              <TextInput
                style={styles.input}
                placeholder="Spécial Weekend"
                placeholderTextColor="rgba(58,58,58,0.35)"
                value={form.title}
                onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              />
            </Field>

            <Field label="Type (percentage/fixed)">
              <TextInput
                style={styles.input}
                placeholder="percentage"
                placeholderTextColor="rgba(58,58,58,0.35)"
                value={form.type}
                onChangeText={(v) =>
                  setForm((p) => ({
                    ...p,
                    type: v === "fixed" ? "fixed" : "percentage",
                  }))
                }
              />
            </Field>

            <Field label="Valeur">
              <TextInput
                style={styles.input}
                placeholder="20"
                keyboardType="number-pad"
                placeholderTextColor="rgba(58,58,58,0.35)"
                value={form.value}
                onChangeText={(v) => setForm((p) => ({ ...p, value: v }))}
              />
            </Field>

            <Field label="Services concernés">
              <TextInput
                style={styles.input}
                placeholder="Tous les services"
                placeholderTextColor="rgba(58,58,58,0.35)"
                value={form.servicesText}
                onChangeText={(v) => setForm((p) => ({ ...p, servicesText: v }))}
              />
            </Field>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Date début</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(58,58,58,0.35)"
                  value={form.startDate}
                  onChangeText={(v) => setForm((p) => ({ ...p, startDate: v }))}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Date fin</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(58,58,58,0.35)"
                  value={form.endDate}
                  onChangeText={(v) => setForm((p) => ({ ...p, endDate: v }))}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>Annuler</Text>
              </Pressable>

              <Pressable
                onPress={handleCreatePromotion}
                style={[styles.primaryBtn, { flex: 1, marginBottom: 0 }]}
                disabled={submitting}
              >
                <Text style={styles.primaryBtnText}>
                  {submitting ? "Création..." : "Créer"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ number, label, color }: { number: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statNumber, { color }]}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8, marginTop: 10 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
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

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: "#FFF", borderRadius: 18, padding: 12, alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 11, color: "rgba(58,58,58,0.6)", marginTop: 6, fontWeight: "700", textAlign: "center" },

  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 999, alignItems: "center", marginBottom: 16 },
  primaryBtnText: { color: "#FFF", fontWeight: "900" },

  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { color: COLORS.text, fontWeight: "900", fontSize: 14 },
  countPill: { backgroundColor: "rgba(212,175,106,0.2)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  countPillText: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },

  card: { backgroundColor: "#FFF", borderRadius: 18, padding: 14, borderLeftWidth: 4 },
  cardTitle: { color: COLORS.text, fontWeight: "900", fontSize: 14 },
  cardSub: { color: "rgba(58,58,58,0.6)", marginTop: 6, fontWeight: "700" },
  cardMini: { color: "rgba(58,58,58,0.5)", marginTop: 6, fontSize: 11, fontWeight: "700" },
  promoValue: { color: COLORS.primary, fontWeight: "900", fontSize: 22 },

  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontWeight: "900", fontSize: 11 },
  badgeActive: { backgroundColor: "rgba(34,197,94,0.16)" },
  badgeActiveText: { color: "#15803d" },
  badgeExpired: { backgroundColor: "rgba(0,0,0,0.06)" },
  badgeExpiredText: { color: "rgba(0,0,0,0.5)" },

  actionsRow: { flexDirection: "row", gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(107,39,55,0.1)" },
  actionBtn: { paddingVertical: 8 },
  actionBtnText: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },
  actionBtnDanger: { paddingVertical: 8 },
  actionBtnDangerText: { color: "#DC2626", fontWeight: "900", fontSize: 12 },

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

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", padding: 18, justifyContent: "center" },
  modalCard: { backgroundColor: "#FFF", borderRadius: 22, padding: 16 },
  modalTitle: { color: COLORS.primary, fontWeight: "900", fontSize: 18, marginBottom: 8 },

  label: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },
  secondaryBtn: { flex: 1, backgroundColor: "rgba(107,39,55,0.06)", paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  secondaryBtnText: { color: COLORS.text, fontWeight: "900" },
});