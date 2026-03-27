import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import axios from "axios";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  useAppointmentGroupDetails,
  useCancelAppointmentGroup,
  useUpdateAppointmentGroup,
} from "../../src/api/appointments";
import { useSalonAvailability } from "../../src/api/discovery";
import { Screen } from "../../src/components/Screen";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { spacing } from "../../src/theme/spacing";
import { colors, overlays } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { typography } from "../../src/theme/typography";
import { useOfflineStatus } from "../../src/providers/OfflineProvider";
import { requireOnlineAction } from "../../src/offline/guard";

function getNextDays(count: number, fromIso?: string) {
  const items: Array<{ label: string; iso: string }> = [];
  const anchor = fromIso ? new Date(`${fromIso}T00:00:00.000Z`) : new Date();

  for (let i = 0; i < count; i++) {
    const next = new Date(anchor);
    next.setUTCDate(anchor.getUTCDate() + i);
    const iso = next.toISOString().slice(0, 10);
    items.push({
      iso,
      label: next.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      }),
    });
  }

  return items;
}

function formatEmployeeLabel(employee: {
  displayName: string;
  primarySpecialtyLabel?: string | null;
}) {
  return employee.primarySpecialtyLabel
    ? `${employee.displayName} - ${employee.primarySpecialtyLabel}`
    : employee.displayName;
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function extractUtcTime(dateIso: string) {
  const date = new Date(dateIso);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

function formatAppointmentTime(dateIso: string) {
  return new Date(dateIso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function getDisplayStatus(status: string, startAt: string) {
  if (status === "PENDING" && new Date(startAt).getTime() < Date.now()) {
    return "EXPIRED";
  }

  return status;
}

function shouldStrikeAmount(status: string) {
  return ["EXPIRED", "CANCELLED", "NO_SHOW", "REJECTED"].includes(status);
}

function toErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (typeof payload === "string" && payload.trim()) return payload;
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message;
    }
    if (Array.isArray(payload?.message) && payload.message.length > 0) {
      return String(payload.message[0]);
    }
  }

  return error instanceof Error
    ? error.message
    : "Impossible de modifier ce rendez-vous.";
}

export default function AppointmentDetailsScreen() {
  const params = useLocalSearchParams<{ groupId?: string }>();
  const groupId = params.groupId;
  const { isOffline } = useOfflineStatus();

  const { data, isLoading, isError, refetch } = useAppointmentGroupDetails(groupId);
  const updateGroup = useUpdateAppointmentGroup();
  const cancelGroup = useCancelAppointmentGroup();

  const firstItem = data?.items[0];
  const initialDateIso = firstItem?.startAt.slice(0, 10);
  const initialTime = firstItem ? extractUtcTime(firstItem.startAt) : undefined;
  const sharedEmployeeId = useMemo(() => {
    const employeeIds = Array.from(
      new Set((data?.items ?? []).map((item) => item.employee?.id).filter(Boolean)),
    );
    return employeeIds.length === 1 ? employeeIds[0] : null;
  }, [data?.items]);

  const [selectedDateIso, setSelectedDateIso] = useState<string | undefined>(
    undefined,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<
    string | null | undefined
  >(undefined);
  const [employeeSelectionTouched, setEmployeeSelectionTouched] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (groupId) {
        void refetch();
      }
    }, [groupId, refetch]),
  );

  useEffect(() => {
    if (!initialDateIso) return;
    setSelectedDateIso(initialDateIso);
    setSelectedTime(initialTime ?? null);
    setSelectedEmployeeId(sharedEmployeeId);
    setEmployeeSelectionTouched(false);
  }, [initialDateIso, initialTime, sharedEmployeeId]);

  const days = useMemo(() => getNextDays(14, initialDateIso), [initialDateIso]);
  const serviceIds = useMemo(
    () => (data?.items ?? []).map((item) => item.service.id),
    [data?.items],
  );

  const availability = useSalonAvailability({
    salonId: data?.salon.id,
    date: selectedDateIso,
    serviceIds,
  });

  const availableEmployees = useMemo(() => {
    if (!selectedTime) return availability.data?.professionals ?? [];
    return (availability.data?.professionals ?? []).filter((professional) =>
      professional.slots.some(
        (slot) => slot.time === selectedTime && slot.available,
      ),
    );
  }, [availability.data?.professionals, selectedTime]);

  const upcomingSlots = useMemo(() => {
    const slots = availability.data?.slots ?? [];
    if (!selectedDateIso) return slots;

    const now = new Date();

    return slots.filter((slot) => {
      if (!slot.available) return false;
      const slotDate = new Date(`${selectedDateIso}T${slot.time}:00.000Z`);
      return slotDate.getTime() > now.getTime();
    });
  }, [availability.data?.slots, selectedDateIso]);

  useEffect(() => {
    if (!selectedTime) return;
    if (!availability.isFetched) return;
    if (upcomingSlots.some((slot) => slot.time === selectedTime)) return;
    setSelectedTime(null);
    setSelectedEmployeeId(undefined);
  }, [availability.isFetched, selectedTime, upcomingSlots]);

  const nextStartAt =
    selectedDateIso && selectedTime
      ? `${selectedDateIso}T${selectedTime}:00.000Z`
      : undefined;
  const employeeChanged =
    employeeSelectionTouched &&
    (selectedEmployeeId ?? null) !== (sharedEmployeeId ?? null);
  const hasChanges =
    !!firstItem &&
    (nextStartAt !== firstItem.startAt || employeeChanged);

  const totalAmount = useMemo(
    () => (data?.items ?? []).reduce((sum, item) => sum + item.service.price, 0),
    [data?.items],
  );
  const displayStatus = firstItem
    ? getDisplayStatus(firstItem.status, firstItem.startAt)
    : undefined;
  const strikeAmount = displayStatus ? shouldStrikeAmount(displayStatus) : false;
  const canManage = Boolean(data?.canManage) && displayStatus !== "EXPIRED";

  const handleSave = async () => {
    if (!requireOnlineAction("modifier un rendez-vous")) return;
    if (!groupId || !nextStartAt || !hasChanges) return;

    try {
      await updateGroup.mutateAsync({
        groupId,
        startAt: nextStartAt,
        employeeId: employeeSelectionTouched
          ? (selectedEmployeeId ?? null)
          : undefined,
      });
      Alert.alert(
        "Rendez-vous mis à jour",
        "Les modifications ont été enregistrées.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/appointments"),
          },
        ],
      );
    } catch (error) {
      const message = toErrorMessage(error);
      Alert.alert("Modification impossible", message);
    }
  };

  const handleCancel = () => {
    if (!requireOnlineAction("annuler un rendez-vous")) return;
    if (!groupId || !data) return;

    Alert.alert(
      "Annuler ce rendez-vous ?",
      `${data.cancellationPolicy.refundLabel}. Cette action est irréversible.`,
      [
        { text: "Retour", style: "cancel" },
        {
          text: "Annuler le rendez-vous",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelGroup.mutateAsync({ groupId });
              Alert.alert(
                "Rendez-vous annulé",
                "Le rendez-vous a bien été annulé.",
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/(tabs)/appointments"),
                  },
                ],
              );
            } catch (error) {
              const message = toErrorMessage(error);
              Alert.alert("Annulation impossible", message);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.brandForeground} />
        </Pressable>
        <Text style={styles.headerTitle}>Gérer le rendez-vous</Text>
      </View>

      {isLoading ? (
        <View style={styles.content}>
          <Card>
            <Text>Chargement...</Text>
          </Card>
        </View>
      ) : isError || !data ? (
        <View style={styles.content}>
          <Card>
            <Text>Impossible de charger ce rendez-vous.</Text>
          </Card>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Card>
              <Text style={styles.salonName}>{data.salon.name}</Text>
              <Text style={styles.metaText}>
                {data.items.length > 1
                  ? `${data.items.length} prestations réservées`
                  : "1 prestation réservée"}
              </Text>
              <Text
                style={[
                  styles.totalAmountText,
                  strikeAmount ? styles.totalAmountStriked : undefined,
                ]}
              >
                Total: {formatCurrency(totalAmount)}
              </Text>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Prestations</Text>
              <View style={styles.servicesList}>
                {data.items.map((item) => (
                  <View key={item.id} style={styles.serviceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{item.service.name}</Text>
                      <Text style={styles.metaText}>
                        {item.service.durationMin} min •{" "}
                        {formatCurrency(item.service.price)}
                      </Text>
                    </View>
                    <Text style={styles.metaText}>
                      {formatAppointmentTime(item.startAt)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Politique d'annulation</Text>
              <Text style={styles.metaText}>
                {data.cancellationPolicy.refundLabel}
              </Text>
              <Text style={styles.metaText}>
                Préavis requis: {data.cancellationPolicy.noticeHoursRequired}h
              </Text>
              <Text style={styles.metaText}>
                Temps restant: {data.cancellationPolicy.noticeHoursRemaining}h
              </Text>
            </Card>

            {canManage ? (
              <>
                <Card>
                  <Text style={styles.sectionTitle}>Modifier la date</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.inlineChoices}
                  >
                    {days.map((day) => {
                      const active = selectedDateIso === day.iso;
                      return (
                        <Pressable
                          key={day.iso}
                          onPress={() => setSelectedDateIso(day.iso)}
                          style={[
                            styles.choicePill,
                            active ? styles.choicePillActive : undefined,
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceLabel,
                              active ? styles.choiceLabelActive : undefined,
                            ]}
                          >
                            {day.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Card>

                <Card>
                  <Text style={styles.sectionTitle}>Modifier l'heure</Text>
                  <View style={styles.timeGrid}>
                    {upcomingSlots.map((slot) => {
                      const active = selectedTime === slot.time;
                      return (
                        <Pressable
                          key={slot.time}
                          onPress={() => slot.available && setSelectedTime(slot.time)}
                          style={[
                            styles.timePill,
                            active ? styles.choicePillActive : undefined,
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceLabel,
                              active ? styles.choiceLabelActive : undefined,
                            ]}
                          >
                            {slot.time}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>

                <Card>
                  <Text style={styles.sectionTitle}>Modifier le professionnel</Text>
                  <View style={styles.employeeList}>
                    <Pressable
                      onPress={() => {
                        setSelectedEmployeeId(null);
                        setEmployeeSelectionTouched(true);
                      }}
                      style={[
                        styles.employeeCard,
                        selectedEmployeeId === null
                          ? styles.employeeCardActive
                          : undefined,
                      ]}
                    >
                      <Text style={styles.serviceName}>Aucune préférence</Text>
                      <Text style={styles.metaText}>
                        Le salon assigne un professionnel disponible.
                      </Text>
                    </Pressable>

                    {availableEmployees.map((employee) => {
                      const active = selectedEmployeeId === employee.id;
                      return (
                        <Pressable
                          key={employee.id}
                          onPress={() => {
                            setSelectedEmployeeId(employee.id);
                            setEmployeeSelectionTouched(true);
                          }}
                          style={[
                            styles.employeeCard,
                            active ? styles.employeeCardActive : undefined,
                          ]}
                        >
                          <Text style={styles.serviceName}>
                            {formatEmployeeLabel(employee)}
                          </Text>
                          <Text style={styles.metaText}>
                            Disponible sur ce créneau
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              </>
            ) : null}
          </ScrollView>

          {canManage ? (
            <View style={styles.bottom}>
              <Button
                title={
                  updateGroup.isPending
                    ? "Enregistrement..."
                    : "Enregistrer les modifications"
                }
                onPress={handleSave}
                disabled={isOffline || !hasChanges || updateGroup.isPending}
              />
              <Button
                title={cancelGroup.isPending ? "Annulation..." : "Annuler le rendez-vous"}
                onPress={handleCancel}
                variant="outline"
                disabled={isOffline || cancelGroup.isPending}
                style={styles.cancelButton}
                textStyle={{ color: colors.dangerText }}
              />
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { color: colors.brandForeground, ...typography.h2 },
  content: { padding: spacing.lg, paddingBottom: 180, gap: spacing.md },
  salonName: { color: colors.text, ...typography.body, fontWeight: "700" },
  sectionTitle: {
    color: colors.text,
    ...typography.body,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  metaText: { color: colors.textMuted, ...typography.small },
  totalAmountText: { color: colors.text, ...typography.body, fontWeight: "700" },
  totalAmountStriked: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  servicesList: { gap: spacing.sm },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  serviceName: { color: colors.text, ...typography.body, fontWeight: "600" },
  inlineChoices: { gap: spacing.sm },
  choicePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlays.brand20,
    backgroundColor: colors.card,
  },
  choicePillActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  choiceLabel: { color: colors.text, ...typography.small, fontWeight: "600" },
  choiceLabelActive: { color: colors.brandForeground },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  timePill: {
    minWidth: "30%",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlays.brand20,
    backgroundColor: colors.card,
  },
  employeeList: { gap: spacing.sm },
  employeeCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  employeeCardActive: {
    borderColor: colors.brand,
    borderWidth: 2,
    backgroundColor: overlays.brand05,
  },
  bottom: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
  },
  cancelButton: {
    borderColor: colors.dangerText,
    backgroundColor: colors.card,
  },
});
