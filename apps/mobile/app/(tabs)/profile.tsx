import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as SecureStore from 'expo-secure-store'
import { useQueryClient } from '@tanstack/react-query'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'
import { useAuthRefresh } from '../../src/providers/AuthRefreshProvider'
import { useMeSummary } from '../../src/api/me'

import {
  MAP_GENDER,
  MAP_AGE,
  MAP_HAIR_TYPES,
  MAP_HAIR_TEXTURE,
  MAP_HAIR_LENGTH,
  MAP_HAIR_CONCERNS,
  MAP_NAIL_TYPE,
  MAP_NAIL_STATE,
  MAP_NAIL_CONCERNS,
  MAP_FACE_SKIN,
  MAP_FACE_CONCERNS,
  MAP_BODY_SKIN,
  MAP_ZONES,
  MAP_WELLBEING,
  MAP_ACTIVITY,
  MAP_FITNESS_GOALS,
  MAP_FITNESS_CONCERNS,
  MAP_PAYMENT_PREFS,
  MAP_NOTIF_PREFS,
  MAP_ALLERGIES,
  labelOf,
  labelsOf,
} from '../../src/constants/questionnaireLabels'

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

type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export default function ProfileScreen() {
  const { refreshAuth } = useAuthRefresh()
  const qc = useQueryClient()

  const [tab, setTab] = useState<TabKey>('infos')
  const [open, setOpen] = useState<string>('general')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    SecureStore.getItemAsync('accessToken').then(setToken)
  }, [])

  const {
    data: summary,
    isLoading,
    refetch,
    isRefetching,
  } = useMeSummary(!!token)

  const profile = summary?.profile
  const user = summary?.user
  const loyalty = summary?.loyalty

  // questionnaire JSON
  const q = (profile?.questionnaire ?? {}) as any

  async function handleLogout() {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('userRole')

    // ✅ évite d’afficher des data d’un ancien user après logout
    qc.clear()

    await refreshAuth()
    router.replace('/(auth)/login')
  }

  /**
   * ✅ Source de vérité = summary (back)
   * On reconstruit un objet "data" au format attendu par ton UI (rows)
   */
  const data = useMemo(() => {
    return {
      general: {
        nickname: profile?.nickname ?? null,
        email: user?.email ?? null,
        phone: user?.phone ?? null,
        gender: profile?.gender ?? null,
        ageRange: profile?.ageRange ?? null,
        city: profile?.city ?? null,
        country: profile?.country ?? null,
      },
      hair: {
        hairType: q?.hair?.hairTypes ?? [],
        texture: q?.hair?.hairTexture ?? null,
        length: q?.hair?.hairLength ?? null,
        concerns: q?.hair?.hairConcerns ?? [],
      },
      nails: {
        type: q?.nails?.nailTypes ?? [],
        state: q?.nails?.nailStates ?? [],
        concerns: q?.nails?.nailConcerns ?? [],
      },
      faceSkin: {
        skinType: q?.face?.faceSkin ?? null,
        concerns: q?.face?.faceConcerns ?? [],
      },
      wellness: {
        bodySkinType: q?.body?.bodySkin ?? null,
        tensionZones: q?.body?.tensionZones ?? [],
        concerns: q?.body?.wellbeingConcerns ?? [],
        sensitiveMassageZones: (q?.body?.massageSensitiveZones ?? []).join(', '),
      },
      fitness: {
        activityLevel: q?.fitness?.activityLevel ?? null,
        goals: q?.fitness?.fitnessGoals ?? [],
        concerns: q?.fitness?.fitnessConcerns ?? [],
      },
      practical: {
        paymentModes: q?.practical?.paymentPrefs ?? [],
        notifications: q?.practical?.notifPrefs ?? [],
      },
      important: {
        allergies: profile?.allergies ?? null,
        notes: profile?.comments ?? '',
      },
    }
  }, [profile, user, q])

  const rows = useMemo(() => {
    const safe = (v: string | null | undefined) => (v && String(v).trim() ? String(v) : null)
    const display = (v: string | null | undefined) => safe(v) ?? 'Non renseigné'
    const displayList = (arr: string[]) => (arr.length ? arr.join(', ') : 'Non renseigné')

    return {
      general: [
        { label: 'Surnom', value: display(data.general.nickname ?? null) },
        { label: 'Email', value: display(data.general.email ?? null) },
        { label: 'Téléphone', value: display(data.general.phone ?? null) },
        { label: 'Genre', value: display(labelOf(data.general.gender, MAP_GENDER)) },
        { label: 'Âge', value: display(labelOf(data.general.ageRange, MAP_AGE)) },
        { label: 'Ville', value: display(data.general.city ?? null) },
        { label: 'Pays', value: display(data.general.country ?? null) },
      ],

      hair: [
        { label: 'Type de cheveux', value: displayList(labelsOf(data.hair.hairType ?? [], MAP_HAIR_TYPES)) },
        { label: 'Texture', value: display(labelOf(data.hair.texture, MAP_HAIR_TEXTURE)) },
        { label: 'Longueur', value: display(labelOf(data.hair.length, MAP_HAIR_LENGTH)) },
        { label: 'Préoccupations', value: displayList(labelsOf(data.hair.concerns ?? [], MAP_HAIR_CONCERNS)) },
      ],

      nails: [
        { label: 'Type', value: displayList(labelsOf(data.nails.type ?? [], MAP_NAIL_TYPE)) },
        { label: 'État', value: displayList(labelsOf(data.nails.state ?? [], MAP_NAIL_STATE)) },
        { label: 'Préoccupations', value: displayList(labelsOf(data.nails.concerns ?? [], MAP_NAIL_CONCERNS)) },
      ],

      faceSkin: [
        { label: 'Type de peau', value: display(labelOf(data.faceSkin.skinType, MAP_FACE_SKIN)) },
        { label: 'Préoccupations', value: displayList(labelsOf(data.faceSkin.concerns ?? [], MAP_FACE_CONCERNS)) },
      ],

      wellness: [
        { label: 'Type de peau (corps)', value: display(labelOf(data.wellness.bodySkinType, MAP_BODY_SKIN)) },
        { label: 'Zones de tension', value: displayList(labelsOf(data.wellness.tensionZones ?? [], MAP_ZONES)) },
        { label: 'Préoccupations', value: displayList(labelsOf(data.wellness.concerns ?? [], MAP_WELLBEING)) },
        {
          label: 'Zones sensibles massage',
          value: displayList(labelsOf(data.wellness.sensitiveMassageZones ?? [], MAP_ZONES)),
        },
      ],

      fitness: [
        { label: "Niveau d'activité", value: display(labelOf(data.fitness.activityLevel, MAP_ACTIVITY)) },
        { label: 'Objectifs', value: displayList(labelsOf(data.fitness.goals ?? [], MAP_FITNESS_GOALS)) },
        { label: 'Préoccupations', value: displayList(labelsOf(data.fitness.concerns ?? [], MAP_FITNESS_CONCERNS)) },
      ],

      practical: [
        { label: 'Modes de paiement', value: displayList(labelsOf(data.practical.paymentModes ?? [], MAP_PAYMENT_PREFS)) },
        { label: 'Notifications', value: displayList(labelsOf(data.practical.notifications ?? [], MAP_NOTIF_PREFS)) },
      ],

      important: [
        { label: 'Allergies', value: display(labelOf(data.important.allergies, MAP_ALLERGIES)) },
        { label: 'Besoins spécifiques', value: display(data.important.notes?.trim() ? data.important.notes : null) },
      ],
    } as Record<string, { label: string; value: string }[]>
  }, [data])

  // ---- Loyalty computed (dynamic) ----
  const loyaltyComputed = useMemo(() => {
    const tier = (loyalty?.tier ?? 'BRONZE') as LoyaltyTier
    const currentPoints = loyalty?.currentPoints ?? 0

    const thresholds: Record<LoyaltyTier, number> = {
      BRONZE: 500,
      SILVER: 2000,
      GOLD: 5000,
      PLATINUM: 5000, // max
    }

    const nextTargetByTier: Record<LoyaltyTier, number> = {
      BRONZE: 500,
      SILVER: 2000,
      GOLD: 5000,
      PLATINUM: 5000,
    }

    const baseByTier: Record<LoyaltyTier, number> = {
      BRONZE: 0,
      SILVER: 500,
      GOLD: 2000,
      PLATINUM: 5000,
    }

    const nextTarget = nextTargetByTier[tier]
    const base = baseByTier[tier]

    const denom = Math.max(1, nextTarget - base)
    const pct =
      tier === 'PLATINUM'
        ? 100
        : Math.max(0, Math.min(100, Math.round(((currentPoints - base) / denom) * 100)))

    // texte "X / Y points"
    const progressText =
      tier === 'PLATINUM'
        ? `${currentPoints} points`
        : `${currentPoints} / ${nextTarget} points`

    const tierLabel =
      tier === 'BRONZE' ? 'Niveau Bronze'
      : tier === 'SILVER' ? 'Niveau Argent'
      : tier === 'GOLD' ? 'Niveau Gold'
      : 'Niveau Platine'

    const pendingAmount =
    loyalty?.pendingDiscount?.amount ??
    loyalty?.pendingDiscount ??
    0

    return {
      tier,
      tierLabel,
      currentPoints,
      progressText,
      progressPct: pct,
      pendingAmount,
    }
  }, [loyalty])

  return (
    <Screen noPadding style={{ backgroundColor: colors.background }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.brandForeground} />
        </Pressable>

        <Text style={styles.headerTitle}>Mon Profil</Text>
        <Text style={styles.headerSubtitle}>Compte, préférences et sécurité</Text>
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {tab === 'infos' && (
          <View style={{ gap: spacing.md }}>
            {isLoading ? (
              <View style={styles.placeholderCard}>
                <Text style={styles.placeholderTitle}>Chargement…</Text>
                <Text style={styles.placeholderText}>Récupération de vos informations.</Text>
              </View>
            ) : (
              SECTIONS.map((s) => (
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
              ))
            )}
          </View>
        )}

        {tab === 'fidelity' && (() => {
        const pendingDiscountAmount = Number(loyaltyComputed?.pendingAmount ?? 0)
        const hasDiscount = pendingDiscountAmount > 0

        return (
          <View style={{ gap: spacing.md }}>
            <LoyaltyGoldCard
              progressText={loyaltyComputed.progressText}
              tierLabel={loyaltyComputed.tierLabel}
              progressPct={loyaltyComputed.progressPct}
              pendingDiscountAmount={pendingDiscountAmount}
              showBenefit={hasDiscount}
            />
          </View>
        )
      })()}

        {tab === 'settings' && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.settingsCard}>
              <SettingsRow
                title="Historique des réservations"
                subtitle="Accédez à vos rendez-vous"
                onPress={() => router.push('/(tabs)/appointments')}
              />

              <View style={styles.rowDivider} />

              <SettingsRow
                title="Moyens de paiement"
                subtitle="Cartes et Mobile Money"
                onPress={() => router.push('/(screens)/profile/payment-methods')}
              />

              <View style={styles.rowDivider} />

              <SettingsRow
                title="Notifications"
                subtitle="Push, email, SMS"
                onPress={() => router.push('/(screens)/profile/notifications')}
              />
            </View>

            <Button title="Se déconnecter" variant="secondary" onPress={handleLogout} />
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
          <Pressable
            onPress={(e) => {
              // évite de toggler l'accordéon quand on clique "Modifier"
              e.stopPropagation?.()
              onEdit()
            }}
            style={styles.editPill}
            hitSlop={10}
          >
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

function SettingsRow({
  title,
  subtitle,
  onPress,
}: {
  title: string
  subtitle: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={styles.settingsRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.settingsTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.settingsSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(58,58,58,0.35)" />
    </Pressable>
  )
}



/** ✅ Carte AMBYA (dynamique) */
function LoyaltyGoldCard({
  progressText,
  tierLabel,
  progressPct,
  pendingDiscountAmount,
  showBenefit,
}: {
  progressText: string
  tierLabel: string
  progressPct: number
  pendingDiscountAmount: number
  showBenefit: boolean
}) {
  const gold = '#D4AF6A'

  return (
    <LinearGradient
      colors={[colors.brand, '#8B3747']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.goldCard}
    >
      {/* Logo AMBYA rond en haut à droite */}
      <View style={styles.goldLogoWrap}>
        <Text style={styles.goldLogoText}>AMBYA</Text>
      </View>

      {/* Titre */}
      <View style={styles.cardHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Ionicons name="ribbon-outline" size={22} color={gold} />
          <Text style={styles.goldTitle} numberOfLines={1}>
            Carte de Fidélité AMBYA
          </Text>
        </View>
      </View>

      {/* Sous-titre */}
      <View style={styles.salonLine}>
        <View style={{ width: 4, height: 4, borderRadius: 4, backgroundColor: gold }} />
        <Text style={styles.goldSalon}>Tous les salons AMBYA</Text>
      </View>

      {/* Progress */}
      <View style={{ marginTop: spacing.sm }}>
        <View style={styles.progressRow}>
          <Text style={styles.goldProgressText}>{progressText}</Text>
          <Text style={styles.goldProgressText}>{tierLabel}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(0, Math.min(100, progressPct))}%`, backgroundColor: gold },
            ]}
          />
        </View>
      </View>

      {/* ✅ Avantage fidélité : seulement si réduction dispo */}
      {showBenefit && (
        <View style={styles.goldBenefit}>
          <Text style={styles.goldBenefitLabel}>🎁 Votre avantage fidélité</Text>
          <Text style={[styles.goldBenefitValue, { color: gold }]}>
            {pendingDiscountAmount} FCFA offerts
          </Text>
          <Text style={styles.goldBenefitSub}>sur votre prochaine prestation</Text>
        </View>
      )}
    </LinearGradient>
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
  headerBack: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: overlays.white06,
    marginBottom: spacing.sm,
  },
  headerTitle: { color: colors.brandForeground, ...typography.h1, fontWeight: '800' },
  headerSubtitle: { marginTop: 6, color: 'rgba(255,255,255,0.85)', ...typography.small },

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

  settingsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
    overflow: 'hidden',
  },
  settingsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingsTitle: { color: colors.text, ...typography.body, fontWeight: '800' },
  settingsSubtitle: { marginTop: 4, color: colors.textMuted, ...typography.small },
  rowDivider: { height: 1, backgroundColor: colors.border },

  // Cards common
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full },
  badgeText: { ...typography.small, fontWeight: '900' },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  roundLogo: {
    width: 56,
    height: 56,
    borderRadius: 56,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundLogoTop: { color: '#FFFFFF', ...typography.small },
  roundLogoBottom: { marginTop: 2, color: '#FFFFFF', ...typography.small },
  cornerLogo: { position: 'absolute', right: 18, top: 18 },

  // Gold card
  goldCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  goldLogoWrap: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 64,
    height: 64,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldLogoText: { color: '#D4AF6A', ...typography.small, fontWeight: '900' },
  goldTitle: { color: colors.brandForeground, ...typography.h3, fontWeight: '900' },
  salonLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  goldSalon: { color: 'rgba(255,255,255,0.70)', ...typography.small, fontWeight: '600' },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goldProgressText: { color: 'rgba(255,255,255,0.90)', ...typography.small, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.20)', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999 },

  goldBenefit: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212,175,106,0.30)',
  },
  goldBenefitLabel: { color: colors.brandForeground, ...typography.body, fontWeight: '800' },
  goldBenefitValue: { marginTop: 6, ...typography.h2, fontWeight: '900' },
  goldBenefitSub: { marginTop: 6, color: 'rgba(255,255,255,0.70)', ...typography.small, fontWeight: '600' },

  // White card base
  whiteCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: overlays.brand20,
    overflow: 'hidden',
  },

  // Program header block
  programHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingRight: 70 },
  programIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 48,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programTitle: { color: colors.brand, ...typography.h3, fontWeight: '900' },
  programSub: { marginTop: 2, color: colors.textMuted, ...typography.small, fontWeight: '600' },
  programSalonLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm, marginBottom: spacing.md },
  programSalon: { color: 'rgba(58,58,58,0.60)', ...typography.small, fontWeight: '600' },

  // Code / value box
  codeBox: { backgroundColor: '#FAF7F2', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  codeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeLabel: { color: 'rgba(58,58,58,0.70)', ...typography.small, fontWeight: '700' },
  codeCopy: { color: colors.brand, ...typography.small, fontWeight: '900' },
  codeValue: { marginTop: 8, color: colors.brand, ...typography.h2, fontWeight: '900', letterSpacing: 1 },

  benefitRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  benefitIcon: {
    width: 22,
    height: 22,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,106,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  benefitText: { color: colors.text, ...typography.body, fontWeight: '700' },
  benefitStrong: { color: colors.brand, fontWeight: '900' },
  benefitSub: { marginTop: 2, color: colors.textMuted, ...typography.small, fontWeight: '600' },

  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.brand,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: colors.brandForeground, ...typography.body, fontWeight: '900' },

  // Birthday
  goldSoftCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,175,106,0.40)',
    overflow: 'hidden',
  },
  whiteInset: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  insetLabel: { color: 'rgba(58,58,58,0.70)', ...typography.small, fontWeight: '700' },
  insetValue: { marginTop: 6, color: colors.brand, ...typography.body, fontWeight: '900' },
  birthdayGift: { borderRadius: radius.lg, padding: spacing.md },
  birthdayGiftLabel: { color: 'rgba(255,255,255,0.90)', ...typography.small, fontWeight: '700' },
  birthdayGiftValue: { marginTop: 6, color: '#D4AF6A', ...typography.h3, fontWeight: '900' },
  birthdayGiftSub: { marginTop: 6, color: 'rgba(255,255,255,0.80)', ...typography.small, fontWeight: '600' },

  // Cashback
  cashValue: { marginTop: 6, color: colors.brand, ...typography.h2, fontWeight: '900' },
  useButton: { backgroundColor: colors.brand, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 10 },
  useButtonText: { color: colors.brandForeground, ...typography.small, fontWeight: '900' },

  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  metricLabel: { color: colors.text, ...typography.body, fontWeight: '700' },
  metricValue: { color: colors.brand, ...typography.body, fontWeight: '900' },
  metricPlus: { color: '#D4AF6A', ...typography.body, fontWeight: '900' },

  tipBox: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(212,175,106,0.12)',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipText: { flex: 1, color: 'rgba(58,58,58,0.75)', ...typography.small, fontWeight: '600' },
  tipStrong: { color: colors.brand, fontWeight: '900' },
})
