import { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAppointments } from "../../src/api/appointments";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/Card";

import { spacing } from "../../src/theme/spacing";
import { colors, overlays } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { typography } from "../../src/theme/typography";

type TabKey = "upcoming" | "past";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "REJECTED"
  | "COMPLETED"
  | "NO_SHOW";

type GroupedAppointment = {
  id: string;
  status: AppointmentStatus;
  startAt: string;
  salonName: string;
  services: string[];
  employeeNames: string[];
};

function toStatusUi(status: AppointmentStatus) {
  if (status === "CONFIRMED") {
    return {
      label: "Confirmé",
      border: "#7B2037",
      pillBg: "#DDF7E7",
      pillColor: "#1E9A53",
    };
  }
  if (status === "PENDING") {
    return {
      label: "En attente",
      border: "#D3A734",
      pillBg: "#FBEFCB",
      pillColor: "#A57800",
    };
  }
  if (status === "COMPLETED") {
    return {
      label: "Terminé",
      border: "#333333",
      pillBg: "#EDEFF3",
      pillColor: "#4E5A68",
    };
  }

  return {
    label: status,
    border: colors.border,
    pillBg: overlays.brand10,
    pillColor: colors.textMuted,
  };
}

function extractGroupId(note?: string | null) {
  if (!note) return null;
  const match = note.match(/\[BOOKING_GROUP:([^\]]+)\]/);
  return match?.[1] ?? null;
}

export default function AppointmentsScreen() {
  const { data, isLoading, isError, refetch } = useAppointments();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabKey>("upcoming");

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const groupedItems = useMemo<GroupedAppointment[]>(() => {
    const items = data?.items ?? [];
    const map = new Map<string, GroupedAppointment>();

    for (const item of items) {
      const groupId = extractGroupId(item.note) ?? item.id;
      const status = item.status as AppointmentStatus;

      if (!map.has(groupId)) {
        map.set(groupId, {
          id: groupId,
          status,
          startAt: item.startAt,
          salonName: item.salon.name,
          services: [item.service.name],
          employeeNames: item.employee?.displayName
            ? [item.employee.displayName]
            : [],
        });
        continue;
      }

      const existing = map.get(groupId)!;
      if (!existing.services.includes(item.service.name)) {
        existing.services.push(item.service.name);
      }
      if (
        item.employee?.displayName &&
        !existing.employeeNames.includes(item.employee.displayName)
      ) {
        existing.employeeNames.push(item.employee.displayName);
      }

      if (
        new Date(item.startAt).getTime() < new Date(existing.startAt).getTime()
      ) {
        existing.startAt = item.startAt;
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    );
  }, [data?.items]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return groupedItems.filter((a) => {
      const start = new Date(a.startAt).getTime();
      return tab === "upcoming" ? start >= now : start < now;
    });
  }, [groupedItems, tab]);

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.brandForeground}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Mes rendez-vous</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.tabsWrap}>
          <Pressable
            onPress={() => setTab("upcoming")}
            style={[
              styles.tabBtn,
              tab === "upcoming" ? styles.tabBtnActive : styles.tabBtnInactive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                tab === "upcoming"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              À venir
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("past")}
            style={[
              styles.tabBtn,
              tab === "past" ? styles.tabBtnActive : styles.tabBtnInactive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                tab === "past" ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Passés
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <Card>
            <Text>Chargement...</Text>
          </Card>
        ) : isError ? (
          <Card>
            <Text>Erreur lors du chargement.</Text>
          </Card>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {tab === "upcoming"
                  ? "Aucun rendez-vous à venir."
                  : "Aucun rendez-vous passé."}
              </Text>
            }
            renderItem={({ item }) => {
              const statusUi = toStatusUi(item.status);
              const isPastCompleted =
                tab === "past" && item.status === "COMPLETED";
              return (
                <View
                  style={[
                    styles.appointmentCard,
                    { borderLeftColor: statusUi.border },
                  ]}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.salonName}>{item.salonName}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: statusUi.pillBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: statusUi.pillColor },
                        ]}
                      >
                        {statusUi.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.serviceText} numberOfLines={2}>
                    {item.services.join(" + ")}
                  </Text>
                  {item.employeeNames.length > 0 ? (
                    <Text style={styles.employeeText}>
                      Employé: {item.employeeNames.join(", ")}
                    </Text>
                  ) : null}

                  <View style={styles.dateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={colors.textMuted}
                    />
                    <Text style={styles.dateText}>
                      {new Date(item.startAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={colors.textMuted}
                      style={{ marginLeft: spacing.sm }}
                    />
                    <Text style={styles.dateText}>
                      {new Date(item.startAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>

                  {isPastCompleted ? (
                    <>
                      <View style={styles.separator} />
                      <Pressable style={styles.reviewRow}>
                        <Ionicons
                          name="star-outline"
                          size={14}
                          color={colors.brand}
                        />
                        <Text style={styles.reviewText}>Laisser un avis</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#F3F1EE" },
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { color: colors.brandForeground, ...typography.h2 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  tabsWrap: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  tabBtn: {
    flex: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
  },
  tabBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  tabBtnInactive: { backgroundColor: "#F3F1EE", borderColor: "#D4CFCA" },
  tabText: { ...typography.body, fontWeight: "600" },
  tabTextActive: { color: colors.brandForeground },
  tabTextInactive: { color: colors.text },
  listContent: { paddingBottom: spacing.xl, gap: spacing.md },
  emptyText: { color: colors.textMuted, marginTop: spacing.md },
  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#DFDBD6",
    borderLeftWidth: 3,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  salonName: {
    color: colors.text,
    ...typography.body,
    fontWeight: "700",
    flex: 1,
  },
  serviceText: { color: colors.textMuted, ...typography.body },
  employeeText: { color: colors.textMuted, ...typography.small },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusPillText: { ...typography.small, fontWeight: "600" },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  dateText: { color: colors.textMuted, ...typography.body, marginLeft: 4 },
  separator: { height: 1, backgroundColor: "#E5E0DB", marginTop: spacing.sm },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    justifyContent: "center",
  },
  reviewText: { color: colors.brand, ...typography.body, fontWeight: "600" },
});
