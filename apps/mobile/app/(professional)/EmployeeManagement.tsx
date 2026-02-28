import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Screen =
  | "pro-dashboard"
  | "pro-employee-management"
  | "pro-expense-management"
  | "pro-accounting-reports"
  | "pro-cash-register"
  | "pro-salon-settings"
  | "pro-promotions"
  | "pro-loyalty"
  | "pro-booking-history"
  | "pro-client-details";

type Props = { navigate: (screen: Screen) => void };

type EmployeeStatus = "active" | "leave" | "absent";

type Employee = {
  id: number;
  name: string;
  role: string;
  status: EmployeeStatus;
  photo?: string | null;
};

export function EmployeeManagement({ navigate }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<number | null>(null);

  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");

  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "",
    customRole: "",
    phone: "",
    email: "",
    firstName: "",
  });

  const [showLeaveCalendar, setShowLeaveCalendar] = useState<number | null>(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [pendingLeaveData, setPendingLeaveData] = useState<{ [k: number]: string[] }>({});
  const [originalLeaveData, setOriginalLeaveData] = useState<{ [k: number]: string[] }>({});
  const [originalEmployees, setOriginalEmployees] = useState<Employee[]>([]);

  const [showAppointmentRequests, setShowAppointmentRequests] = useState(false);
  const [showInvitationSent, setShowInvitationSent] = useState(false);

  const [showAbsenceModal, setShowAbsenceModal] = useState<number | null>(null);
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceStartDate, setAbsenceStartDate] = useState(""); // yyyy-mm-dd
  const [absenceEndDate, setAbsenceEndDate] = useState("");

  const [showAbsenceNotification, setShowAbsenceNotification] = useState(false);
  const [absenceNotificationMessage, setAbsenceNotificationMessage] = useState("");

  const [appointmentRequests, setAppointmentRequests] = useState([
    { id: 1, employeeName: "Marie Kouassi", subject: "Demande de rendez-vous mensuel", date: "2026-02-05", time: "10:00", status: "pending" as const },
    { id: 2, employeeName: "Jean Bongo", subject: "Discussion sur planification", date: "2026-02-07", time: "14:30", status: "pending" as const },
    { id: 3, employeeName: "Sophie Mbongo", subject: "Retour de congé - Briefing", date: "2026-02-10", time: "09:00", status: "accepted" as const },
    { id: 4, employeeName: "Paul N'Guema", subject: "Formation continue", date: "2026-02-12", time: "15:00", status: "refused" as const },
  ]);

  const [leaveData, setLeaveData] = useState<{ [key: number]: string[] }>({
    3: ["2026-01-20", "2026-01-21", "2026-01-22", "2026-01-23", "2026-01-24"],
  });

  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: "Marie Kouassi", role: "Coiffeuse", status: "active", photo: null },
    { id: 2, name: "Jean Bongo", role: "Barbier", status: "active", photo: null },
    { id: 3, name: "Sophie Mbongo", role: "Esthéticienne", status: "leave", photo: null },
    { id: 4, name: "Paul N'Guema", role: "Masseur", status: "active", photo: null },
  ]);

  const handleDeleteEmployee = (id: number) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleEditEmployee = (id: number) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;
    setEditingEmployee(id);
    setEditFormData((p) => ({
      ...p,
      name: emp.name,
      role: emp.role,
      customRole: emp.role === "Autre" ? customRole : "",
    }));
    setShowModal(true);
  };

  const handleSaveEmployee = () => {
    const resolvedRole = editFormData.role === "Autre" ? editFormData.customRole : editFormData.role;
    if (!editFormData.name?.trim()) return;

    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === editingEmployee ? { ...e, name: editFormData.name.trim(), role: resolvedRole || e.role } : e))
      );
      setEditingEmployee(null);
    } else {
      const newEmployee: Employee = {
        id: Math.max(0, ...employees.map((e) => e.id)) + 1,
        name: editFormData.name.trim(),
        role: resolvedRole || "Employé",
        status: "active",
        photo: null,
      };
      setEmployees((prev) => [...prev, newEmployee]);
      setShowInvitationSent(true);
    }
    setShowModal(false);
  };

  const handleOpenLeaveCalendar = (employeeId: number) => {
    setOriginalLeaveData({ ...leaveData });
    setOriginalEmployees([...employees]);
    setShowLeaveCalendar(employeeId);
  };

  const handleToggleAbsence = (employeeId: number) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    if (emp.status === "absent") {
      setEmployees((prev) => prev.map((e) => (e.id === employeeId ? { ...e, status: "active" } : e)));
      toast(`${emp.name} a été marqué(e) comme présent(e)`);
    } else {
      setShowAbsenceModal(employeeId);
      setAbsenceReason("");
      setAbsenceStartDate("");
      setAbsenceEndDate("");
    }
  };

  const toast = (msg: string) => {
    setAbsenceNotificationMessage(msg);
    setShowAbsenceNotification(true);
    setTimeout(() => setShowAbsenceNotification(false), 2500);
  };

  const handleConfirmAbsence = () => {
    if (!showAbsenceModal || !absenceStartDate) return;
    const emp = employees.find((e) => e.id === showAbsenceModal);
    setEmployees((prev) => prev.map((e) => (e.id === showAbsenceModal ? { ...e, status: "absent" } : e)));
    setShowAbsenceModal(null);
    toast(`${emp?.name ?? "Employé"} a été marqué(e) comme absent(e)`);
  };

  const headerSubtitle = useMemo(() => `${employees.length} membres dans votre équipe`, [employees.length]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigate("pro-dashboard")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Gestion des Employés</Text>
        <Text style={styles.headerSub}>{headerSubtitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Employee */}
        <Pressable onPress={() => { setEditingEmployee(null); setShowModal(true); }} style={styles.primaryBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Ajouter un employé</Text>
        </Pressable>

        {/* Leave Requests */}
        <Pressable onPress={() => setShowAppointmentRequests(true)} style={styles.goldBtn}>
          <Ionicons name="calendar" size={18} color="#fff" />
          <Text style={styles.goldBtnText}>Demandes de congés</Text>
        </Pressable>

        {/* Employees list */}
        <View style={{ gap: 12 }}>
          {employees.map((employee) => (
            <View key={employee.id} style={styles.card}>
              <View style={styles.rowTop}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={18} color="#6B2737" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.empName}>{employee.name}</Text>
                  <Text style={styles.empRole}>{employee.role}</Text>

                  <View style={[styles.badge, badgeByStatus(employee.status)]}>
                    <Text style={styles.badgeText}>
                      {employee.status === "active" ? "Actif" : employee.status === "absent" ? "Absent" : "En congé"}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable onPress={() => handleToggleAbsence(employee.id)} style={styles.iconBtn}>
                    <Ionicons
                      name={employee.status === "absent" ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={employee.status === "absent" ? "#16a34a" : "#dc2626"}
                    />
                  </Pressable>

                  <Pressable onPress={() => handleOpenLeaveCalendar(employee.id)} style={styles.iconBtn}>
                    <Ionicons name="calendar-outline" size={20} color="#D4AF6A" />
                  </Pressable>

                  <Pressable onPress={() => handleEditEmployee(employee.id)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={20} color="#6B2737" />
                  </Pressable>

                  <Pressable onPress={() => setShowDeleteConfirm(employee.id)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* Toast */}
      <Modal visible={showAbsenceNotification} transparent animationType="fade">
        <View style={styles.toastWrap}>
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.toastText}>{absenceNotificationMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Absence modal */}
      <Modal visible={showAbsenceModal !== null} transparent animationType="slide" onRequestClose={() => setShowAbsenceModal(null)}>
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
                L'employé sera marqué comme absent et ne pourra pas prendre de rendez-vous pendant cette période.
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
            <TextInput value={absenceReason} onChangeText={setAbsenceReason} placeholder="Maladie, urgence..." style={styles.input} />

            <View style={styles.modalFooter}>
              <Pressable onPress={() => setShowAbsenceModal(null)} style={styles.secondaryBtn}>
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

      {/* Add/Edit Employee modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editingEmployee ? "Modifier un employé" : "Ajouter un employé"}</Text>

              <Text style={styles.label}>Nom</Text>
              <TextInput
                value={editFormData.name}
                onChangeText={(v) => setEditFormData((p) => ({ ...p, name: v }))}
                placeholder="Nom complet"
                style={styles.input}
              />

              <Text style={styles.label}>Prénom</Text>
              <TextInput
                value={editFormData.firstName}
                onChangeText={(v) => setEditFormData((p) => ({ ...p, firstName: v }))}
                placeholder="Prénom"
                style={styles.input}
              />

              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                value={editFormData.phone}
                onChangeText={(v) => setEditFormData((p) => ({ ...p, phone: v }))}
                placeholder="+241 .."
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
                Ces informations seront utilisées pour inviter l'employé à créer son mot de passe.
              </Text>

              {/* Role (simple RN version: quick chips) */}
              <Text style={styles.label}>Rôle / Spécialité</Text>
              <View style={styles.chipsWrap}>
                {["Coiffeur/Coiffeuse", "Esthéticienne", "Barbier", "Masseur/Masseuse", "Manucure", "Coach sportif", "Autre"].map((r) => {
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
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{r}</Text>
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

              {/* Planning hebdo (UI only) */}
              <View style={styles.sectionSep} />
              <Text style={styles.sectionTitle}>Planning hebdomadaire</Text>
              {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day) => (
                <View key={day} style={styles.planningRow}>
                  <Text style={styles.planningDay}>{day}</Text>
                  <TextInput style={styles.timeInput} placeholder="09:00" />
                  <Text style={{ color: "#999" }}>–</Text>
                  <TextInput style={styles.timeInput} placeholder="18:00" />
                </View>
              ))}

              <View style={styles.modalFooter}>
                <Pressable onPress={() => setShowModal(false)} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Annuler</Text>
                </Pressable>

                <Pressable onPress={handleSaveEmployee} style={styles.primaryBtnSmall}>
                  <Ionicons name={editingEmployee ? "save-outline" : "mail-outline"} size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>{editingEmployee ? "Enregistrer" : "Envoyer l'invitation"}</Text>
                </Pressable>
              </View>

              <View style={{ height: 14 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Invitation sent */}
      <Modal visible={showInvitationSent} transparent animationType="fade" onRequestClose={() => setShowInvitationSent(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Ionicons name="checkmark" size={20} color="#16a34a" />
            </View>
            <Text style={styles.confirmTitle}>Invitation envoyée !</Text>
            <Text style={styles.confirmText}>
              L'employé peut créer son mot de passe via email/SMS et accéder à l'espace via le login unique.
            </Text>
            <Pressable onPress={() => setShowInvitationSent(false)} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Compris</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete confirm */}
      <Modal visible={showDeleteConfirm !== null} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={[styles.confirmIcon, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="warning-outline" size={20} color="#dc2626" />
            </View>
            <Text style={styles.confirmTitle}>Supprimer cet employé ?</Text>
            <Text style={styles.confirmText}>Cette action est irréversible.</Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => setShowDeleteConfirm(null)} style={[styles.secondaryBtn, { flex: 1 }]}>
                <Text style={styles.secondaryBtnText}>Annuler</Text>
              </Pressable>
              <Pressable onPress={() => handleDeleteEmployee(showDeleteConfirm!)} style={[styles.dangerBtn, { flex: 1 }]}>
                <Text style={styles.dangerBtnText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Leave calendar + leave confirmation + appointment requests
          -> je te mets une version RN compacte (calendrier "grille") dans un 2e message si tu veux.
          Là on continue les autres écrans pour avancer vite. */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },

  header: { backgroundColor: "#6B2737", paddingTop: 52, paddingBottom: 18, paddingHorizontal: 18 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.8)", marginTop: 6, fontSize: 13 },

  content: { padding: 18, paddingBottom: 32, gap: 12 },

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

  goldBtn: {
    backgroundColor: "#D4AF6A",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  goldBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10 },
  rowTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(107,39,55,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  empName: { color: "#3A3A3A", fontSize: 15, fontWeight: "700" },
  empRole: { color: "rgba(58,58,58,0.6)", marginTop: 2, marginBottom: 8, fontSize: 12 },

  badge: { alignSelf: "flex-start", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#3A3A3A" },

  actions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 4 },

  toastWrap: { flex: 1, justifyContent: "flex-start", alignItems: "center", paddingTop: 90 },
  toast: { backgroundColor: "#6B2737", borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, flexDirection: "row", gap: 8, alignItems: "center" },
  toastText: { color: "#fff", fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 18 },
  modalCard: { backgroundColor: "#fff", borderRadius: 22, padding: 16 },
  modalCardLarge: { backgroundColor: "#fff", borderRadius: 22, padding: 16, maxHeight: "92%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#6B2737", marginBottom: 12 },

  alertBox: { backgroundColor: "#FEF2F2", borderRadius: 14, padding: 12, flexDirection: "row", gap: 10, marginBottom: 12 },
  alertText: { flex: 1, color: "#3A3A3A", fontSize: 12 },

  label: { color: "#3A3A3A", fontSize: 13, fontWeight: "700", marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: "#FAF7F2", borderRadius: 16, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 12 : 10, borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },

  helpText: { color: "rgba(58,58,58,0.6)", fontSize: 12, marginTop: 8 },

  modalFooter: { flexDirection: "row", gap: 10, marginTop: 14 },
  secondaryBtn: { backgroundColor: "#FAF7F2", borderRadius: 999, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { color: "#3A3A3A", fontWeight: "700" },
  dangerBtn: { backgroundColor: "#dc2626", borderRadius: 999, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  dangerBtnText: { color: "#fff", fontWeight: "800" },

  confirmCard: { backgroundColor: "#fff", borderRadius: 22, padding: 18, alignItems: "center" },
  confirmIcon: { width: 54, height: 54, borderRadius: 999, backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  confirmTitle: { fontSize: 18, fontWeight: "900", color: "#3A3A3A", marginBottom: 6, textAlign: "center" },
  confirmText: { fontSize: 13, color: "rgba(58,58,58,0.7)", textAlign: "center", marginBottom: 14 },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(107,39,55,0.2)" },
  chipActive: { backgroundColor: "rgba(107,39,55,0.10)", borderColor: "#6B2737" },
  chipText: { fontSize: 12, color: "#3A3A3A" },
  chipTextActive: { fontWeight: "800", color: "#6B2737" },

  sectionSep: { height: 1, backgroundColor: "rgba(107,39,55,0.12)", marginTop: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#3A3A3A", marginBottom: 8 },

  planningRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  planningDay: { width: 88, color: "#3A3A3A", fontWeight: "700" },
  timeInput: {
    flex: 1,
    backgroundColor: "#FAF7F2",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
  },
});