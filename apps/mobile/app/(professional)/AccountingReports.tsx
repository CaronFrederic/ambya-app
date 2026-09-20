import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

import { ProHeader } from "./components/ProHeader";
import {
  createManualProductSale,
  deleteManualProductSale,
  getAccountingReport,
  updateManualProductSale,
  type AccountingReportResponse,
  type ManualProductSale,
  type ComparisonIndicator,
  type PeriodType,
} from "../../src/api/accounting-reports";
import { getCurrentSubscription } from "../../src/api/subscriptions";
import { getSubscriptionEntitlements } from "../../src/subscription/subscription-entitlements";

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
  greenPale: "#EAF2ED",
};

const PERIODS: PeriodType[] = [
  "Ce mois",
  "Trimestre",
  "Année",
  "Choisir",
];

function formatMoney(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function toYmd(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0"
  )}`;
}

function parseYmd(value: string): Date {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatDisplayDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR").format(
    parseYmd(value)
  );
}

function getCurrentMonthDates() {
  const today = new Date();

  return {
    startDate: toYmd(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    ),
    endDate: toYmd(today),
  };
}

function getDiffPresentation(
  indicator: ComparisonIndicator,
  kind: "revenue" | "expense" | "result"
) {
  const diff = indicator.diffPercent;

  if (diff === null || diff === 0) {
    return {
      value: "—",
      label: "stable",
      positive: false,
      neutral: true,
    };
  }

  const positive =
    kind === "expense" ? diff < 0 : diff > 0;

  return {
    value: `${diff > 0 ? "+" : ""}${diff
      .toFixed(1)
      .replace(".", ",")} %`,
    label: positive ? "mieux" : "à surveiller",
    positive,
    neutral: false,
  };
}

function SummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text
        style={[
          styles.summaryLabel,
          muted && styles.mutedText,
        ]}
      >
        {label}
      </Text>

      <Text style={styles.summaryAmount}>
        {formatMoney(value)} F
      </Text>
    </View>
  );
}

function ComparisonRow({
  label,
  indicator,
  kind,
}: {
  label: string;
  indicator: ComparisonIndicator;
  kind: "revenue" | "expense" | "result";
}) {
  const presentation = getDiffPresentation(
    indicator,
    kind
  );

  return (
    <View style={styles.comparisonRow}>
      <Text style={styles.comparisonLabel}>
        {label}
      </Text>

      <View style={styles.comparisonRight}>
        <Text style={styles.comparisonPercent}>
          {presentation.value}
        </Text>

        <View
          style={[
            styles.comparisonBadge,
            presentation.positive &&
              styles.comparisonBadgePositive,
          ]}
        >
          <Text
            style={[
              styles.comparisonBadgeText,
              presentation.positive &&
                styles.comparisonBadgeTextPositive,
            ]}
          >
            {presentation.neutral
              ? "— stable"
              : `${presentation.positive ? "▲" : "▼"} ${
                  presentation.label
                }`}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ComparisonChart({
  report,
}: {
  report: AccountingReportResponse;
}) {
  const data = [
    {
      label: "Recettes",
      real: report.comparison.revenue.real,
      estimated:
        report.comparison.revenue.estimated,
    },
    {
      label: "Dépenses",
      real: report.comparison.expenses.real,
      estimated:
        report.comparison.expenses.estimated,
    },
    {
      label: "Résultat",
      real: Math.max(
        0,
        report.comparison.result.real
      ),
      estimated: Math.max(
        0,
        report.comparison.result.estimated
      ),
    },
  ];

  const maximum = Math.max(
    1,
    ...data.flatMap((item) => [
      item.real,
      item.estimated,
    ])
  );

  return (
    <View style={styles.comparisonCard}>
      <View style={styles.chart}>
        {data.map((item) => {
          const realHeight = Math.max(
            8,
            (item.real / maximum) * 150
          );
          const estimatedHeight = Math.max(
            8,
            (item.estimated / maximum) * 150
          );

          return (
            <View
              key={item.label}
              style={styles.chartGroup}
            >
              <View style={styles.chartBars}>
                <View
                  style={[
                    styles.realBar,
                    {
                      height: realHeight,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.estimatedBar,
                    {
                      height: estimatedHeight,
                    },
                  ]}
                />
              </View>

              <Text style={styles.chartLabel}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={styles.realLegendSquare} />
          <Text style={styles.legendText}>
            Réalisé
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={styles.estimatedLegendSquare}
          />
          <Text style={styles.legendText}>
            Estimé
          </Text>
        </View>
      </View>

      <ComparisonRow
        label="Recettes"
        indicator={report.comparison.revenue}
        kind="revenue"
      />
      <ComparisonRow
        label="Dépenses"
        indicator={report.comparison.expenses}
        kind="expense"
      />
      <ComparisonRow
        label="Résultat"
        indicator={report.comparison.result}
        kind="result"
      />

      <Text style={styles.comparisonBasis}>
        {report.comparison.basisLabel}
      </Text>
    </View>
  );
}

export default function AccountingReportsScreen() {
  const currentDates = useMemo(
    () => getCurrentMonthDates(),
    []
  );

  const [periodType, setPeriodType] =
    useState<PeriodType>("Ce mois");
  const [startDate, setStartDate] = useState(
    currentDates.startDate
  );
  const [endDate, setEndDate] = useState(
    currentDates.endDate
  );
  const [dateTarget, setDateTarget] = useState<
    "start" | "end" | null
  >(null);

  const [report, setReport] =
    useState<AccountingReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [saleModalVisible, setSaleModalVisible] =
    useState(false);
  const [editingSale, setEditingSale] =
    useState<ManualProductSale | null>(null);
  const [saleAmount, setSaleAmount] = useState("");
  const [saleDate, setSaleDate] = useState(toYmd(new Date()));
  const [saleDatePickerVisible, setSaleDatePickerVisible] =
    useState(false);
  const [savingSale, setSavingSale] = useState(false);

  const loadReport = async (
    nextPeriod = periodType
  ) => {
    const data = await getAccountingReport({
      periodType: nextPeriod,
      startDate:
        nextPeriod === "Choisir"
          ? startDate
          : undefined,
      endDate:
        nextPeriod === "Choisir"
          ? endDate
          : undefined,
    });

    setReport(data);
  };

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);

        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) {
          throw new Error("Utilisateur non authentifié.");
        }

        const current = await getCurrentSubscription(token);
        const entitlements = getSubscriptionEntitlements(
          current.subscription.plan
        );

        if (!entitlements.managementRegister) {
          Alert.alert(
            "Fonctionnalité Premium",
            "Le Registre de gestion est réservé à l’offre Premium.",
            [
              {
                text: "Retour au dashboard",
                onPress: () => router.replace("/(professional)/dashboard"),
              },
            ]
          );
          router.replace("/(professional)/dashboard");
          return;
        }

        await loadReport();
      } catch (error) {
        Alert.alert(
          "Chargement impossible",
          error instanceof Error
            ? error.message
            : "Une erreur est survenue."
        );
      } finally {
        setLoading(false);
      }
    };

    void initialLoad();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadReport();
    } catch (error) {
      Alert.alert(
        "Actualisation impossible",
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const selectPeriod = async (
    nextPeriod: PeriodType
  ) => {
    setPeriodType(nextPeriod);

    if (nextPeriod === "Choisir") {
      return;
    }

    try {
      setRefreshing(true);
      const data = await getAccountingReport({
        periodType: nextPeriod,
      });
      setReport(data);
    } catch (error) {
      Alert.alert(
        "Chargement impossible",
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const applyCustomPeriod = async () => {
    if (parseYmd(startDate) > parseYmd(endDate)) {
      Alert.alert(
        "Période invalide",
        "La date de début doit précéder la date de fin."
      );
      return;
    }

    try {
      setRefreshing(true);
      await loadReport("Choisir");
    } catch (error) {
      Alert.alert(
        "Chargement impossible",
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const onDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setDateTarget(null);
    }

    if (
      event.type === "dismissed" ||
      !selectedDate ||
      !dateTarget
    ) {
      return;
    }

    const value = toYmd(selectedDate);

    if (dateTarget === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  const openCreateSale = () => {
    setEditingSale(null);
    setSaleAmount("");
    setSaleDate(toYmd(new Date()));
    setSaleModalVisible(true);
  };

  const openEditSale = (sale: ManualProductSale) => {
    setEditingSale(sale);
    setSaleAmount(String(sale.amount));
    setSaleDate(sale.saleDate);
    setSaleModalVisible(true);
  };

  const closeSaleModal = () => {
    if (savingSale) {
      return;
    }

    setSaleDatePickerVisible(false);
    setSaleModalVisible(false);
    setEditingSale(null);
  };

  const saveProductSale = async () => {
    const amount = Number(saleAmount.replace(/\s/g, ""));

    if (!Number.isInteger(amount) || amount <= 0) {
      Alert.alert(
        "Montant invalide",
        "Saisissez un montant supérieur à 0 FCFA."
      );
      return;
    }

    try {
      setSavingSale(true);

      if (editingSale) {
        await updateManualProductSale(editingSale.id, {
          amount,
          saleDate,
        });
      } else {
        await createManualProductSale({ amount, saleDate });
      }

      setSaleModalVisible(false);
      setEditingSale(null);
      await loadReport();
    } catch (error) {
      Alert.alert(
        "Enregistrement impossible",
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setSavingSale(false);
    }
  };

  const confirmDeleteSale = (sale: ManualProductSale) => {
    Alert.alert(
      "Supprimer la vente",
      `Supprimer la vente de ${formatMoney(sale.amount)} FCFA du ${formatDisplayDate(
        sale.saleDate
      )} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteManualProductSale(sale.id);
                await loadReport();
              } catch (error) {
                Alert.alert(
                  "Suppression impossible",
                  error instanceof Error
                    ? error.message
                    : "Une erreur est survenue."
                );
              }
            })();
          },
        },
      ]
    );
  };

  const openExport = () => {
    router.push({
      pathname:
        "/(professional)/accounting-report-export",
      params: {
        periodType,
        startDate:
          periodType === "Choisir"
            ? startDate
            : "",
        endDate:
          periodType === "Choisir"
            ? endDate
            : "",
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ProHeader
          title="Registre de gestion"
          subtitle="Vue simplifiée de votre activité"
          backTo="/(professional)/dashboard"
        />

        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color={COLORS.brand}
          />
          <Text style={styles.loaderText}>
            Chargement du registre...
          </Text>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <ProHeader
          title="Registre de gestion"
          subtitle="Vue simplifiée de votre activité"
          backTo="/(professional)/dashboard"
        />

        <View style={styles.loader}>
          <Text style={styles.loaderText}>
            Le registre n'est pas disponible.
          </Text>
        </View>
      </View>
    );
  }

  const topExpenses =
    report.expenses.byCategory.slice(0, 5);
  const remainingExpenses =
    report.expenses.byCategory.slice(5);
  const remainingTotal = remainingExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <View style={styles.container}>
      <ProHeader
        title="Registre de gestion"
        subtitle="Vue simplifiée de votre activité"
        backTo="/(professional)/dashboard"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.periodCard}>
          <Text style={styles.sectionEyebrow}>
            PÉRIODE
          </Text>

          <View style={styles.periodGrid}>
            {PERIODS.map((period) => {
              const active = periodType === period;

              return (
                <Pressable
                  key={period}
                  style={[
                    styles.periodButton,
                    active &&
                      styles.periodButtonActive,
                  ]}
                  onPress={() =>
                    void selectPeriod(period)
                  }
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      active &&
                        styles.periodButtonTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {periodType === "Choisir" && (
            <View style={styles.customPeriod}>
              <View style={styles.dateButtons}>
                <Pressable
                  style={styles.dateButton}
                  onPress={() =>
                    setDateTarget("start")
                  }
                >
                  <Text style={styles.dateCaption}>
                    Du
                  </Text>
                  <Text style={styles.dateValue}>
                    {formatDisplayDate(startDate)}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.dateButton}
                  onPress={() =>
                    setDateTarget("end")
                  }
                >
                  <Text style={styles.dateCaption}>
                    Au
                  </Text>
                  <Text style={styles.dateValue}>
                    {formatDisplayDate(endDate)}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.applyButton}
                onPress={applyCustomPeriod}
              >
                <Text style={styles.applyButtonText}>
                  Appliquer
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.periodSummary}>
            {report.period.label}
          </Text>
        </View>

        <View style={styles.registerCard}>
          <Text style={styles.blockTitle}>
            RECETTES
          </Text>

          <View style={styles.heroAmountRow}>
            <View>
              <Text style={styles.heroLabel}>
                RECETTES
              </Text>
              <Text style={styles.heroSubtitle}>
                Encaissements de la période · montants TTC
              </Text>
            </View>

            <Text style={styles.heroAmount}>
              {formatMoney(report.revenue.total)}
              <Text style={styles.heroCurrency}>
                {" "}F
              </Text>
            </Text>
          </View>

          <View style={styles.separator} />

          <SummaryRow
            label="Prestations"
            value={report.revenue.services}
          />
          <View style={styles.productSalesHeader}>
            <View style={styles.productSalesLabelWrap}>
              <Text style={styles.summaryLabel}>
                Ventes de produits
              </Text>
              <Text style={styles.productSalesHint}>
                Saisie manuelle · {report.revenue.productLineCount} vente
                {report.revenue.productLineCount > 1 ? "s" : ""}
              </Text>
            </View>

            <View style={styles.productSalesRight}>
              <Text style={styles.summaryAmount}>
                {formatMoney(report.revenue.products)} F
              </Text>
              <Pressable
                style={styles.addSaleButton}
                onPress={openCreateSale}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={COLORS.white}
                />
                <Text style={styles.addSaleButtonText}>
                  Ajouter
                </Text>
              </Pressable>
            </View>
          </View>

          {report.revenue.productSales.length > 0 && (
            <View style={styles.productSalesList}>
              {report.revenue.productSales.map((sale) => (
                <View key={sale.id} style={styles.productSaleItem}>
                  <View>
                    <Text style={styles.productSaleDate}>
                      {formatDisplayDate(sale.saleDate)}
                    </Text>
                    <Text style={styles.productSaleAmount}>
                      {formatMoney(sale.amount)} FCFA
                    </Text>
                  </View>

                  <View style={styles.productSaleActions}>
                    <Pressable
                      style={styles.iconAction}
                      onPress={() => openEditSale(sale)}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={18}
                        color={COLORS.brand}
                      />
                    </Pressable>
                    <Pressable
                      style={styles.iconAction}
                      onPress={() => confirmDeleteSale(sale)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#B91C1C"
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.separator} />

          <SummaryRow
            label="Total"
            value={report.revenue.total}
          />

          <Text style={styles.blockTitle}>
            DÉPENSES
          </Text>

          <View style={styles.heroAmountRow}>
            <View>
              <Text style={styles.heroLabel}>
                DÉPENSES
              </Text>
              <Text style={styles.heroSubtitle}>
                Sorties enregistrées ·{" "}
                {report.expenses.lineCount} ligne
                {report.expenses.lineCount > 1
                  ? "s"
                  : ""}
              </Text>
            </View>

            <Text style={styles.heroAmount}>
              {formatMoney(report.expenses.total)}
              <Text style={styles.heroCurrency}>
                {" "}F
              </Text>
            </Text>
          </View>

          <View style={styles.separator} />

          {topExpenses.length === 0 ? (
            <Text style={styles.noExpenseText}>
              Aucune dépense enregistrée · 0 FCFA
            </Text>
          ) : (
            topExpenses.map((expense) => (
              <SummaryRow
                key={expense.category}
                label={expense.category}
                value={expense.amount}
              />
            ))
          )}

          {remainingExpenses.length > 0 && (
            <SummaryRow
              label={`${remainingExpenses.length} autres postes`}
              value={remainingTotal}
              muted
            />
          )}

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>
              RÉSULTAT DE LA PÉRIODE
            </Text>

            <Text style={styles.resultAmount}>
              {formatMoney(report.result)}
              <Text style={styles.resultCurrency}>
                {" "}F
              </Text>
            </Text>

            <Text style={styles.resultHint}>
              Avant impôts et usure du matériel
            </Text>
          </View>
        </View>

        <Text style={styles.sectionEyebrowOutside}>
          EN DEHORS DU RÉSULTAT
        </Text>

        <View style={styles.investmentCard}>
          <View style={styles.investmentHeader}>
            <Text style={styles.investmentTitle}>
              Investissements
            </Text>

            <Text style={styles.investmentAmount}>
              {formatMoney(
                report.investments.total
              )}{" "}
              F
            </Text>
          </View>

          <Text style={styles.investmentText}>
            Matériel acheté sur la période. Il sert
            plusieurs années, donc il n'est pas retiré
            du résultat — votre comptable l'étalera sur
            sa durée d'usage.
          </Text>
        </View>

        <Text style={styles.sectionEyebrowOutside}>
          COMPARAISON AVEC VOS MOIS PRÉCÉDENTS
        </Text>

        <ComparisonChart report={report} />

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>
            Un repère, pas une comptabilité
          </Text>

          <Text style={styles.disclaimerText}>
            Ce registre vous aide à piloter votre
            activité au quotidien. Il ne tient pas
            compte des impôts, de l'usure du matériel
            ni des règles fiscales, et ne remplace pas
            votre comptable.
          </Text>
        </View>

        <Text style={styles.sectionEyebrowOutside}>
          EXPORTER LE REGISTRE
        </Text>

        <View style={styles.exportButtons}>
          <Pressable
            style={styles.exportButton}
            onPress={openExport}
          >
            <Ionicons
              name="document-text-outline"
              size={28}
              color={COLORS.brand}
            />
            <Text style={styles.exportButtonText}>
              Excel
            </Text>
          </Pressable>

          <Pressable
            style={styles.exportButton}
            onPress={openExport}
          >
            <Ionicons
              name="document-outline"
              size={28}
              color={COLORS.brand}
            />
            <Text style={styles.exportButtonText}>
              PDF
            </Text>
          </Pressable>
        </View>

        <Text style={styles.exportHint}>
          Excel pour retravailler les chiffres, PDF
          pour transmettre.
        </Text>
      </ScrollView>

      <Modal
        transparent
        visible={saleModalVisible}
        animationType="fade"
        onRequestClose={closeSaleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.saleModal}>
            <Text style={styles.calendarTitle}>
              {editingSale
                ? "Modifier la vente de produits"
                : "Ajouter une vente de produits"}
            </Text>

            <Text style={styles.inputLabel}>Montant</Text>
            <View style={styles.amountInputWrap}>
              <TextInput
                value={saleAmount}
                onChangeText={(value) =>
                  setSaleAmount(value.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
                placeholder="Ex. 25000"
                placeholderTextColor={COLORS.muted}
                style={styles.amountInput}
              />
              <Text style={styles.inputCurrency}>FCFA</Text>
            </View>

            <Text style={styles.inputLabel}>Date de la vente</Text>
            <Pressable
              style={styles.saleDateButton}
              onPress={() => setSaleDatePickerVisible(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.brand}
              />
              <Text style={styles.saleDateButtonText}>
                {formatDisplayDate(saleDate)}
              </Text>
            </Pressable>

            {saleDatePickerVisible && (
              <View style={styles.saleDatePickerWrap}>
                <DateTimePicker
                  value={parseYmd(saleDate)}
                  mode="date"
                  display={
                    Platform.OS === "ios" ? "inline" : "calendar"
                  }
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") {
                      setSaleDatePickerVisible(false);
                    }

                    if (event.type === "dismissed" || !selectedDate) {
                      return;
                    }

                    setSaleDate(toYmd(selectedDate));
                  }}
                  locale="fr-FR"
                  themeVariant="light"
                  accentColor={COLORS.brand}
                />

                {Platform.OS === "ios" && (
                  <Pressable
                    style={styles.calendarDone}
                    onPress={() => setSaleDatePickerVisible(false)}
                  >
                    <Text style={styles.calendarDoneText}>
                      Terminé
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.saleModalActions}>
              <Pressable
                style={styles.cancelSaleButton}
                onPress={closeSaleModal}
                disabled={savingSale}
              >
                <Text style={styles.cancelSaleButtonText}>
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveSaleButton,
                  savingSale && styles.disabledButton,
                ]}
                onPress={() => void saveProductSale()}
                disabled={savingSale}
              >
                {savingSale ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveSaleButtonText}>
                    Enregistrer
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={dateTarget !== null}
        animationType="fade"
        onRequestClose={() => setDateTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <Text style={styles.calendarTitle}>
              {dateTarget === "start"
                ? "Date de début"
                : "Date de fin"}
            </Text>

            {dateTarget && (
              <DateTimePicker
                value={parseYmd(
                  dateTarget === "start"
                    ? startDate
                    : endDate
                )}
                mode="date"
                display={
                  Platform.OS === "ios"
                    ? "inline"
                    : "calendar"
                }
                maximumDate={new Date()}
                onChange={onDateChange}
                locale="fr-FR"
                themeVariant="light"
                accentColor={COLORS.brand}
              />
            )}

            {Platform.OS === "ios" && (
              <Pressable
                style={styles.calendarDone}
                onPress={() => setDateTarget(null)}
              >
                <Text style={styles.calendarDoneText}>
                  Terminé
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 42,
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
  periodCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  sectionEyebrow: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionEyebrowOutside: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 22,
    marginBottom: 10,
  },
  periodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  periodButton: {
    flexGrow: 1,
    minWidth: "46%",
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  periodButtonText: {
    color: COLORS.text,
    fontWeight: "800",
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  customPeriod: {
    marginTop: 12,
  },
  dateButtons: {
    flexDirection: "row",
    gap: 8,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 12,
  },
  dateCaption: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  dateValue: {
    color: COLORS.text,
    fontWeight: "800",
    marginTop: 4,
  },
  applyButton: {
    backgroundColor: COLORS.brand,
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    marginTop: 8,
  },
  applyButtonText: {
    color: COLORS.white,
    fontWeight: "900",
  },
  periodSummary: {
    color: COLORS.muted,
    marginTop: 12,
    textAlign: "center",
  },
  registerCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 22,
    padding: 18,
  },
  blockTitle: {
    color: COLORS.muted,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginTop: 10,
    marginBottom: 12,
  },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroLabel: {
    color: COLORS.brandSoft,
    fontWeight: "900",
    fontSize: 15,
  },
  heroSubtitle: {
    color: COLORS.muted,
    marginTop: 5,
    maxWidth: 220,
  },
  heroAmount: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
  },
  heroCurrency: {
    fontSize: 14,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 12,
  },
  summaryLabel: {
    color: "#59484D",
    fontSize: 16,
    flex: 1,
  },
  summaryAmount: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  mutedText: {
    color: COLORS.muted,
    fontStyle: "italic",
  },
  noExpenseText: {
    color: COLORS.muted,
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: COLORS.brand,
    borderRadius: 18,
    padding: 18,
    marginTop: 10,
  },
  resultLabel: {
    color: COLORS.gold,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  resultAmount: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "800",
    marginTop: 12,
  },
  resultCurrency: {
    fontSize: 17,
    fontWeight: "600",
  },
  resultHint: {
    color: "rgba(255,255,255,0.65)",
    marginTop: 6,
  },
  investmentCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBB5C0",
    borderRadius: 18,
    backgroundColor: "#F7F2F6",
    padding: 18,
  },
  investmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  investmentTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  investmentAmount: {
    color: "#644A60",
    fontSize: 20,
    fontWeight: "800",
  },
  investmentText: {
    color: "#806A77",
    lineHeight: 21,
    marginTop: 8,
  },
  comparisonCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 20,
    padding: 18,
  },
  chart: {
    height: 190,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingHorizontal: 6,
  },
  chartGroup: {
    alignItems: "center",
    width: 82,
  },
  chartBars: {
    height: 155,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  realBar: {
    width: 20,
    backgroundColor: COLORS.brandSoft,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  estimatedBar: {
    width: 20,
    backgroundColor: COLORS.goldPale,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  chartLabel: {
    color: COLORS.muted,
    fontWeight: "800",
    marginTop: 7,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 22,
    marginVertical: 18,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  realLegendSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: COLORS.brand,
  },
  estimatedLegendSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: COLORS.goldPale,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  legendText: {
    color: COLORS.muted,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  comparisonLabel: {
    color: "#59484D",
    fontSize: 16,
  },
  comparisonRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  comparisonPercent: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16,
  },
  comparisonBadge: {
    backgroundColor: "#F1EDEA",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  comparisonBadgePositive: {
    backgroundColor: COLORS.greenPale,
  },
  comparisonBadgeText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 12,
  },
  comparisonBadgeTextPositive: {
    color: COLORS.green,
  },
  comparisonBasis: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 8,
  },
  disclaimerCard: {
    backgroundColor: "#F6EFEA",
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    padding: 16,
    marginTop: 22,
  },
  disclaimerTitle: {
    color: COLORS.brand,
    fontWeight: "900",
    fontSize: 16,
  },
  disclaimerText: {
    color: "#705C62",
    lineHeight: 22,
    marginTop: 8,
  },
  exportButtons: {
    flexDirection: "row",
    gap: 12,
  },
  exportButton: {
    flex: 1,
    minHeight: 116,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  exportButtonText: {
    color: COLORS.brand,
    fontSize: 18,
    fontWeight: "900",
  },
  exportHint: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(42,27,32,0.45)",
    justifyContent: "center",
    padding: 18,
  },
  calendarModal: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
  },
  calendarTitle: {
    color: COLORS.brand,
    fontWeight: "900",
    fontSize: 19,
    marginBottom: 8,
  },
  calendarDone: {
    backgroundColor: COLORS.brand,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  calendarDoneText: {
    color: COLORS.white,
    fontWeight: "900",
  },
  productSalesHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
  },
  productSalesLabelWrap: {
    flex: 1,
  },
  productSalesHint: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 11,
  },
  productSalesRight: {
    alignItems: "flex-end",
    gap: 7,
  },
  addSaleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.brand,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addSaleButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },
  productSalesList: {
    marginTop: 8,
    gap: 8,
  },
  productSaleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  productSaleDate: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  productSaleAmount: {
    marginTop: 2,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  productSaleActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  saleModal: {
    width: "92%",
    maxWidth: 460,
    maxHeight: "90%",
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 20,
  },
  inputLabel: {
    marginTop: 16,
    marginBottom: 7,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
  },
  amountInput: {
    flex: 1,
    minHeight: 48,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  inputCurrency: {
    color: COLORS.brand,
    fontSize: 12,
    fontWeight: "900",
  },
  saleDateButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },
  saleDateButtonText: {
    color: COLORS.text,
    fontWeight: "800",
  },
  saleDatePickerWrap: {
    marginTop: 10,
  },
  saleModalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelSaleButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cancelSaleButtonText: {
    color: COLORS.brand,
    fontWeight: "800",
  },
  saveSaleButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: COLORS.brand,
  },
  saveSaleButtonText: {
    color: COLORS.white,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.65,
  },
});
