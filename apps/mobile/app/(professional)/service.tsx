import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Image,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { Href } from "expo-router";

import { ProHeader } from "./components/ProHeader";

type ServiceCategory =
  | "Coiffure"
  | "Barbier"
  | "Massage"
  | "Manucure"
  | "Pédicure"
  | "Maquillage"
  | "Autre";

type Service = {
  id: number;
  name: string;
  category: ServiceCategory;
  price: number;
  duration: number; // minutes
  description: string;
  isActive: boolean;
  imageUri?: string | null;
};

const DASHBOARD_HREF: Href = "/(professional)/dashboard";

const COLORS = {
  bg: "#FAF7F2",
  white: "#FFFFFF",
  brand: "#6B2737",
  gold: "#D4AF6A",
  text: "#3A3A3A",
  muted: "rgba(58,58,58,0.6)",
  border: "rgba(107,39,55,0.18)",
  danger: "#dc2626",
  success: "#16a34a",
};

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([
    {
      id: 1,
      name: "Tresses simples",
      category: "Coiffure",
      price: 15000,
      duration: 90,
      description: "Tresses classiques avec finition soignée.",
      isActive: true,
      imageUri: null,
    },
    {
      id: 2,
      name: "Coupe homme",
      category: "Barbier",
      price: 8000,
      duration: 30,
      description: "Coupe nette + contours.",
      isActive: true,
      imageUri: null,
    },
    {
      id: 3,
      name: "Massage relaxant",
      category: "Massage",
      price: 18000,
      duration: 60,
      description: "Massage détente corps complet.",
      isActive: false,
      imageUri: null,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [form, setForm] = useState<{
    name: string;
    category: ServiceCategory;
    price: string;
    duration: string;
    description: string;
    isActive: boolean;
    imageUri: string | null;
  }>({
    name: "",
    category: "Coiffure",
    price: "",
    duration: "",
    description: "",
    isActive: true,
    imageUri: null,
  });

  const totalServices = useMemo(() => services.length, [services.length]);
  const activeServices = useMemo(
    () => services.filter((s) => s.isActive).length,
    [services]
  );

  const toast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "Coiffure",
      price: "",
      duration: "",
      description: "",
      isActive: true,
      imageUri: null,
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      category: service.category,
      price: String(service.price),
      duration: String(service.duration),
      description: service.description,
      isActive: service.isActive,
      imageUri: service.imageUri ?? null,
    });
    setShowModal(true);
  };

  const saveService = () => {
    const price = Number(form.price || 0);
    const duration = Number(form.duration || 0);

    if (!form.name.trim()) {
      toast("Le nom du service est requis.");
      return;
    }

    if (!price || price <= 0) {
      toast("Le prix doit être supérieur à 0.");
      return;
    }

    if (!duration || duration <= 0) {
      toast("La durée doit être supérieure à 0.");
      return;
    }

    if (editingId) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                name: form.name.trim(),
                category: form.category,
                price,
                duration,
                description: form.description.trim(),
                isActive: form.isActive,
                imageUri: form.imageUri,
              }
            : s
        )
      );
      toast("Service modifié ✅");
    } else {
      const newService: Service = {
        id: Math.max(0, ...services.map((s) => s.id)) + 1,
        name: form.name.trim(),
        category: form.category,
        price,
        duration,
        description: form.description.trim(),
        isActive: form.isActive,
        imageUri: form.imageUri,
      };
      setServices((prev) => [newService, ...prev]);
      toast("Service ajouté ✅");
    }

    setShowModal(false);
    resetForm();
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setServices((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteId(null);
    toast("Service supprimé 🗑️");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast("Permission galerie refusée.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setForm((p) => ({ ...p, imageUri: result.assets[0]?.uri ?? null }));
    }
  };

  const toggleServiceStatus = (id: number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  return (
    <View style={styles.container}>
      <ProHeader
        title="Services"
        subtitle="Gérez votre catalogue de prestations"
        backTo={DASHBOARD_HREF}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalServices}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {activeServices}
            </Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
        </View>

        {/* Add */}
        <Pressable onPress={openCreate} style={styles.primaryBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Ajouter un service</Text>
        </Pressable>

        {/* List */}
        <View style={{ gap: 12 }}>
          {services.map((service) => (
            <View key={service.id} style={styles.card}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={styles.imageBox}>
                  {service.imageUri ? (
                    <Image
                      source={{ uri: service.imageUri }}
                      style={styles.image}
                    />
                  ) : (
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color="rgba(107,39,55,0.6)"
                    />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.topRow}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>
                        {service.category}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: service.isActive
                            ? "#dcfce7"
                            : "#f3f4f6",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: service.isActive
                              ? COLORS.success
                              : "rgba(58,58,58,0.65)",
                          },
                        ]}
                      >
                        {service.isActive ? "Actif" : "Inactif"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDesc}>{service.description}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {service.price.toLocaleString()} FCFA
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>{service.duration} min</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => toggleServiceStatus(service.id)}
                >
                  <Ionicons
                    name={service.isActive ? "pause-circle-outline" : "play-circle-outline"}
                    size={16}
                    color={service.isActive ? "#f59e0b" : COLORS.success}
                  />
                  <Text style={styles.actionText}>
                    {service.isActive ? "Désactiver" : "Activer"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.actionBtn}
                  onPress={() => openEdit(service)}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={COLORS.brand}
                  />
                  <Text style={styles.actionText}>Modifier</Text>
                </Pressable>

                <Pressable
                  style={styles.actionBtn}
                  onPress={() => setDeleteId(service.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
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

      {/* Toast */}
      <Modal visible={toastVisible} transparent animationType="fade">
        <View style={styles.toastWrap}>
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Modifier un service" : "Ajouter un service"}
              </Text>
              <Pressable onPress={() => setShowModal(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nom du service *</Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="Ex: Tresses collées"
                style={styles.input}
              />

              <Text style={styles.label}>Catégorie</Text>
              <View style={styles.rowWrap}>
                {(
                  [
                    "Coiffure",
                    "Barbier",
                    "Massage",
                    "Manucure",
                    "Pédicure",
                    "Maquillage",
                    "Autre",
                  ] as const
                ).map((cat) => {
                  const active = form.category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setForm((p) => ({ ...p, category: cat }))}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Prix (FCFA) *</Text>
              <TextInput
                value={form.price}
                onChangeText={(v) => setForm((p) => ({ ...p, price: v }))}
                placeholder="15000"
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.label}>Durée (minutes) *</Text>
              <TextInput
                value={form.duration}
                onChangeText={(v) => setForm((p) => ({ ...p, duration: v }))}
                placeholder="60"
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                value={form.description}
                onChangeText={(v) =>
                  setForm((p) => ({ ...p, description: v }))
                }
                placeholder="Décris brièvement la prestation..."
                multiline
                style={[styles.input, { height: 96, textAlignVertical: "top" }]}
              />

              <View style={styles.sectionSep} />

              <Text style={styles.label}>Photo du service (optionnel)</Text>
              {!!form.imageUri ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: form.imageUri }} style={styles.imagePreview} />
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                    <Pressable
                      onPress={pickImage}
                      style={[styles.secondaryBtn, { flex: 1 }]}
                    >
                      <Ionicons name="image-outline" size={16} color={COLORS.text} />
                      <Text style={styles.secondaryText}>Changer</Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        setForm((p) => ({ ...p, imageUri: null }))
                      }
                      style={[styles.dangerBtn, { flex: 1 }]}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                      <Text style={styles.dangerText}>Retirer</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={pickImage} style={styles.uploadBtn}>
                  <Ionicons name="camera-outline" size={18} color="#fff" />
                  <Text style={styles.uploadText}>Ajouter une photo</Text>
                </Pressable>
              )}

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Service actif</Text>
                  <Text style={styles.switchHint}>
                    Visible et réservable par les clients
                  </Text>
                </View>

                <Switch
                  value={form.isActive}
                  onValueChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                  trackColor={{ false: "#d1d5db", true: "#D4AF6A" }}
                  thumbColor="#fff"
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <Pressable
                  onPress={() => setShowModal(false)}
                  style={[styles.secondaryBtn, { flex: 1 }]}
                >
                  <Text style={styles.secondaryText}>Annuler</Text>
                </Pressable>

                <Pressable
                  onPress={saveService}
                  style={[
                    styles.primaryBtn,
                    { flex: 1, paddingVertical: 12 },
                    (!form.name.trim() ||
                      !Number(form.price || 0) ||
                      !Number(form.duration || 0)) && { opacity: 0.55 },
                  ]}
                  disabled={
                    !form.name.trim() ||
                    !Number(form.price || 0) ||
                    !Number(form.duration || 0)
                  }
                >
                  <Text style={styles.primaryBtnText}>
                    {editingId ? "Mettre à jour" : "Enregistrer"}
                  </Text>
                </Pressable>
              </View>

              <View style={{ height: 10 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete confirm */}
      <Modal
        visible={deleteId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={[styles.confirmIcon, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="warning-outline" size={20} color={COLORS.danger} />
            </View>
            <Text style={styles.confirmTitle}>Supprimer ce service ?</Text>
            <Text style={styles.confirmText}>Cette action est irréversible.</Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setDeleteId(null)}
                style={[styles.secondaryBtn, { flex: 1 }]}
              >
                <Text style={styles.secondaryText}>Annuler</Text>
              </Pressable>

              <Pressable
                onPress={confirmDelete}
                style={[styles.dangerBtn, { flex: 1 }]}
              >
                <Text style={styles.dangerText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  content: { padding: 18, paddingBottom: 28, gap: 12 },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statValue: { fontSize: 22, fontWeight: "900", color: COLORS.brand },
  statLabel: { marginTop: 6, color: COLORS.muted, fontSize: 12 },

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

  imageBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },

  categoryPill: {
    backgroundColor: "rgba(212,175,106,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  categoryPillText: {
    color: COLORS.brand,
    fontWeight: "800",
    fontSize: 12,
  },

  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: "800",
    fontSize: 12,
  },

  serviceName: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  serviceDesc: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 13,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  metaText: {
    color: COLORS.brand,
    fontWeight: "800",
    fontSize: 13,
  },
  metaDot: {
    color: COLORS.muted,
  },

  cardActions: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(107,39,55,0.10)",
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  actionText: {
    color: COLORS.brand,
    fontWeight: "700",
    fontSize: 12,
  },

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
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.brand,
  },

  label: {
    color: COLORS.text,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 6,
  },

  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  rowWrap: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: "rgba(107,39,55,0.10)",
    borderColor: COLORS.brand,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.text,
  },
  chipTextActive: {
    fontWeight: "900",
    color: COLORS.brand,
  },

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

  imagePreviewWrap: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.15)",
  },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: "#eee",
  },

  switchRow: {
    marginTop: 14,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  switchHint: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
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
  secondaryText: {
    color: COLORS.text,
    fontWeight: "800",
  },

  dangerBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  dangerText: {
    color: "#fff",
    fontWeight: "900",
  },

  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
  },
  confirmIcon: {
    width: 54,
    height: 54,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 6,
    textAlign: "center",
  },
  confirmText: {
    fontSize: 13,
    color: "rgba(58,58,58,0.7)",
    textAlign: "center",
    marginBottom: 14,
  },
});