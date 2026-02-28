import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Switch } from "react-native";
import { ProHeader } from "./components/ProHeader";

const COLORS = { bg: "#FAF7F2", text: "#3A3A3A", primary: "#6B2737", gold: "#D4AF6A" };

type CardType = "stamps" | "points" | "progressive";

export default function LoyaltyScreen() {
  const [enabled, setEnabled] = useState(true);
  const [cardType, setCardType] = useState<CardType>("stamps");
  const [programName, setProgramName] = useState("Carte VIP Ébène");
  const [programDesc, setProgramDesc] = useState("Profitez d'avantages exclusifs après chaque visite");
  const [stamps, setStamps] = useState(10);

  const clients = useMemo(
    () => [
      { name: "Marie Kouassi", progress: 7, total: 10 },
      { name: "Sophie Mbongo", progress: 4, total: 10 },
      { name: "Jean Bongo", progress: 9, total: 10 },
    ],
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ProHeader title="Ma Carte de Fidélité" subtitle="Programme personnalisé" backTo="/(professional)/dashboard" />

      <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.panelTitle}>Activer ma carte de fidélité personnalisée</Text>
              <Text style={styles.help}>En complément d’AMBYA Rewards</Text>
            </View>
            <Switch value={enabled} onValueChange={setEnabled} />
          </View>

          <View style={styles.tipGold}>
            <Text style={styles.tipGoldText}>✓ Digitalisation cartes papier • ✓ Règles personnalisables • ✓ Autonomie totale</Text>
          </View>
        </View>

        {enabled && (
          <>
            <View style={styles.panel}>
              <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Configuration</Text>

              <Field label="Nom du programme">
                <TextInput value={programName} onChangeText={setProgramName} style={styles.input} />
              </Field>

              <Field label="Description courte">
                <TextInput value={programDesc} onChangeText={setProgramDesc} style={[styles.input, { height: 80, textAlignVertical: "top" }]} multiline />
              </Field>

              <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Type de programme</Text>
              {[
                { id: "stamps", title: "📌 Système tampons", desc: "X prestations = 1 gratuite" },
                { id: "points", title: "💰 Points salon", desc: "1€ dépensé = X points" },
                { id: "progressive", title: "📈 Réductions progressives", desc: "Plus de visites = plus de réduction" },
              ].map((t) => {
                const active = cardType === (t.id as CardType);
                return (
                  <Pressable key={t.id} onPress={() => setCardType(t.id as CardType)} style={[styles.choice, active && styles.choiceActive]}>
                    <Text style={styles.choiceTitle}>{t.title}</Text>
                    <Text style={styles.help}>{t.desc}</Text>
                  </Pressable>
                );
              })}

              {cardType === "stamps" && (
                <View style={styles.subPanel}>
                  <Text style={styles.label}>Nombre de tampons requis</Text>
                  <TextInput
                    value={String(stamps)}
                    onChangeText={(t) => {
                      const n = Number(t.replace(/[^\d]/g, ""));
                      if (!Number.isFinite(n)) return;
                      setStamps(Math.max(5, Math.min(20, n)));
                    }}
                    style={styles.input}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.help}>Exemple : {stamps} coupes = 1 coupe gratuite</Text>
                </View>
              )}
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Statistiques Fidélité</Text>
              <View style={styles.grid2}>
                <MiniStat number="47" label="Cartes actives" />
                <MiniStat number="68%" label="Utilisation" />
                <MiniStat number="12" label="Récompenses" />
                <MiniStat number="+35%" label="Rétention" />
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Clients avec carte</Text>
                <Pressable><Text style={styles.link}>Voir tous</Text></Pressable>
              </View>

              <View style={{ gap: 12, marginTop: 10 }}>
                {clients.map((c) => (
                  <View key={c.name} style={styles.clientRow}>
                    <View style={styles.avatar}>
                      <Text style={{ color: COLORS.primary, fontWeight: "900" }}>{c.name.slice(0, 1)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientName}>{c.name}</Text>
                      <View style={styles.progressRow}>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${(c.progress / c.total) * 100}%` }]} />
                        </View>
                        <Text style={styles.help}>{c.progress}/{c.total}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <Pressable style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Enregistrer ma carte de fidélité</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8, marginTop: 10 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function MiniStat({ number, label }: { number: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatNumber}>{number}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: "#FFF", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(107,39,55,0.12)", marginBottom: 12 },
  panelTitle: { color: COLORS.text, fontWeight: "900", fontSize: 14 },
  sectionTitle: { color: COLORS.primary, fontWeight: "900", fontSize: 14 },
  help: { color: "rgba(58,58,58,0.55)", fontSize: 12, fontWeight: "600" },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  input: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "rgba(107,39,55,0.2)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  tipGold: { backgroundColor: "rgba(212,175,106,0.2)", borderRadius: 14, padding: 10, marginTop: 10, borderWidth: 1, borderColor: "rgba(212,175,106,0.3)" },
  tipGoldText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },

  choice: { borderWidth: 1, borderColor: "rgba(107,39,55,0.18)", borderRadius: 16, padding: 12, marginTop: 10, backgroundColor: "#FFF" },
  choiceActive: { borderColor: COLORS.primary, backgroundColor: "rgba(107,39,55,0.06)" },
  choiceTitle: { color: COLORS.text, fontWeight: "900" },

  subPanel: { marginTop: 12, backgroundColor: "rgba(107,39,55,0.06)", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "rgba(107,39,55,0.12)" },

  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  miniStat: { width: "48%", backgroundColor: "rgba(107,39,55,0.06)", borderRadius: 14, padding: 12 },
  miniStatNumber: { color: COLORS.primary, fontWeight: "900", fontSize: 18 },
  miniStatLabel: { color: "rgba(58,58,58,0.55)", fontSize: 12, fontWeight: "700", marginTop: 6 },

  link: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },

  clientRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(107,39,55,0.12)", alignItems: "center", justifyContent: "center" },
  clientName: { color: COLORS.text, fontWeight: "900" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  progressTrack: { flex: 1, height: 8, backgroundColor: "rgba(107,39,55,0.08)", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.primary },

  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 999, alignItems: "center", marginTop: 10 },
  primaryBtnText: { color: "#FFF", fontWeight: "900" },
});