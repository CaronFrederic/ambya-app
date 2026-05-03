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
} from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "../../src/api/dashboard";

const today = new Date().toLocaleDateString("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const COLORS = {
  bg: "#FAF7F2",
  primary: "#6B2737",
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

type TileProps = {
  title: string;
  href: Href;
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

const EMPTY_SUMMARY: DashboardSummary = {
  todayAppointments: 0,
  monthRevenue: 0,
  monthExpenses: 0,
  newClients: 0,
  occupancyRate: 0,
};

async function getAccessToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync("accessToken");
  return token ?? null;
}

function formatFcfa(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function Tile({
  title,
  subtitle,
  icon,
  href,
  tone = "primary",
}: TileProps & {
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: "primary" | "gold";
}) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 },
        tone === "gold" && { borderColor: COLORS.gold },
      ]}
    >
      <View
        style={[
          styles.cardIconWrap,
          tone === "gold" && { backgroundColor: `${COLORS.gold}22` },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={tone === "gold" ? COLORS.gold : COLORS.primary}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={`${COLORS.text}66`} />
    </Pressable>
  );
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
        style={({ pressed }) => [styles.bannerButton, pressed && { opacity: 0.9 }]}
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
        router.push("/(professional)/booking-history" as Href);
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
        style={({ pressed }) => [styles.quickActionsButton, pressed && { opacity: 0.95 }]}
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
    </View>
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

    const message = String(error?.message ?? "");

    if (message.toLowerCase().includes("unauthorized")) {
      setSummary(EMPTY_SUMMARY);
      setErrorMessage("Session expirée.");
      return;
    }

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

    const message = String(error?.message ?? "");

    if (message.toLowerCase().includes("unauthorized")) {
      setSummary(EMPTY_SUMMARY);
      setErrorMessage("Session expirée.");
      return;
    }

    setErrorMessage("Impossible d’actualiser les données.");
  } finally {
    setRefreshing(false);
  }
};

  useEffect(() => {
  let cancelled = false;

  const run = async () => {
    const token = await getAccessToken();

    if (!token || cancelled) {
      setLoading(false);
      setSummary(EMPTY_SUMMARY);
      setErrorMessage("Session expirée.");
      return;
    }

    await initialLoad();
  };

  run();

  return () => {
    cancelled = true;
  };
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
    [summary]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Espace Professionnel</Text>
        <Text style={styles.headerSub}>Accès rapide à la gestion du salon</Text>
        <Text style={styles.headerDate}>
          📅 {today.charAt(0).toUpperCase() + today.slice(1)}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.primary} />
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

          <Tile
            title="Agenda"
            subtitle="Planning et rendez-vous"
            icon="calendar-outline"
            href={"/(professional)/agenda" as Href}
          />

          <Tile
            title="Caisse & Transactions"
            subtitle="Suivi des paiements"
            icon="cash-outline"
            href={"/(professional)/cash-register" as Href}
          />

          <Tile
            title="Paramètres du Salon"
            subtitle="Infos • Photos • Horaires • Paiements • Acompte"
            icon="settings-outline"
            href={"/(professional)/salon-settings" as Href}
          />

          <Tile
            title="Promotions & Offres"
            subtitle="Créer et piloter vos promos"
            icon="pricetags-outline"
            href={"/(professional)/promotions" as Href}
            tone="gold"
          />

          <Tile
            title="Carte de Fidélité"
            subtitle="Gestion du programme de fidélité"
            icon="gift-outline"
            href={"/(professional)/loyalty" as Href}
            tone="gold"
          />

          <Tile
            title="Historique Réservations"
            subtitle="Terminé • Annulé • No-show"
            icon="calendar-outline"
            href={"/(professional)/booking-history" as Href}
          />

          <Tile
            title="Fiche Client (exemple)"
            subtitle="Détails + gestion acompte"
            icon="person-outline"
            href={"/(professional)/client-details" as Href}
          />

          <Tile
            title="Gestion des Employés"
            subtitle="Ajouter, modifier ou supprimer des employés"
            icon="people-outline"
            href={"/(professional)/team-management" as Href}
          />

          <Tile
            title="Dépenses & Revenus"
            subtitle="Gestion des dépenses et revenus du salon"
            icon="cash-outline"
            href={"/(professional)/ExpenseManagement" as Href}
          />

          <Tile
            title="Rapports Comptables"
            subtitle="Analyse des revenus et dépenses"
            icon="bar-chart-outline"
            href={"/(professional)/AccountingReports" as Href}
          />

          <Tile
            title="Service"
            subtitle="service & promotions"
            icon="construct-outline"
            href={"/(professional)/service" as Href}
          />
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
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },
  headerSub: {
    color: `${COLORS.white}CC`,
    marginTop: 6,
    fontSize: 13,
  },
  headerDate: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 28,
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

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: `${COLORS.primary}14`,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.primary}12`,
  },
  cardTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
  },
  cardSubtitle: {
    color: `${COLORS.text}88`,
    marginTop: 2,
    fontSize: 12,
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 12,
    color: "rgba(58,58,58,0.6)",
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  quickActionsWrap: {
    marginBottom: 16,
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
    fontWeight: "600",
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
    fontWeight: "500",
  },

  bannerWrap: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 18,
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
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  bannerLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    fontWeight: "500",
  },
  bannerValue: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  bannerButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginLeft: 12,
  },
  bannerButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
