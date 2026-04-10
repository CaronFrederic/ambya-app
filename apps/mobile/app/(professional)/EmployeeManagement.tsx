import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ProHeader } from "./components/ProHeader";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  markEmployeeAbsent,
  markEmployeeActive,
  updateEmployee,
  type ApiEmployee,
} from "../../src/api/employees";


type EmployeeStatus = "active" | "leave" | "absent";

type Employee = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  photo?: string | null;
  phone?: string;
  email?: string;
};

type RequestStatus = "pending" | "accepted" | "refused";

type AppointmentRequest = {
  id: number;
  employeeName: string;
  subject: string;
  date: string;
  time: string;
  status: RequestStatus;
};



function mapApiEmployeeToUi(employee: ApiEmployee): Employee {
  let status: EmployeeStatus = "active";

  if (employee.status === "ABSENT") status = "absent";
  if (employee.status === "ON_LEAVE") status = "leave";

  return {
    id: employee.id,
    name:
      employee.displayName ||
      [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim() ||
      "Employé",
    role: employee.roleLabel || "Non renseigné",
    status,
    photo: employee.photoUrl,
    phone: employee.phone ?? "",
    email: employee.email ?? "",
  };
}

export default function EmployeeManagement() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");

  const [editFormData, setEditFormData] = useState({
    name: "",
    firstName: "",
    phone: "",
    email: "",
    role: "",
    customRole: "",
    photo: null as string | null,
  });

  const [showAbsenceModal, setShowAbsenceModal] = useState<string | null>(null);
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceStartDate, setAbsenceStartDate] = useState("");
  const [absenceEndDate, setAbsenceEndDate] = useState("");

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [showInvitationSent, setShowInvitationSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [showAppointmentRequests, setShowAppointmentRequests] = useState(false);

  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([
    {
      id: 1,
      employeeName: "Marie Kouassi",
      subject: "Demande de rendez-vous mensuel",
      date: "2026-02-05",
      time: "10:00",
      status: "pending",
    },
    {
      id: 2,
      employeeName: "Jean Bongo",
      subject: "Discussion sur planification",
      date: "2026-02-07",
      time: "14:30",
      status: "pending",
    },
    {
      id: 3,
      employeeName: "Sophie Mbongo",
      subject: "Retour de congé - Briefing",
      date: "2026-02-10",
      time: "09:00",
      status: "accepted",
    },
    {
      id: 4,
      employeeName: "Paul N'Guema",
      subject: "Formation continue",
      date: "2026-02-12",
      time: "15:00",
      status: "refused",
    },
  ]);

  const handleAcceptRequest = (id: number) => {
    setAppointmentRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "accepted" } : req))
    );
    toast("Demande acceptée");
  };

  const handleRefuseRequest = (id: number) => {
    setAppointmentRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "refused" } : req))
    );
    toast("Demande refusée");
  };

  const headerSubtitle = useMemo(
    () => `${employees.length} membres dans votre équipe`,
    [employees.length]
  );

  const toast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const loadEmployees = async () => {
    
    const data = await getEmployees();
    setEmployees(data.map(mapApiEmployeeToUi));
  };

  const initialLoad = async () => {
    try {
      setLoading(true);
      await loadEmployees();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadEmployees();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erreur de rafraîchissement.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  const resetForm = () => {
    setSelectedRole("");
    setCustomRole("");
    setEditFormData({
      name: "",
      firstName: "",
      phone: "",
      email: "",
      role: "",
      customRole: "",
      photo: null,
    });
  };

  const handleEditEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;

    setEditingEmployee(id);

    const roleIsOther =
      emp.role &&
      ![
        "Coiffeur/Coiffeuse",
        "Esthéticienne",
        "Barbier",
        "Masseur/Masseuse",
        "Manucure",
        "Coach sportif",
      ].includes(emp.role);

    setSelectedRole(roleIsOther ? "Autre" : emp.role);
    setCustomRole(roleIsOther ? emp.role : "");

    setEditFormData({
      name: emp.name,
      firstName: "",
      phone: emp.phone ?? "",
      email: emp.email ?? "",
      role: roleIsOther ? "Autre" : emp.role,
      customRole: roleIsOther ? emp.role : "",
      photo: emp.photo ?? null,
    });

    setShowModal(true);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast("Permission galerie refusée");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!res.canceled) {
      setEditFormData((p) => ({ ...p, photo: res.assets[0]?.uri ?? null }));
    }
  };

  const handleSaveEmployee = async () => {
    const fullName = [editFormData.firstName.trim(), editFormData.name.trim()]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!fullName) {
      toast("Le nom est requis.");
      return;
    }

    const resolvedRole =
      editFormData.role === "Autre"
        ? editFormData.customRole.trim()
        : editFormData.role;

    if (!resolvedRole) {
      toast("Le rôle est requis.");
      return;
    }

    try {
      setSubmitting(true);
      

      if (editingEmployee) {
        await updateEmployee( editingEmployee, {
          displayName: fullName,
          roleLabel: resolvedRole,
          photoUrl: editFormData.photo ?? undefined,
          phone: editFormData.phone || undefined,
          email: editFormData.email || undefined,
        });

        toast("Employé modifié");
      } else {
        await createEmployee( {
          displayName: fullName,
          firstName: editFormData.firstName || undefined,
          roleLabel: resolvedRole,
          photoUrl: editFormData.photo ?? undefined,
          phone: editFormData.phone || undefined,
          email: editFormData.email || undefined,
        });

        setShowInvitationSent(true);
      }

      await loadEmployees();
      setEditingEmployee(null);
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      
      await deleteEmployee( id);
      await loadEmployees();
      setShowDeleteConfirm(null);
      toast("Employé supprimé");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erreur lors de la suppression.");
    }
  };

  const handleToggleAbsence = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    if (emp.status === "absent") {
      handleMarkActive(employeeId, emp.name);
    } else {
      setShowAbsenceModal(employeeId);
      setAbsenceReason("");
      setAbsenceStartDate("");
      setAbsenceEndDate("");
    }
  };

  const handleMarkActive = async (employeeId: string, name?: string) => {
    try {
      
      await markEmployeeActive(employeeId);
      await loadEmployees();
      toast(`${name ?? "Employé"} est marqué(e) présent(e)`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erreur lors de la mise à jour.");
    }
  };

  const handleConfirmAbsence = async () => {
    if (!showAbsenceModal || !absenceStartDate) return;

    const emp = employees.find((e) => e.id === showAbsenceModal);

    try {
      
      await markEmployeeAbsent(showAbsenceModal, {
        startDate: absenceStartDate,
        endDate: absenceEndDate || undefined,
        reason: absenceReason || undefined,
      });

      await loadEmployees();
      setShowAbsenceModal(null);
      toast(`${emp?.name ?? "Employé"} a été marqué(e) absent(e)`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erreur lors du marquage d'absence.");
    }
  };

  return (
    <View style={styles.container}>
      <ProHeader title="Gestion des Employés" subtitle={headerSubtitle} />

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#6B2737" />
          <Text style={styles.loaderText}>Chargement des employés...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Pressable
            onPress={() => {
              setEditingEmployee(null);
              resetForm();
              setShowModal(true);
            }}
            style={styles.primaryBtn}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Ajouter un employé</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowAppointmentRequests(true)}
            style={styles.leaveRequestsBtn}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.leaveRequestsBtnText}>Demandes de congés</Text>
          </Pressable>

          <View style={{ gap: 12 }}>
            {employees.map((employee) => (
              <View key={employee.id} style={styles.card}>
                <View style={styles.rowTop}>
                  <View style={styles.avatar}>
                    {employee.photo ? (
                      <Image
                        source={{ uri: employee.photo }}
                        style={{ width: 48, height: 48, borderRadius: 999 }}
                      />
                    ) : (
                      <Ionicons name="person" size={18} color="#6B2737" />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.empName}>{employee.name}</Text>
                    <Text style={styles.empRole}>{employee.role}</Text>

                    <View style={[styles.badge, badgeByStatus(employee.status)]}>
                      <Text style={styles.badgeText}>
                        {employee.status === "active"
                          ? "Actif"
                          : employee.status === "absent"
                          ? "Absent"
                          : "En congé"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => handleToggleAbsence(employee.id)}
                      style={styles.iconBtn}
                    >
                      <Ionicons
                        name={
                          employee.status === "absent"
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={20}
                        color={employee.status === "absent" ? "#16a34a" : "#dc2626"}
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => handleEditEmployee(employee.id)}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="create-outline" size={20} color="#6B2737" />
                    </Pressable>

                    <Pressable
                      onPress={() => setShowDeleteConfirm(employee.id)}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="trash-outline" size={20} color="#dc2626" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      )}

      <Modal visible={toastVisible} transparent animationType="fade">
        <View style={styles.toastWrap}>
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAppointmentRequests}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppointmentRequests(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.requestsModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.requestsModalTitle}>
                Demandes de rendez-vous employés
              </Text>
              <Pressable
                onPress={() => setShowAppointmentRequests(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#3A3A3A" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {appointmentRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.requestTitleRow}>
                        <Text style={styles.requestEmployeeName}>
                          {request.employeeName}
                        </Text>
                        <View
                          style={[styles.requestBadge, requestBadgeStyle(request.status)]}
                        >
                          <Text
                            style={[
                              styles.requestBadgeText,
                              requestBadgeTextStyle(request.status),
                            ]}
                          >
                            {request.status === "pending"
                              ? "En attente"
                              : request.status === "accepted"
                              ? "Accepté"
                              : "Refusé"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.requestSubject}>{request.subject}</Text>

                      <View style={styles.requestMetaRow}>
                        <View style={styles.requestMetaItem}>
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color="rgba(58,58,58,0.55)"
                          />
                          <Text style={styles.requestMetaText}>
                            {new Date(request.date).toLocaleDateString("fr-FR")}
                          </Text>
                        </View>

                        <View style={styles.requestMetaItem}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="rgba(58,58,58,0.55)"
                          />
                          <Text style={styles.requestMetaText}>{request.time}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {request.status === "pending" && (
                    <View style={styles.requestActions}>
                      <Pressable
                        onPress={() => handleAcceptRequest(request.id)}
                        style={styles.acceptBtn}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.acceptBtnText}>Accepter</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleRefuseRequest(request.id)}
                        style={styles.refuseBtn}
                      >
                        <Ionicons name="close-outline" size={18} color="#fff" />
                        <Text style={styles.refuseBtnText}>Refuser</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setShowAppointmentRequests(false)}
              style={[styles.primaryBtn, { marginTop: 18 }]}
            >
              <Text style={styles.primaryBtnText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAbsenceModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAbsenceModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Marquer comme absent</Text>
              <Pressable onPress={() => setShowAbsenceModal(null)}>
                <Ionicons name="close" size={22} color="#3A3A3A" />
              </Pressable>
            </View>

            <View style={styles.alertBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.alertText}>
                L'employé sera marqué comme absent et ne pourra pas prendre de
                rendez-vous pendant cette période.
              </Text>
            </View>

            <Text style={styles.label}>Date de début *</Text>
            <TextInput
              value={absenceStartDate}
              onChangeText={setAbsenceStartDate}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.label}>Date de fin (optionnelle)</Text>
            <TextInput
              value={absenceEndDate}
              onChangeText={setAbsenceEndDate}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.label}>Motif (optionnel)</Text>
            <TextInput
              value={absenceReason}
              onChangeText={setAbsenceReason}
              placeholder="Maladie, urgence..."
              style={styles.input}
            />

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setShowAbsenceModal(null)}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmAbsence}
                disabled={!absenceStartDate}
                style={[styles.dangerBtn, !absenceStartDate && { opacity: 0.5 }]}
              >
                <Text style={styles.dangerBtnText}>Confirmer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingEmployee ? "Modifier un employé" : "Ajouter un employé"}
              </Text>

              <Text style={styles.label}>Photo (optionnel)</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={styles.photoBox}>
                  {editFormData.photo ? (
                    <Image
                      source={{ uri: editFormData.photo }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Ionicons name="camera" size={24} color="rgba(107,39,55,0.6)" />
                  )}
                </View>

                <View style={{ flex: 1, gap: 10 }}>
                  <Pressable onPress={pickPhoto} style={styles.smallPrimary}>
                    <Ionicons name="image-outline" size={16} color="#fff" />
                    <Text style={styles.smallPrimaryText}>Choisir</Text>
                  </Pressable>

                  {!!editFormData.photo && (
                    <Pressable
                      onPress={() =>
                        setEditFormData((p) => ({ ...p, photo: null }))
                      }
                      style={styles.smallDanger}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                      <Text style={styles.smallPrimaryText}>Retirer</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <Text style={styles.label}>Nom</Text>
              <TextInput
                value={editFormData.name}
                onChangeText={(v) => setEditFormData((p) => ({ ...p, name: v }))}
                placeholder="Nom"
                style={styles.input}
              />

              <Text style={styles.label}>Prénom</Text>
              <TextInput
                value={editFormData.firstName}
                onChangeText={(v) =>
                  setEditFormData((p) => ({ ...p, firstName: v }))
                }
                placeholder="Prénom"
                style={styles.input}
              />

              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                value={editFormData.phone}
                onChangeText={(v) => setEditFormData((p) => ({ ...p, phone: v }))}
                placeholder="+241 ..."
                keyboardType="phone-pad"
                style={styles.input}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                value={editFormData.email}
                onChangeText={(v) => setEditFormData((p) => ({ ...p, email: v }))}
                placeholder="email@exemple.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <Text style={styles.helpText}>
                Ces informations seront utilisées pour inviter l'employé à créer
                son mot de passe.
              </Text>

              <Text style={styles.label}>Rôle / Spécialité</Text>
              <View style={styles.chipsWrap}>
                {[
                  "Coiffeur/Coiffeuse",
                  "Esthéticienne",
                  "Barbier",
                  "Masseur/Masseuse",
                  "Manucure",
                  "Coach sportif",
                  "Autre",
                ].map((r) => {
                  const active = editFormData.role === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => {
                        setSelectedRole(r);
                        setEditFormData((p) => ({ ...p, role: r }));
                      }}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {r}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedRole === "Autre" && (
                <>
                  <Text style={styles.label}>Précisez</Text>
                  <TextInput
                    value={customRole}
                    onChangeText={(v) => {
                      setCustomRole(v);
                      setEditFormData((p) => ({ ...p, customRole: v }));
                    }}
                    placeholder="Ex : Maquilleuse FX"
                    style={styles.input}
                  />
                </>
              )}

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => {
                    setShowModal(false);
                    setEditingEmployee(null);
                    resetForm();
                  }}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Annuler</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveEmployee}
                  style={[styles.primaryBtnSmall, submitting && { opacity: 0.6 }]}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name={editingEmployee ? "save-outline" : "mail-outline"}
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.primaryBtnText}>
                        {editingEmployee ? "Enregistrer" : "Envoyer l'invitation"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={{ height: 14 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showInvitationSent}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvitationSent(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Ionicons name="checkmark" size={20} color="#16a34a" />
            </View>
            <Text style={styles.confirmTitle}>Invitation envoyée !</Text>
            <Text style={styles.confirmText}>
              L'employé peut créer son mot de passe via email/SMS et accéder à
              l'espace via le login unique.
            </Text>
            <Pressable
              onPress={() => setShowInvitationSent(false)}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Compris</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={[styles.confirmIcon, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="warning-outline" size={20} color="#dc2626" />
            </View>
            <Text style={styles.confirmTitle}>Supprimer cet employé ?</Text>
            <Text style={styles.confirmText}>Cette action est irréversible.</Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setShowDeleteConfirm(null)}
                style={[styles.secondaryBtn, { flex: 1 }]}
              >
                <Text style={styles.secondaryBtnText}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDeleteEmployee(showDeleteConfirm!)}
                style={[styles.dangerBtn, { flex: 1 }]}
              >
                <Text style={styles.dangerBtnText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function badgeByStatus(status: EmployeeStatus) {
  switch (status) {
    case "active":
      return { backgroundColor: "#dcfce7" };
    case "absent":
      return { backgroundColor: "#fee2e2" };
    case "leave":
      return { backgroundColor: "#ffedd5" };
    default:
      return { backgroundColor: "#eee" };
  }
}

function requestBadgeStyle(status: RequestStatus) {
  switch (status) {
    case "pending":
      return { backgroundColor: "#FDE7C7" };
    case "accepted":
      return { backgroundColor: "#DCFCE7" };
    case "refused":
      return { backgroundColor: "#FEE2E2" };
    default:
      return { backgroundColor: "#eee" };
  }
}

function requestBadgeTextStyle(status: RequestStatus) {
  switch (status) {
    case "pending":
      return { color: "#C2410C" };
    case "accepted":
      return { color: "#15803D" };
    case "refused":
      return { color: "#DC2626" };
    default:
      return { color: "#3A3A3A" };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },
  content: { padding: 18, paddingBottom: 32, gap: 12 },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loaderText: {
    color: "#6B2737",
    fontWeight: "700",
  },

  primaryBtn: {
    backgroundColor: "#6B2737",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnSmall: {
    backgroundColor: "#6B2737",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  rowTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(107,39,55,0.10)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  empName: { color: "#3A3A3A", fontSize: 15, fontWeight: "700" },
  empRole: {
    color: "rgba(58,58,58,0.6)",
    marginTop: 2,
    marginBottom: 8,
    fontSize: 12,
  },

  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#3A3A3A" },

  actions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 4 },

  toastWrap: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 90,
  },
  toast: {
    backgroundColor: "#6B2737",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  toastText: { color: "#fff", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 22, padding: 16 },
  modalCardLarge: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6B2737",
    marginBottom: 12,
  },

  alertBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  alertText: { flex: 1, color: "#3A3A3A", fontSize: 12 },

  label: {
    color: "#3A3A3A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#FAF7F2",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
  },

  helpText: { color: "rgba(58,58,58,0.6)", fontSize: 12, marginTop: 8 },

  modalFooter: { flexDirection: "row", gap: 10, marginTop: 14 },
  secondaryBtn: {
    backgroundColor: "#FAF7F2",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#3A3A3A", fontWeight: "700" },
  dangerBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerBtnText: { color: "#fff", fontWeight: "800" },

  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
  },
  confirmIcon: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#3A3A3A",
    marginBottom: 6,
    textAlign: "center",
  },
  confirmText: {
    fontSize: 13,
    color: "rgba(58,58,58,0.7)",
    textAlign: "center",
    marginBottom: 14,
  },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
  },
  chipActive: {
    backgroundColor: "rgba(107,39,55,0.10)",
    borderColor: "#6B2737",
  },
  chipText: { fontSize: 12, color: "#3A3A3A" },
  chipTextActive: { fontWeight: "800", color: "#6B2737" },

  photoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#FAF7F2",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  smallPrimary: {
    backgroundColor: "#6B2737",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  smallDanger: {
    backgroundColor: "#dc2626",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  smallPrimaryText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  leaveRequestsBtn: {
    backgroundColor: "#D4AF6A",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  leaveRequestsBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  requestsModalCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 18,
    maxHeight: "90%",
  },

  requestsModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6B2737",
    flex: 1,
    paddingRight: 12,
  },

  closeBtn: {
    padding: 4,
    borderRadius: 10,
  },

  requestCard: {
    backgroundColor: "#FAF7F2",
    borderRadius: 22,
    padding: 16,
  },

  requestHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  requestTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },

  requestEmployeeName: {
    color: "#3A3A3A",
    fontSize: 16,
    fontWeight: "800",
  },

  requestBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  requestBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  requestSubject: {
    color: "#3A3A3A",
    fontSize: 14,
    marginBottom: 10,
  },

  requestMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  requestMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  requestMetaText: {
    color: "rgba(58,58,58,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },

  requestActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(107,39,55,0.10)",
  },

  acceptBtn: {
    flex: 1,
    backgroundColor: "#09B43A",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  acceptBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  refuseBtn: {
    flex: 1,
    backgroundColor: "#F40000",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  refuseBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});