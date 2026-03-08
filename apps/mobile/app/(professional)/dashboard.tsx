import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ProHeader } from "./components/ProHeader";

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
};
type TileProps = {
  title: string;
  href: Href; // ✅ pas string
};

function Tile(props: TileProps & { subtitle: string; icon: any; tone?: "primary" | "gold" }) {
  const tone = props.tone ?? "primary";
  return (
    <Pressable
      onPress={() => router.push(props.href)}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 },
        tone === "gold" && { borderColor: COLORS.gold },
      ]}
    >
      <View style={[styles.cardIconWrap, tone === "gold" && { backgroundColor: `${COLORS.gold}22` }]}>
        <Ionicons name={props.icon} size={20} color={tone === "gold" ? COLORS.gold : COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{props.title}</Text>
        <Text style={styles.cardSubtitle}>{props.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={`${COLORS.text}66`} />
    </Pressable>
  );
}
type KPIProps = {
  icon: any
  iconColor: string
  bgColor: string
  label: string
  value: string
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
  )
}

type QuickActionItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  withBorder?: boolean;
};

function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  const actions: QuickActionItem[] = [
    {
      label: "Ajouter un employé",
      icon: "add-outline",
      onPress: () => {
        setIsOpen(false);
        router.push("/(professional)/EmployeeManagement");
      },
      withBorder: true,
    },
    {
      label: "Ajouter un service",
      icon: "add-outline",
      onPress: () => {
        setIsOpen(false);
        router.push("/(professional)/service");
      },
      withBorder: true,
    },
    {
      label: "Bloquer un créneau",
      icon: "lock-closed-outline",
      onPress: () => {
        setIsOpen(false);
        router.push("/(professional)/booking-history");
      },
      withBorder: true,
    },
    {
      label: "Créer une promotion",
      icon: "pricetag-outline",
      onPress: () => {
        setIsOpen(false);
        router.push("/(professional)/promotions");
      },
      withBorder: true,
    },
    {
      label: "Voir fiche client",
      icon: "person-outline",
      onPress: () => {
        setIsOpen(false);
        router.push("/(professional)/client-details");
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
          style={{
            transform: [{ rotate: isOpen ? "90deg" : "0deg" }],
          }}
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
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Espace Professionnel</Text>
      <Text style={styles.headerSub}>Accès rapide à la gestion du salon</Text>
      <Text style={styles.headerDate}>
  📅 {today.charAt(0).toUpperCase() + today.slice(1)}
</Text>
    </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>

              {/* KPI */}
          <View style={styles.kpiGrid}>
            <KPI
              icon="cash-outline"
              iconColor="#16A34A"
              bgColor="#DCFCE7"
              label="Revenu cumulé (mois en cours)"
              value="2 450 000 FCFA"
            />

            <KPI
              icon="trending-up-outline"
              iconColor="#7C3AED"
              bgColor="#EDE9FE"
              label="% d'occupation"
              value="85%"
            />

            <KPI
              icon="people-outline"
              iconColor="#EA580C"
              bgColor="#FFEDD5"
              label="Nouveaux clients"
              value="3"
            />

            <KPI
              icon="card-outline"
              iconColor="#DC2626"
              bgColor="#FEE2E2"
              label="Dépenses cumulées (mois en cours)"
              value="450 000 FCFA"
            />
          </View>

          <QuickActions />
        
        <Tile title="Caisse & Transactions" subtitle="Suivi des paiements" icon="cash-outline" href="/(professional)/cash-register" />
        <Tile title="Paramètres du Salon" subtitle="Infos • Photos • Horaires • Paiements • Acompte" icon="settings-outline" href="/(professional)/salon-settings" />
        <Tile title="Promotions & Offres" subtitle="Créer et piloter vos promos" icon="pricetags-outline" href="/(professional)/promotions" tone="gold" />
        <Tile title="Carte de Fidélité" subtitle="Gestion du programme de fidélité" icon="gift-outline" href="/(professional)/loyalty" tone="gold" />
        <Tile title="Historique Réservations" subtitle="Terminé • Annulé • No-show" icon="calendar-outline" href="/(professional)/booking-history" />
  <Tile title="Fiche Client (exemple)" subtitle="Détails + gestion acompte" icon="person-outline" href="/(professional)/client-details" />

  <Tile title="Gestion des Employés" subtitle="Ajouter, modifier ou supprimer des employés" icon="people-outline" href="/(professional)/EmployeeManagement" />
  <Tile title="Dépenses & Revenus" subtitle="Gestion des dépenses et revenus du salon" icon="cash-outline" href="/(professional)/ExpenseManagement" />
  <Tile title="Rapports Comptables" subtitle="Analyse des revenus et dépenses" icon="bar-chart-outline" href="/(professional)/AccountingReports" />
  <Tile title="Service" subtitle="service & promotions" icon="service-outline" href="/(professional)/service" />
</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  headerDate: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
  },
  kpiGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: 18,
},

kpiCard: {
  width: "48%",
  backgroundColor: "#FFFFFF",
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
  color: "#3A3A3A",
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
});
