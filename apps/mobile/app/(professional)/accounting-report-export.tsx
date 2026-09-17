import React, {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import { ProHeader } from "./components/ProHeader";
import {
  getAccountingReport,
  getAccountingReportExportUrl,
  type AccountingReportResponse,
  type ExportFormat,
  type PeriodType,
} from "../../src/api/accounting-reports";

const COLORS = {
  background: "#FAF7F2",
  brand: "#6B2737",
  text: "#2A1B20",
  muted: "#8A7A7E",
  gold: "#D4AF6A",
  line: "#EAE0DA",
  white: "#FFFFFF",
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function isPeriodType(
  value: string | undefined
): value is PeriodType {
  return (
    value === "Ce mois" ||
    value === "Trimestre" ||
    value === "Année" ||
    value === "Choisir"
  );
}

export default function AccountingReportExportScreen() {
  const params = useLocalSearchParams<{
    periodType?: string;
    startDate?: string;
    endDate?: string;
  }>();

  const periodType: PeriodType = isPeriodType(
    params.periodType
  )
    ? params.periodType
    : "Ce mois";

  const startDate =
    typeof params.startDate === "string" &&
    params.startDate
      ? params.startDate
      : undefined;

  const endDate =
    typeof params.endDate === "string" &&
    params.endDate
      ? params.endDate
      : undefined;

  const [format, setFormat] =
    useState<ExportFormat>("pdf");
  const [report, setReport] =
    useState<AccountingReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] =
    useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const data = await getAccountingReport({
          periodType,
          startDate,
          endDate,
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
        setLoading(false);
      }
    };

    void load();
  }, [periodType, startDate, endDate]);

  const generateDocument = async () => {
    try {
      setGenerating(true);

      const url =
        await getAccountingReportExportUrl(
          {
            periodType,
            startDate,
            endDate,
          },
          format
        );

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "Export impossible",
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !report) {
    return (
      <View style={styles.container}>
        <ProHeader
          title="Exporter le registre"
          subtitle="Préparation du document"
          backTo="/(professional)/AccountingReports"
        />

        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color={COLORS.brand}
          />
        </View>
      </View>
    );
  }

  const topExpenses =
    report.expenses.byCategory.slice(0, 3);
  const remainingExpenses =
    report.expenses.byCategory.slice(3);
  const remainingAmount = remainingExpenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return (
    <View style={styles.container}>
      <ProHeader
        title="Exporter le registre"
        subtitle={`${report.establishment.name} · ${report.period.label}`}
        backTo="/(professional)/AccountingReports"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          PÉRIODE
        </Text>

        <View style={styles.periodCard}>
          <View>
            <Text style={styles.periodValue}>
              {report.period.label}
            </Text>
            <Text style={styles.periodHint}>
              {report.period.isCurrentPeriod
                ? "Période en cours, arrêtée à aujourd'hui"
                : "Période sélectionnée"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          FORMAT
        </Text>

        <Pressable
          style={[
            styles.formatCard,
            format === "pdf" &&
              styles.formatCardSelected,
          ]}
          onPress={() => setFormat("pdf")}
        >
          <View
            style={[
              styles.formatIcon,
              format === "pdf" &&
                styles.formatIconSelected,
            ]}
          >
            <Ionicons
              name="document-outline"
              size={28}
              color={
                format === "pdf"
                  ? COLORS.gold
                  : COLORS.brand
              }
            />
          </View>

          <View style={styles.formatContent}>
            <Text style={styles.formatTitle}>
              PDF
            </Text>
            <Text style={styles.formatText}>
              Document figé, prêt à transmettre. Reprend
              le registre avec le détail de chaque ligne.
            </Text>
          </View>

          <View
            style={[
              styles.radio,
              format === "pdf" &&
                styles.radioSelected,
            ]}
          >
            {format === "pdf" && (
              <View style={styles.radioDot} />
            )}
          </View>
        </Pressable>

        <Pressable
          style={[
            styles.formatCard,
            format === "excel" &&
              styles.formatCardSelected,
          ]}
          onPress={() => setFormat("excel")}
        >
          <View
            style={[
              styles.formatIcon,
              format === "excel" &&
                styles.formatIconSelected,
            ]}
          >
            <Ionicons
              name="grid-outline"
              size={27}
              color={
                format === "excel"
                  ? COLORS.gold
                  : COLORS.brand
              }
            />
          </View>

          <View style={styles.formatContent}>
            <Text style={styles.formatTitle}>
              Excel
            </Text>
            <Text style={styles.formatText}>
              Tableau modifiable, une ligne par recette
              et par dépense. Pour trier ou retravailler
              les chiffres.
            </Text>
          </View>

          <View
            style={[
              styles.radio,
              format === "excel" &&
                styles.radioSelected,
            ]}
          >
            {format === "excel" && (
              <View style={styles.radioDot} />
            )}
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>
          APERÇU
        </Text>

        <View style={styles.preview}>
          <Text style={styles.ambya}>
            A M B Y A
          </Text>

          <Text style={styles.previewTitle}>
            Registre de gestion
          </Text>

          <Text style={styles.previewMeta}>
            {report.establishment.name}
            {report.establishment.city
              ? ` · ${report.establishment.city}`
              : ""}
          </Text>

          <Text style={styles.previewMeta}>
            {report.period.label}
          </Text>

          <Text style={styles.previewMeta}>
            Document généré le{" "}
            {new Intl.DateTimeFormat("fr-FR", {
              dateStyle: "short",
              timeStyle: "short",
            }).format(new Date(report.generatedAt))}
          </Text>

          <View style={styles.goldSeparator} />

          <Text style={styles.previewSection}>
            RECETTES
          </Text>

          <PreviewRow
            label="Prestations"
            value={report.revenue.services}
          />
          <PreviewRow
            label="Ventes de produits"
            value={report.revenue.products}
          />

          <View style={styles.line} />

          <PreviewRow
            label="Total"
            value={report.revenue.total}
            strong
          />

          <Text style={styles.previewSection}>
            DÉPENSES
          </Text>

          {topExpenses.map((expense) => (
            <PreviewRow
              key={expense.category}
              label={expense.category}
              value={expense.amount}
            />
          ))}

          {remainingExpenses.length > 0 && (
            <PreviewRow
              label={`${remainingExpenses.length} autres postes`}
              value={remainingAmount}
              muted
            />
          )}

          <View style={styles.line} />

          <PreviewRow
            label="Total"
            value={report.expenses.total}
            strong
          />

          <View style={styles.previewResult}>
            <Text style={styles.previewResultLabel}>
              RÉSULTAT DE LA PÉRIODE
            </Text>
            <Text style={styles.previewResultAmount}>
              {formatMoney(report.result)} F
            </Text>
          </View>

          <View style={styles.dashedLine} />

          <Text style={styles.previewSection}>
            EN DEHORS DU RÉSULTAT
          </Text>

          <PreviewRow
            label="Investissements"
            value={report.investments.total}
            strong
          />

          <View style={styles.line} />

          <Text style={styles.previewDisclaimer}>
            Montants TTC. Ce registre est un outil de
            suivi de gestion. Il ne constitue pas un
            document comptable et ne remplace pas votre
            comptable.
          </Text>
        </View>

        <View style={styles.receiptNotice}>
          <Text style={styles.receiptEmoji}>
            🗂️
          </Text>
          <Text style={styles.receiptText}>
            Les reçus ne sont pas joints. Chaque ligne
            porte son numéro de reçu si vous l'avez
            saisi — gardez vos documents papier de côté.
          </Text>
        </View>

        <Pressable
          style={[
            styles.generateButton,
            generating &&
              styles.generateButtonDisabled,
          ]}
          disabled={generating}
          onPress={generateDocument}
        >
          {generating ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.generateButtonText}>
              Générer le document
            </Text>
          )}
        </Pressable>

        <Text style={styles.generateHint}>
          Vous pourrez ensuite le partager ou
          l'enregistrer.
        </Text>
      </ScrollView>
    </View>
  );
}

function PreviewRow({
  label,
  value,
  strong = false,
  muted = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={styles.previewRow}>
      <Text
        style={[
          styles.previewRowLabel,
          strong && styles.strong,
          muted && styles.muted,
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.previewRowValue,
          strong && styles.strong,
        ]}
      >
        {formatMoney(value)} F
      </Text>
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
  },
  content: {
    padding: 16,
    paddingBottom: 42,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 16,
    marginBottom: 10,
  },
  periodCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 18,
    padding: 18,
  },
  periodValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  periodHint: {
    color: COLORS.muted,
    marginTop: 5,
  },
  formatCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 10,
  },
  formatCardSelected: {
    borderColor: COLORS.brand,
  },
  formatIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F6EFEA",
    alignItems: "center",
    justifyContent: "center",
  },
  formatIconSelected: {
    backgroundColor: COLORS.brand,
  },
  formatContent: {
    flex: 1,
  },
  formatTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },
  formatText: {
    color: COLORS.muted,
    lineHeight: 21,
    marginTop: 4,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D7CBC5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  radioSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brand,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  preview: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 20,
    padding: 18,
  },
  ambya: {
    color: COLORS.gold,
    fontWeight: "900",
    letterSpacing: 6,
    textAlign: "center",
  },
  previewTitle: {
    color: COLORS.brand,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
  },
  previewMeta: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 5,
  },
  goldSeparator: {
    height: 2,
    backgroundColor: COLORS.gold,
    marginHorizontal: -18,
    marginTop: 18,
  },
  previewSection: {
    color: COLORS.muted,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 10,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 9,
  },
  previewRowLabel: {
    color: "#59484D",
    flex: 1,
  },
  previewRowValue: {
    color: COLORS.text,
    fontWeight: "800",
  },
  strong: {
    fontWeight: "900",
  },
  muted: {
    color: COLORS.muted,
    fontStyle: "italic",
  },
  line: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 8,
  },
  previewResult: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  previewResultLabel: {
    color: COLORS.gold,
    fontWeight: "900",
    flex: 1,
  },
  previewResultAmount: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "900",
  },
  dashedLine: {
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBB5C0",
    marginTop: 16,
  },
  previewDisclaimer: {
    color: COLORS.muted,
    fontStyle: "italic",
    lineHeight: 20,
  },
  receiptNotice: {
    backgroundColor: "#F6EFEA",
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  receiptEmoji: {
    fontSize: 22,
  },
  receiptText: {
    flex: 1,
    color: "#705C62",
    lineHeight: 22,
  },
  generateButton: {
    backgroundColor: COLORS.brand,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginTop: 18,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },
  generateHint: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 10,
  },
});
