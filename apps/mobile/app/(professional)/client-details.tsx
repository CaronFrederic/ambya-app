import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, TextInput } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ProHeader } from "./components/ProHeader";

const COLORS = {
  bg: "#FAF7F2",
  white: "#FFFFFF",
  text: "#3A3A3A",
  primary: "#6B2737",
  gold: "#D4AF6A",
  green: "#16A34A",
  greenBg: "rgba(34,197,94,0.12)",
  red: "#DC2626",
  redBg: "rgba(220,38,38,0.12)",
  soft: "rgba(107,39,55,0.06)",
  border: "rgba(107,39,55,0.12)",
  muted: "rgba(58,58,58,0.55)",
};

type BookingStatus = "Terminé" | "Annulé";

type Booking = {
  id: number;
  date: string;
  service: string;
  employee: string;
  amount: string;
  status: BookingStatus;
};

type PreferredEmployee = {
  id: number;
  name: string;
  count: number;
};

export default function ClientDetailsScreen() {
  const params = useLocalSearchParams<{ client?: string }>();
  const clientName = params.client ?? "Marie Kouassi";

  const [depositExempt, setDepositExempt] = useState(false);
  const [privateNotes, setPrivateNotes] = useState(
    "Préfère les RDV le matin. Très ponctuel. Aime discuter."
  );

  const bookings: Booking[] = [
    { id: 1, date: "25 Jan 2026", service: "Tresses Nattes", employee: "Marie", amount: "25 000 FCFA", status: "Terminé" },
    { id: 2, date: "10 Jan 2026", service: "Manucure Classique", employee: "Jean", amount: "15 000 FCFA", status: "Terminé" },
    { id: 3, date: "28 Déc 2025", service: "Brushing", employee: "Sophie", amount: "18 000 FCFA", status: "Terminé" },
    { id: 4, date: "15 Déc 2025", service: "Tresses Nattes", employee: "Marie", amount: "25 000 FCFA", status: "Terminé" },
    { id: 5, date: "5 Déc 2025", service: "Manucure Classique", employee: "Jean", amount: "15 000 FCFA", status: "Annulé" },
  ];

  const preferredEmployees: PreferredEmployee[] = [
    { id: 1, name: "Marie", count: 5 },
    { id: 2, name: "Jean", count: 2 },
  ];

  const preferredServices = [
    { name: "Tresses Nattes", count: 4 },
    { name: "Manucure Classique", count: 2 },
    { name: "Brushing", count: 2 },
  ];

  return (
    <View style={styles.screen}>
      <ProHeader title="Fiche Client" backTo="/(professional)/dashboard" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header client */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={34} color={COLORS.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>{clientName}</Text>

              <View style={styles.pillGold}>
                <Text style={styles.pillGoldText}>⭐ Client régulier</Text>
              </View>

              <View style={styles.inlineInfoRow}>
                <Ionicons name="call-outline" size={14} color={COLORS.text} />
                <Text style={styles.sub}>+241 77 11 22 33</Text>
              </View>

              <Text style={styles.mini}>Cliente depuis le 12 Oct 2025</Text>
            </View>
          </View>
        </View>

        {/* Gestion acompte */}
        <View style={[styles.card, styles.depositCard]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Gestion Acompte</Text>
          </View>

          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Dispenser ce client de l'acompte</Text>
              <Text style={styles.mini}>Le client pourra payer entièrement sur place</Text>
            </View>
            <Switch value={depositExempt} onValueChange={setDepositExempt} />
          </View>

          <View style={[styles.notice, depositExempt ? styles.noticeGold : styles.noticeGray]}>
            <Ionicons
              name={depositExempt ? "lock-open-outline" : "lock-closed-outline"}
              size={16}
              color={depositExempt ? COLORS.primary : "rgba(0,0,0,0.6)"}
            />
            <Text
              style={[
                styles.noticeText,
                depositExempt ? styles.noticeGoldText : styles.noticeGrayText,
              ]}
            >
              {depositExempt
                ? "Ce client est dispensé d'acompte"
                : "Ce client doit régler un acompte de 30%"}
            </Text>
          </View>

          <View style={styles.depositStatsRow}>
            <View style={styles.depositStatCol}>
              <Text style={styles.depositStatLabel}>Acomptes réglés</Text>
              <Text style={styles.depositStatValue}>3</Text>
            </View>
            <View style={styles.depositStatCol}>
              <Text style={styles.depositStatLabel}>Total acomptes</Text>
              <Text style={styles.depositStatValue}>21 000 FCFA</Text>
            </View>
          </View>
        </View>

        {/* Alerte allergie */}
        <View style={styles.alert}>
          <Ionicons name="alert-circle-outline" size={22} color="#B91C1C" style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>⚠️ Allergie aux produits chimiques forts</Text>
            <Text style={styles.alertSub}>Privilégier les produits naturels et bio</Text>
          </View>
        </View>

        {/* Statistiques client */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitleAccent}>📊 Statistiques Client</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>Réservations</Text>
              <Text style={styles.statsValue}>8</Text>
              <Text style={styles.statsSub}>7 terminées • 1 annulée</Text>
            </View>

            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>CA généré</Text>
              <Text style={styles.statsValue}>185000</Text>
              <Text style={styles.statsSub}>FCFA</Text>
            </View>

            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>Panier moyen</Text>
              <Text style={styles.statsValue}>23125</Text>
              <Text style={styles.statsSub}>FCFA</Text>
            </View>

            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>Dernière visite</Text>
              <Text style={styles.statsValueDark}>Il y a 12 jours</Text>
            </View>
          </View>

          <View style={styles.loyaltyRow}>
            <Text style={styles.loyaltyLabel}>Taux de fidélité</Text>
            <Text style={styles.loyaltyValue}>✓ 87% - Client très fidèle</Text>
          </View>

          <View style={styles.loyaltyRow}>
            <Text style={styles.loyaltyLabel}>Taux de no-show</Text>
            <Text style={styles.loyaltyValue}>✓ 0% - Toujours présent</Text>
          </View>
        </View>

        {/* Historique des réservations */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitleAccent}>🕒 Historique des Réservations</Text>
            <Pressable>
              <Text style={styles.linkText}>Voir tout</Text>
            </Pressable>
          </View>

          <View style={styles.historyHeader}>
            <Text style={[styles.historyHeaderText, { flex: 1.15 }]}>Date</Text>
            <Text style={[styles.historyHeaderText, { flex: 1.7 }]}>Service</Text>
            <Text style={[styles.historyHeaderText, { flex: 1.1 }]}>Employé</Text>
            <Text style={[styles.historyHeaderText, { flex: 1.05, textAlign: "right" }]}>Montant</Text>
          </View>

          {bookings.map((booking) => (
            <View key={booking.id} style={styles.historyRow}>
              <Text style={[styles.historyCell, { flex: 1.15 }]}>{booking.date}</Text>
              <Text style={[styles.historyCell, { flex: 1.7 }]}>{booking.service}</Text>
              <Text style={[styles.historyCell, { flex: 1.1 }]}>{booking.employee}</Text>

              <View style={{ flex: 1.3, alignItems: "flex-end" }}>
                <Text style={styles.historyCellAmount}>{booking.amount}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    booking.status === "Terminé" ? styles.statusDone : styles.statusCanceled,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      booking.status === "Terminé"
                        ? styles.statusDoneText
                        : styles.statusCanceledText,
                    ]}
                  >
                    {booking.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Services préférés */}
        <View style={styles.card}>
          <Text style={styles.sectionTitleAccent}>⭐ Services Préférés</Text>

          {preferredServices.map((service, idx) => (
            <View key={service.name} style={styles.preferredRow}>
              <View style={styles.preferredRank}>
                <Text style={styles.preferredRankText}>{idx + 1}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.preferredTitle}>{service.name}</Text>
                <Text style={styles.preferredCountSub}>{service.count} fois</Text>
              </View>
            </View>
          ))}

          <Pressable style={styles.outlineBtnLarge}>
            <Text style={styles.outlineBtnText}>Créer une offre personnalisée pour ce client</Text>
          </Pressable>
        </View>

        {/* Employés préférés */}
        <View style={styles.card}>
          <Text style={styles.sectionTitleAccent}>👥 Employé(s) Préféré(s)</Text>

          <View style={styles.employeeWrap}>
            {preferredEmployees.map((employee) => (
              <View key={employee.id} style={styles.employeeItem}>
                <View style={styles.employeeAvatar}>
                  <Text style={styles.employeeAvatarText}>{employee.name.slice(0, 1)}</Text>
                </View>

                <View>
                  <Text style={styles.employeeName}>{employee.name}</Text>
                  <Text style={styles.employeeSub}>{employee.count} RDV</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Notes privées */}
        <View style={styles.card}>
          <Text style={styles.sectionTitleAccent}>💬 Notes Privées du Salon</Text>

          <TextInput
            value={privateNotes}
            onChangeText={setPrivateNotes}
            multiline
            textAlignVertical="top"
            style={styles.notesInput}
          />

          <Pressable style={styles.primaryBtnWithIcon}>
            <Ionicons name="save-outline" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Enregistrer les notes</Text>
          </Pressable>

          <View style={styles.privateNoticeRow}>
            <Ionicons name="lock-closed-outline" size={14} color={COLORS.muted} />
            <Text style={styles.privateNoticeText}>
              Ces notes sont privées et ne sont visibles que par votre salon
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={{ gap: 12 }}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push("/(professional)/booking-history")}
          >
            <Text style={styles.primaryBtnText}>Créer un RDV pour ce client</Text>
          </Pressable>

          <Pressable style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Envoyer une notification</Text>
          </Pressable>

          <Pressable>
            <Text style={styles.dangerText}>Bloquer ce client</Text>
          </Pressable>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  content: {
    padding: 18,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },

  headerRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(107,39,55,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  h1: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 22,
    marginBottom: 6,
  },

  pillGold: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212,175,106,0.20)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },

  pillGoldText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 11,
  },

  inlineInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  sub: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },

  mini: {
    color: COLORS.muted,
    fontWeight: "600",
    marginTop: 5,
    fontSize: 12,
  },

  depositCard: {
    borderWidth: 2,
    borderColor: "rgba(212,175,106,0.30)",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  sectionTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 15,
  },

  sectionTitleAccent: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 12,
  },

  title: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  notice: {
    marginTop: 14,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  noticeText: {
    fontWeight: "700",
    fontSize: 13,
    flex: 1,
  },

  noticeGold: {
    backgroundColor: "rgba(212,175,106,0.20)",
    borderColor: "rgba(212,175,106,0.40)",
  },

  noticeGoldText: {
    color: COLORS.primary,
  },

  noticeGray: {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderColor: "rgba(0,0,0,0.12)",
  },

  noticeGrayText: {
    color: "rgba(0,0,0,0.6)",
  },

  depositStatsRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(107,39,55,0.10)",
    flexDirection: "row",
    gap: 12,
  },

  depositStatCol: {
    flex: 1,
  },

  depositStatLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 4,
  },

  depositStatValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },

  alert: {
    backgroundColor: "rgba(220,38,38,0.10)",
    borderWidth: 2,
    borderColor: "rgba(220,38,38,0.28)",
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },

  alertTitle: {
    color: "#991B1B",
    fontWeight: "900",
    marginBottom: 6,
    fontSize: 14,
  },

  alertSub: {
    color: "#B91C1C",
    fontStyle: "italic",
    fontWeight: "600",
    fontSize: 13,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  statsCard: {
    width: "48%",
    backgroundColor: "#F7F2ED",
    borderRadius: 20,
    padding: 16,
    minHeight: 120,
    justifyContent: "space-between",
  },

  statsLabel: {
    color: "rgba(58,58,58,0.60)",
    fontSize: 12,
    marginBottom: 10,
  },

  statsValue: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "900",
  },

  statsValueDark: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },

  statsSub: {
    color: "rgba(58,58,58,0.60)",
    fontSize: 11,
    marginTop: 6,
  },

  loyaltyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14,
  },

  loyaltyLabel: {
    color: COLORS.muted,
    fontSize: 13,
    flex: 1,
  },

  loyaltyValue: {
    color: COLORS.green,
    fontWeight: "800",
    fontSize: 13,
    textAlign: "right",
    flex: 1,
  },

  linkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  historyHeader: {
    flexDirection: "row",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(107,39,55,0.10)",
  },

  historyHeaderText: {
    color: "rgba(58,58,58,0.55)",
    fontSize: 12,
    fontWeight: "700",
  },

  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(107,39,55,0.08)",
  },

  historyCell: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },

  historyCellAmount: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "right",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-end",
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  statusDone: {
    backgroundColor: "rgba(34,197,94,0.16)",
  },

  statusDoneText: {
    color: "#15803D",
  },

  statusCanceled: {
    backgroundColor: "rgba(220,38,38,0.12)",
  },

  statusCanceledText: {
    color: "#DC2626",
  },

  preferredRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  preferredRank: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  preferredRankText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 16,
  },

  preferredTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  preferredCountSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },

  employeeWrap: {
    flexDirection: "row",
    gap: 22,
    flexWrap: "wrap",
  },

  employeeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  employeeAvatarText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
  },

  employeeName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  employeeSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },

  notesInput: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.20)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 14,
    backgroundColor: "#FFF",
    marginBottom: 14,
  },

  primaryBtnWithIcon: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  privateNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },

  privateNoticeText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },

  primaryBtnText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 15,
  },

  outlineBtn: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "#FFF",
  },

  outlineBtnLarge: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "#FFF",
    marginTop: 10,
  },

  outlineBtnText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 15,
  },

  dangerText: {
    color: COLORS.red,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
});