import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";

import { ProHeader } from "./components/ProHeader";
import { logout } from "../../src/api/auth";
import {
  getSalonSettings,
  updateSalonSettings,
  uploadSalonPhoto,
} from "../../src/api/salon-settings";
import {
  cancelSubscription as cancelSalonSubscription,
  confirmSubscriptionPaymentForBeta,
  getCurrentSubscription,
  subscribeToPlan,
  type CurrentSubscription,
  type SubscriptionPayment,
  type SubscriptionPaymentMethod,
  type SubscriptionPlan,
} from "../../src/api/subscriptions";
import { useAuthRefresh } from "../../src/providers/AuthRefreshProvider";

const COLORS = {
  bg: "#FAF7F2",
  text: "#3A3A3A",
  primary: "#6B2737",
  gold: "#D4AF6A",
};

type TabId = "infos" | "photos" | "horaires" | "paiements" | "acompte" | "abonnement";

type SubscriptionOffer = {
  id: SubscriptionPlan;
  name: string;
  price: number;
  commissionPct: number;
  description: string;
  features: string[];
  recommended?: boolean;
};

const SUBSCRIPTION_OFFERS: SubscriptionOffer[] = [
  {
    id: "DISCOVERY",
    name: "Découverte",
    price: 0,
    commissionPct: 12,
    description: "Pour démarrer sans risque.",
    features: [
      "Profil professionnel visible sur AMBYA",
      "Réservations illimitées",
      "Agenda & gestion des RDV",
      "Caisse & transactions",
      "Fiche client avec historique",
      "Promotions & offres spéciales",
    ],
  },
  {
    id: "ESSENTIAL",
    name: "Essentiel",
    price: 12900,
    commissionPct: 0,
    description: "Pour les activités actives.",
    features: [
      "Tout le plan Découverte",
      "Gestion des employés & congés",
      "Gestion des dépenses & caisse",
      "Fiche client avec historique",
      "Statistiques & tableau de bord",
    ],
    recommended: true,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: 24900,
    commissionPct: 0,
    description: "Pour piloter et analyser.",
    features: [
      "Tout le plan Essentiel",
      "Registre de gestion",
      "Espace dédié aux employés",
    ],
  },
];

const PAYMENT_METHODS: { id: SubscriptionPaymentMethod; label: string }[] = [
  { id: "AIRTEL_MONEY", label: "Airtel Money" },
  { id: "MOOV_MONEY", label: "Moov Money" },
  { id: "CARD", label: "Carte bancaire" },
  { id: "MANUAL_MOBILE_MONEY", label: "Mobile Money manuel" },
];

type ScheduleSlot = {
  start: string;
  end: string;
  enabled: boolean;
};

function SlotEditor({
  slots,
  onChange,
}: {
  slots: ScheduleSlot[];
  onChange: (next: ScheduleSlot[]) => void;
}) {
  const updateSlot = (index: number, patch: Partial<ScheduleSlot>) => {
    onChange(
      slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot))
    );
  };

  return (
    <View style={{ gap: 10 }}>
      {slots.map((slot, idx) => (
        <View key={idx} style={styles.slotRow}>
          <Switch
            value={slot.enabled}
            onValueChange={(value) => updateSlot(idx, { enabled: value })}
          />
          <TextInput
            value={slot.start}
            onChangeText={(text) => updateSlot(idx, { start: text })}
            placeholder="09:00"
            style={[styles.input, { flex: 1 }]}
          />
          <Text style={{ color: "rgba(58,58,58,0.5)", fontWeight: "700" }}>–</Text>
          <TextInput
            value={slot.end}
            onChangeText={(text) => updateSlot(idx, { end: text })}
            placeholder="18:00"
            style={[styles.input, { flex: 1 }]}
          />

          {slots.length > 1 && (
            <Pressable
              onPress={() => onChange(slots.filter((_, i) => i !== idx))}
              style={styles.smallDangerBtn}
            >
              <Text style={styles.smallDangerBtnText}>✕</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable
        onPress={() =>
          onChange([
            ...slots,
            { start: "09:00", end: "18:00", enabled: true },
          ])
        }
        style={styles.inlineBtn}
      >
        <Text style={styles.inlineBtnText}>＋ Ajouter une plage</Text>
      </Pressable>
    </View>
  );
}

export default function SalonSettingsScreen() {
  const { refreshAuth } = useAuthRefresh();

  const tabs = useMemo(
    () => [
      { id: "infos", label: "Infos" },
      { id: "photos", label: "Photos" },
      { id: "horaires", label: "Horaires" },
      { id: "paiements", label: "Paiements" },
      { id: "acompte", label: "Acompte" },
      { id: "abonnement", label: "Abonnement" },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState<TabId>("infos");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
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
  const [instagramHandle, setInstagramHandle] = useState("@ebenecoiffure");
  const [instagramVerified] = useState(true);
  const [showInstagramFeed, setShowInstagramFeed] = useState(true);

  const [tiktokHandle, setTiktokHandle] = useState("");
  const [showTikTokFeed, setShowTikTokFeed] = useState(false);

  const [facebookUrl, setFacebookUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // photos
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingGalleryImages, setUploadingGalleryImages] = useState(false);

  // horaires
  const [scheduleType, setScheduleType] = useState<"standard" | "custom">("standard");
  const [standardSlots, setStandardSlots] = useState([
    { start: "09:00", end: "18:00", enabled: true },
  ]);
  const [customSlots, setCustomSlots] = useState<Record<string, ScheduleSlot[]>>({
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

  // abonnement réel : source de vérité = module subscriptions côté API
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPayment[]>([]);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<SubscriptionPaymentMethod>("AIRTEL_MONEY");

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const token = await SecureStore.getItemAsync("accessToken");

        if (!token) {
          Alert.alert("Session expirée", "Veuillez vous reconnecter.");
          return;
        }

        const settings = await getSalonSettings(token);
        const subscriptionData = await getCurrentSubscription(token);
        setSubscription(subscriptionData.subscription);
        setSubscriptionPayments(subscriptionData.payments);

        setName(settings.name ?? "");
        setDesc(settings.description ?? "");
        setAddress(settings.address ?? "");
        setPhone(settings.phone ?? "");
        setEmail(settings.email ?? "");

        setCategories((prev) =>
          Object.fromEntries(
            Object.keys(prev).map((category) => [
              category,
              settings.categories?.includes(category) ?? false,
            ])
          )
        );

        setProfileImage(settings.coverImageUrl ?? null);
        setGalleryImages(settings.galleryImageUrls ?? []);

        setInstagramHandle(settings.instagramHandle ?? "");
        setShowInstagramFeed(settings.showInstagramFeed ?? false);
        setTiktokHandle(settings.tiktokHandle ?? "");
        setShowTikTokFeed(settings.showTikTokFeed ?? false);
        setFacebookUrl(settings.facebookUrl ?? "");
        setWebsiteUrl(settings.websiteUrl ?? "");

        setScheduleType(settings.scheduleType ?? "standard");
        setStandardSlots(
          settings.standardSlots?.length
            ? settings.standardSlots
            : [{ start: "09:00", end: "18:00", enabled: true }]
        );
        setCustomSlots(settings.customSlots ?? customSlots);

        setPayMobileMoney(settings.paymentSettings?.payMobileMoney ?? true);
        setPayCard(settings.paymentSettings?.payCard ?? true);
        setPayCash(settings.paymentSettings?.payCash ?? true);
        setOrangeMoney(settings.paymentSettings?.orangeMoney ?? "");
        setMoovMoney(settings.paymentSettings?.moovMoney ?? "");
        setAirtelMoney(settings.paymentSettings?.airtelMoney ?? "");
        setBankName(settings.paymentSettings?.bankName ?? "");
        setIban(settings.paymentSettings?.iban ?? "");
        setBankOwner(settings.paymentSettings?.bankOwner ?? "");

        setDepositEnabled(settings.depositEnabled ?? false);
        setDepositPercentage(settings.depositPercentage ?? 30);
        setCancelPolicyHours(
          (settings.paymentSettings?.cancelPolicyHours ?? 12) as 12 | 24 | 48
        );
      } catch (error) {
        console.log("Load salon settings error:", error);
        Alert.alert("Erreur", "Impossible de charger les paramètres du salon.");
      } finally {
        setLoadingSettings(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSaveSettings() {
    if (savingSettings) return;

    try {
      setSavingSettings(true);

      const token = await SecureStore.getItemAsync("accessToken");

      if (!token) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        return;
      }

      const selectedCategories = Object.entries(categories)
        .filter(([, selected]) => selected)
        .map(([category]) => category);

      const payload = {
        name: name.trim(),
        description: desc.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        categories: selectedCategories,

        coverImageUrl: profileImage,
        galleryImageUrls: galleryImages,

        instagramHandle: instagramHandle.trim() || undefined,
        showInstagramFeed,
        tiktokHandle: tiktokHandle.trim() || undefined,
        showTikTokFeed,
        facebookUrl: facebookUrl.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,

        scheduleType,
        standardSlots,
        customSlots,

        paymentSettings: {
          payMobileMoney,
          payCard,
          payCash,
          orangeMoney: orangeMoney.trim(),
          moovMoney: moovMoney.trim(),
          airtelMoney: airtelMoney.trim(),
          bankName: bankName.trim(),
          iban: iban.trim(),
          bankOwner: bankOwner.trim(),
          cancelPolicyHours,
        },

        depositEnabled,
        depositPercentage,
      };

      await updateSalonSettings(token, payload);

      Alert.alert("Succès", "Les paramètres du salon ont été enregistrés.");
    } catch (error) {
      console.log("Save salon settings error:", error);
      Alert.alert("Erreur", "Impossible d’enregistrer les modifications.");
    } finally {
      setSavingSettings(false);
    }
  }

  const subscriptionPlan = subscription?.plan ?? "DISCOVERY";
  const hasActiveSubscription =
    subscriptionPlan !== "DISCOVERY" && subscription?.status === "ACTIVE";

  const currentSubscriptionOffer = SUBSCRIPTION_OFFERS.find(
    (offer) => offer.id === subscriptionPlan
  );

  async function reloadSubscription(token?: string) {
    const accessToken = token ?? (await SecureStore.getItemAsync("accessToken"));
    if (!accessToken) {
      Alert.alert("Session expirée", "Veuillez vous reconnecter.");
      return;
    }

    const result = await getCurrentSubscription(accessToken);
    setSubscription(result.subscription);
    setSubscriptionPayments(result.payments);
  }

  /**
   * MODE BÊTA TEMPORAIRE — activation immédiate de l'abonnement.
   *
   * Tant que l'API de paiement n'est pas complètement câblée, on crée la
   * demande de souscription puis on confirme immédiatement le paiement bêta.
   * Cela permet de tester les droits et l'affichage des offres sans passer
   * manuellement par l'état "Paiement en attente".
   *
   * TODO PAIEMENT :
   * Quand SingPay / Airtel Money / Moov Money / carte seront prêts,
   * supprimer cette version temporaire et réactiver la version définitive
   * commentée juste en dessous.
   */
  async function selectSubscription(plan: SubscriptionPlan) {
    if (subscriptionBusy || plan === "DISCOVERY") return;

    try {
      setSubscriptionBusy(true);

      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        return;
      }

      // 1. On conserve le vrai flux backend : création de la souscription.
      const result = await subscribeToPlan(
        token,
        plan as Exclude<SubscriptionPlan, "DISCOVERY">,
        selectedPaymentMethod
      );

      // 2. TEMPORAIRE BÊTA :
      // confirmation immédiate afin de ne pas bloquer les tests sur le paiement.
      await confirmSubscriptionPaymentForBeta(token, result.payment.id);

      // 3. Recharge la source de vérité depuis l'API.
      await reloadSubscription(token);

      const selectedOffer = SUBSCRIPTION_OFFERS.find(
        (offer) => offer.id === plan
      );

      Alert.alert(
        "Abonnement activé",
        `L'offre ${selectedOffer?.name ?? plan} est maintenant active.`
      );
    } catch (error) {
      console.log("Temporary beta subscription activation error:", error);
      Alert.alert(
        "Changement d’abonnement impossible",
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setSubscriptionBusy(false);
    }
  }

  /*
   * ================================================================
   * FLUX DÉFINITIF DE PAIEMENT — À RÉACTIVER PLUS TARD
   * ================================================================
   *
   * Cette version est volontairement conservée dans le fichier.
   * Elle crée le paiement PENDING et attend sa confirmation réelle.
   *
   * async function selectSubscription(plan: SubscriptionPlan) {
   *   if (subscriptionBusy || plan === "DISCOVERY") return;
   *
   *   try {
   *     setSubscriptionBusy(true);
   *     const token = await SecureStore.getItemAsync("accessToken");
   *     if (!token) {
   *       Alert.alert("Session expirée", "Veuillez vous reconnecter.");
   *       return;
   *     }
   *
   *     const result = await subscribeToPlan(
   *       token,
   *       plan as Exclude<SubscriptionPlan, "DISCOVERY">,
   *       selectedPaymentMethod
   *     );
   *
   *     await reloadSubscription(token);
   *
   *     Alert.alert(
   *       "Paiement en attente",
   *       `Une demande de paiement de ${result.payment.amount.toLocaleString(
   *         "fr-FR"
   *       )} FCFA a été créée. L’abonnement ne sera actif qu’après confirmation du paiement.`
   *     );
   *   } catch (error) {
   *     console.log("Subscription create error:", error);
   *     Alert.alert(
   *       "Souscription impossible",
   *       error instanceof Error ? error.message : "Une erreur est survenue."
   *     );
   *   } finally {
   *     setSubscriptionBusy(false);
   *   }
   * }
   */

  function requestCancellation() {
    if (subscriptionBusy || !hasActiveSubscription) return;

    Alert.alert(
      "Annuler le renouvellement ?",
      "Votre abonnement restera actif jusqu’à la fin de la période déjà payée. Ensuite, votre salon repassera automatiquement à Découverte.",
      [
        { text: "Conserver l’abonnement", style: "cancel" },
        {
          text: "Annuler le renouvellement",
          style: "destructive",
          onPress: async () => {
            try {
              setSubscriptionBusy(true);
              const token = await SecureStore.getItemAsync("accessToken");
              if (!token) return;
              await cancelSalonSubscription(token);
              await reloadSubscription(token);
            } catch (error) {
              Alert.alert(
                "Erreur",
                error instanceof Error ? error.message : "Annulation impossible."
              );
            } finally {
              setSubscriptionBusy(false);
            }
          },
        },
      ]
    );
  }

  async function confirmPendingPayment(paymentId: string) {
    try {
      setSubscriptionBusy(true);
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return;
      await confirmSubscriptionPaymentForBeta(token, paymentId);
      await reloadSubscription(token);
      Alert.alert("Abonnement activé", "Le paiement bêta a été confirmé.");
    } catch (error) {
      Alert.alert(
        "Confirmation impossible",
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setSubscriptionBusy(false);
    }
  }

  async function pickSingleImage() {
    if (uploadingProfileImage) return;

    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "Autorisez l'accès à vos photos pour ajouter une image au salon."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (!asset?.uri) {
      Alert.alert("Erreur", "Impossible de lire la photo sélectionnée.");
      return;
    }

    try {
      setUploadingProfileImage(true);

      const token = await SecureStore.getItemAsync("accessToken");

      if (!token) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        return;
      }

      const uploaded = await uploadSalonPhoto(token, {
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });

      setProfileImage(uploaded.url);
    } catch (error) {
      console.log("Upload salon profile photo error:", error);
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer la photo."
      );
    } finally {
      setUploadingProfileImage(false);
    }
  }

  async function pickMultipleImages() {
    if (uploadingGalleryImages) return;

    const remainingSlots = Math.max(0, 10 - galleryImages.length);

    if (remainingSlots === 0) {
      Alert.alert(
        "Galerie complète",
        "Vous avez déjà ajouté 10 photos."
      );
      return;
    }

    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "Autorisez l'accès à vos photos pour compléter la galerie."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });

    if (result.canceled) return;

    const assets = result.assets.slice(0, remainingSlots);

    try {
      setUploadingGalleryImages(true);

      const token = await SecureStore.getItemAsync("accessToken");

      if (!token) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        return;
      }

      const uploadedUrls: string[] = [];
      let failedUploads = 0;

      for (const asset of assets) {
        if (!asset?.uri) {
          failedUploads += 1;
          continue;
        }

        try {
          const uploaded = await uploadSalonPhoto(token, {
            uri: asset.uri,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
          });

          uploadedUrls.push(uploaded.url);
        } catch (error) {
          console.log("Upload salon gallery photo error:", error);
          failedUploads += 1;
        }
      }

      if (uploadedUrls.length > 0) {
        setGalleryImages((prev) =>
          [...prev, ...uploadedUrls].slice(0, 10)
        );
      }

      if (failedUploads > 0) {
        Alert.alert(
          "Upload partiel",
          `${failedUploads} photo${
            failedUploads > 1 ? "s n'ont" : " n'a"
          } pas pu être envoyée${failedUploads > 1 ? "s" : ""}.`
        );
      }
    } catch (error) {
      console.log("Upload salon gallery error:", error);
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer les photos de la galerie."
      );
    } finally {
      setUploadingGalleryImages(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      setShowLogoutModal(false);
      await logout(refreshAuth);
    } catch (error) {
      console.log("Logout error:", error);
      await logout(refreshAuth);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ProHeader
        title="Paramètres du Salon"
        subtitle="Configurez votre profil"
        backTo="/(professional)/dashboard"
      />

      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((t) => {
            const active = activeTab === (t.id as TabId);

            return (
              <Pressable
                key={t.id}
                onPress={() => setActiveTab(t.id as TabId)}
                style={styles.tabBtn}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t.label}
                </Text>

                <View
                  style={[
                    styles.tabIndicator,
                    active && styles.tabIndicatorActive,
                  ]}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "infos" && (
          <View style={{ gap: 14 }}>
            <Field label="Nom du salon">
              <TextInput value={name} onChangeText={setName} style={styles.input} />
            </Field>

            <Field label="Description">
              <TextInput
                value={desc}
                onChangeText={setDesc}
                style={[styles.input, { height: 120, textAlignVertical: "top" }]}
                multiline
              />
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

            <View style={styles.socialSection}>
              <Text style={styles.socialSectionTitle}>📱 Réseaux Sociaux</Text>
              <Text style={styles.socialSectionSubtitle}>
                Connectez vos réseaux pour afficher vos publications sur votre fiche salon
              </Text>

              <View style={styles.socialCardInstagram}>
                <View style={styles.socialHeaderRow}>
                  <View style={styles.socialTitleWrap}>
                    <Text style={styles.socialIcon}>📷</Text>
                    <Text style={styles.socialTitle}>Instagram</Text>
                  </View>

                  {instagramVerified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>✓ Vérifié</Text>
                    </View>
                  )}
                </View>

                <TextInput
                  value={instagramHandle}
                  onChangeText={setInstagramHandle}
                  style={[styles.input, styles.socialInput, styles.socialInputInstagram]}
                  placeholder="@votresalon"
                  placeholderTextColor="rgba(58,58,58,0.35)"
                  autoCapitalize="none"
                />

                <Pressable
                  onPress={() => setShowInstagramFeed((prev) => !prev)}
                  style={styles.socialCheckboxRow}
                >
                  <View style={[styles.checkboxSquare, showInstagramFeed && styles.checkboxSquareOn]}>
                    {showInstagramFeed && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <Text style={styles.socialCheckboxLabel}>
                    Afficher le feed Instagram sur ma fiche salon
                  </Text>
                </Pressable>
              </View>

              <View style={styles.socialCardTikTok}>
                <View style={styles.socialHeaderRow}>
                  <View style={styles.socialTitleWrap}>
                    <Text style={styles.socialIcon}>🎵</Text>
                    <Text style={styles.socialTitle}>TikTok</Text>
                  </View>
                </View>

                <TextInput
                  value={tiktokHandle}
                  onChangeText={setTiktokHandle}
                  style={[styles.input, styles.socialInput, styles.socialInputTikTok]}
                  placeholder="@votresalon"
                  placeholderTextColor="rgba(58,58,58,0.35)"
                  autoCapitalize="none"
                />

                <Pressable
                  onPress={() => setShowTikTokFeed((prev) => !prev)}
                  style={styles.socialCheckboxRow}
                >
                  <View style={[styles.checkboxSquare, showTikTokFeed && styles.checkboxSquareOn]}>
                    {showTikTokFeed && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <Text style={styles.socialCheckboxLabel}>
                    Afficher les vidéos TikTok sur ma fiche salon
                  </Text>
                </Pressable>
              </View>

              <View style={styles.socialCardFacebook}>
                <View style={styles.socialHeaderRow}>
                  <View style={styles.socialTitleWrap}>
                    <Text style={styles.socialIcon}>📘</Text>
                    <Text style={styles.socialTitle}>Facebook</Text>
                  </View>
                </View>

                <TextInput
                  value={facebookUrl}
                  onChangeText={setFacebookUrl}
                  style={[styles.input, styles.socialInput, styles.socialInputFacebook]}
                  placeholder="facebook.com/EbeneCoiffure"
                  placeholderTextColor="rgba(58,58,58,0.35)"
                  autoCapitalize="none"
                />

                <Pressable style={styles.connectLinkBtn}>
                  <Text style={styles.connectLinkText}>Connecter Facebook</Text>
                </Pressable>
              </View>

              <View style={styles.socialCardWebsite}>
                <View style={styles.socialHeaderRow}>
                  <View style={styles.socialTitleWrap}>
                    <Text style={styles.socialIcon}>🌐</Text>
                    <Text style={styles.socialTitle}>Site Web</Text>
                  </View>
                </View>

                <TextInput
                  value={websiteUrl}
                  onChangeText={setWebsiteUrl}
                  style={[styles.input, styles.socialInput, styles.socialInputWebsite]}
                  placeholder="https://votre-site.com"
                  placeholderTextColor="rgba(58,58,58,0.35)"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
        )}

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
              onPress={pickSingleImage}
              style={[
                styles.primaryBtn,
                { backgroundColor: COLORS.primary },
                uploadingProfileImage && { opacity: 0.7 },
              ]}
              disabled={uploadingProfileImage}
            >
              {uploadingProfileImage ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {profileImage ? "Changer la photo" : "Ajouter une photo"}
                </Text>
              )}
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
                <Pressable
                  onPress={pickMultipleImages}
                  style={[
                    styles.galleryAdd,
                    uploadingGalleryImages && { opacity: 0.65 },
                  ]}
                  disabled={uploadingGalleryImages}
                >
                  {uploadingGalleryImages ? (
                    <>
                      <ActivityIndicator color={COLORS.primary} />
                      <Text
                        style={{
                          color: "rgba(107,39,55,0.6)",
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        Envoi...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={{
                          color: "rgba(107,39,55,0.6)",
                          fontWeight: "900",
                          fontSize: 20,
                        }}
                      >
                        ＋
                      </Text>
                      <Text
                        style={{
                          color: "rgba(107,39,55,0.6)",
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        Ajouter
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 Les clients qui voient des photos réservent 3× plus souvent</Text>
            </View>
          </View>
        )}

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
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.rowLabel}>Commission AMBYA</Text>
                <Text style={styles.help}>
                  {hasActiveSubscription
                    ? `Incluse dans votre abonnement ${currentSubscriptionOffer?.name ?? "AMBYA"}.`
                    : "Commission appliquée au plan Découverte."}
                </Text>
              </View>
              <Text style={styles.rowValue}>{subscription?.commissionPct ?? 12} %</Text>
            </View>
            <View style={styles.tipBoxGold}>
              <Text style={styles.tipTextGold}>
                {hasActiveSubscription
                  ? "✓ Aucune commission AMBYA n'est prélevée sur vos nouvelles réservations."
                  : "💡 Essentiel et Premium passent à 0 % de commission après confirmation du paiement."}
              </Text>
            </View>
          </View>
        )}

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
                    <Pressable key={h} onPress={() => setCancelPolicyHours(h as 12 | 24 | 48)} style={styles.radioRow}>
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

        {activeTab === "abonnement" && (
          <View style={{ gap: 14 }}>
            <Text style={styles.sectionTitle}>Votre abonnement</Text>

            <View
              style={[
                styles.subscriptionCurrentCard,
                hasActiveSubscription && styles.subscriptionCurrentCardActive,
              ]}
            >
              <View style={styles.subscriptionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subscriptionEyebrow}>OFFRE ACTUELLE</Text>
                  <Text style={styles.subscriptionCurrentTitle}>
                    {currentSubscriptionOffer?.name ?? "Découverte"}
                  </Text>
                </View>
                <View style={styles.subscriptionStatusBadge}>
                  <Text style={styles.subscriptionStatusText}>
                    {subscription?.status === "PENDING_PAYMENT"
                      ? "Paiement en attente"
                      : subscription?.cancelAtPeriodEnd
                      ? "Fin programmée"
                      : "Actif"}
                  </Text>
                </View>
              </View>

              <Text style={styles.subscriptionPrice}>
                {(currentSubscriptionOffer?.price ?? 0).toLocaleString("fr-FR")} FCFA
                <Text style={styles.subscriptionPricePeriod}> / mois</Text>
              </Text>
              <Text style={
                (subscription?.commissionPct ?? 12) === 0
                  ? styles.subscriptionCommissionGood
                  : styles.subscriptionCommissionWarning
              }>
                Commission AMBYA : {subscription?.commissionPct ?? 12} %
              </Text>

              {!!subscription?.currentPeriodEnd && subscriptionPlan !== "DISCOVERY" && (
                <Text style={styles.help}>
                  Période active jusqu’au {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR")}
                </Text>
              )}

              {subscription?.cancelAtPeriodEnd && (
                <Text style={styles.help}>
                  Le salon repassera à Découverte à la fin de cette période.
                </Text>
              )}
            </View>

            <View style={styles.tipBoxGold}>
              <Text style={styles.tipTextGold}>
                🧪 Mode test temporaire : le changement d’offre est activé immédiatement,
                sans attendre la confirmation d’un paiement.
              </Text>
            </View>

            {/*
             * ================================================================
             * UI DE PAIEMENT DÉFINITIVE — À RÉACTIVER PLUS TARD
             * ================================================================
             * Le sélecteur de moyen de paiement est masqué temporairement.
             * Le code d'origine est conservé ci-dessous.
             * <Text style={styles.sectionTitle}>Moyen de paiement</Text>
             * <View style={styles.pillsWrap}>
             * {PAYMENT_METHODS.map((method) => {
             * const active = selectedPaymentMethod === method.id;
             * return (
             * <Pressable
             * key={method.id}
             * onPress={() => setSelectedPaymentMethod(method.id)}
             * style={[styles.chip, active && styles.chipOn]}
             * >
             * <Text style={[styles.chipText, active && styles.chipTextOn]}>
             * {method.label}
             * </Text>
             * </Pressable>
             * );
             * })}
             * </View>
             * <Text style={styles.help}>
             * Le branchement SingPay / opérateur sera ajouté plus tard. Pour l’instant, la demande reste en attente jusqu’à validation bêta.
             * </Text>
             * 
             */}

            <Text style={styles.sectionTitle}>Les offres AMBYA</Text>
            {SUBSCRIPTION_OFFERS.map((offer) => {
              const selected = subscriptionPlan === offer.id;
              const isDiscovery = offer.id === "DISCOVERY";

              return (
                <View
                  key={offer.id}
                  style={[
                    styles.subscriptionOfferCard,
                    selected && styles.subscriptionOfferCardSelected,
                  ]}
                >
                  <View style={styles.subscriptionHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Text style={styles.subscriptionOfferName}>{offer.name}</Text>
                        {offer.recommended && (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedBadgeText}>RECOMMANDÉ</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.subscriptionOfferDescription}>
                        {offer.description}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.subscriptionOfferPrice}>
                    {offer.price.toLocaleString("fr-FR")} FCFA
                    <Text style={styles.subscriptionPricePeriod}> / mois</Text>
                  </Text>
                  <Text style={
                    offer.commissionPct === 0
                      ? styles.subscriptionCommissionGood
                      : styles.subscriptionCommissionWarning
                  }>
                    {offer.commissionPct === 0
                      ? "Sans commission"
                      : `${offer.commissionPct} % de commission / réservation`}
                  </Text>

                  <View style={{ gap: 7, marginTop: 10 }}>
                    {offer.features.map((feature) => (
                      <Text key={feature} style={styles.subscriptionFeature}>
                        ✓ {feature}
                      </Text>
                    ))}
                  </View>

                  {!isDiscovery && (
                    <Pressable
                      onPress={() => selectSubscription(offer.id)}
                      disabled={
                        subscriptionBusy ||
                        (selected && subscription?.status === "ACTIVE")
                      }
                      style={[
                        styles.subscriptionChooseBtn,
                        selected &&
                          subscription?.status === "ACTIVE" &&
                          styles.subscriptionChooseBtnSelected,
                      ]}
                    >
                      <Text style={styles.subscriptionChooseBtnText}>
                        {selected && subscription?.status === "ACTIVE"
                          ? "Offre actuelle"
                          : `Choisir ${offer.name}`}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}

            {/*
             * ================================================================
             * CARTE "PAIEMENT EN ATTENTE" — À RÉACTIVER PLUS TARD
             * ================================================================
             * Masquée pendant le mode de test à activation immédiate.
             * {subscriptionPayments
             * .filter((payment) => payment.status === "PENDING")
             * .slice(0, 1)
             * .map((payment) => (
             * <View key={payment.id} style={styles.tipBoxGold}>
             * <Text style={styles.tipTextGold}>
             * Paiement en attente : {payment.amount.toLocaleString("fr-FR")} FCFA
             * </Text>
             * <Pressable
             * onPress={() => confirmPendingPayment(payment.id)}
             * disabled={subscriptionBusy}
             * style={[styles.inlineBtn, { marginTop: 10 }]}
             * >
             * <Text style={styles.inlineBtnText}>
             * Valider le paiement (BÊTA)
             * </Text>
             * </Pressable>
             * </View>
             * ))}
             */}


            {hasActiveSubscription && !subscription?.cancelAtPeriodEnd && (
              <Pressable
                onPress={requestCancellation}
                disabled={subscriptionBusy}
                style={styles.subscriptionCancelBtn}
              >
                <Text style={styles.subscriptionCancelBtnText}>
                  Annuler le renouvellement
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {activeTab !== "abonnement" && (
          <Pressable
            onPress={handleSaveSettings}
            style={[
              styles.primaryBtn,
              { marginTop: 18 },
              savingSettings && { opacity: 0.7 },
            ]}
            disabled={savingSettings}
          >
            {savingSettings ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Enregistrer les modifications</Text>
            )}
          </Pressable>
        )}

        <Pressable
          onPress={() => setShowLogoutModal(true)}
          style={[styles.logoutBtn, loggingOut && { opacity: 0.7 }]}
          disabled={loggingOut}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutBtnText}>
            {loggingOut ? "Déconnexion..." : "Se déconnecter"}
          </Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>

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

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutModalBg}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutIconWrap}>
              <Text style={styles.logoutModalIcon}>🚪</Text>
            </View>

            <Text style={styles.logoutModalTitle}>Déconnexion</Text>

            <Text style={styles.logoutModalText}>
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter
              pour accéder à votre tableau de bord.
            </Text>

            <View style={styles.logoutModalButtons}>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                style={styles.logoutCancelBtn}
                disabled={loggingOut}
              >
                <Text style={styles.logoutCancelText}>Annuler</Text>
              </Pressable>

              <Pressable
                onPress={handleLogout}
                style={[styles.logoutConfirmBtn, loggingOut && { opacity: 0.7 }]}
                disabled={loggingOut}
              >
                <Text style={styles.logoutConfirmText}>
                  {loggingOut ? "Déconnexion..." : "Se déconnecter"}
                </Text>
              </Pressable>
            </View>
          </View>
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

  tabsContainer: {
    height: 70,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(107,39,55,0.06)",
  },

  tabsContent: {
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 28,
  },

  tabBtn: {
    height: 70,
    minWidth: 74,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  tabText: {
    color: "rgba(58,58,58,0.55)",
    fontSize: 15,
    fontWeight: "900",
  },

  tabTextActive: {
    color: COLORS.primary,
  },

  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "100%",
    borderRadius: 999,
    backgroundColor: "transparent",
  },

  tabIndicatorActive: {
    backgroundColor: COLORS.primary,
  },

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

  subscriptionCurrentCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.12)",
  },
  subscriptionCurrentCardActive: {
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(34,197,94,0.05)",
  },
  subscriptionHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  subscriptionEyebrow: { color: "rgba(58,58,58,0.5)", fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  subscriptionCurrentTitle: { color: COLORS.primary, fontSize: 20, fontWeight: "900", marginTop: 4 },
  subscriptionStatusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  subscriptionStatusBadgeActive: { backgroundColor: "#DCFCE7" },
  subscriptionStatusBadgeFree: { backgroundColor: "#F3F4F6" },
  subscriptionStatusText: { fontSize: 11, fontWeight: "900" },
  subscriptionStatusTextActive: { color: "#15803D" },
  subscriptionStatusTextFree: { color: "#6B7280" },
  subscriptionPrice: { color: COLORS.text, fontSize: 22, fontWeight: "900", marginTop: 16 },
  subscriptionPricePeriod: { fontSize: 12, fontWeight: "700", color: "rgba(58,58,58,0.55)" },
  subscriptionCommissionGood: { color: "#15803D", fontWeight: "800", marginTop: 8, marginBottom: 4 },
  subscriptionCommissionWarning: { color: "#C2410C", fontWeight: "800", marginTop: 8, marginBottom: 4 },
  subscriptionOfferCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(107,39,55,0.12)" },
  subscriptionOfferCardSelected: { borderColor: COLORS.gold, borderWidth: 2, backgroundColor: "rgba(212,175,106,0.07)" },
  subscriptionOfferName: { color: COLORS.primary, fontSize: 18, fontWeight: "900" },
  subscriptionOfferDescription: { color: "rgba(58,58,58,0.65)", fontSize: 12, marginTop: 6, lineHeight: 18 },
  subscriptionOfferPrice: { color: COLORS.text, fontSize: 20, fontWeight: "900", marginTop: 14 },
  subscriptionFeature: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  recommendedBadge: { backgroundColor: "rgba(212,175,106,0.22)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  recommendedBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: "900" },
  subscriptionChooseBtn: { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 12, alignItems: "center" },
  subscriptionChooseBtnSelected: { backgroundColor: "rgba(107,39,55,0.08)", borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },
  subscriptionChooseBtnText: { color: "#FFF", fontWeight: "900" },
  subscriptionChooseBtnTextSelected: { color: COLORS.primary },
  subscriptionCancelBtn: { borderWidth: 1, borderColor: "rgba(220,38,38,0.35)", backgroundColor: "rgba(220,38,38,0.05)", borderRadius: 999, paddingVertical: 13, alignItems: "center" },
  subscriptionCancelBtnText: { color: "#DC2626", fontWeight: "900" },

  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  primaryBtnText: { color: "#FFF", fontWeight: "900" },

  okBox: { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.25)" },
  okText: { color: "#15803d" },
  warnBox: { backgroundColor: "rgba(249,115,22,0.12)", borderColor: "rgba(249,115,22,0.25)" },
  warnText: { color: "#c2410c" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", padding: 18, justifyContent: "center" },
  modalCard: { backgroundColor: "#FFF", borderRadius: 22, padding: 12 },

  socialSection: {
    marginTop: 10,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: "rgba(107,39,55,0.10)",
    gap: 14,
  },

  socialSectionTitle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "900",
  },

  socialSectionSubtitle: {
    color: "rgba(58,58,58,0.60)",
    fontSize: 12,
    marginTop: -4,
  },

  socialCardInstagram: {
    backgroundColor: "#F9F1FB",
    borderColor: "#E9C8F8",
    borderRadius: 18,
    padding: 14,
  },

  socialCardTikTok: {
    backgroundColor: "#EEF9FC",
    borderColor: "#9FE7F6",
    borderRadius: 18,
    padding: 14,
  },

  socialCardFacebook: {
    backgroundColor: "#EEF4FF",
    borderColor: "#BDD4FF",
    borderRadius: 18,
    padding: 14,
  },

  socialCardWebsite: {
    backgroundColor: "#F5F5F5",
    borderColor: "#D9D9D9",
    borderRadius: 18,
    padding: 14,
  },

  socialHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  socialTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  socialIcon: {
    fontSize: 22,
  },

  socialTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },

  verifiedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  verifiedBadgeText: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "800",
  },

  socialInput: {
    marginBottom: 10,
  },

  socialInputInstagram: {
    borderColor: "#D8B4FE",
  },

  socialInputTikTok: {
    borderColor: "#67E8F9",
  },

  socialInputFacebook: {
    borderColor: "#93C5FD",
  },

  socialInputWebsite: {
    borderColor: "#D1D5DB",
  },

  socialCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "rgba(58,58,58,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },

  checkboxSquareOn: {
    backgroundColor: "#93C5FD",
    borderColor: "#93C5FD",
  },

  checkboxTick: {
    color: "#1F2937",
    fontWeight: "900",
    fontSize: 13,
  },

  socialCheckboxLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },

  connectLinkBtn: {
    alignSelf: "flex-start",
    marginTop: 2,
  },

  connectLinkText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
  },

  logoutBtn: {
    marginTop: 14,
    backgroundColor: "#DC2626",
    borderRadius: 999,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  logoutBtnText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 14,
  },

  logoutIcon: {
    fontSize: 16,
  },

  logoutModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 20,
  },

  logoutModalCard: {
    backgroundColor: "#FFF",
    borderRadius: 26,
    padding: 22,
  },

  logoutIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(220,38,38,0.1)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },

  logoutModalIcon: {
    fontSize: 28,
  },

  logoutModalTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },

  logoutModalText: {
    textAlign: "center",
    color: "rgba(58,58,58,0.7)",
    fontSize: 13,
    marginBottom: 20,
  },

  logoutModalButtons: {
    flexDirection: "row",
    gap: 10,
  },

  logoutCancelBtn: {
    flex: 1,
    backgroundColor: "#FAF7F2",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },

  logoutCancelText: {
    color: COLORS.text,
    fontWeight: "700",
  },

  logoutConfirmBtn: {
    flex: 1,
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },

 logoutConfirmText: {
    color: "#FFF",
    fontWeight: "800",
  },

  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.18)",
  },

  chipOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },

  chipTextOn: {
    color: "#FFF",
  },
});