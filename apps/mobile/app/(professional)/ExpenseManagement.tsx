import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import * as SecureStore from "expo-secure-store";

import { ProHeader } from "./components/ProHeader";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  type ApiExpense,
  type ExpensePaymentMethod,
} from "../../src/api/expenses";
import {
  getSalonSettings,
  type SubscriptionPlan,
} from "../../src/api/salon-settings";

const COLORS = {
  background: "#FAF7F2",
  brand: "#6B2737",
  brandDark: "#4E1B27",
  brandSoft: "#8E4356",
  text: "#2A1B20",
  muted: "#8A7A7E",
  gold: "#D4AF6A",
  goldPale: "#F0E2C6",
  line: "#EAE0DA",
  white: "#FFFFFF",
  green: "#3F7A5E",
  investment: "#F4F1F6",
};

const DASHBOARD_HREF: Href = "/(professional)/dashboard";

const CATEGORIES = [
  ["🧴", "Produits & consommables"],
  ["📦", "Marchandises revendues"],
  ["👥", "Charges de personnel"],
  ["🏠", "Loyer & charges du local"],
  ["💡", "Eau & électricité"],
  ["📱", "Téléphone & internet"],
  ["🧾", "Honoraires & prestataires externes"],
  ["🪑", "Location d’espace ou d’équipement"],
  ["🔑", "Abonnements & licences"],
  ["🚕", "Transport & déplacements"],
  ["🔧", "Entretien & réparations"],
  ["🧺", "Blanchisserie"],
  ["📣", "Publicité & communication"],
  ["🎓", "Formation & certification"],
  ["🛡️", "Assurance"],
  ["🏦", "Frais bancaires & commissions"],
  ["🏛️", "Impôts & taxes"],
  ["⋯", "Autres"],
] as const;

const PAYMENT_OPTIONS: Array<{
  label: string;
  value: ExpensePaymentMethod;
}> = [
  { label: "Espèces", value: "CASH" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Carte", value: "CARD" },
  { label: "Virement", value: "BANK_TRANSFER" },
];

const PAYMENT_LABELS: Record<ExpensePaymentMethod, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Carte",
  BANK_TRANSFER: "Virement",
};

const CATEGORY_FAMILIES: Record<string, string> = {
  "Charges de personnel": "Personnel",
  "Loyer & charges du local": "Local",
  "Location d’espace ou d’équipement": "Local",
  "Produits & consommables": "Produits",
  "Marchandises revendues": "Produits",
};

const FAMILY_COLORS: Record<string, string> = {
  Personnel: "#D4AF6A",
  Local: "#D7B59E",
  Produits: "#B96378",
  Autres: "#8E4356",
};

type ExpenseForm = {
  date: string;
  category: string;
  amount: string;
  description: string;
  paymentMethod: ExpensePaymentMethod;
  isRecurring: boolean;
  isInvestment: boolean;
  receiptNumber: string;
};

type ExpenseFamily = {
  name: string;
  amount: number;
  percentage: number;
  color: string;
};

async function getAccessToken(): Promise<string> {
  const accessToken = await SecureStore.getItemAsync("accessToken");

  if (!accessToken) {
    throw new Error("Utilisateur non authentifié.");
  }

  return accessToken;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function getMonthLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);

  return label.replace(/^./, (character) => character.toUpperCase());
}

function toYmd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseYmd(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDisplayDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR").format(parseYmd(value));
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function toApiDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function getExpenseDay(value: string): Date {
  const date = new Date(value);

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
}

function getDayTitle(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(date)
    .toUpperCase();
}

function getCategoryIcon(category: string): string {
  return CATEGORIES.find(([, name]) => name === category)?.[0] ?? "💼";
}

function isLateEntry(expense: ApiExpense): boolean {
  const paymentDate = new Date(expense.expenseDate);
  const entryDate = new Date(expense.createdAt);

  const nextMonthStart = Date.UTC(
    paymentDate.getUTCFullYear(),
    paymentDate.getUTCMonth() + 1,
    1
  );

  return entryDate.getTime() >= nextMonthStart;
}

function getSubscriptionPrice(plan: SubscriptionPlan): number {
  if (plan === "PRO") {
    return 15_000;
  }

  if (plan === "BUSINESS") {
    return 30_000;
  }

  return 0;
}

function getSubscriptionName(plan: SubscriptionPlan): string {
  if (plan === "PRO") {
    return "AMBYA Pro";
  }

  if (plan === "BUSINESS") {
    return "AMBYA Business";
  }

  return "Sans abonnement";
}

function createEmptyForm(date = new Date()): ExpenseForm {
  return {
    date: toYmd(date),
    category: "Produits & consommables",
    amount: "",
    description: "",
    paymentMethod: "CASH",
    isRecurring: false,
    isInvestment: false,
    receiptNumber: "",
  };
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getMaximumSelectableDate(cursor: Date): Date {
  const today = new Date();
  const monthEnd = getMonthEnd(cursor);

  today.setHours(23, 59, 59, 999);
  monthEnd.setHours(23, 59, 59, 999);

  return monthEnd < today ? monthEnd : today;
}

export default function ExpenseManagementScreen() {
  const [cursor, setCursor] = useState<Date>(() => {
    const today = new Date();

    return getMonthStart(today);
  });

  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [previousMonths, setPreviousMonths] = useState<ApiExpense[][]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState<ExpenseForm>(() => createEmptyForm());

  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan>("FREE");
  const [subscriptionStatus, setSubscriptionStatus] = useState("ACTIVE");
  const [subscriptionStartedAt, setSubscriptionStartedAt] = useState<
    string | null
  >(null);

  const currentMonth = getMonthKey(new Date());
  const selectedMonth = getMonthKey(cursor);
  const canGoToNextMonth = selectedMonth < currentMonth;

  const operatingExpenses = useMemo(
    () => expenses.filter((expense) => !expense.isInvestment),
    [expenses]
  );

  const investments = useMemo(
    () => expenses.filter((expense) => expense.isInvestment),
    [expenses]
  );

  const monthlyTotal = useMemo(
    () =>
      operatingExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      ),
    [operatingExpenses]
  );

  const investmentTotal = useMemo(
    () =>
      investments.reduce((sum, expense) => sum + expense.amount, 0),
    [investments]
  );

  const previousThreeMonthAverage = useMemo(() => {
    if (previousMonths.length === 0) {
      return 0;
    }

    const total = previousMonths.reduce((sum, monthExpenses) => {
      const monthTotal = monthExpenses
        .filter((expense) => !expense.isInvestment)
        .reduce(
          (monthSum, expense) => monthSum + expense.amount,
          0
        );

      return sum + monthTotal;
    }, 0);

    return Math.round(total / previousMonths.length);
  }, [previousMonths]);

  const comparisonPercentage = useMemo(() => {
    if (!previousThreeMonthAverage) {
      return null;
    }

    return Math.round(
      ((monthlyTotal - previousThreeMonthAverage) /
        previousThreeMonthAverage) *
        100
    );
  }, [monthlyTotal, previousThreeMonthAverage]);

  const expenseFamilies = useMemo<ExpenseFamily[]>(() => {
    const familyAmounts: Record<string, number> = {
      Personnel: 0,
      Local: 0,
      Produits: 0,
      Autres: 0,
    };

    operatingExpenses.forEach((expense) => {
      const familyName =
        CATEGORY_FAMILIES[expense.category] ?? "Autres";

      familyAmounts[familyName] += expense.amount;
    });

    return Object.entries(familyAmounts)
      .filter(([, familyAmount]) => familyAmount > 0)
      .map(([name, familyAmount]) => ({
        name,
        amount: familyAmount,
        percentage:
          monthlyTotal > 0
            ? Math.round((familyAmount / monthlyTotal) * 100)
            : 0,
        color: FAMILY_COLORS[name],
      }));
  }, [operatingExpenses, monthlyTotal]);

  const groupedExpenses = useMemo(() => {
    const groups = new Map<string, ApiExpense[]>();

    operatingExpenses.forEach((expense) => {
      const key = expense.expenseDate.slice(0, 10);
      const existing = groups.get(key) ?? [];

      groups.set(key, [...existing, expense]);
    });

    return [...groups.entries()].sort(([dateA], [dateB]) =>
      dateB.localeCompare(dateA)
    );
  }, [operatingExpenses]);

  const orderedCategories = useMemo(() => {
    const usageCount = new Map<string, number>();

    expenses.forEach((expense) => {
      usageCount.set(
        expense.category,
        (usageCount.get(expense.category) ?? 0) + 1
      );
    });

    return [...CATEGORIES].sort(
      (categoryA, categoryB) =>
        (usageCount.get(categoryB[1]) ?? 0) -
        (usageCount.get(categoryA[1]) ?? 0)
    );
  }, [expenses]);

  const visibleCategories = showAllCategories
    ? orderedCategories
    : orderedCategories.slice(0, 6);

  const minimumDate = getMonthStart(cursor);
  const maximumDate = getMaximumSelectableDate(cursor);

  const loadExpenses = async () => {
    const accessToken = await getAccessToken();

    const currentExpenses = await getExpenses(accessToken, {
      month: selectedMonth,
    });

    setExpenses(currentExpenses);

    const previous: ApiExpense[][] = [];

    for (let monthOffset = 1; monthOffset <= 3; monthOffset += 1) {
      const previousDate = new Date(
        cursor.getFullYear(),
        cursor.getMonth() - monthOffset,
        1
      );

      const monthExpenses = await getExpenses(accessToken, {
        month: getMonthKey(previousDate),
      });

      previous.push(monthExpenses);
    }

    setPreviousMonths(previous);

    try {
      const salonSettings = await getSalonSettings(accessToken);

      setSubscriptionPlan(
        salonSettings.paymentSettings.subscriptionPlan
      );
      setSubscriptionStatus(
        salonSettings.paymentSettings.subscriptionStatus
      );
      setSubscriptionStartedAt(
        salonSettings.paymentSettings.subscriptionStartedAt
      );
    } catch {
      // Les dépenses restent utilisables même si les paramètres du salon
      // ne peuvent pas être chargés.
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        await loadExpenses();
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error
            ? error.message
            : "Impossible de charger les dépenses."
        );
      } finally {
        setLoading(false);
      }
    };

    void initialLoad();
  }, [selectedMonth]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadExpenses();
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible d’actualiser les dépenses."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const goToPreviousMonth = () => {
    setCursor(
      new Date(
        cursor.getFullYear(),
        cursor.getMonth() - 1,
        1
      )
    );
  };

  const goToNextMonth = () => {
    if (!canGoToNextMonth) {
      return;
    }

    setCursor(
      new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        1
      )
    );
  };

  const openAddExpense = () => {
    const initialDate =
      selectedMonth === currentMonth
        ? new Date()
        : getMonthStart(cursor);

    setForm(createEmptyForm(initialDate));
    setShowAllCategories(false);
    setShowDatePicker(false);
    setShowModal(true);
  };

  const closeAddExpense = () => {
    Keyboard.dismiss();
    setShowDatePicker(false);
    setShowModal(false);
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    if (
      selectedDate < minimumDate ||
      selectedDate > maximumDate
    ) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      date: toYmd(selectedDate),
    }));
  };

  const saveExpense = async () => {
    const numericAmount = Number(form.amount);

    if (!numericAmount || numericAmount < 1) {
      Alert.alert(
        "Montant requis",
        "Saisissez un montant valide."
      );
      return;
    }

    if (
      form.category === "Autres" &&
      !form.description.trim()
    ) {
      Alert.alert(
        "Description requise",
        "La description est obligatoire pour la catégorie Autres."
      );
      return;
    }

    try {
      setSubmitting(true);

      const accessToken = await getAccessToken();

      await createExpense(accessToken, {
        category: form.category,
        description: form.description.trim() || undefined,
        amount: numericAmount,
        expenseDate: toApiDate(form.date),
        paymentMethod: form.paymentMethod,
        isRecurring: form.isRecurring,
        isInvestment: form.isInvestment,
        receiptNumber: form.receiptNumber.trim() || undefined,
      });

      await loadExpenses();

      closeAddExpense();

      Alert.alert(
        "Succès",
        "Dépense ajoutée avec succès."
      );
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer la dépense."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpenseItem = (expense: ApiExpense) => {
    Alert.alert(
      "Supprimer la dépense",
      expense.isRecurring && !expense.recurringSourceId
        ? "La dépense sera supprimée et sa récurrence sera arrêtée pour les prochains mois."
        : "Cette action retirera la dépense de la liste.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const accessToken = await getAccessToken();

              await deleteExpense(
                accessToken,
                expense.id
              );

              await loadExpenses();
            } catch (error) {
              Alert.alert(
                "Erreur",
                error instanceof Error
                  ? error.message
                  : "Suppression impossible."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ProHeader
          title="Dépenses"
          subtitle={getMonthLabel(cursor)}
          backTo={DASHBOARD_HREF}
        />

        <View style={styles.loader}>
          <ActivityIndicator
            color={COLORS.brand}
            size="large"
          />
          <Text style={styles.loaderText}>
            Chargement...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProHeader
        title="Dépenses"
        subtitle={getMonthLabel(cursor)}
        backTo={DASHBOARD_HREF}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.monthNavigation}>
          <Pressable
            style={styles.monthArrow}
            onPress={goToPreviousMonth}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={COLORS.brand}
            />
          </Pressable>

          <View style={styles.monthCenter}>
            <Text style={styles.monthText}>
              {getMonthLabel(cursor)}
            </Text>

            <Text
              style={[
                styles.monthStatus,
                selectedMonth === currentMonth &&
                  styles.monthStatusCurrent,
              ]}
            >
              {selectedMonth === currentMonth
                ? "EN COURS"
                : "MOIS ÉCOULÉ"}
            </Text>
          </View>

          <Pressable
            disabled={!canGoToNextMonth}
            style={[
              styles.monthArrow,
              !canGoToNextMonth &&
                styles.monthArrowDisabled,
            ]}
            onPress={goToNextMonth}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.brand}
            />
          </Pressable>
        </View>

        {selectedMonth < currentMonth && (
          <View style={styles.pastMonthNotice}>
            <Text>⏱</Text>
            <Text style={styles.noticeText}>
              Mois écoulé. Vous pouvez encore ajouter
              une dépense oubliée : elle sera enregistrée
              à sa date réelle et signalée comme saisie
              tardive.
            </Text>
          </View>
        )}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            TOTAL DU MOIS
          </Text>

          <Text style={styles.totalValue}>
            {formatAmount(monthlyTotal)}{" "}
            <Text style={styles.fcfa}>FCFA</Text>
          </Text>

          <View style={styles.totalMeta}>
            <Text style={styles.totalCount}>
              {operatingExpenses.length} dépense
              {operatingExpenses.length > 1 ? "s" : ""}{" "}
              enregistrée
              {operatingExpenses.length > 1 ? "s" : ""}
            </Text>

            {comparisonPercentage !== null && (
              <View style={styles.deltaBadge}>
                <Text style={styles.deltaText}>
                  {comparisonPercentage >= 0 ? "+" : ""}
                  {comparisonPercentage} % vs habituel
                </Text>
              </View>
            )}
          </View>

          {expenseFamilies.length > 0 && (
            <>
              <View style={styles.distributionBar}>
                {expenseFamilies.map((family) => (
                  <View
                    key={family.name}
                    style={[
                      styles.distributionSegment,
                      {
                        flexGrow: family.amount,
                        backgroundColor: family.color,
                      },
                    ]}
                  />
                ))}
              </View>

              <View style={styles.legend}>
                {expenseFamilies.map((family) => (
                  <View
                    key={family.name}
                    style={styles.legendItem}
                  >
                    <View
                      style={[
                        styles.legendDot,
                        {
                          backgroundColor:
                            family.color,
                        },
                      ]}
                    />

                    <Text style={styles.legendText}>
                      {family.name}{" "}
                      {family.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        <Pressable
          style={styles.addButton}
          onPress={openAddExpense}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={COLORS.white}
          />
          <Text style={styles.addButtonText}>
            Ajouter une dépense
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>
          VOTRE ABONNEMENT
        </Text>

        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionMark}>
            <Text style={styles.subscriptionMarkText}>
              A
            </Text>
          </View>

          <View style={styles.subscriptionContent}>
            <Text style={styles.subscriptionTitle}>
              {getSubscriptionName(subscriptionPlan)}
            </Text>

            <Text style={styles.subscriptionStatus}>
              {subscriptionStatus === "ACTIVE"
                ? "Abonnement actif"
                : "Abonnement annulé"}
              {subscriptionStartedAt
                ? ` depuis le ${new Intl.DateTimeFormat(
                    "fr-FR"
                  ).format(
                    new Date(subscriptionStartedAt)
                  )}`
                : ""}
            </Text>
          </View>

          <Text style={styles.subscriptionPrice}>
            {formatAmount(
              getSubscriptionPrice(subscriptionPlan)
            )}{" "}
            F
          </Text>
        </View>

        <Text style={styles.subscriptionHint}>
          Ligne système non modifiable. Elle reprend
          l’abonnement actuellement enregistré pour le
          salon. Le paiement récurrent automatique n’est
          pas activé.
        </Text>

        <Text style={styles.sectionTitle}>
          DÉPENSES
        </Text>

        {groupedExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              Aucune dépense
            </Text>
            <Text style={styles.emptyText}>
              Aucune dépense d’exploitation enregistrée
              pour ce mois.
            </Text>
          </View>
        ) : (
          groupedExpenses.map(
            ([dateKey, dayExpenses]) => (
              <View key={dateKey}>
                <Text style={styles.dayTitle}>
                  {getDayTitle(
                    getExpenseDay(
                      dayExpenses[0].expenseDate
                    )
                  )}
                </Text>

                {dayExpenses.map((expense) => {
                  const paymentMethod =
                    expense.paymentMethod
                      ? PAYMENT_LABELS[
                          expense.paymentMethod
                        ]
                      : "Non renseigné";

                  return (
                    <Pressable
                      key={expense.id}
                      style={styles.expenseCard}
                      onLongPress={() =>
                        deleteExpenseItem(expense)
                      }
                    >
                      <View style={styles.expenseIcon}>
                        <Text>
                          {getCategoryIcon(
                            expense.category
                          )}
                        </Text>
                      </View>

                      <View
                        style={styles.expenseContent}
                      >
                        <Text
                          style={styles.expenseTitle}
                        >
                          {expense.description ||
                            expense.category}
                        </Text>

                        <View
                          style={styles.expenseMetaRow}
                        >
                          <Text
                            style={styles.categoryBadge}
                          >
                            {expense.category}
                          </Text>

                          {expense.isRecurring && (
                            <Text
                              style={
                                styles.recurringBadge
                              }
                            >
                              ↻ Récurrent
                            </Text>
                          )}
                        </View>

                        <Text
                          style={styles.paymentText}
                        >
                          {paymentMethod}
                          {expense.receiptNumber
                            ? ` · Reçu ${expense.receiptNumber}`
                            : ""}
                        </Text>

                        {isLateEntry(expense) && (
                          <Text
                            style={styles.lateBadge}
                          >
                            Saisi le{" "}
                            {new Intl.DateTimeFormat(
                              "fr-FR"
                            ).format(
                              new Date(
                                expense.createdAt
                              )
                            )}
                            , après la fin du mois
                          </Text>
                        )}
                      </View>

                      <Text
                        style={styles.expenseAmount}
                      >
                        {formatAmount(expense.amount)} F
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )
          )
        )}

        <View style={styles.paperNotice}>
          <Text>🗂️</Text>
          <Text style={styles.noticeText}>
            Gardez vos reçus papier. L’application
            enregistre le numéro de reçu, mais ne conserve
            pas de photo du justificatif.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          INVESTISSEMENTS
        </Text>

        <View style={styles.investmentBox}>
          <View style={styles.investmentHeader}>
            <Text style={styles.investmentTitle}>
              Matériel durable
            </Text>
            <Text style={styles.investmentTotal}>
              {formatAmount(investmentTotal)} F
            </Text>
          </View>

          <Text style={styles.investmentNote}>
            Ces achats sont séparés des dépenses du mois
            et ne sont pas inclus dans le total ci-dessus.
          </Text>

          {investments.length === 0 ? (
            <Text style={styles.emptyText}>
              Aucun investissement enregistré ce mois.
            </Text>
          ) : (
            investments.map((expense) => (
              <Pressable
                key={expense.id}
                style={styles.investmentLine}
                onLongPress={() =>
                  deleteExpenseItem(expense)
                }
              >
                <Text
                  style={styles.investmentDescription}
                >
                  {expense.description ||
                    expense.category}
                </Text>

                <Text
                  style={styles.investmentLineAmount}
                >
                  {formatAmount(expense.amount)} F
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeAddExpense}
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback
              onPress={() => undefined}
            >
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Ajouter une dépense
                  </Text>

                  <Pressable
                    hitSlop={12}
                    onPress={closeAddExpense}
                  >
                    <Ionicons
                      name="close"
                      size={30}
                      color={COLORS.muted}
                    />
                  </Pressable>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.formLabel}>
                    DATE DE PAIEMENT
                  </Text>

                  <Pressable
                    style={styles.dateField}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowDatePicker(true);
                    }}
                  >
                    <Text style={styles.dateFieldText}>
                      {formatDisplayDate(form.date)}
                    </Text>

                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={COLORS.brand}
                    />
                  </Pressable>

                  <Text style={styles.formHint}>
                    Date à laquelle la dépense a été payée.
                    La date de saisie est enregistrée
                    automatiquement.
                  </Text>

                  {showDatePicker && (
                    <View style={styles.calendarBox}>
                      <DateTimePicker
                        value={parseYmd(form.date)}
                        mode="date"
                        display={
                          Platform.OS === "ios"
                            ? "inline"
                            : "calendar"
                        }
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                        onChange={handleDateChange}
                        locale="fr-FR"
                        themeVariant="light"
                        accentColor={COLORS.brand}
                      />

                      {Platform.OS === "ios" && (
                        <Pressable
                          style={
                            styles.calendarDoneButton
                          }
                          onPress={() =>
                            setShowDatePicker(false)
                          }
                        >
                          <Text
                            style={
                              styles.calendarDoneText
                            }
                          >
                            Terminé
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  <Text style={styles.formLabel}>
                    CATÉGORIE
                  </Text>

                  <View style={styles.categories}>
                    {visibleCategories.map(
                      ([icon, category]) => {
                        const selected =
                          form.category === category;

                        return (
                          <Pressable
                            key={category}
                            style={[
                              styles.categoryOption,
                              selected &&
                                styles.categoryOptionSelected,
                            ]}
                            onPress={() =>
                              setForm((previous) => ({
                                ...previous,
                                category,
                              }))
                            }
                          >
                            <Text>{icon}</Text>
                            <Text
                              style={[
                                styles.categoryOptionText,
                                selected &&
                                  styles.categoryOptionTextSelected,
                              ]}
                            >
                              {category}
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>

                  {!showAllCategories && (
                    <Pressable
                      onPress={() =>
                        setShowAllCategories(true)
                      }
                    >
                      <Text
                        style={styles.moreCategories}
                      >
                        Voir les 12 autres catégories
                      </Text>
                    </Pressable>
                  )}

                  <Text style={styles.formLabel}>
                    MONTANT TTC
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={form.amount}
                    onChangeText={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        amount: value.replace(
                          /[^0-9]/g,
                          ""
                        ),
                      }))
                    }
                    keyboardType="number-pad"
                    placeholder="Ex. 25 000"
                  />

                  <Text style={styles.formHint}>
                    Montant TTC, tel qu’il figure sur votre
                    reçu.
                  </Text>

                  <Text style={styles.formLabel}>
                    DESCRIPTION
                    {form.category === "Autres"
                      ? " *"
                      : ""}
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                    ]}
                    value={form.description}
                    onChangeText={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        description: value,
                      }))
                    }
                    multiline
                    placeholder="Ex. Achat de consommables"
                  />

                  <Text style={styles.formLabel}>
                    MODE DE PAIEMENT
                  </Text>

                  <View style={styles.paymentModes}>
                    {PAYMENT_OPTIONS.map((option) => {
                      const selected =
                        form.paymentMethod ===
                        option.value;

                      return (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.paymentMode,
                            selected &&
                              styles.paymentModeSelected,
                          ]}
                          onPress={() =>
                            setForm((previous) => ({
                              ...previous,
                              paymentMethod:
                                option.value,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.paymentModeText,
                              selected &&
                                styles.paymentModeTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.formLabel}>
                    OPTIONS
                  </Text>

                  <Pressable
                    style={styles.toggleRow}
                    onPress={() =>
                      setForm((previous) => ({
                        ...previous,
                        isRecurring:
                          !previous.isRecurring,
                      }))
                    }
                  >
                    <View
                      style={[
                        styles.customSwitch,
                        form.isRecurring &&
                          styles.customSwitchEnabled,
                      ]}
                    >
                      <View
                        style={[
                          styles.customSwitchThumb,
                          form.isRecurring &&
                            styles.customSwitchThumbEnabled,
                        ]}
                      />
                    </View>

                    <View style={styles.toggleContent}>
                      <Text style={styles.toggleTitle}>
                        Dépense récurrente
                      </Text>
                      <Text style={styles.toggleSubtitle}>
                        Se reporte automatiquement chaque
                        mois. La récurrence s’arrête lorsque
                        la dépense d’origine est supprimée.
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={styles.toggleRow}
                    onPress={() =>
                      setForm((previous) => ({
                        ...previous,
                        isInvestment:
                          !previous.isInvestment,
                      }))
                    }
                  >
                    <View
                      style={[
                        styles.customSwitch,
                        form.isInvestment &&
                          styles.customSwitchEnabled,
                      ]}
                    >
                      <View
                        style={[
                          styles.customSwitchThumb,
                          form.isInvestment &&
                            styles.customSwitchThumbEnabled,
                        ]}
                      />
                    </View>

                    <View style={styles.toggleContent}>
                      <Text style={styles.toggleTitle}>
                        Achat de matériel durable
                      </Text>
                      <Text style={styles.toggleSubtitle}>
                        Fauteuil, climatiseur, machine,
                        mobilier — tout ce qui sert plus
                        d’un an.
                      </Text>
                    </View>
                  </Pressable>

                  {form.isInvestment && (
                    <View style={styles.investmentAlert}>
                      <Text
                        style={
                          styles.investmentAlertText
                        }
                      >
                        Cette dépense sera affichée dans
                        Investissements et exclue du total
                        mensuel.
                      </Text>
                    </View>
                  )}

                  <Text style={styles.formLabel}>
                    NUMÉRO DE REÇU{" "}
                    <Text style={styles.optionalLabel}>
                      (facultatif)
                    </Text>
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={form.receiptNumber}
                    onChangeText={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        receiptNumber: value,
                      }))
                    }
                    placeholder="FA-2026-0483"
                  />

                  <View style={styles.paperNotice}>
                    <Text>🗂️</Text>
                    <Text style={styles.noticeText}>
                      Gardez le reçu papier de côté.
                      L’application n’en conserve pas de
                      copie.
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={closeAddExpense}
                    >
                      <Text
                        style={styles.cancelButtonText}
                      >
                        Annuler
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.saveButton,
                        submitting &&
                          styles.saveButtonDisabled,
                      ]}
                      disabled={submitting}
                      onPress={saveExpense}
                    >
                      {submitting ? (
                        <ActivityIndicator
                          color={COLORS.white}
                        />
                      ) : (
                        <Text
                          style={styles.saveButtonText}
                        >
                          Enregistrer
                        </Text>
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.modalBottomSpace} />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loaderText: {
    color: COLORS.muted,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    padding: 7,
    marginBottom: 12,
  },
  monthArrow: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F6EFEA",
    alignItems: "center",
    justifyContent: "center",
  },
  monthArrowDisabled: {
    opacity: 0.28,
  },
  monthCenter: {
    flex: 1,
    alignItems: "center",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  monthStatus: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.muted,
    marginTop: 2,
  },
  monthStatusCurrent: {
    color: COLORS.gold,
  },
  pastMonthNotice: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: "#F6EFEA",
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noticeText: {
    flex: 1,
    color: "#6E5A5F",
    lineHeight: 20,
  },
  totalCard: {
    backgroundColor: COLORS.brand,
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    overflow: "hidden",
  },
  totalLabel: {
    color: COLORS.gold,
    fontWeight: "800",
    letterSpacing: 2,
  },
  totalValue: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "800",
    marginTop: 14,
  },
  fcfa: {
    fontSize: 17,
    fontWeight: "600",
    opacity: 0.8,
  },
  totalMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  totalCount: {
    color: "rgba(255,255,255,0.72)",
    fontWeight: "600",
    flex: 1,
  },
  deltaBadge: {
    borderWidth: 1,
    borderColor: "rgba(212,175,106,0.45)",
    backgroundColor: "rgba(212,175,106,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  deltaText: {
    color: COLORS.gold,
    fontWeight: "800",
    fontSize: 12,
  },
  distributionBar: {
    height: 8,
    flexDirection: "row",
    gap: 2,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 18,
  },
  distributionSegment: {
    flexBasis: 0,
    minWidth: 2,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
  },
  addButton: {
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 18,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 22,
    marginBottom: 10,
  },
  subscriptionCard: {
    backgroundColor: "#FDF8EF",
    borderColor: "rgba(212,175,106,0.6)",
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subscriptionMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  subscriptionMarkText: {
    fontSize: 22,
    color: COLORS.gold,
    fontWeight: "800",
  },
  subscriptionContent: {
    flex: 1,
  },
  subscriptionTitle: {
    fontWeight: "900",
    fontSize: 16,
    color: COLORS.text,
  },
  subscriptionStatus: {
    color: COLORS.green,
    marginTop: 4,
    fontWeight: "700",
    fontSize: 12,
  },
  subscriptionPrice: {
    fontWeight: "900",
    fontSize: 16,
    color: COLORS.brandDark,
  },
  subscriptionHint: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  dayTitle: {
    fontWeight: "900",
    color: COLORS.muted,
    marginTop: 12,
    marginBottom: 8,
  },
  expenseCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 18,
    padding: 14,
    marginBottom: 9,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  expenseIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F6EFEA",
    alignItems: "center",
    justifyContent: "center",
  },
  expenseContent: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
  },
  expenseMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 5,
  },
  categoryBadge: {
    backgroundColor: "#F3EBE6",
    color: COLORS.brand,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: "800",
    fontSize: 11,
  },
  recurringBadge: {
    backgroundColor: COLORS.goldPale,
    color: "#7A5A1E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: "800",
    fontSize: 11,
  },
  paymentText: {
    color: COLORS.muted,
    marginTop: 7,
  },
  lateBadge: {
    fontSize: 11,
    color: "#8A6E3E",
    backgroundColor: "#FBF4E6",
    padding: 5,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  expenseAmount: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  emptyTitle: {
    fontWeight: "900",
    color: COLORS.text,
  },
  emptyText: {
    color: COLORS.muted,
    marginTop: 5,
  },
  paperNotice: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F6EFEA",
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  investmentBox: {
    backgroundColor: COLORS.investment,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C6B3BC",
    borderRadius: 18,
    padding: 16,
  },
  investmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  investmentTitle: {
    fontWeight: "900",
    fontSize: 16,
  },
  investmentTotal: {
    fontWeight: "900",
    fontSize: 18,
    color: "#5B4356",
  },
  investmentNote: {
    color: "#7B6572",
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 8,
  },
  investmentLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2D8DE",
    paddingVertical: 10,
    gap: 10,
  },
  investmentDescription: {
    flex: 1,
    color: COLORS.text,
  },
  investmentLineAmount: {
    fontWeight: "900",
    color: "#5B4356",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(42,27,32,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    maxHeight: "94%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.brand,
  },
  formLabel: {
    fontWeight: "900",
    color: COLORS.muted,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dateField: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateFieldText: {
    fontSize: 17,
    color: COLORS.text,
  },
  formHint: {
    color: COLORS.muted,
    lineHeight: 19,
    marginTop: 7,
  },
  calendarBox: {
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    borderRadius: 16,
    padding: 8,
    marginTop: 8,
    backgroundColor: COLORS.white,
  },
  calendarDoneButton: {
    backgroundColor: COLORS.brand,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  calendarDoneText: {
    color: COLORS.white,
    fontWeight: "800",
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  categoryOptionText: {
    color: COLORS.text,
    fontWeight: "600",
  },
  categoryOptionTextSelected: {
    color: COLORS.white,
    fontWeight: "800",
  },
  moreCategories: {
    color: COLORS.brand,
    fontWeight: "900",
    textDecorationLine: "underline",
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 92,
    textAlignVertical: "top",
  },
  paymentModes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentMode: {
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  paymentModeSelected: {
    borderColor: COLORS.brand,
    backgroundColor: "#F6EFEA",
  },
  paymentModeText: {
    color: COLORS.text,
  },
  paymentModeTextSelected: {
    color: COLORS.brand,
    fontWeight: "900",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  customSwitch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D9CDC7",
    padding: 2,
    justifyContent: "center",
  },
  customSwitchEnabled: {
    backgroundColor: COLORS.brand,
  },
  customSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  customSwitchThumbEnabled: {
    transform: [{ translateX: 18 }],
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontWeight: "900",
    fontSize: 16,
    color: COLORS.text,
  },
  toggleSubtitle: {
    color: COLORS.muted,
    lineHeight: 19,
    marginTop: 4,
  },
  investmentAlert: {
    backgroundColor: COLORS.investment,
    borderLeftWidth: 3,
    borderLeftColor: "#A88FA0",
    padding: 12,
    borderRadius: 8,
  },
  investmentAlertText: {
    color: COLORS.text,
  },
  optionalLabel: {
    fontWeight: "400",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: COLORS.brand,
    fontWeight: "900",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 16,
  },
  modalBottomSpace: {
    height: 20,
  },
});
