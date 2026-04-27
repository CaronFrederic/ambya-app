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
import type { Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ProHeader } from "./components/ProHeader";
import {
  confirmAppointment,
  getCalendarAppointments,
  getPendingAppointments,
  rejectAppointment,
  type ProPendingAppointmentItem,
} from "../../src/api/pro-appointments";


type PendingRequest = {
  id: string;
  time: string;
  client: string;
  service: string;
  duration: string;
  phone: string;
};

const AGENDA_HREF: Href = "/(professional)/agenda";




function buildWeekDays() {
  const base = new Date();
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);

  const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  return labels.map((label, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);

    return {
      day: label,
      date: d.getDate(),
      fullDate: d.toISOString().slice(0, 10),
    };
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const diffMin = Math.max(0, Math.round((end - start) / 60000));

  if (diffMin >= 60) {
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m === 0 ? `${h}h` : `${h}h${m}`;
  }

  return `${diffMin}min`;
}

function mapPendingRequest(item: ProPendingAppointmentItem): PendingRequest {
  return {
    id: item.id,
    time: formatTime(item.startAt),
    client: item.clientName || "Client non renseigné",
    service: item.serviceName || "Service non renseigné",
    duration: formatDuration(item.startAt, item.endAt),
    phone: item.clientPhone ?? "Non renseigné",
  };
}

export default function ProCalendarScreen() {
  const weekDays = useMemo(() => buildWeekDays(), []);
  const [selectedDate, setSelectedDate] = useState<string>(
    weekDays[2]?.fullDate ?? new Date().toISOString().slice(0, 10)
  );
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [modalType, setModalType] = useState<"accept" | "reject" | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const headerSubtitle = useMemo(() => {
    return `${pendingRequests.length} demande${pendingRequests.length > 1 ? "s" : ""} en attente`;
  }, [pendingRequests.length]);

  const loadPendingRequests = async (dateToLoad: string) => {
  const data = await getPendingAppointments(dateToLoad);

  console.log("PENDING RAW DATA", JSON.stringify(data, null, 2));

  setPendingRequests(data.map(mapPendingRequest));
};

  const initialLoad = async () => {
    try {
      setLoading(true);
      await loadPendingRequests(selectedDate);
    } catch (error) {
      console.error("Pending requests load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadPendingRequests(selectedDate);
    } catch (error) {
      console.error("Pending requests refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadPendingRequests(selectedDate).catch((error) => {
        console.error("Pending requests date reload error:", error);
      });
    }
  }, [selectedDate]);

  const acceptCurrentAppointment = async (id: string) => {
    try {
      setProcessingId(id);
      
      await confirmAppointment(id);
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
      setSelectedRequest(null);
      setModalType(null);
    } catch (error) {
      console.error("Accept appointment error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectCurrentAppointment = async (id: string) => {
    try {
      setProcessingId(id);
      
      await rejectAppointment(id);
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
      setSelectedRequest(null);
      setModalType(null);
    } catch (error) {
      console.error("Reject appointment error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <ProHeader
        title="Demandes de rendez-vous"
        subtitle={headerSubtitle}
        backTo={AGENDA_HREF}
      />

      <View style={styles.weekWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekContent}
        >
          {weekDays.map(({ day, date, fullDate }) => {
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
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#6B2737" />
          <Text style={styles.loaderText}>Chargement des demandes...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={30} color="#6B2737" />
              </View>
              <Text style={styles.emptyTitle}>Aucune demande en attente</Text>
              <Text style={styles.emptyText}>
                Toutes les demandes ont été traitées.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.clientRow}>
                    <View style={styles.userIconWrap}>
                      <Ionicons name="person-outline" size={22} color="#6B2737" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientName}>{request.client}</Text>
                      <Text style={styles.clientPhone}>{request.phone}</Text>
                    </View>
                  </View>

                  <View style={styles.infoGroup}>
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={16} color="#6B2737" />
                      <Text style={styles.infoText}>
                        {request.time} ({request.duration})
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="pricetag-outline" size={16} color="#6B2737" />
                      <Text style={styles.infoText}>{request.service}</Text>
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={() => {
                        setSelectedRequest(request);
                        setModalType("reject");
                      }}
                      style={styles.rejectBtn}
                    >
                      <Text style={styles.rejectBtnText}>Refuser</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setSelectedRequest(request);
                        setModalType("accept");
                      }}
                      style={styles.acceptBtn}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={styles.acceptBtnText}>Accepter</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 28 }} />
        </ScrollView>
      )}

      <Modal
        visible={!!selectedRequest && !!modalType}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSelectedRequest(null);
          setModalType(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalType === "accept" ? "Accepter la demande ?" : "Refuser la demande ?"}
            </Text>

            {selectedRequest && (
              <>
                <Text style={styles.modalText}>
                  {selectedRequest.client} • {selectedRequest.service} • {selectedRequest.time}
                </Text>

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => {
                      setSelectedRequest(null);
                      setModalType(null);
                    }}
                    style={styles.modalCancelBtn}
                    disabled={!!processingId}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </Pressable>

                  {modalType === "accept" ? (
                    <Pressable
                      onPress={() => acceptCurrentAppointment(selectedRequest.id)}
                      style={styles.modalAcceptBtn}
                      disabled={processingId === selectedRequest.id}
                    >
                      {processingId === selectedRequest.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.modalAcceptText}>Confirmer</Text>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => rejectCurrentAppointment(selectedRequest.id)}
                      style={styles.modalRejectBtn}
                      disabled={processingId === selectedRequest.id}
                    >
                      {processingId === selectedRequest.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.modalRejectText}>Refuser</Text>
                      )}
                    </Pressable>
                  )}
                </View>
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

  weekWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(107,39,55,0.08)",
  },
  weekContent: {
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  dayCard: {
    width: 84,
    borderRadius: 20,
    backgroundColor: "#FAF7F2",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.16)",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCardActive: {
    backgroundColor: "#6B2737",
    borderColor: "#6B2737",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
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

  content: {
    padding: 18,
    paddingBottom: 24,
  },

  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },

  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  userIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(107,39,55,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  clientName: {
    color: "#3A3A3A",
    fontWeight: "900",
    fontSize: 16,
  },
  clientPhone: {
    marginTop: 2,
    color: "rgba(58,58,58,0.6)",
    fontSize: 13,
  },

  infoGroup: {
    gap: 8,
    marginBottom: 16,
    paddingLeft: 56,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    color: "#3A3A3A",
    fontSize: 14,
    fontWeight: "600",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },

  rejectBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#fecaca",
    backgroundColor: "#fff",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    color: "#dc2626",
    fontWeight: "800",
    fontSize: 15,
  },

  acceptBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#6B2737",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  acceptBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 999,
    backgroundColor: "rgba(107,39,55,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#3A3A3A",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
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
  modalTitle: {
    color: "#6B2737",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  modalText: {
    color: "#3A3A3A",
    fontSize: 14,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },

  modalCancelBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#FAF7F2",
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#3A3A3A",
    fontWeight: "800",
  },

  modalAcceptBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#6B2737",
    paddingVertical: 14,
    alignItems: "center",
  },
  modalAcceptText: {
    color: "#fff",
    fontWeight: "900",
  },

  modalRejectBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    alignItems: "center",
  },
  modalRejectText: {
    color: "#fff",
    fontWeight: "900",
  },
});