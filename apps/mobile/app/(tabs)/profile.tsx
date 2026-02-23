import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { TextInput } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as SecureStore from 'expo-secure-store'

import { Screen } from '../../src/components/Screen'
import { Button } from '../../src/components/Button'
import { useProfile } from '../../src/providers/ProfileProvider'

import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'
import { useAuthRefresh } from '../../src/providers/AuthRefreshProvider'

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
  const { refreshAuth } = useAuthRefresh()
  const { data } = useProfile()
  const [tab, setTab] = useState<TabKey>('infos')
  const [open, setOpen] = useState<string>('general')

  async function handleLogout() {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('userRole')
    await refreshAuth()

    router.replace('/(auth)/login')
  }

  const [salonSearchQuery, setSalonSearchQuery] = useState('')

  const LOYALTY_CARDS = useMemo(
    () => [
      { id: 'ambya-gold', title: 'Carte de Fidélité AMBYA', salonLabel: 'Tous les salons AMBYA' },
      { id: 'parrainage', title: 'Programme Parrainage', salonLabel: 'Tous les salons partenaires' },
      { id: 'anniversaire', title: 'Programme Anniversaire', salonLabel: 'Spa Zenitude & Wellness' },
      { id: 'cashback', title: 'Programme Cashback', salonLabel: 'Salon Belle Vue Premium' },
    ],
    []
  )

  const filteredCards = useMemo(() => {
    const q = salonSearchQuery.trim().toLowerCase()
    if (!q) return LOYALTY_CARDS
    return LOYALTY_CARDS.filter((c) => {
      return (
        c.title.toLowerCase().includes(q) ||
        c.salonLabel.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      )
    })
  }, [LOYALTY_CARDS, salonSearchQuery])

  const rows = useMemo(() => {
    return {
      general: [
        { label: 'Surnom', value: data.general.nickname ?? 'Non renseigné' },
        { label: 'Email', value: data.general.email ?? 'Non renseigné' },
        { label: 'Téléphone', value: data.general.phone ?? 'Non renseigné' },
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
      {/* ✅ HEADER (même logique que Payment / Booking) */}
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
        <View style={{ gap: spacing.md }}>
          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="rgba(58,58,58,0.35)" style={styles.searchIcon} />
            <TextInput
              value={salonSearchQuery}
              onChangeText={setSalonSearchQuery}
              placeholder="Rechercher un salon..."
              placeholderTextColor="rgba(58,58,58,0.40)"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {!!salonSearchQuery && (
              <Pressable onPress={() => setSalonSearchQuery('')} hitSlop={10} style={styles.searchClear}>
                <Text style={styles.searchClearText}>Effacer</Text>
              </Pressable>
            )}
          </View>

          {!!salonSearchQuery && (
            <Text style={styles.resultsText}>
              {filteredCards.length} {filteredCards.length > 1 ? 'cartes trouvées' : 'carte trouvée'}
            </Text>
          )}

          {!!salonSearchQuery && filteredCards.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="search" size={36} color="rgba(58,58,58,0.18)" />
              <Text style={styles.emptyTitle}>Aucune carte trouvée</Text>
              <Text style={styles.emptySub}>Essayez avec un autre nom de salon</Text>
            </View>
          )}

          {/* Cards */}
          {filteredCards.some((c) => c.id === 'ambya-gold') && <LoyaltyGoldCard />}
          {filteredCards.some((c) => c.id === 'parrainage') && <ReferralCard />}
          {filteredCards.some((c) => c.id === 'anniversaire') && <BirthdayCard />}
          {filteredCards.some((c) => c.id === 'cashback') && <CashbackCard />}
        </View>
      )}

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

            <Button
              title="Se déconnecter"
              variant="secondary"
              onPress={handleLogout}
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

function DotLine({ color }: { color: string }) {
  return <View style={{ width: 4, height: 4, borderRadius: 4, backgroundColor: color }} />
}

function Badge({
  label,
  backgroundColor,
  color,
}: {
  label: string
  backgroundColor: string
  color: string
}) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  )
}

function RoundLogo({
  variant,
}: {
  variant: 'gold' | 'friends' | 'vip' | 'cash'
}) {
  const bg =
    variant === 'gold'
      ? 'rgba(255,255,255,0.10)'
      : variant === 'vip'
        ? colors.gold ?? '#D4AF6A'
        : colors.brand

  const border =
    variant === 'gold' ? 'rgba(255,255,255,0.20)' : overlays.brand20

  return (
    <View style={[styles.roundLogo, { backgroundColor: bg, borderColor: border }]}>
      <Text style={styles.roundLogoTop}>AMBYA</Text>
      <Text style={styles.roundLogoBottom}>
        {variant === 'friends' ? 'Friends' : variant === 'vip' ? 'VIP' : variant === 'cash' ? 'Cash' : ''}
      </Text>
    </View>
  )
}

/** 1) Carte AMBYA Gold */
function LoyaltyGoldCard() {
  const gold = '#D4AF6A'
  return (
    <LinearGradient
      colors={[colors.brand, '#8B3747']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.goldCard}
    >
      <View style={styles.goldLogoWrap}>
        <Text style={styles.goldLogoText}>AMBYA</Text>
      </View>

      <View style={styles.cardHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Ionicons name="ribbon-outline" size={22} color={gold} />
          <Text style={styles.goldTitle} numberOfLines={1}>
            Carte de Fidélité AMBYA
          </Text>
        </View>
        <Badge label="Actif" backgroundColor={gold} color={colors.brand} />
      </View>

      <View style={styles.salonLine}>
        <DotLine color={gold} />
        <Text style={styles.goldSalon}>Tous les salons AMBYA</Text>
      </View>

      <View style={{ marginTop: spacing.sm }}>
        <View style={styles.progressRow}>
          <Text style={styles.goldProgressText}>750 / 1000 points</Text>
          <Text style={styles.goldProgressText}>Niveau Gold</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '75%', backgroundColor: gold }]} />
        </View>
      </View>

      <View style={styles.goldBenefit}>
        <Text style={styles.goldBenefitLabel}>🎁 Votre avantage fidélité</Text>
        <Text style={[styles.goldBenefitValue, { color: gold }]}>500 FCFA offerts</Text>
        <Text style={styles.goldBenefitSub}>sur votre prochaine prestation</Text>
      </View>
    </LinearGradient>
  )
}

/** 2) Parrainage */
function ReferralCard() {
  const gold = '#D4AF6A'
  return (
    <View style={styles.whiteCard}>
      <View style={styles.cornerLogo}>
        <RoundLogo variant="friends" />
      </View>

      <View style={styles.programHeader}>
        <View style={styles.programIconWrap}>
          <Ionicons name="people-outline" size={22} color={gold} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.programTitle}>Programme Parrainage</Text>
          <Text style={styles.programSub}>Invitez vos amis et gagnez ensemble</Text>
        </View>
      </View>

      <View style={styles.programSalonLine}>
        <DotLine color={colors.brand} />
        <Text style={styles.programSalon}>Tous les salons partenaires</Text>
      </View>

      <View style={styles.codeBox}>
        <View style={styles.codeTopRow}>
          <Text style={styles.codeLabel}>Votre code parrain</Text>
          <Pressable hitSlop={10}>
            <Text style={styles.codeCopy}>Copier</Text>
          </Pressable>
        </View>
        <Text style={styles.codeValue}>MARIE2024</Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <View style={styles.benefitRow}>
          <View style={styles.benefitIcon}>
            <Ionicons name="gift-outline" size={14} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.benefitText}>
              <Text style={styles.benefitStrong}>1000 FCFA</Text> pour vous
            </Text>
            <Text style={styles.benefitSub}>À chaque ami inscrit</Text>
          </View>
        </View>

        <View style={styles.benefitRow}>
          <View style={styles.benefitIcon}>
            <Ionicons name="gift-outline" size={14} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.benefitText}>
              <Text style={styles.benefitStrong}>500 FCFA</Text> pour votre ami
            </Text>
            <Text style={styles.benefitSub}>Dès sa première réservation</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => {}}>
        <Text style={styles.primaryButtonText}>Partager mon code</Text>
      </Pressable>
    </View>
  )
}

/** 3) Anniversaire */
function BirthdayCard() {
  return (
    <LinearGradient
      colors={['rgba(212,175,106,0.20)', 'rgba(212,175,106,0.08)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.goldSoftCard}
    >
      <View style={styles.cornerLogo}>
        <RoundLogo variant="vip" />
      </View>

      <View style={styles.programHeader}>
        <View style={[styles.programIconWrap, { backgroundColor: 'rgba(212,175,106,0.95)' }]}>
          <Ionicons name="sparkles-outline" size={22} color={colors.brandForeground} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.programTitle}>Programme Anniversaire</Text>
          <Text style={styles.programSub}>Votre mois spécial</Text>
        </View>
      </View>

      <View style={styles.programSalonLine}>
        <DotLine color={colors.brand} />
        <Text style={styles.programSalon}>Spa Zenitude & Wellness</Text>
      </View>

      <View style={styles.whiteInset}>
        <Text style={styles.insetLabel}>Votre anniversaire</Text>
        <Text style={styles.insetValue}>15 Mars</Text>
      </View>

      <LinearGradient
        colors={[colors.brand, '#8B3747']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.birthdayGift}
      >
        <Text style={styles.birthdayGiftLabel}>🎉 Cadeau d'anniversaire</Text>
        <Text style={styles.birthdayGiftValue}>Prestation gratuite</Text>
        <Text style={styles.birthdayGiftSub}>Jusqu'à 5000 FCFA - Valable le mois de votre anniversaire</Text>
      </LinearGradient>
    </LinearGradient>
  )
}

/** 4) Cashback */
function CashbackCard() {
  const gold = '#D4AF6A'
  return (
    <View style={styles.whiteCard}>
      <View style={styles.cornerLogo}>
        <RoundLogo variant="cash" />
      </View>

      <View style={styles.programHeader}>
        <View style={styles.programIconWrap}>
          <Ionicons name="wallet-outline" size={22} color={gold} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.programTitle}>Programme Cashback</Text>
          <Text style={styles.programSub}>Récupérez une partie de vos dépenses</Text>
        </View>
      </View>

      <View style={styles.programSalonLine}>
        <DotLine color={colors.brand} />
        <Text style={styles.programSalon}>Salon Belle Vue Premium</Text>
      </View>

      <View style={styles.codeBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.codeLabel}>Cashback disponible</Text>
            <Text style={styles.cashValue}>2 450 FCFA</Text>
          </View>
          <Pressable style={styles.useButton} onPress={() => {}}>
            <Text style={styles.useButtonText}>Utiliser</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Taux de cashback actuel</Text>
        <Text style={styles.metricValue}>3%</Text>
      </View>

      <View style={styles.metricRowNoBorder}>
        <Text style={styles.metricLabel}>Ce mois-ci</Text>
        <Text style={styles.metricPlus}>+450 FCFA</Text>
      </View>

      <View style={styles.tipBox}>
        <Ionicons name="gift-outline" size={16} color={colors.brand} style={{ marginTop: 1 }} />
        <Text style={styles.tipText}>
          <Text style={styles.tipStrong}>Niveau Platinum :</Text> débloquez 5% de cashback sur toutes vos prestations
        </Text>
      </View>
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

    // Loyalty - search
  searchWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: overlays.brand20,
    paddingVertical: 10,
    paddingLeft: 44,
    paddingRight: 90,
    shadowColor: colors.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 12,
  },
  searchInput: {
    color: colors.text,
    ...typography.body,
    fontWeight: '600',
  },
  searchClear: {
    position: 'absolute',
    right: 14,
    top: 10,
    height: 30,
    justifyContent: 'center',
  },
  searchClearText: {
    color: colors.brand,
    ...typography.small,
    fontWeight: '800',
  },
  resultsText: {
    paddingHorizontal: 6,
    color: 'rgba(58,58,58,0.60)',
    ...typography.small,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  emptyTitle: { color: colors.text, ...typography.body, fontWeight: '800', marginTop: 6 },
  emptySub: { color: colors.textMuted, ...typography.small },

  // Cards common
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.small,
    fontWeight: '900',
  },
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
  roundLogoTop: {
    color: '#FFFFFF',
    ...typography.small,
  },
  roundLogoBottom: {
    marginTop: 2,
    color: '#FFFFFF',
    ...typography.small,
  },

  cornerLogo: {
    position: 'absolute',
    right: 18,
    top: 18,
  },

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
  goldLogoText: {
    color: '#D4AF6A',
    ...typography.small,
    fontWeight: '900',
  },
  goldTitle: {
    color: colors.brandForeground,
    ...typography.h3,
    fontWeight: '900',
  },
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
  codeBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  codeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeLabel: { color: 'rgba(58,58,58,0.70)', ...typography.small, fontWeight: '700' },
  codeCopy: { color: colors.brand, ...typography.small, fontWeight: '900' },
  codeValue: { marginTop: 8, color: colors.brand, ...typography.h2, fontWeight: '900', letterSpacing: 1 },

  // Referral benefits
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
  useButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
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
