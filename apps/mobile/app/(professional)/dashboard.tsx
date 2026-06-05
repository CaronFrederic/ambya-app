import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "../../src/api/dashboard";
import { createProBlockedSlot } from "../../src/api/appointments";

const today = new Date().toLocaleDateString("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const COLORS = {
  bg: "#FAF7F2",
  primary: "#6B2737",
  primaryLight: "#8A3046",
  gold: "#D4AF6A",
  text: "#3A3A3A",
  white: "#FFFFFF",
  success: "#16A34A",
  successBg: "#DCFCE7",
  purple: "#7C3AED",
  purpleBg: "#EDE9FE",
  orange: "#EA580C",
  orangeBg: "#FFEDD5",
  red: "#DC2626",
  redBg: "#FEE2E2",
};

type KPIProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  label: string;
  value: string;
};

type QuickActionItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  withBorder?: boolean;
};

type DashboardTile = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  color?: string;
};

const EMPTY_SUMMARY: DashboardSummary = {
  todayAppointments: 0,
  monthRevenue: 0,
  monthExpenses: 0,
  newClients: 0,
  occupancyRate: 0,
};

const dashboardTiles: DashboardTile[] = [
  {
    title: "Services",
    icon: "pricetag-outline",
    href: "/(professional)/service" as Href,
  },
  {
    title: "Employés",
    icon: "people-outline",
    href: "/(professional)/team-management" as Href,
  },
  {
    title: "Dépenses",
    icon: "trending-down-outline",
    href: "/(professional)/ExpenseManagement" as Href,
    color: COLORS.red,
  },
  {
    title: "Comptabilité",
    icon: "newspaper-outline",
    href: "/(professional)/AccountingReports" as Href,
  },
  {
    title: "Caisse",
    icon: "card-outline",
    href: "/(professional)/cash-register" as Href,
    color: COLORS.success,
  },
  {
    title: "Promotions",
    icon: "pricetags-outline",
    href: "/(professional)/promotions" as Href,
    color: COLORS.gold,
  },
  {
    title: "Historique",
    icon: "time-outline",
    href: "/(professional)/booking-history" as Href,
  },
  {
    title: "Fiche Client",
    icon: "person-outline",
    href: "/(professional)/client-details" as Href,
  },
  {
    title: "Paramètres",
    icon: "settings-outline",
    href: "/(professional)/salon-settings" as Href,
  },
];

async function getAccessToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync("accessToken");
  return token ?? null;
}

function formatFcfa(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function TodayAppointmentsBanner({ count }: { count: number }) {
  return (
    <View style={styles.bannerWrap}>
      <View style={styles.bannerLeft}>
        <View style={styles.bannerIconCircle}>
          <Ionicons name="calendar-outline" size={24} color={COLORS.white} />
        </View>

        <View>
          <Text style={styles.bannerLabel}>RDV aujourd&apos;hui</Text>
          <Text style={styles.bannerValue}>{count}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push("/(professional)/agenda" as Href)}
        style={({ pressed }) => [
          styles.bannerButton,
          pressed && { opacity: 0.9 },
        ]}
      >
        <Text style={styles.bannerButtonText}>Voir l&apos;agenda</Text>
      </Pressable>
    </View>
  );
}

function KPI({ icon, iconColor, bgColor, label, value }: KPIProps) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>

      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockDate, setBlockDate] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const handleCreateBlockedSlot = async () => {
    try {
      setBlocking(true);

      const token = await getAccessToken();

      if (!token) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        return;
      }

      await createProBlockedSlot(token, {
        date: blockDate,
        startTime: blockStart,
        endTime: blockEnd,
        reason: blockReason,
      });

      Alert.alert("Succès", "Le créneau a été bloqué.");
      setShowBlockModal(false);
      setBlockDate("");
      setBlockStart("");
      setBlockEnd("");
      setBlockReason("");
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.message ?? "Impossible de bloquer le créneau."
      );
    } finally {
      setBlocking(false);
    }
  };

  const actions: QuickActionItem[] = [
    {
      label: "Ajouter un employé",
      icon: "add-outline",
      onPress: () => {
        setIsOpen(false);
        router.push("/(professional)/team-management" as Href);
      },
      withBorder: true,
    },
    {
      label: "Ajouter un service",
      icon: "add-outline",
      onPress: () => {
        setIsOpen(false);
        router.push("/(professional)/service" as Href);
      },
      withBorder: true,
    },
    {
      label: "Bloquer un créneau",
      icon: "lock-closed-outline",
      onPress: () => {
        setIsOpen(false);
        setShowBlockModal(true);
      },
      withBorder: true,
    },
    {
      label: "Créer une promotion",
      icon: "pricetag-outline",
      onPress: () => {
        setIsOpen(false);
        router.push("/(professional)/promotions" as Href);
      },
      withBorder: true,
    },
    {
      label: "Voir fiche client",
      icon: "person-outline",
      onPress: () => {
        setIsOpen(false);
        router.push("/(professional)/client-details" as Href);
      },
    },
  ];

  return (
    <View style={styles.quickActionsWrap}>
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={({ pressed }) => [
          styles.quickActionsButton,
          pressed && { opacity: 0.95 },
        ]}
      >
        <Text style={styles.quickActionsTitle}>Actions rapides</Text>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.primary}
          style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
        />
      </Pressable>

      {isOpen && (
        <View style={styles.quickActionsDropdown}>
          {actions.map((action, index) => (
            <Pressable
              key={`${action.label}-${index}`}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.quickActionItem,
                action.withBorder && styles.quickActionItemBorder,
                pressed && styles.quickActionItemPressed,
              ]}
            >
              <Ionicons
                name={action.icon}
                size={20}
                color={COLORS.primary}
                style={styles.quickActionIcon}
              />
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={showBlockModal} transparent animationType="fade">
        <View style={styles.blockModalOverlay}>
          <View style={styles.blockModalCard}>
            <View style={styles.blockModalHeader}>
              <View>
                <Text style={styles.blockModalTitle}>Bloquer un créneau</Text>
                <Text style={styles.blockModalSubtitle}>
                  Rendez indisponible une période spécifique
                </Text>
              </View>

              <Pressable onPress={() => setShowBlockModal(false)}>
                <Ionicons name="close-outline" size={28} color={COLORS.white} />
              </Pressable>
            </View>

            <View style={styles.blockModalBody}>
              <Text style={styles.blockLabel}>Date</Text>
              <TextInput
                value={blockDate}
                onChangeText={setBlockDate}
                placeholder="2026-01-07"
                style={styles.blockInput}
              />

              <Text style={styles.blockLabel}>Heure de début</Text>
              <TextInput
                value={blockStart}
                onChangeText={setBlockStart}
                placeholder="09:00"
                style={styles.blockInput}
              />

              <Text style={styles.blockLabel}>Heure de fin</Text>
              <TextInput
                value={blockEnd}
                onChangeText={setBlockEnd}
                placeholder="12:00"
                style={styles.blockInput}
              />

              <Text style={styles.blockLabel}>Raison optionnelle</Text>
              <TextInput
                value={blockReason}
                onChangeText={setBlockReason}
                placeholder="Ex: Pause déjeuner, formation..."
                style={[styles.blockInput, { height: 96, textAlignVertical: "top" }]}
                multiline
              />

              <View style={styles.blockModalActions}>
                <Pressable
                  style={styles.blockCancelBtn}
                  onPress={() => setShowBlockModal(false)}
                >
                  <Text style={styles.blockCancelText}>Annuler</Text>
                </Pressable>

                <Pressable
                  style={[styles.blockConfirmBtn, blocking && { opacity: 0.7 }]}
                  onPress={handleCreateBlockedSlot}
                  disabled={blocking}
                >
                  <Text style={styles.blockConfirmText}>
                    {blocking ? "Blocage..." : "Bloquer"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DashboardTileCard({ item }: { item: DashboardTile }) {
  return (
    <Pressable
      onPress={() => router.push(item.href)}
      style={({ pressed }) => [
        styles.dashboardTile,
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
      ]}
    >
      <Ionicons
        name={item.icon}
        size={28}
        color={item.color ?? COLORS.primary}
      />
      <Text style={styles.dashboardTileText}>{item.title}</Text>
    </Pressable>
  );
}

export default function ProDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = async () => {
    const token = await getAccessToken();

    if (!token) {
      setSummary(EMPTY_SUMMARY);
      setErrorMessage("Session expirée.");
      return;
    }

    const data = await getDashboardSummary(token);

    setSummary({
      todayAppointments: data?.todayAppointments ?? 0,
      monthRevenue: data?.monthRevenue ?? 0,
      monthExpenses: data?.monthExpenses ?? 0,
      newClients: data?.newClients ?? 0,
      occupancyRate: data?.occupancyRate ?? 0,
    });
  };

  const initialLoad = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await loadDashboard();
    } catch (error: any) {
      console.error("Dashboard load error:", error);
      setErrorMessage("Impossible de charger le dashboard.");
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setErrorMessage(null);
      await loadDashboard();
    } catch (error: any) {
      console.error("Dashboard refresh error:", error);
      setErrorMessage("Impossible d’actualiser les données.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  const kpis = useMemo(
    () => [
      {
        icon: "cash-outline" as const,
        iconColor: COLORS.success,
        bgColor: COLORS.successBg,
        label: "Revenu cumulé (mois en cours)",
        value: formatFcfa(summary.monthRevenue),
      },
      {
        icon: "trending-up-outline" as const,
        iconColor: COLORS.purple,
        bgColor: COLORS.purpleBg,
        label: "% d'occupation",
        value: `${summary.occupancyRate}%`,
      },
      {
        icon: "people-outline" as const,
        iconColor: COLORS.orange,
        bgColor: COLORS.orangeBg,
        label: "Nouveaux clients",
        value: String(summary.newClients),
      },
      {
        icon: "card-outline" as const,
        iconColor: COLORS.red,
        bgColor: COLORS.redBg,
        label: "Dépenses cumulées (mois en cours)",
        value: formatFcfa(summary.monthExpenses),
      },
    ],
    [summary],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Tableau de bord</Text>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="rgba(255,255,255,0.75)"
          />
        </View>

        <Text style={styles.headerDate}>
          {today.charAt(0).toUpperCase() + today.slice(1)}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Chargement du dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TodayAppointmentsBanner count={summary.todayAppointments} />

          <View style={styles.kpiGrid}>
            {kpis.map((kpi) => (
              <KPI
                key={kpi.label}
                icon={kpi.icon}
                iconColor={kpi.iconColor}
                bgColor={kpi.bgColor}
                label={kpi.label}
                value={kpi.value}
              />
            ))}
          </View>

          <QuickActions />

          <View style={styles.tileGrid}>
            {dashboardTiles.map((item) => (
              <DashboardTileCard key={item.title} item={item} />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 36,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "800",
  },
  headerDate: {
    color: COLORS.gold,
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 30,
  },

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

  errorBox: {
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}22`,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  bannerWrap: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bannerIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  bannerLabel: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 16,
    fontWeight: "700",
  },
  bannerValue: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  bannerButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    marginLeft: 12,
  },
  bannerButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  kpiCard: {
    width: "49%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    minHeight: 104,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 13,
    color: "rgba(58,58,58,0.6)",
    lineHeight: 18,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 4,
  },

  quickActionsWrap: {
    marginBottom: 14,
    zIndex: 20,
  },
  quickActionsButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.20)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickActionsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  quickActionsDropdown: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.10)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  quickActionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(107,39,55,0.05)",
  },
  quickActionItemPressed: {
    backgroundColor: "#FAF7F2",
  },
  quickActionIcon: {
    width: 22,
    textAlign: "center",
  },
  quickActionLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },

  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dashboardTile: {
    width: "49%",
    minHeight: 92,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.primary}14`,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  dashboardTileText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
  },
  blockModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
},

blockModalCard: {
  width: "100%",
  maxWidth: 430,
  backgroundColor: COLORS.white,
  borderRadius: 24,
  overflow: "hidden",
},

blockModalHeader: {
  backgroundColor: COLORS.primary,
  padding: 22,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
},

blockModalTitle: {
  color: COLORS.white,
  fontSize: 18,
  fontWeight: "900",
},

blockModalSubtitle: {
  color: "rgba(255,255,255,0.85)",
  marginTop: 8,
  fontWeight: "600",
},

blockModalBody: {
  padding: 22,
},

blockLabel: {
  color: COLORS.text,
  fontWeight: "800",
  marginBottom: 8,
  marginTop: 10,
},

blockInput: {
  borderWidth: 1,
  borderColor: "rgba(107,39,55,0.20)",
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 13,
  color: COLORS.text,
  backgroundColor: COLORS.white,
},

blockModalActions: {
  flexDirection: "row",
  gap: 12,
  marginTop: 24,
},

blockCancelBtn: {
  flex: 1,
  borderWidth: 1,
  borderColor: "rgba(107,39,55,0.20)",
  borderRadius: 999,
  paddingVertical: 14,
  alignItems: "center",
},

blockCancelText: {
  color: COLORS.primary,
  fontWeight: "900",
},

blockConfirmBtn: {
  flex: 1,
  backgroundColor: COLORS.primary,
  borderRadius: 999,
  paddingVertical: 14,
  alignItems: "center",
},

blockConfirmText: {
  color: COLORS.white,
  fontWeight: "900",
},
});