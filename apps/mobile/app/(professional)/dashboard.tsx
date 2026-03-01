import React from "react";
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
        <Tile title="Caisse & Transactions" subtitle="Suivi des paiements" icon="cash-outline" href="/(professional)/cash-register" />
        <Tile title="Paramètres du Salon" subtitle="Infos • Photos • Horaires • Paiements • Acompte" icon="settings-outline" href="/(professional)/salon-settings" />
        <Tile title="Promotions & Offres" subtitle="Créer et piloter vos promos" icon="pricetags-outline" href="/(professional)/promotions" tone="gold" />
        <Tile title="Carte de Fidélité" subtitle="Programme personnalisé salon" icon="gift-outline" href="/(professional)/loyalty" tone="gold" />
        <Tile title="Historique Réservations" subtitle="Terminé • Annulé • No-show" icon="calendar-outline" href="/(professional)/booking-history" />
  <Tile title="Fiche Client (exemple)" subtitle="Détails + gestion acompte" icon="person-outline" href="/(professional)/client-details" />

  <Tile title="Gestion des Employés" subtitle="Ajouter, modifier ou supprimer des employés" icon="people-outline" href="/(professional)/EmployeeManagement" />
  <Tile title="Dépenses & Revenus" subtitle="Gestion des dépenses et revenus du salon" icon="cash-outline" href="/(professional)/ExpenseManagement" />
  <Tile title="Rapports Comptables" subtitle="Analyse des revenus et dépenses" icon="bar-chart-outline" href="/(professional)/AccountingReports" />
  <Tile title="Fidélité" subtitle="Gestion du programme de fidélité" icon="gift-outline" href="/(professional)/loyalty" />
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
});
