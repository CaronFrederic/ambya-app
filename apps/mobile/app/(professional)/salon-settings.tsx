import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Switch, Modal, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ProHeader } from "./components/ProHeader";

const COLORS = {
  bg: "#FAF7F2",
  text: "#3A3A3A",
  primary: "#6B2737",
  gold: "#D4AF6A",
};

type TabId = "infos" | "photos" | "horaires" | "paiements" | "acompte";

export default function SalonSettingsScreen() {
  const tabs = useMemo(
    () => [
      { id: "infos", label: "Infos" },
      { id: "photos", label: "Photos" },
      { id: "horaires", label: "Horaires" },
      { id: "paiements", label: "Paiements" },
      { id: "acompte", label: "Acompte" },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState<TabId>("infos");

  // infos
  const [name, setName] = useState("Ébène Coiffure & Beauté");
  const [desc, setDesc] = useState(
    "Salon de coiffure afro et beauté situé au cœur de Libreville. Spécialisé dans les tresses, les soins capillaires naturels et les services de manucure."
  );
  const [address, setAddress] = useState("Boulevard Triomphal, Libreville, Gabon");
  const [phone, setPhone] = useState("+241 77 00 00 00");
  const [email, setEmail] = useState("contact@ebenecoiffure.com");
  const [categories, setCategories] = useState<Record<string, boolean>>({
    Coiffure: true,
    Spa: false,
    Ongles: true,
    Barbier: false,
    Manucure: false,
    Pédicure: false,
    Massage: true,
    Maquillage: false,
  });

  // photos
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // horaires
  const [scheduleType, setScheduleType] = useState<"standard" | "custom">("standard");
  const [standardSlots, setStandardSlots] = useState([{ start: "09:00", end: "18:00", enabled: true }]);
  const [customSlots, setCustomSlots] = useState<Record<string, { start: string; end: string; enabled: boolean }[]>>({
    Lundi: [{ start: "09:00", end: "18:00", enabled: true }],
    Mardi: [{ start: "09:00", end: "18:00", enabled: true }],
    Mercredi: [{ start: "09:00", end: "18:00", enabled: true }],
    Jeudi: [{ start: "09:00", end: "18:00", enabled: true }],
    Vendredi: [{ start: "09:00", end: "18:00", enabled: true }],
    Samedi: [{ start: "09:00", end: "18:00", enabled: true }],
    Dimanche: [{ start: "09:00", end: "18:00", enabled: false }],
  });

  // paiements
  const [payMobileMoney, setPayMobileMoney] = useState(true);
  const [payCard, setPayCard] = useState(true);
  const [payCash, setPayCash] = useState(true);

  const [orangeMoney, setOrangeMoney] = useState("");
  const [moovMoney, setMoovMoney] = useState("");
  const [airtelMoney, setAirtelMoney] = useState("");

  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [bankOwner, setBankOwner] = useState("");

  // acompte
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState(30);
  const [cancelPolicyHours, setCancelPolicyHours] = useState<12 | 24 | 48>(12);

  async function pickSingleImage(setter: (uri: string) => void) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  }

  async function pickMultipleImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: 10 - galleryImages.length,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setGalleryImages((prev) => [...prev, ...uris].slice(0, 10));
    }
  }

  function SlotEditor({
    slots,
    onChange,
  }: {
    slots: { start: string; end: string; enabled: boolean }[];
    onChange: (next: { start: string; end: string; enabled: boolean }[]) => void;
  }) {
    return (
      <View style={{ gap: 10 }}>
        {slots.map((s, idx) => (
          <View key={idx} style={styles.slotRow}>
            <Switch value={s.enabled} onValueChange={(v) => onChange(slots.map((x, i) => (i === idx ? { ...x, enabled: v } : x)))} />
            <TextInput
              value={s.start}
              onChangeText={(t) => onChange(slots.map((x, i) => (i === idx ? { ...x, start: t } : x)))}
              placeholder="09:00"
              style={[styles.input, { flex: 1 }]}
            />
            <Text style={{ color: "rgba(58,58,58,0.5)", fontWeight: "700" }}>–</Text>
            <TextInput
              value={s.end}
              onChangeText={(t) => onChange(slots.map((x, i) => (i === idx ? { ...x, end: t } : x)))}
              placeholder="18:00"
              style={[styles.input, { flex: 1 }]}
            />
            {slots.length > 1 && (
              <Pressable onPress={() => onChange(slots.filter((_, i) => i !== idx))} style={styles.smallDangerBtn}>
                <Text style={styles.smallDangerBtnText}>✕</Text>
              </Pressable>
            )}
          </View>
        ))}

        <Pressable onPress={() => onChange([...slots, { start: "09:00", end: "18:00", enabled: true }])} style={styles.inlineBtn}>
          <Text style={styles.inlineBtnText}>＋ Ajouter une plage</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ProHeader title="Paramètres du Salon" subtitle="Configurez votre profil" backTo="/(professional)/dashboard" />

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map((t) => {
          const active = activeTab === (t.id as TabId);
          return (
            <Pressable key={t.id} onPress={() => setActiveTab(t.id as TabId)} style={[styles.tabBtn, active && styles.tabBtnActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* INFOS */}
        {activeTab === "infos" && (
          <View style={{ gap: 14 }}>
            <Field label="Nom du salon">
              <TextInput value={name} onChangeText={setName} style={styles.input} />
            </Field>

            <Field label="Description">
              <TextInput value={desc} onChangeText={setDesc} style={[styles.input, { height: 120, textAlignVertical: "top" }]} multiline />
              <Text style={styles.help}>Max 500 caractères</Text>
            </Field>

            <Field label="Adresse complète">
              <TextInput value={address} onChangeText={setAddress} style={styles.input} />
            </Field>

            <Field label="Téléphone">
              <TextInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
            </Field>

            <Field label="Email professionnel">
              <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
            </Field>

            <Text style={styles.sectionTitle}>Catégories proposées</Text>
            <View style={styles.grid2}>
              {Object.keys(categories).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setCategories((p) => ({ ...p, [k]: !p[k] }))}
                  style={[styles.checkRow, categories[k] ? styles.checkRowOn : styles.checkRowOff]}
                >
                  <Text style={[styles.checkBox, categories[k] && styles.checkBoxOn]}>{categories[k] ? "✓" : ""}</Text>
                  <Text style={styles.checkLabel}>{k}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* PHOTOS */}
        {activeTab === "photos" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.sectionTitle}>Photo de profil du salon</Text>

            <View style={styles.photoBox}>
              {profileImage ? (
                <Pressable onPress={() => setPreviewUri(profileImage)} style={{ flex: 1 }}>
                  <Image source={{ uri: profileImage }} style={styles.photo} />
                </Pressable>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={{ color: "rgba(107,39,55,0.6)", fontWeight: "800" }}>Aucune photo</Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={() => pickSingleImage((uri) => setProfileImage(uri))}
              style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]}
            >
              <Text style={styles.primaryBtnText}>{profileImage ? "Changer la photo" : "Ajouter une photo"}</Text>
            </Pressable>

            <Text style={styles.help}>Format recommandé : Carré (1:1), JPG ou PNG, max 5MB</Text>

            <Text style={styles.sectionTitle}>Galerie du salon ({galleryImages.length}/10)</Text>
            <View style={styles.galleryGrid}>
              {galleryImages.map((uri, idx) => (
                <View key={uri + idx} style={styles.galleryItem}>
                  <Pressable onPress={() => setPreviewUri(uri)} style={{ flex: 1 }}>
                    <Image source={{ uri }} style={styles.galleryImg} />
                  </Pressable>
                  <Pressable onPress={() => setGalleryImages((p) => p.filter((_, i) => i !== idx))} style={styles.galleryRemove}>
                    <Text style={{ color: "#FFF", fontWeight: "900" }}>✕</Text>
                  </Pressable>
                </View>
              ))}

              {galleryImages.length < 10 && (
                <Pressable onPress={pickMultipleImages} style={styles.galleryAdd}>
                  <Text style={{ color: "rgba(107,39,55,0.6)", fontWeight: "900", fontSize: 20 }}>＋</Text>
                  <Text style={{ color: "rgba(107,39,55,0.6)", fontWeight: "700", fontSize: 12 }}>Ajouter</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 Les clients qui voient des photos réservent 3× plus souvent</Text>
            </View>
          </View>
        )}

        {/* HORAIRES */}
        {activeTab === "horaires" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.sectionTitle}>Configuration des horaires</Text>

            <Pressable onPress={() => setScheduleType("standard")} style={styles.radioRow}>
              <Text style={[styles.radioDot, scheduleType === "standard" && styles.radioDotOn]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.radioTitle}>Horaires standard</Text>
                <Text style={styles.help}>Même plage horaire pour tous les jours</Text>
              </View>
            </Pressable>

            <Pressable onPress={() => setScheduleType("custom")} style={styles.radioRow}>
              <Text style={[styles.radioDot, scheduleType === "custom" && styles.radioDotOn]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.radioTitle}>Personnalisé</Text>
                <Text style={styles.help}>Plages horaires différentes par jour</Text>
              </View>
            </Pressable>

            {scheduleType === "standard" ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Tous les jours</Text>
                <SlotEditor slots={standardSlots} onChange={setStandardSlots} />
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {Object.keys(customSlots).map((day) => (
                  <View key={day} style={styles.panel}>
                    <Text style={styles.panelTitle}>{day}</Text>
                    <SlotEditor
                      slots={customSlots[day]}
                      onChange={(next) => setCustomSlots((p) => ({ ...p, [day]: next }))}
                    />
                  </View>
                ))}
              </View>
            )}

            <View style={styles.tipBoxGold}>
              <Text style={styles.tipTextGold}>ℹ️ Vos disponibilités seront visibles par les clients lors de la prise de rendez-vous</Text>
            </View>
          </View>
        )}

        {/* PAIEMENTS */}
        {activeTab === "paiements" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.sectionTitle}>Méthodes de paiement acceptées</Text>

            <ToggleRow label="Mobile Money" value={payMobileMoney} onChange={setPayMobileMoney} subtitle="Orange Money, Moov Money, Airtel Money" />
            <ToggleRow label="Carte bancaire" value={payCard} onChange={setPayCard} subtitle="Visa, Mastercard" />
            <ToggleRow label="Espèces" value={payCash} onChange={setPayCash} subtitle="Paiement en liquide au salon" />

            <Text style={styles.sectionTitle}>Informations Mobile Money</Text>
            <Field label="Orange Money">
              <TextInput value={orangeMoney} onChangeText={setOrangeMoney} style={styles.input} placeholder="+241 77 ..." placeholderTextColor="rgba(58,58,58,0.35)" />
            </Field>
            <Field label="Moov Money">
              <TextInput value={moovMoney} onChangeText={setMoovMoney} style={styles.input} placeholder="+241 62 ..." placeholderTextColor="rgba(58,58,58,0.35)" />
            </Field>
            <Field label="Airtel Money">
              <TextInput value={airtelMoney} onChangeText={setAirtelMoney} style={styles.input} placeholder="+241 74 ..." placeholderTextColor="rgba(58,58,58,0.35)" />
            </Field>

            <Text style={styles.sectionTitle}>Coordonnées bancaires</Text>
            <Field label="Nom de la banque">
              <TextInput value={bankName} onChangeText={setBankName} style={styles.input} placeholder="Ex: BGFI Bank" placeholderTextColor="rgba(58,58,58,0.35)" />
            </Field>
            <Field label="RIB / IBAN">
              <TextInput value={iban} onChangeText={setIban} style={styles.input} placeholder="Ex: GA21..." placeholderTextColor="rgba(58,58,58,0.35)" />
            </Field>
            <Field label="Titulaire du compte">
              <TextInput value={bankOwner} onChangeText={setBankOwner} style={styles.input} placeholder="Nom complet / société" placeholderTextColor="rgba(58,58,58,0.35)" />
            </Field>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>🔒 Vos informations bancaires sont sécurisées et cryptées. Elles ne sont jamais partagées avec les clients.</Text>
            </View>

            <Text style={styles.sectionTitle}>Frais & commissions</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.rowLabel}>Commission AMBYA</Text>
              <Text style={styles.rowValue}>15%</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.rowLabel}>Frais de transaction</Text>
              <Text style={styles.rowValue}>2–5%</Text>
            </View>
            <View style={styles.tipBoxGold}>
              <Text style={styles.tipTextGold}>💡 Exemple : pour 10 000 FCFA, vous recevez environ 6 500 FCFA</Text>
            </View>
          </View>
        )}

        {/* ACOMPTE */}
        {activeTab === "acompte" && (
          <View style={{ gap: 14 }}>
            <View style={styles.panelWhite}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.panelTitle}>Activer l'acompte pour les nouveaux clients</Text>
                  <Text style={styles.help}>Demandez un acompte pour sécuriser les réservations</Text>
                </View>
                <Switch value={depositEnabled} onValueChange={setDepositEnabled} />
              </View>

              <View style={[styles.tipBox, depositEnabled ? styles.okBox : styles.warnBox]}>
                <Text style={[styles.tipText, depositEnabled ? styles.okText : styles.warnText]}>
                  {depositEnabled
                    ? "✓ L'acompte est activé (réduit les no-shows)"
                    : "⚠️ Sans acompte, le taux de no-show peut être plus élevé (15–20%)"}
                </Text>
              </View>
            </View>

            {depositEnabled && (
              <>
                <Field label="Pourcentage d'acompte (10–50)">
                  <TextInput
                    value={String(depositPercentage)}
                    onChangeText={(t) => {
                      const n = Number(t.replace(/[^\d]/g, ""));
                      if (!Number.isFinite(n)) return;
                      setDepositPercentage(Math.max(10, Math.min(50, n)));
                    }}
                    style={styles.input}
                    keyboardType="number-pad"
                  />
                </Field>

                <View style={styles.tipBoxGold}>
                  <Text style={styles.tipTextGold}>
                    Exemple pour 20 000 FCFA → acompte {Math.round((20000 * depositPercentage) / 100).toLocaleString("fr-FR")} FCFA / solde{" "}
                    {Math.round((20000 * (100 - depositPercentage)) / 100).toLocaleString("fr-FR")} FCFA
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>Politique d'annulation acompte</Text>
                {[12, 24, 48].map((h) => {
                  const checked = cancelPolicyHours === h;
                  return (
                    <Pressable key={h} onPress={() => setCancelPolicyHours(h as any)} style={styles.radioRow}>
                      <Text style={[styles.radioDot, checked && styles.radioDotOn]} />
                      <Text style={styles.radioTitle}>Remboursement si annulation ≥ {h}h avant RDV</Text>
                      {h === 12 && <Text style={styles.reco}>Recommandé</Text>}
                    </Pressable>
                  );
                })}
              </>
            )}
          </View>
        )}

        <Pressable onPress={() => {}} style={[styles.primaryBtn, { marginTop: 18 }]}>
          <Text style={styles.primaryBtnText}>Enregistrer les modifications</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Preview modal */}
      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <View style={styles.modalBg}>
          <Pressable style={{ flex: 1 }} onPress={() => setPreviewUri(null)} />
          <View style={styles.modalCard}>
            {!!previewUri && <Image source={{ uri: previewUri }} style={{ width: "100%", height: 320, borderRadius: 16 }} />}
            <Pressable onPress={() => setPreviewUri(null)} style={[styles.primaryBtn, { marginTop: 12 }]}>
              <Text style={styles.primaryBtnText}>Fermer</Text>
            </Pressable>
          </View>
          <Pressable style={{ flex: 1 }} onPress={() => setPreviewUri(null)} />
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{label}</Text>
        {!!subtitle && <Text style={styles.help}>{subtitle}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  help: { color: "rgba(58,58,58,0.55)", fontSize: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "900", marginTop: 6, marginBottom: 6 },

  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },

  tabs: { paddingHorizontal: 12, paddingVertical: 12, gap: 8, backgroundColor: "#FFF" },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: COLORS.primary },
  tabText: { color: "rgba(58,58,58,0.6)", fontWeight: "800" },
  tabTextActive: { color: COLORS.primary },

  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  checkRow: { width: "48%", flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 14 },
  checkRowOn: { backgroundColor: "rgba(107,39,55,0.08)", borderWidth: 1, borderColor: "rgba(107,39,55,0.25)" },
  checkRowOff: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "rgba(107,39,55,0.15)" },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "rgba(107,39,55,0.25)", textAlign: "center", textAlignVertical: "center" },
  checkBoxOn: { borderColor: COLORS.primary, color: COLORS.primary },
  checkLabel: { color: COLORS.text, fontWeight: "700" },

  photoBox: { width: "100%", height: 220, borderRadius: 18, overflow: "hidden", backgroundColor: "#FFF" },
  photo: { width: "100%", height: "100%" },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(107,39,55,0.06)" },

  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  galleryItem: { width: "30%", aspectRatio: 1, borderRadius: 14, overflow: "hidden", backgroundColor: "#FFF" },
  galleryImg: { width: "100%", height: "100%" },
  galleryRemove: { position: "absolute", top: 6, right: 6, backgroundColor: "#DC2626", width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  galleryAdd: { width: "30%", aspectRatio: 1, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(107,39,55,0.25)", alignItems: "center", justifyContent: "center", gap: 4 },

  tipBox: { backgroundColor: "rgba(107,39,55,0.06)", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(107,39,55,0.12)" },
  tipText: { color: COLORS.primary, fontWeight: "700", fontSize: 12 },
  tipBoxGold: { backgroundColor: "rgba(212,175,106,0.2)", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(212,175,106,0.3)" },
  tipTextGold: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },

  radioRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "rgba(107,39,55,0.35)" },
  radioDotOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  radioTitle: { color: COLORS.text, fontWeight: "800" },
  reco: { marginLeft: "auto", color: COLORS.primary, backgroundColor: "rgba(212,175,106,0.22)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontWeight: "900", fontSize: 11 },

  panel: { backgroundColor: "rgba(107,39,55,0.06)", borderRadius: 18, padding: 12, borderWidth: 1, borderColor: "rgba(107,39,55,0.12)" },
  panelWhite: { backgroundColor: "#FFF", borderRadius: 18, padding: 12, borderWidth: 1, borderColor: "rgba(107,39,55,0.12)" },
  panelTitle: { color: COLORS.text, fontWeight: "900", marginBottom: 10 },

  slotRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  inlineBtn: { paddingVertical: 10 },
  inlineBtnText: { color: COLORS.primary, fontWeight: "900" },
  smallDangerBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(220,38,38,0.1)", alignItems: "center", justifyContent: "center" },
  smallDangerBtnText: { color: "#DC2626", fontWeight: "900" },

  toggleRow: { backgroundColor: "#FFF", borderRadius: 18, padding: 12, borderWidth: 1, borderColor: "rgba(107,39,55,0.12)", flexDirection: "row", alignItems: "center", gap: 10 },
  toggleTitle: { color: COLORS.text, fontWeight: "900" },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "rgba(107,39,55,0.12)" },
  rowLabel: { color: COLORS.text, fontWeight: "800" },
  rowValue: { color: COLORS.primary, fontWeight: "900" },

  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  primaryBtnText: { color: "#FFF", fontWeight: "900" },

  okBox: { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.25)" },
  okText: { color: "#15803d" },
  warnBox: { backgroundColor: "rgba(249,115,22,0.12)", borderColor: "rgba(249,115,22,0.25)" },
  warnText: { color: "#c2410c" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", padding: 18, justifyContent: "center" },
  modalCard: { backgroundColor: "#FFF", borderRadius: 22, padding: 12 },
});