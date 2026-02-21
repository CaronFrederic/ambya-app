import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../src/components/Screen'
import { Card } from '../../src/components/Card'
import { Input } from '../../src/components/Input'
import { Button } from '../../src/components/Button'
import { useProfile, SectionKey } from '../../src/providers/ProfileProvider'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipIdle,
        active ? { color: colors.brandForeground } : { color: colors.brand },
      ]}
    >
      {label}
    </Text>
  )
}

export default function EditSectionScreen() {
  const params = useLocalSearchParams<{ section?: string; title?: string }>()
  const section = (params.section ?? 'general') as SectionKey
  const title = (params.title ?? 'Modifier') as string

  const { data, patchSection } = useProfile()

  // Local draft (avant Enregistrer)
  const initial = useMemo(() => (data as any)[section] ?? {}, [data, section])
  const [draft, setDraft] = useState<any>(initial)

  const toggleInArray = (key: string, value: string) => {
    setDraft((d: any) => {
      const arr = Array.isArray(d[key]) ? d[key] : []
      const exists = arr.includes(value)
      return { ...d, [key]: exists ? arr.filter((x: string) => x !== value) : [...arr, value] }
    })
  }

  const setField = (key: string, value: any) => setDraft((d: any) => ({ ...d, [key]: value }))

  const onSave = () => {
    patchSection(section, draft)
    router.back()
  }

  const onCancel = () => router.back()

  return (
    <Screen noPadding style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={22} color="#fff" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* RENDER selon section */}
        {section === 'general' && (
          <Card style={styles.card}>
            <Field label="Surnom">
              <Input value={draft.nickname ?? ''} onChangeText={(v) => setField('nickname', v)} placeholder="Ex: Marie" />
            </Field>

            <Field label="Genre">
              <View style={styles.chipsRow}>
                {['Femme', 'Homme', 'Autre', 'Je ne sais pas'].map((v) => (
                  <Chip key={v} label={v} active={draft.gender === v} onPress={() => setField('gender', v)} />
                ))}
              </View>
            </Field>

            <Field label="Âge">
              <View style={styles.chipsRow}>
                {['18–24', '25–34', '35–44', '45+', 'Je ne sais pas'].map((v) => (
                  <Chip key={v} label={v} active={draft.ageRange === v} onPress={() => setField('ageRange', v)} />
                ))}
              </View>
            </Field>

            <Field label="Ville">
              <Input value={draft.city ?? ''} onChangeText={(v) => setField('city', v)} placeholder="Ex: Libreville" />
            </Field>

            <Field label="Pays">
              <Input value={draft.country ?? ''} onChangeText={(v) => setField('country', v)} placeholder="Ex: Gabon" />
            </Field>
          </Card>
        )}

        {section === 'hair' && (
          <Card style={styles.card}>
            <Field label="Type de cheveux">
              <View style={styles.chipsRow}>
                {['Lisses', 'Ondulés', 'Bouclés', 'Crépus', 'Je ne sais pas'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={(draft.hairType ?? []).includes(v)}
                    onPress={() => toggleInArray('hairType', v)}
                  />
                ))}
              </View>
            </Field>

            <Field label="Texture">
              <Input value={draft.texture ?? ''} onChangeText={(v) => setField('texture', v)} placeholder="Ex: Fine / Épaisse / ..." />
            </Field>

            <Field label="Longueur">
              <View style={styles.chipsRow}>
                {['Courts', 'Mi-longs', 'Longs', 'Je ne sais pas'].map((v) => (
                  <Chip key={v} label={v} active={draft.length === v} onPress={() => setField('length', v)} />
                ))}
              </View>
            </Field>

            <Field label="Préoccupations">
              <View style={styles.chipsRow}>
                {['Sécheresse', 'Frisottis', 'Casse', 'Pellicules', 'Je ne sais pas'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={(draft.concerns ?? []).includes(v)}
                    onPress={() => toggleInArray('concerns', v)}
                  />
                ))}
              </View>
            </Field>
          </Card>
        )}

        {section === 'nails' && (
          <Card style={styles.card}>
            <Field label="Type">
              <View style={styles.chipsRow}>
                {['Lisses', 'Cassants', 'Striés', 'Je ne sais pas'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={(draft.type ?? []).includes(v)}
                    onPress={() => toggleInArray('type', v)}
                  />
                ))}
              </View>
            </Field>

            <Field label="État">
              <Input value={draft.state ?? ''} onChangeText={(v) => setField('state', v)} placeholder="Ex: Ongles normaux" />
            </Field>

            <Field label="Préoccupations">
              <View style={styles.chipsRow}>
                {['Cuticules', 'Décoloration', 'Ongles mous', 'Je ne sais pas'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={(draft.concerns ?? []).includes(v)}
                    onPress={() => toggleInArray('concerns', v)}
                  />
                ))}
              </View>
            </Field>
          </Card>
        )}

        {section === 'faceSkin' && (
          <Card style={styles.card}>
            <Field label="Type de peau">
              <View style={styles.chipsRow}>
                {['Sèche', 'Mixte', 'Grasse', 'Sensible', 'Je ne sais pas'].map((v) => (
                  <Chip key={v} label={v} active={draft.skinType === v} onPress={() => setField('skinType', v)} />
                ))}
              </View>
            </Field>

            <Field label="Préoccupations">
              <View style={styles.chipsRow}>
                {['Taches', 'Acné', 'Déshydratation', 'Rougeurs', 'Je ne sais pas'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={(draft.concerns ?? []).includes(v)}
                    onPress={() => toggleInArray('concerns', v)}
                  />
                ))}
              </View>
            </Field>
          </Card>
        )}

        {section === 'wellness' && (
          <Card style={styles.card}>
            <Field label="Type de peau (corps)">
              <Input value={draft.bodySkinType ?? ''} onChangeText={(v) => setField('bodySkinType', v)} placeholder="Ex: Je ne sais pas" />
            </Field>

            <Field label="Zones de tension">
              <View style={styles.chipsRow}>
                {['Épaules', 'Dos', 'Jambes', 'Nuque', 'Je ne sais pas'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={(draft.tensionZones ?? []).includes(v)}
                    onPress={() => toggleInArray('tensionZones', v)}
                  />
                ))}
              </View>
            </Field>

            <Field label="Préoccupations">
              <View style={styles.chipsRow}>
                {['Stress', 'Relaxation', 'Sommeil', 'Douleurs', 'Je ne sais pas'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={(draft.concerns ?? []).includes(v)}
                    onPress={() => toggleInArray('concerns', v)}
                  />
                ))}
              </View>
            </Field>

            <Field label="Zones sensibles massage">
              <Input
                value={draft.sensitiveMassageZones ?? ''}
                onChangeText={(v) => setField('sensitiveMassageZones', v)}
                placeholder="Ex: Aucune sélection"
              />
            </Field>
          </Card>
        )}

        {section === 'fitness' && (
          <Card style={styles.card}>
            <Field label="Niveau d'activité">
              <View style={styles.chipsRow}>
                {['Occasionnel', 'Régulier', 'Intensif', 'Je ne sais pas'].map((v) => (
                  <Chip key={v} label={v} active={draft.activityLevel === v} onPress={() => setField('activityLevel', v)} />
                ))}
              </View>
            </Field>

            <Field label="Objectifs">
              <View style={styles.chipsRow}>
                {['Condition générale', 'Perte de poids', 'Gain musculaire', 'Je ne sais pas'].map((v) => (
                  <Chip key={v} label={v} active={(draft.goals ?? []).includes(v)} onPress={() => toggleInArray('goals', v)} />
                ))}
              </View>
            </Field>

            <Field label="Préoccupations">
              <View style={styles.chipsRow}>
                {['Posture / mobilité', 'Souplesse', 'Endurance', 'Je ne sais pas'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={(draft.concerns ?? []).includes(v)}
                    onPress={() => toggleInArray('concerns', v)}
                  />
                ))}
              </View>
            </Field>
          </Card>
        )}

        {section === 'practical' && (
          <Card style={styles.card}>
            <Field label="Modes de paiement">
              <View style={styles.chipsRow}>
                {['Mobile Money', 'Cash', 'Carte', 'Je ne sais pas'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={(draft.paymentModes ?? []).includes(v)}
                    onPress={() => toggleInArray('paymentModes', v)}
                  />
                ))}
              </View>
            </Field>

            <Field label="Notifications">
              <View style={styles.chipsRow}>
                {['Push', 'Email', 'SMS'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={(draft.notifications ?? []).includes(v)}
                    onPress={() => toggleInArray('notifications', v)}
                  />
                ))}
              </View>
            </Field>
          </Card>
        )}

        {section === 'important' && (
          <Card style={styles.card}>
            <Field label="Avez-vous des allergies ou sensibilités ?">
              <View style={styles.choiceCol}>
                {(['Oui', 'Non', 'Je ne sais pas'] as const).map((v) => {
                  const active = draft.allergies === v
                  return (
                    <View key={v} style={[styles.choiceRow, active ? styles.choiceActive : styles.choiceIdle]}>
                      <Text
                        style={[styles.choiceText, active && { color: colors.text }]}
                        onPress={() => setField('allergies', v)}
                      >
                        {v}
                      </Text>
                      {active && <Ionicons name="checkmark" size={18} color={colors.brand} />}
                    </View>
                  )
                })}
              </View>
            </Field>

            <Field label="Commentaires ou besoins spécifiques (Optionnel)">
              <Input
                value={draft.notes ?? ''}
                onChangeText={(v) => setField('notes', v)}
                placeholder="Informations supplémentaires..."
                multiline
                style={{ minHeight: 110, paddingTop: 12 }}
              />
            </Field>
          </Card>
        )}

        <View style={{ height: spacing.lg }} />
      </ScrollView>

      {/* FOOTER CTA */}
      <View style={styles.footer}>
        <Button title="Annuler" variant="secondary" onPress={onCancel} />
        <Button title="Enregistrer" onPress={onSave} />
      </View>
    </Screen>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ marginTop: spacing.sm }}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    gap: spacing.md,
  },
  headerTitle: { color: colors.brandForeground, ...typography.h2 },

  content: { padding: spacing.lg, paddingBottom: 140 },

  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },

  label: { color: colors.text, ...typography.small, fontWeight: '700' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
    overflow: 'hidden',
    fontWeight: '800',
  },
  chipIdle: { backgroundColor: overlays.brand10, borderWidth: 1, borderColor: overlays.brand20 },
  chipActive: { backgroundColor: colors.brand, borderWidth: 1, borderColor: colors.brand },

  choiceCol: { gap: spacing.sm },
  choiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  choiceIdle: { backgroundColor: colors.card, borderWidth: 1, borderColor: overlays.brand20 },
  choiceActive: { backgroundColor: overlays.brand05, borderWidth: 2, borderColor: colors.brand },
  choiceText: { color: colors.text, ...typography.body, fontWeight: '700' },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
