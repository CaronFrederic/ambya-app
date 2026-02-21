import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { useProfile } from '../../src/providers/ProfileProvider'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

type TabKey = 'infos' | 'fidelity' | 'settings'

const SECTIONS = [
  { key: 'general', title: 'Informations générales' },
  { key: 'hair', title: 'Profil capillaire' },
  { key: 'nails', title: 'Ongles' },
  { key: 'faceSkin', title: 'Peau visage' },
  { key: 'wellness', title: 'Bien-être' },
  { key: 'fitness', title: 'Fitness' },
  { key: 'practical', title: 'Préférences pratiques' },
  { key: 'important', title: 'Informations importantes' },
] as const

export default function ProfileScreen() {
  const { data } = useProfile()
  const [tab, setTab] = useState<TabKey>('infos')
  const [open, setOpen] = useState<string>('general')

  const rows = useMemo(() => {
    return {
      general: [
        { label: 'Surnom', value: data.general.nickname ?? 'Non renseigné' },
        { label: 'Genre', value: data.general.gender ?? 'Non renseigné' },
        { label: 'Âge', value: data.general.ageRange ?? 'Non renseigné' },
        { label: 'Ville', value: data.general.city ?? 'Non renseigné' },
        { label: 'Pays', value: data.general.country ?? 'Non renseigné' },
      ],
      hair: [
        { label: 'Type de cheveux', value: (data.hair.hairType ?? []).join(', ') || 'Non renseigné' },
        { label: 'Texture', value: data.hair.texture ?? 'Non renseigné' },
        { label: 'Longueur', value: data.hair.length ?? 'Non renseigné' },
        { label: 'Préoccupations', value: (data.hair.concerns ?? []).join(', ') || 'Non renseigné' },
      ],
      nails: [
        { label: 'Type', value: (data.nails.type ?? []).join(', ') || 'Non renseigné' },
        { label: 'État', value: data.nails.state ?? 'Non renseigné' },
        { label: 'Préoccupations', value: (data.nails.concerns ?? []).join(', ') || 'Non renseigné' },
      ],
      faceSkin: [
        { label: 'Type de peau', value: data.faceSkin.skinType ?? 'Non renseigné' },
        { label: 'Préoccupations', value: (data.faceSkin.concerns ?? []).join(', ') || 'Non renseigné' },
      ],
      wellness: [
        { label: 'Type de peau (corps)', value: data.wellness.bodySkinType ?? 'Non renseigné' },
        { label: 'Zones de tension', value: (data.wellness.tensionZones ?? []).join(', ') || 'Non renseigné' },
        { label: 'Préoccupations', value: (data.wellness.concerns ?? []).join(', ') || 'Non renseigné' },
        { label: 'Zones sensibles massage', value: data.wellness.sensitiveMassageZones ?? 'Non renseigné' },
      ],
      fitness: [
        { label: "Niveau d'activité", value: data.fitness.activityLevel ?? 'Non renseigné' },
        { label: 'Objectifs', value: (data.fitness.goals ?? []).join(', ') || 'Non renseigné' },
        { label: 'Préoccupations', value: (data.fitness.concerns ?? []).join(', ') || 'Non renseigné' },
      ],
      practical: [
        { label: 'Modes de paiement', value: (data.practical.paymentModes ?? []).join(', ') || 'Non renseigné' },
        { label: 'Notifications', value: (data.practical.notifications ?? []).join(', ') || 'Non renseigné' },
      ],
      important: [
        { label: 'Allergies', value: data.important.allergies ?? 'Non renseigné' },
        { label: 'Besoins spécifiques', value: data.important.notes?.trim() ? data.important.notes : 'Non renseigné' },
      ],
    } as Record<string, { label: string; value: string }[]>
  }, [data])

  return (
    <Screen noPadding style={{ backgroundColor: colors.background }}>
      {/* HEADER BORDEAUX */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabsPill}>
          <TabButton active={tab === 'infos'} label="Mes infos" onPress={() => setTab('infos')} />
          <TabButton active={tab === 'fidelity'} label="Fidélité" onPress={() => setTab('fidelity')} />
          <TabButton active={tab === 'settings'} label="Paramètres" onPress={() => setTab('settings')} />
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'infos' && (
          <View style={{ gap: spacing.md }}>
            {SECTIONS.map((s) => (
              <SectionAccordion
                key={s.key}
                title={s.title}
                open={open === s.key}
                onToggle={() => setOpen(open === s.key ? '' : s.key)}
                onEdit={() =>
                  router.push({
                    pathname: '/(screens)/edit-section',
                    params: { section: s.key, title: s.title },
                  })
                }
              >
                <View style={{ gap: spacing.sm }}>
                  {(rows as any)[s.key]?.map((r: any, idx: number) => (
                    <View key={idx} style={styles.kvRow}>
                      <Text style={styles.kLabel}>{r.label}</Text>
                      <Text style={styles.kValue}>{r.value}</Text>
                    </View>
                  ))}
                </View>
              </SectionAccordion>
            ))}
          </View>
        )}

        {tab === 'fidelity' && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>Fidélité</Text>
            <Text style={styles.placeholderText}>À venir (points, historique, avantages…)</Text>
          </View>
        )}

        {tab === 'settings' && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>Paramètres</Text>
            <Text style={styles.placeholderText}>À venir (sécurité, notifications avancées…)</Text>
            <View style={{ height: spacing.md }} />
            <Button
              title="Se déconnecter"
              variant="secondary"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </Screen>
  )
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  )
}

function SectionAccordion({
  title,
  open,
  onToggle,
  onEdit,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <View style={styles.sectionCard}>
      <Pressable onPress={onToggle} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <View style={styles.sectionRight}>
          <Pressable onPress={onEdit} style={styles.editPill} hitSlop={10}>
            <Ionicons name="create-outline" size={16} color={colors.brand} />
            <Text style={styles.editPillText}>Modifier</Text>
          </Pressable>

          <Ionicons
            name="chevron-down"
            size={18}
            color="rgba(58,58,58,0.50)"
            style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
          />
        </View>
      </Pressable>

      {open && <View style={styles.sectionBody}>{children}</View>}
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
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: colors.brandForeground, ...typography.h1, fontWeight: '700' },

  tabsWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: -18,
  },
  tabsPill: {
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 6,
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: { backgroundColor: colors.brand },
  tabText: { color: colors.textMuted, ...typography.small, fontWeight: '700' },
  tabTextActive: { color: colors.brandForeground },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 80,
  },

  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: { color: colors.text, ...typography.h3, fontWeight: '700', flex: 1 },

  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: overlays.brand10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  editPillText: { color: colors.brand, ...typography.small, fontWeight: '800' },

  sectionBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
  },

  kvRow: { gap: 4 },
  kLabel: { color: colors.textMuted, ...typography.small },
  kValue: { color: colors.text, ...typography.body, fontWeight: '600' },

  placeholderCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  placeholderTitle: { color: colors.text, ...typography.h3, fontWeight: '800', marginBottom: 6 },
  placeholderText: { color: colors.textMuted, ...typography.body },
})
