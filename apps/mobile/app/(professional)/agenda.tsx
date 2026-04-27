import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { ProHeader } from "./components/ProHeader";
import {
  getCalendarAppointments,
  type ProAppointmentCalendarItem,
} from "../../src/api/pro-appointments";

type AppointmentStatus = "confirmed" | "pending" | "cancelled";

type Appointment = {
  id: string;
  time: string;
  staff: string;
  client: string;
  service: string;
  duration: string;
  status: AppointmentStatus;
};

type DayItem = {
  day: string;
  date: number;
  fullDate: string;
};

const CALENDAR_HREF: Href = "/(professional)/pro-calendar";



function safeDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTime(dateString?: string | null) {
  const d = safeDate(dateString);
  if (!d) return "Heure invalide";

  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startAt?: string | null, endAt?: string | null) {
  const start = safeDate(startAt);
  const end = safeDate(endAt);

  if (!start || !end) return "Durée inconnue";

  const diffMin = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60000)
  );

  if (diffMin >= 60) {
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m === 0 ? `${h}h` : `${h}h${m}`;
  }

  return `${diffMin}min`;
}

function mapStatus(status: ProAppointmentCalendarItem["status"]): AppointmentStatus {
  if (status === "PENDING") return "pending";
  if (status === "CONFIRMED") return "confirmed";
  return "cancelled";
}

function buildWeekDays() {
  const base = new Date();
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);

  const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
  const result: DayItem[] = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    result.push({
      day: labels[i],
      date: d.getDate(),
      fullDate: d.toISOString().slice(0, 10),
    });
  }

  return result;
}

export default function AgendaScreen() {
  const days = useMemo(() => buildWeekDays(), []);
  const [selectedDate, setSelectedDate] = useState<string>(
    days[0]?.fullDate ?? new Date().toISOString().slice(0, 10)
  );
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const selectedDayMeta = useMemo(
    () => days.find((d) => d.fullDate === selectedDate),
    [days, selectedDate]
  );

  const openNewRequests = () => {
    router.push(CALENDAR_HREF);
  };

 const loadAgenda = async (dateToLoad: string) => {
  const data = await getCalendarAppointments(dateToLoad);

  console.log("AGENDA RAW DATA", JSON.stringify(data, null, 2));

  const mapped = data.map((item) => ({
    id: item.id,
    time: formatTime(item.startAt),
    staff: item.employeeName || "Non assigné",
    client: item.clientName || "Client non renseigné",
    service: item.serviceName || "Service non renseigné",
    duration: formatDuration(item.startAt, item.endAt),
    status: mapStatus(item.status),
  }));

  setAppointments(mapped);
  setPendingCount(data.filter((a) => a.status === "PENDING").length);
};

  const initialLoad = async () => {
    try {
      setLoading(true);
      await loadAgenda(selectedDate);
    } catch (error) {
      console.error("Agenda load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAgenda(selectedDate);
    } catch (error) {
      console.error("Agenda refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadAgenda(selectedDate).catch((error) => {
        console.error("Agenda date reload error:", error);
      });
    }
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <ProHeader title="Agenda" backTo={"/(professional)/dashboard" as const} />

      <View style={styles.headerActionWrap}>
        <Pressable onPress={openNewRequests} style={styles.newBtn}>
          <Ionicons name="add" size={16} color="#6B2737" />
          <Text style={styles.newBtnText}>Nouveau RDV</Text>

          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#6B2737" />
          <Text style={styles.loaderText}>Chargement de l'agenda...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysWrap}
          >
            {days.map(({ day, date, fullDate }) => {
              const active = selectedDate === fullDate;
              return (
                <Pressable
                  key={fullDate}
                  onPress={() => setSelectedDate(fullDate)}
                  style={[styles.dayCard, active && styles.dayCardActive]}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
                  <Text style={[styles.dayDate, active && styles.dayTextActive]}>{date}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ gap: 14 }}>
            {appointments.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={28} color="rgba(107,39,55,0.55)" />
                <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
                <Text style={styles.emptyText}>
                  Aucun créneau planifié pour cette journée.
                </Text>
              </View>
            ) : (
              appointments.map((apt) => (
                <Pressable
                  key={apt.id}
                  onPress={() => setSelectedAppointment(apt)}
                  style={styles.appointmentCard}
                >
                  <View style={styles.appointmentAccent} />

                  <View style={{ flex: 1 }}>
                    <View style={styles.appointmentTopRow}>
                      <Text style={styles.time}>{apt.time}</Text>

                      <View
                        style={[
                          styles.statusPill,
                          apt.status === "confirmed"
                            ? styles.statusConfirmed
                            : apt.status === "pending"
                            ? styles.statusPending
                            : styles.statusCancelled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            apt.status === "confirmed"
                              ? { color: "#15803d" }
                              : apt.status === "pending"
                              ? { color: "#a16207" }
                              : { color: "#b91c1c" },
                          ]}
                        >
                          {apt.status === "confirmed"
                            ? "Confirmé"
                            : apt.status === "pending"
                            ? "En attente"
                            : "Annulé"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.clientService}>
                      {apt.client} • {apt.service}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>{apt.staff}</Text>
                      <Text style={styles.metaText}>{apt.duration}</Text>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      )}

      <Modal
        visible={!!selectedAppointment}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAppointment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détail du rendez-vous</Text>
              <Pressable onPress={() => setSelectedAppointment(null)} hitSlop={12}>
                <Ionicons name="close" size={22} color="#3A3A3A" />
              </Pressable>
            </View>

            {selectedAppointment && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Heure</Text>
                  <Text style={styles.detailValue}>{selectedAppointment.time}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Client</Text>
                  <Text style={styles.detailValue}>{selectedAppointment.client}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Service</Text>
                  <Text style={styles.detailValue}>{selectedAppointment.service}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Employé</Text>
                  <Text style={styles.detailValue}>{selectedAppointment.staff}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Durée</Text>
                  <Text style={styles.detailValue}>{selectedAppointment.duration}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Statut</Text>
                  <Text style={styles.detailValue}>
                    {selectedAppointment.status === "confirmed"
                      ? "Confirmé"
                      : selectedAppointment.status === "pending"
                      ? "En attente"
                      : "Annulé"}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setSelectedAppointment(null)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>Fermer</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },

  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    color: "#6B2737",
    fontWeight: "700",
  },

  headerActionWrap: {
    paddingHorizontal: 18,
    marginTop: -42,
    marginBottom: 8,
    alignItems: "flex-end",
  },

  newBtn: {
    backgroundColor: "#D4AF6A",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  newBtnText: {
    color: "#6B2737",
    fontWeight: "800",
    fontSize: 14,
  },

  badge: {
    position: "absolute",
    top: -8,
    right: -6,
    minWidth: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  daysWrap: {
    gap: 10,
    paddingVertical: 12,
    marginBottom: 18,
  },
  dayCard: {
    width: 84,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.15)",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardActive: {
    backgroundColor: "#6B2737",
    borderColor: "#6B2737",
  },
  dayText: {
    color: "#3A3A3A",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 4,
  },
  dayDate: {
    color: "#3A3A3A",
    fontWeight: "900",
    fontSize: 16,
  },
  dayTextActive: {
    color: "#fff",
  },

  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  appointmentAccent: {
    width: 4,
    borderRadius: 999,
    backgroundColor: "#6B2737",
  },

  appointmentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  time: {
    color: "#6B2737",
    fontWeight: "800",
    fontSize: 16,
  },

  statusPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusConfirmed: {
    backgroundColor: "#dcfce7",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
  },
  statusCancelled: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },

  clientService: {
    color: "#3A3A3A",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 14,
  },
  metaText: {
    color: "rgba(58,58,58,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },

  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    color: "#3A3A3A",
    fontWeight: "800",
    fontSize: 16,
  },
  emptyText: {
    color: "rgba(58,58,58,0.6)",
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    color: "#6B2737",
    fontSize: 18,
    fontWeight: "900",
  },

  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(107,39,55,0.08)",
  },
  detailLabel: {
    color: "rgba(58,58,58,0.6)",
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: "#3A3A3A",
    fontSize: 15,
    fontWeight: "700",
  },

  closeBtn: {
    marginTop: 16,
    backgroundColor: "#6B2737",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
});