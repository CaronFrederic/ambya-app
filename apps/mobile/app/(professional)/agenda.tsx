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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";

import { ProHeader } from "./components/ProHeader";
import {
  createManualAppointment,
  getCalendarAppointments,
  getManualAppointmentOptions,
  getPendingAppointmentCount,
  type ProAppointmentCalendarItem,
  type ProManualAppointmentClientOption,
  type ProManualAppointmentEmployeeOption,
  type ProManualAppointmentServiceOption,
} from "../../src/api/pro-appointments";

type AppointmentStatus =
  | "confirmed"
  | "in_progress"
  | "completed";

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

const REQUESTS_HREF = "/(professional)/pro-calendar" as Href;

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

function mapStatus(
  status: ProAppointmentCalendarItem["status"]
): AppointmentStatus {
  if (status === "IN_PROGRESS") return "in_progress";
  if (status === "COMPLETED") return "completed";
  return "confirmed";
}

function statusLabel(status: AppointmentStatus) {
  if (status === "in_progress") return "En cours";
  if (status === "completed") return "Terminé";
  return "Confirmé";
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

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("fr-FR");
}

export default function AgendaScreen() {
  const days = useMemo(() => buildWeekDays(), []);

  const [selectedDate, setSelectedDate] = useState<string>(
    days[0]?.fullDate ?? new Date().toISOString().slice(0, 10)
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualOptionsLoading, setManualOptionsLoading] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState("");

  const [clients, setClients] = useState<ProManualAppointmentClientOption[]>([]);
  const [services, setServices] = useState<ProManualAppointmentServiceOption[]>([]);
  const [employees, setEmployees] = useState<
    ProManualAppointmentEmployeeOption[]
  >([]);

  const [clientSearch, setClientSearch] = useState("");
  const [selectedSalonClientId, setSelectedSalonClientId] = useState("");
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [manualDate, setManualDate] = useState(selectedDate);
  const [manualTime, setManualTime] = useState("");
  const [manualNote, setManualNote] = useState("");

  const filteredClients = useMemo(() => {
    const query = normalizeSearch(clientSearch);

    if (!query) {
      return clients.slice(0, 12);
    }

    return clients
      .filter((client) => {
        return (
          normalizeSearch(client.name).includes(query) ||
          normalizeSearch(client.phone ?? "").includes(query) ||
          normalizeSearch(client.email ?? "").includes(query)
        );
      })
      .slice(0, 12);
  }, [clients, clientSearch]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  const loadPendingCount = async () => {
    const result = await getPendingAppointmentCount();
    setPendingCount(result.count);
  };

  const loadAgenda = async (dateToLoad: string) => {
    const data = await getCalendarAppointments(dateToLoad);

    const mapped: Appointment[] = data.map((item) => ({
      id: item.id,
      time: formatTime(item.startAt),
      staff: item.employeeName || "Non assigné",
      client: item.clientName || "Client non renseigné",
      service: item.serviceName || "Service non renseigné",
      duration: formatDuration(item.startAt, item.endAt),
      status: mapStatus(item.status),
    }));

    setAppointments(mapped);
  };

  const loadAgendaAndCount = async (dateToLoad: string) => {
    await Promise.all([loadAgenda(dateToLoad), loadPendingCount()]);
  };

  const initialLoad = async () => {
    try {
      setLoading(true);
      await loadAgendaAndCount(selectedDate);
    } catch (error) {
      console.error("Agenda load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAgendaAndCount(selectedDate);
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

  const resetManualForm = () => {
    setClientSearch("");
    setSelectedSalonClientId("");
    setIsNewClient(false);
    setNewClientName("");
    setNewClientPhone("");
    setSelectedServiceId("");
    setSelectedEmployeeId("");
    setManualDate(selectedDate);
    setManualTime("");
    setManualNote("");
    setManualError("");
  };

  const closeManualModal = () => {
    setManualModalVisible(false);
    resetManualForm();
  };

  const openManualModal = async () => {
    resetManualForm();
    setManualDate(selectedDate);
    setManualModalVisible(true);

    try {
      setManualOptionsLoading(true);
      const options = await getManualAppointmentOptions();
      setClients(options.clients);
      setServices(options.services);
      setEmployees(
        options.employees.filter(
          (employee) => employee.isActive && employee.status === "ACTIVE"
        )
      );
    } catch (error) {
      setManualError(
        error instanceof Error
          ? error.message
          : "Impossible de charger les données du rendez-vous."
      );
    } finally {
      setManualOptionsLoading(false);
    }
  };

  const submitManualAppointment = async () => {
    setManualError("");

    if (isNewClient) {
      if (!newClientName.trim()) {
        setManualError("Le nom du nouveau client est requis.");
        return;
      }

      if (!newClientPhone.trim()) {
        setManualError("Le téléphone du nouveau client est requis.");
        return;
      }
    } else if (!selectedSalonClientId) {
      setManualError("Sélectionnez un client ou créez un nouveau client.");
      return;
    }

    if (!selectedServiceId) {
      setManualError("Sélectionnez un service.");
      return;
    }

    if (!selectedEmployeeId) {
      setManualError("Sélectionnez un employé.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(manualDate)) {
      setManualError("La date doit être au format AAAA-MM-JJ.");
      return;
    }

    if (!/^\d{2}:\d{2}$/.test(manualTime)) {
      setManualError("L'heure doit être au format HH:MM.");
      return;
    }

    const localDate = new Date(`${manualDate}T${manualTime}:00`);

    if (Number.isNaN(localDate.getTime())) {
      setManualError("Date ou heure invalide.");
      return;
    }

    try {
      setManualSubmitting(true);

      await createManualAppointment({
        salonClientId: isNewClient ? undefined : selectedSalonClientId,
        clientName: isNewClient ? newClientName.trim() : undefined,
        clientPhone: isNewClient ? newClientPhone.trim() : undefined,
        serviceId: selectedServiceId,
        employeeId: selectedEmployeeId,
        startAt: localDate.toISOString(),
        note: manualNote.trim() || undefined,
      });

      closeManualModal();

      if (manualDate !== selectedDate) {
        setSelectedDate(manualDate);
      }

      await loadAgendaAndCount(manualDate);
    } catch (error) {
      setManualError(
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter ce rendez-vous."
      );
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProHeader title="Agenda" backTo={"/(professional)/dashboard" as const} />

      <View style={styles.headerActions}>
        <Pressable
          onPress={() => router.push(REQUESTS_HREF)}
          style={styles.pendingLink}
        >
          <Ionicons name="notifications-outline" size={17} color="#6B2737" />
          <Text style={styles.pendingLinkText}>
            {pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#6B2737" />
        </Pressable>

        <Pressable onPress={openManualModal} style={styles.newBtn}>
          <Ionicons name="add" size={16} color="#6B2737" />
          <Text style={styles.newBtnText}>Nouveau RDV</Text>
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
                  <Text
                    style={[styles.dayText, active && styles.dayTextActive]}
                  >
                    {day}
                  </Text>
                  <Text
                    style={[styles.dayDate, active && styles.dayTextActive]}
                  >
                    {date}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ gap: 14 }}>
            {appointments.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="calendar-outline"
                  size={28}
                  color="rgba(107,39,55,0.55)"
                />
                <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
                <Text style={styles.emptyText}>
                  Aucun rendez-vous confirmé pour cette journée.
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
                          apt.status === "completed"
                            ? styles.statusCompleted
                            : apt.status === "in_progress"
                            ? styles.statusInProgress
                            : styles.statusConfirmed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            apt.status === "completed"
                              ? { color: "#475569" }
                              : apt.status === "in_progress"
                              ? { color: "#1d4ed8" }
                              : { color: "#15803d" },
                          ]}
                        >
                          {statusLabel(apt.status)}
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
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détail du rendez-vous</Text>
              <Pressable
                onPress={() => setSelectedAppointment(null)}
                hitSlop={12}
              >
                <Ionicons name="close" size={22} color="#3A3A3A" />
              </Pressable>
            </View>

            {selectedAppointment && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Heure</Text>
                  <Text style={styles.detailValue}>
                    {selectedAppointment.time}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Client</Text>
                  <Text style={styles.detailValue}>
                    {selectedAppointment.client}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Service</Text>
                  <Text style={styles.detailValue}>
                    {selectedAppointment.service}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Employé</Text>
                  <Text style={styles.detailValue}>
                    {selectedAppointment.staff}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Durée</Text>
                  <Text style={styles.detailValue}>
                    {selectedAppointment.duration}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Statut</Text>
                  <Text style={styles.detailValue}>
                    {statusLabel(selectedAppointment.status)}
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

      <Modal
        visible={manualModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeManualModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.manualModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Nouveau rendez-vous</Text>
                <Text style={styles.modalSubtitle}>
                  Saisie manuelle suite à un appel client
                </Text>
              </View>

              <Pressable onPress={closeManualModal} hitSlop={12}>
                <Ionicons name="close" size={22} color="#3A3A3A" />
              </Pressable>
            </View>

            {manualOptionsLoading ? (
              <View style={styles.manualLoader}>
                <ActivityIndicator size="large" color="#6B2737" />
                <Text style={styles.loaderText}>
                  Chargement du formulaire...
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 12 }}
              >
                <Text style={styles.formLabel}>Client *</Text>

                <View style={styles.modeRow}>
                  <Pressable
                    onPress={() => {
                      setIsNewClient(false);
                      setNewClientName("");
                      setNewClientPhone("");
                    }}
                    style={[
                      styles.modeBtn,
                      !isNewClient && styles.modeBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        !isNewClient && styles.modeBtnTextActive,
                      ]}
                    >
                      Client existant
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setIsNewClient(true);
                      setSelectedSalonClientId("");
                      setClientSearch("");
                    }}
                    style={[
                      styles.modeBtn,
                      isNewClient && styles.modeBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        isNewClient && styles.modeBtnTextActive,
                      ]}
                    >
                      Nouveau client
                    </Text>
                  </Pressable>
                </View>

                {isNewClient ? (
                  <>
                    <TextInput
                      value={newClientName}
                      onChangeText={setNewClientName}
                      placeholder="Nom du client"
                      style={styles.input}
                    />
                    <TextInput
                      value={newClientPhone}
                      onChangeText={setNewClientPhone}
                      placeholder="Téléphone"
                      keyboardType="phone-pad"
                      style={[styles.input, { marginTop: 8 }]}
                    />
                  </>
                ) : (
                  <>
                    <TextInput
                      value={clientSearch}
                      onChangeText={setClientSearch}
                      placeholder="Rechercher par nom, téléphone ou email"
                      style={styles.input}
                    />

                    <View style={styles.choiceList}>
                      {filteredClients.length === 0 ? (
                        <Text style={styles.noChoiceText}>
                          Aucun client trouvé.
                        </Text>
                      ) : (
                        filteredClients.map((client) => {
                          const active =
                            selectedSalonClientId === client.salonClientId;

                          return (
                            <Pressable
                              key={client.salonClientId}
                              disabled={client.blocked}
                              onPress={() =>
                                setSelectedSalonClientId(client.salonClientId)
                              }
                              style={[
                                styles.choiceRow,
                                active && styles.choiceRowActive,
                                client.blocked && { opacity: 0.45 },
                              ]}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={styles.choiceTitle}>
                                  {client.name}
                                </Text>
                                <Text style={styles.choiceSubtitle}>
                                  {client.phone ||
                                    client.email ||
                                    "Coordonnée non renseignée"}
                                </Text>
                              </View>

                              {client.blocked ? (
                                <Text style={styles.blockedText}>Bloqué</Text>
                              ) : active ? (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={20}
                                  color="#6B2737"
                                />
                              ) : null}
                            </Pressable>
                          );
                        })
                      )}
                    </View>
                  </>
                )}

                <Text style={styles.formLabel}>Service *</Text>
                <View style={styles.chipsWrap}>
                  {services.map((service) => {
                    const active = selectedServiceId === service.id;

                    return (
                      <Pressable
                        key={service.id}
                        onPress={() => setSelectedServiceId(service.id)}
                        style={[
                          styles.choiceChip,
                          active && styles.choiceChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            active && styles.choiceChipTextActive,
                          ]}
                        >
                          {service.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {selectedService && (
                  <Text style={styles.selectionHint}>
                    {selectedService.durationMin} min •{" "}
                    {selectedService.price.toLocaleString()} FCFA
                  </Text>
                )}

                <Text style={styles.formLabel}>Employé *</Text>
                <View style={styles.chipsWrap}>
                  {employees.map((employee) => {
                    const active = selectedEmployeeId === employee.id;

                    return (
                      <Pressable
                        key={employee.id}
                        onPress={() => setSelectedEmployeeId(employee.id)}
                        style={[
                          styles.choiceChip,
                          active && styles.choiceChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            active && styles.choiceChipTextActive,
                          ]}
                        >
                          {employee.displayName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.formLabel}>Date *</Text>
                <TextInput
                  value={manualDate}
                  onChangeText={setManualDate}
                  placeholder="AAAA-MM-JJ"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <Text style={styles.formLabel}>Heure *</Text>
                <TextInput
                  value={manualTime}
                  onChangeText={setManualTime}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                  style={styles.input}
                />

                <Text style={styles.formLabel}>Note</Text>
                <TextInput
                  value={manualNote}
                  onChangeText={setManualNote}
                  placeholder="Information complémentaire..."
                  multiline
                  style={[styles.input, styles.noteInput]}
                />

                {!!manualError && (
                  <View style={styles.errorBox}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#b91c1c"
                    />
                    <Text style={styles.errorText}>{manualError}</Text>
                  </View>
                )}

                <View style={styles.manualActions}>
                  <Pressable
                    onPress={closeManualModal}
                    style={styles.cancelBtn}
                    disabled={manualSubmitting}
                  >
                    <Text style={styles.cancelBtnText}>Annuler</Text>
                  </Pressable>

                  <Pressable
                    onPress={submitManualAppointment}
                    style={[
                      styles.submitBtn,
                      manualSubmitting && { opacity: 0.6 },
                    ]}
                    disabled={manualSubmitting}
                  >
                    {manualSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.submitBtnText}>Ajouter le RDV</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
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

  headerActions: {
    paddingHorizontal: 18,
    marginTop: -42,
    marginBottom: 8,
    alignItems: "flex-end",
    gap: 8,
  },

  pendingLink: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.15)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pendingLinkText: {
    color: "#6B2737",
    fontWeight: "800",
    fontSize: 12,
  },

  newBtn: {
    backgroundColor: "#D4AF6A",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  newBtnText: {
    color: "#6B2737",
    fontWeight: "800",
    fontSize: 14,
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
  statusInProgress: {
    backgroundColor: "#dbeafe",
  },
  statusCompleted: {
    backgroundColor: "#e2e8f0",
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
  detailModalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
  },
  manualModalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 12,
  },
  modalTitle: {
    color: "#6B2737",
    fontSize: 18,
    fontWeight: "900",
  },
  modalSubtitle: {
    marginTop: 3,
    color: "rgba(58,58,58,0.6)",
    fontSize: 12,
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

  manualLoader: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  formLabel: {
    color: "#3A3A3A",
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FAF7F2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.16)",
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: "#3A3A3A",
  },
  noteInput: {
    minHeight: 84,
    textAlignVertical: "top",
  },

  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  modeBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.16)",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modeBtnActive: {
    backgroundColor: "rgba(107,39,55,0.08)",
    borderColor: "#6B2737",
  },
  modeBtnText: {
    color: "rgba(58,58,58,0.7)",
    fontWeight: "700",
    fontSize: 12,
  },
  modeBtnTextActive: {
    color: "#6B2737",
    fontWeight: "900",
  },

  choiceList: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.12)",
    overflow: "hidden",
  },
  choiceRow: {
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(107,39,55,0.08)",
    backgroundColor: "#fff",
  },
  choiceRowActive: {
    backgroundColor: "rgba(212,175,106,0.14)",
  },
  choiceTitle: {
    color: "#3A3A3A",
    fontWeight: "800",
    fontSize: 13,
  },
  choiceSubtitle: {
    color: "rgba(58,58,58,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  noChoiceText: {
    padding: 12,
    color: "rgba(58,58,58,0.6)",
    fontSize: 12,
  },
  blockedText: {
    color: "#b91c1c",
    fontSize: 11,
    fontWeight: "800",
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.16)",
    backgroundColor: "#fff",
  },
  choiceChipActive: {
    borderColor: "#6B2737",
    backgroundColor: "rgba(107,39,55,0.08)",
  },
  choiceChipText: {
    color: "#3A3A3A",
    fontSize: 12,
    fontWeight: "700",
  },
  choiceChipTextActive: {
    color: "#6B2737",
    fontWeight: "900",
  },
  selectionHint: {
    color: "rgba(58,58,58,0.6)",
    fontSize: 12,
    marginTop: 6,
  },

  errorBox: {
    marginTop: 14,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    padding: 11,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  errorText: {
    flex: 1,
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
  },

  manualActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#FAF7F2",
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#3A3A3A",
    fontWeight: "800",
  },
  submitBtn: {
    flex: 1.4,
    borderRadius: 999,
    backgroundColor: "#6B2737",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
});