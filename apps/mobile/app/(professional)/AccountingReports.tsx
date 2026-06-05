import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProHeader } from "./components/ProHeader";
import {
  getAccountingReport,
  getAccountingReportExportUrl,
  type AccountingReportResponse,
  type PeriodType,
  type ViewMode,
} from "../../src/api/accounting-reports";

const COLORS = {
  bg: "#FAF7F2",
  text: "#3A3A3A",
  primary: "#6B2737",
  gold: "#D4AF6A",
  green: "#008A3D",
  red: "#D00000",
  blue: "#0057FF",
};

function formatFCFA(value: number) {
  return `${Math.round(value).toLocaleString("fr-FR")} FCFA`;
}

function currentMonthTitle() {
  return new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function diffPercent(real: number, forecast: number) {
  if (forecast <= 0) return 0;
  return Math.round(((real - forecast) / forecast) * 1000) / 10;
}

function getCurrentMonthDates() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function AccountingReports() {
  const [viewMode, setViewMode] = useState<ViewMode>("comparaison");
  const [periodType, setPeriodType] = useState<PeriodType>("Ce mois");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [report, setReport] = useState<AccountingReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const canLoadReport =
    periodType !== "Personnalisé" ||
    (startDate.trim().length > 0 && endDate.trim().length > 0);

  const forecast = useMemo(() => {
    return {
      serviceSales: report?.comparison?.revenue.serviceSales.forecast ?? 0,
      productSales: report?.comparison?.revenue.productSales.forecast ?? 0,
      expenses: report?.forecast?.kpis.quarterExpenses ?? 0,
      netResult: report?.comparison?.netResult.forecast ?? 0,
    };
  }, [report]);

  const real = useMemo(() => {
    const serviceSales = report?.incomeStatement.revenue.serviceSales ?? 0;
    const productSales = report?.incomeStatement.revenue.productSales ?? 0;
    const totalRevenue =
      report?.incomeStatement.revenue.total ?? serviceSales + productSales;
    const totalExpenses = report?.incomeStatement.expenses.total ?? 0;
    const netResult =
      report?.incomeStatement.netResult ?? totalRevenue - totalExpenses;

    return {
      serviceSales,
      productSales,
      totalRevenue,
      totalExpenses,
      netResult,
      expenses: report?.incomeStatement.expenses.byCategory ?? [],
    };
  }, [report]);

  const loadReport = async () => {
    if (!canLoadReport) {
      return;
    }

    const data = await getAccountingReport({
      reportType: "compte-resultat",
      periodType,
      startDate: periodType === "Personnalisé" ? startDate.trim() : undefined,
      endDate: periodType === "Personnalisé" ? endDate.trim() : undefined,
    });

    setReport(data);
  };

  const initialLoad = async () => {
    try {
      setLoading(true);
      await loadReport();
    } catch (error) {
      console.error("Accounting report load error:", error);
      Alert.alert(
        "Chargement impossible",
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadReport();
    } catch (error) {
      console.error("Accounting report refresh error:", error);
      Alert.alert(
        "Actualisation impossible",
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    if (!loading && canLoadReport) {
      loadReport().catch((error) => {
        console.error("Accounting report reload error:", error);
        Alert.alert(
          "Chargement impossible",
          error instanceof Error ? error.message : "Une erreur est survenue.",
        );
      });
    }
  }, [periodType]);

  const handleChangePeriod = (period: PeriodType) => {
    setPeriodType(period);

    if (period === "Personnalisé" && (!startDate.trim() || !endDate.trim())) {
      const dates = getCurrentMonthDates();
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    }
  };

  const handleApplyCustomPeriod = async () => {
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert(
        "Période incomplète",
        "Veuillez renseigner une date de début et une date de fin.",
      );
      return;
    }

    try {
      setRefreshing(true);
      await loadReport();
    } catch (error) {
      console.error("Accounting custom period error:", error);
      Alert.alert(
        "Chargement impossible",
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportExcel = async () => {
    if (periodType === "Personnalisé" && (!startDate.trim() || !endDate.trim())) {
      Alert.alert(
        "Période incomplète",
        "Veuillez renseigner une date de début et une date de fin avant l’export.",
      );
      return;
    }

    try {
      setExporting(true);

      const url = await getAccountingReportExportUrl({
        reportType: "compte-resultat",
        periodType,
        startDate:
          periodType === "Personnalisé" ? startDate.trim() : undefined,
        endDate: periodType === "Personnalisé" ? endDate.trim() : undefined,
      });

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "Export impossible",
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProHeader
        title="Comptabilité & Rapports Prévisionnels"
        subtitle="Normes SYSCOHADA - Prévisions et analyses"
        backTo="/(professional)/dashboard"
      />

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Chargement du rapport...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <InfoBox />

          <View style={styles.tabs}>
            <ModeTab
              label="Comparaison"
              active={viewMode === "comparaison"}
              onPress={() => setViewMode("comparaison")}
            />
            <ModeTab
              label="Prévisionnel"
              active={viewMode === "previsionnel"}
              onPress={() => setViewMode("previsionnel")}
              info
            />
            <ModeTab
              label="Réel"
              active={viewMode === "reel"}
              onPress={() => setViewMode("reel")}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Période</Text>

            <View style={styles.periodGrid}>
              {(
                [
                  "Ce mois",
                  "Mois dernier",
                  "Cette année",
                  "Personnalisé",
                ] as const
              ).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => handleChangePeriod(p)}
                  style={[
                    styles.periodOption,
                    periodType === p && styles.periodOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodOptionText,
                      periodType === p && styles.periodOptionTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>

            {periodType === "Personnalisé" ? (
              <>
                <View style={styles.dateRow}>
                  <TextInput
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="Début YYYY-MM-DD"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  <TextInput
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="Fin YYYY-MM-DD"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>

                <Pressable
                  onPress={handleApplyCustomPeriod}
                  disabled={!startDate.trim() || !endDate.trim()}
                  style={[
                    styles.applyPeriodBtn,
                    (!startDate.trim() || !endDate.trim()) && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.applyPeriodBtnText}>
                    Appliquer la période
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>

          {viewMode === "comparaison" ? (
            <ComparisonView
              real={real}
              forecast={forecast}
              comparison={report?.comparison}
              chartData={report?.charts?.realVsForecast ?? []}
            />
          ) : null}

          {viewMode === "previsionnel" ? (
            <ForecastView
              months={report?.forecast?.months ?? []}
              kpis={report?.forecast?.kpis}
            />
          ) : null}

          {viewMode === "reel" ? (
            <RealView
              real={real}
              trend={report?.summary.trendPercent ?? 0}
              chartData={report?.charts?.realMonthly ?? []}
            />
          ) : null}

          <View style={styles.exportRow}>
            <Pressable style={[styles.exportBtn, { backgroundColor: "#DC2626" }]}>
              <Ionicons name="download-outline" size={18} color="#FFF" />
              <Text style={styles.exportText}>PDF</Text>
            </Pressable>

            <Pressable
              onPress={handleExportExcel}
              disabled={exporting}
              style={[
                styles.exportBtn,
                { backgroundColor: "#16A34A", opacity: exporting ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="download-outline" size={18} color="#FFF" />
              <Text style={styles.exportText}>
                {exporting ? "Export..." : "Excel"}
              </Text>
            </Pressable>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

function InfoBox() {
  return (
    <View style={styles.infoBox}>
      <View style={styles.infoIcon}>
        <Text style={styles.infoIconText}>i</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>
          Comment fonctionne la comptabilité prévisionnelle ?
        </Text>

        <Text style={styles.infoText}>
          <Text style={styles.bold}>• Comparaison :</Text> Compare vos chiffres
          réels avec vos prévisions pour identifier les écarts et ajuster votre
          stratégie.
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.bold}>• Prévisionnel :</Text> Affiche les
          projections pour les 3 prochains mois basées sur votre historique.
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.bold}>• Réel :</Text> Montre vos résultats
          conformes aux normes SYSCOHADA.
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.bold}>• Dépenses :</Text> Les charges affichées
          proviennent des dépenses enregistrées dans la page Dépenses.
        </Text>
      </View>
    </View>
  );
}

function ModeTab({
  label,
  active,
  onPress,
  info,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  info?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <View style={styles.tabContent}>
        <Text style={[styles.tabText, active && styles.tabTextActive]}>
          {label}
        </Text>
        {info ? (
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={active ? "#FFF" : "#3B82F6"}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function ComparisonView({
  real,
  forecast,
  comparison,
  chartData,
}: {
  real: {
    serviceSales: number;
    productSales: number;
    totalRevenue: number;
    totalExpenses: number;
    netResult: number;
    expenses: { category: string; amount: number }[];
  };
  forecast: {
    serviceSales: number;
    productSales: number;
    expenses: number;
    netResult: number;
  };
  comparison?: AccountingReportResponse["comparison"];
  chartData: Array<{
    label: string;
    real: number;
    forecast: number;
  }>;
}) {
  const fallbackExpenses = real.expenses.length
    ? real.expenses
    : [{ category: "Aucune dépense enregistrée", amount: 0 }];

  const maxChartValue = Math.max(
    ...chartData.map((d) => Math.max(d.real, d.forecast)),
    1,
  );

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Compte de Résultat - {currentMonthTitle()}
        </Text>

        <Text style={styles.smallLabel}>Classe 7 - Revenus</Text>

        <ComparisonLine
          label="Ventes de services"
          real={comparison?.revenue.serviceSales.real ?? real.serviceSales}
          forecast={
            comparison?.revenue.serviceSales.forecast ?? forecast.serviceSales
          }
          diffPercent={comparison?.revenue.serviceSales.diffPercent}
          kind="revenue"
        />

        <ComparisonLine
          label="Produits vendus"
          real={comparison?.revenue.productSales.real ?? real.productSales}
          forecast={
            comparison?.revenue.productSales.forecast ?? forecast.productSales
          }
          diffPercent={comparison?.revenue.productSales.diffPercent}
          kind="revenue"
        />

        <Text style={[styles.smallLabel, { marginTop: 16 }]}>
          Classe 6 - Dépenses issues de la page Dépenses
        </Text>

        {(comparison?.expenses.length ? comparison.expenses : fallbackExpenses)
          .slice(0, 6)
          .map((expense, index) => (
            <ComparisonLine
              key={`${expense.category}-${index}`}
              label={expense.category}
              real={"real" in expense ? expense.real : expense.amount}
              forecast={
                "forecast" in expense
                  ? expense.forecast
                  : Math.round(expense.amount * 0.92)
              }
              diffPercent={
                "diffPercent" in expense ? expense.diffPercent : undefined
              }
              kind="expense"
            />
          ))}

        <View style={styles.separator} />

        <ComparisonLine
          label="Résultat Net"
          real={comparison?.netResult.real ?? real.netResult}
          forecast={comparison?.netResult.forecast ?? forecast.netResult}
          diffPercent={comparison?.netResult.diffPercent}
          kind="result"
          large
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.chartTitle}>
          Évolution Réel vs Prévisionnel
        </Text>

        <View style={styles.chart}>
          {chartData.length > 0 ? (
            chartData.map((item, index) => {
              const realHeight = Math.max(6, (item.real / maxChartValue) * 100);
              const forecastHeight = Math.max(
                6,
                (item.forecast / maxChartValue) * 100,
              );

              return (
                <View key={`${item.label}-${index}`} style={styles.chartPair}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${realHeight}%`,
                        backgroundColor: "#22C55E",
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${forecastHeight}%`,
                        backgroundColor: "#3B82F6",
                      },
                    ]}
                  />
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyChartText}>Aucune donnée disponible.</Text>
          )}
        </View>

        <View style={styles.legend}>
          <Legend color="#22C55E" label="Réel" />
          <Legend color="#3B82F6" label="Prévisionnel" />
        </View>

        <View style={styles.chartFooter}>
          <Text style={styles.chartDate}>{chartData[0]?.label ?? "-"}</Text>
          <Text style={styles.chartDate}>
            {chartData[chartData.length - 1]?.label ?? "-"}
          </Text>
        </View>
      </View>
    </>
  );
}

function ComparisonLine({
  label,
  real,
  forecast,
  diffPercent: backendDiffPercent,
  kind,
  large,
}: {
  label: string;
  real: number;
  forecast: number;
  diffPercent?: number;
  kind: "revenue" | "expense" | "result";
  large?: boolean;
}) {
  const percent = backendDiffPercent ?? diffPercent(real, forecast);
  const positive = percent >= 0;

  return (
    <View
      style={[
        styles.comparisonLine,
        kind === "expense"
          ? styles.expenseGradient
          : kind === "result"
            ? styles.resultGradient
            : styles.revenueGradient,
      ]}
    >
      <Text style={[styles.lineTitle, large && { fontSize: 16 }]}>
        {label}
      </Text>

      <View style={styles.comparisonBottom}>
        <View style={{ flex: 1 }}>
          <MoneyRow
            label="Réel"
            value={real}
            color={
              kind === "expense"
                ? COLORS.red
                : kind === "result"
                  ? COLORS.gold
                  : COLORS.green
            }
          />
          <MoneyRow label="Prévisionnel" value={forecast} color={COLORS.blue} />
        </View>

        <View
          style={[
            styles.percentBadge,
            { backgroundColor: positive ? "#DCFCE7" : "#FFEDD5" },
          ]}
        >
          <Text
            style={[
              styles.percentText,
              { color: positive ? "#15803D" : "#EA580C" },
            ]}
          >
            {positive ? "+" : ""}
            {percent}%
          </Text>
        </View>
      </View>
    </View>
  );
}

function ForecastView({
  months,
  kpis,
}: {
  months: Array<{
    month: string;
    revenue: number;
    expenses: number;
    result: number;
  }>;
  kpis?: NonNullable<AccountingReportResponse["forecast"]>["kpis"];
}) {
  const safeMonths = months.length
    ? months
    : [
        { month: "Mois +1", revenue: 0, expenses: 0, result: 0 },
        { month: "Mois +2", revenue: 0, expenses: 0, result: 0 },
        { month: "Mois +3", revenue: 0, expenses: 0, result: 0 },
      ];

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Projections - 3 prochains mois</Text>
        <Text style={styles.smallLabel}>
          Basé sur l'historique des revenus et des dépenses enregistrées
        </Text>

        {safeMonths.map((month) => (
          <View key={month.month} style={styles.forecastCard}>
            <Text style={styles.forecastMonth}>{month.month}</Text>

            <MoneyRow
              label="Revenus prévisionnels"
              value={month.revenue}
              color={COLORS.green}
            />
            <MoneyRow
              label="Dépenses prévisionnelles"
              value={month.expenses}
              color={COLORS.red}
            />

            <View style={styles.separatorLight} />

            <MoneyRow
              label="Résultat prévisionnel"
              value={month.result}
              color={COLORS.gold}
              strong
            />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.chartTitle}>Indicateurs Prévisionnels Clés</Text>

        <View style={styles.kpiGrid}>
          <KpiBox
            label="CA Prévisionnel T2"
            value={formatFCFA(kpis?.quarterRevenue ?? 0)}
            sub={`Résultat: ${formatFCFA(kpis?.quarterResult ?? 0)}`}
            color="#15803D"
            bg="#F0FDF4"
          />
          <KpiBox
            label="Dépenses prévues"
            value={formatFCFA(kpis?.quarterExpenses ?? 0)}
            sub="Projection charges"
            color="#DC2626"
            bg="#FEF2F2"
          />
          <KpiBox
            label="Marge Prévue"
            value={`${kpis?.marginPercent ?? 0}%`}
            sub="Objectif: 40%"
            color="#1D4ED8"
            bg="#EFF6FF"
          />
          <KpiBox
            label="Panier Moyen"
            value={formatFCFA(kpis?.averageBasket ?? 0)}
            sub="Moyenne estimée"
            color="#B45309"
            bg="#FFFBEB"
          />
        </View>
      </View>
    </>
  );
}

function RealView({
  real,
  trend,
  chartData,
}: {
  real: {
    serviceSales: number;
    productSales: number;
    totalRevenue: number;
    totalExpenses: number;
    netResult: number;
    expenses: { category: string; amount: number }[];
  };
  trend: number;
  chartData: Array<{
    label: string;
    value: number;
  }>;
}) {
  const expenses = real.expenses.length
    ? real.expenses
    : [{ category: "Aucune dépense enregistrée", amount: 0 }];

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Compte de Résultat Réel - {currentMonthTitle()}
        </Text>

        <Text style={styles.smallLabel}>Classe 7 - Revenus</Text>
        <View style={[styles.statementBox, { backgroundColor: "#ECFDF5" }]}>
          <MoneyRow
            label="Ventes de services"
            value={real.serviceSales}
            color={COLORS.green}
          />
          <MoneyRow
            label="Produits vendus"
            value={real.productSales}
            color={COLORS.green}
          />
          <View style={styles.separatorLight} />
          <MoneyRow
            label="Total Revenus"
            value={real.totalRevenue}
            color={COLORS.green}
            strong
          />
        </View>

        <Text style={[styles.smallLabel, { marginTop: 16 }]}>
          Classe 6 - Dépenses enregistrées
        </Text>
        <View style={[styles.statementBox, { backgroundColor: "#FEF2F2" }]}>
          {expenses.map((item, index) => (
            <MoneyRow
              key={`${item.category}-${index}`}
              label={item.category}
              value={item.amount}
              color={COLORS.red}
            />
          ))}
          <View style={styles.separatorLight} />
          <MoneyRow
            label="Total dépenses enregistrées"
            value={real.totalExpenses}
            color={COLORS.red}
            strong
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.resultBox}>
          <MoneyRow
            label="Résultat Net"
            value={real.netResult}
            color={COLORS.gold}
            strong
          />
          <Text
            style={[
              styles.trendText,
              { color: trend >= 0 ? "#16A34A" : "#DC2626" },
            ]}
          >
            {trend >= 0 ? "+" : ""}
            {trend}% vs période précédente
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.chartTitle}>Évolution Mensuelle Réelle</Text>

        <View style={styles.chart}>
          {chartData.length > 0 ? (
            chartData.map((item, index) => {
              const height = Math.max(6, (item.value / maxChartValue) * 100);

              return (
                <View
                  key={`${item.label}-${index}`}
                  style={[
                    styles.singleBar,
                    {
                      height: `${height}%`,
                    },
                  ]}
                />
              );
            })
          ) : (
            <Text style={styles.emptyChartText}>Aucune donnée disponible.</Text>
          )}
        </View>

        <View style={styles.chartFooter}>
          <Text style={styles.chartDate}>{chartData[0]?.label ?? "-"}</Text>
          <Text style={styles.chartDate}>
            {chartData[chartData.length - 1]?.label ?? "-"}
          </Text>
        </View>
      </View>
    </>
  );
}

function MoneyRow({
  label,
  value,
  color,
  strong,
}: {
  label: string;
  value: number;
  color: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.moneyRow}>
      <Text style={[styles.moneyLabel, strong && { fontWeight: "900" }]}>
        {label}
      </Text>
      <Text style={[styles.moneyValue, { color }, strong && { fontSize: 14 }]}>
        {formatFCFA(value)}
      </Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function KpiBox({
  label,
  value,
  sub,
  color,
  bg,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.kpiBox, { backgroundColor: bg }]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={[styles.kpiSub, { color }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 14, paddingBottom: 32, gap: 14 },

  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: { color: COLORS.primary, fontWeight: "700" },

  infoBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconText: { color: "#FFF", fontWeight: "900" },
  infoTitle: { color: "#1E3A8A", fontWeight: "900", marginBottom: 8 },
  infoText: {
    color: "#1D4ED8",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  bold: { fontWeight: "900" },

  tabs: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabContent: { flexDirection: "row", alignItems: "center", gap: 4 },
  tabText: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  tabTextActive: { color: "#FFF" },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  label: { color: COLORS.text, fontWeight: "900", marginBottom: 10 },
  periodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  periodOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.16)",
  },
  periodOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodOptionText: { color: COLORS.text, fontWeight: "800", fontSize: 12 },
  periodOptionTextActive: { color: "#FFF" },
  dateRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(107,39,55,0.2)",
  },

  applyPeriodBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  applyPeriodBtnText: {
    color: "#FFF",
    fontWeight: "900",
  },

  sectionTitle: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 18,
  },
  smallLabel: {
    color: "rgba(58,58,58,0.62)",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },

  comparisonLine: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  revenueGradient: { backgroundColor: "#ECFDF5" },
  expenseGradient: { backgroundColor: "#FEF2F2" },
  resultGradient: { backgroundColor: "#FEFCE8" },
  lineTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  comparisonBottom: { flexDirection: "row", alignItems: "center", gap: 12 },
  percentBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  percentText: { fontWeight: "900", fontSize: 12 },

  moneyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 7,
  },
  moneyLabel: {
    flex: 1,
    color: "rgba(58,58,58,0.68)",
    fontSize: 12,
    fontWeight: "700",
  },
  moneyValue: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },

  separator: {
    height: 2,
    backgroundColor: "rgba(107,39,55,0.18)",
    marginVertical: 14,
  },
  separatorLight: {
    height: 1,
    backgroundColor: "rgba(107,39,55,0.12)",
    marginVertical: 8,
  },

  chartTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 16,
  },
  chart: {
    height: 150,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 12,
  },
  chartPair: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    opacity: 0.75,
  },
  singleBar: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    opacity: 0.82,
  },
  emptyChartText: {
    color: "rgba(58,58,58,0.55)",
    fontWeight: "700",
    fontSize: 12,
    alignSelf: "center",
    textAlign: "center",
    flex: 1,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginTop: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { color: "rgba(58,58,58,0.6)", fontSize: 12 },
  chartFooter: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartDate: { color: "rgba(58,58,58,0.4)", fontSize: 12 },

  forecastCard: {
    backgroundColor: "#F3F4FF",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  forecastMonth: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 10,
  },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiBox: {
    width: "48%",
    borderRadius: 14,
    padding: 12,
  },
  kpiLabel: {
    color: "rgba(58,58,58,0.6)",
    fontSize: 11,
    fontWeight: "700",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },

  statementBox: {
    borderRadius: 14,
    padding: 12,
  },
  resultBox: {
    backgroundColor: "#FEFCE8",
    borderRadius: 14,
    padding: 14,
  },
  trendText: {
    textAlign: "right",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },

  exportRow: { flexDirection: "row", gap: 12 },
  exportBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  exportText: { color: "#FFF", fontWeight: "900" },
});