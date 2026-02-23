import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Screen } from '../../../src/components/Screen'
import { Button } from '../../../src/components/Button'
import { Card } from '../../../src/components/Card'
import {
  usePayment,
  CardPaymentMethod,
  CardBrand,
  MobileMoneyMethod,
  MobileMoneyProvider,
} from '../../../src/providers/PaymentProvider'

import { colors, overlays } from '../../../src/theme/colors'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import { typography } from '../../../src/theme/typography'

function onlyDigits(v: string) {
  return (v ?? '').replace(/\D/g, '')
}

function formatCardNumber(v: string) {
  const d = onlyDigits(v).slice(0, 19)
  return d.replace(/(.{4})/g, '$1 ').trim()
}

function detectBrand(digits: string): CardBrand {
  if (!digits) return 'Autre'
  if (digits.startsWith('4')) return 'Visa'
  if (/^(5[1-5])/.test(digits) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'Amex'
  return 'Autre'
}

function maskCard(last4: string) {
  return `•••• •••• •••• ${last4}`
}

function normalizePhone(v: string) {
  // conserve + et chiffres
  return (v ?? '').replace(/[^\d+]/g, '').slice(0, 20)
}

const MM_PROVIDERS: MobileMoneyProvider[] = ['Airtel Money', 'Moov Money', 'Orange Money', 'MTN', 'Autre']

export default function PaymentMethodsScreen() {
  const {
    // Cards
    cards,
    upsertCard,
    removeCard,
    setDefault,

    // Mobile Money (depuis Provider)
    mobileMoney,
    upsertMobileMoney,
    removeMobileMoney,
    setDefaultMobileMoney,
  } = usePayment()

  // -----------------------
  // Carte (existante)
  // -----------------------
  const defaultCard = useMemo(() => cards.find((c) => c.isDefault) ?? cards[0], [cards])
  const [editingCard, setEditingCard] = useState(false)

  const [holderName, setHolderName] = useState(defaultCard?.holderName ?? '')
  const [number, setNumber] = useState('') // jamais pré-remplir
  const [expMonth, setExpMonth] = useState(defaultCard?.expMonth ?? '')
  const [expYear, setExpYear] = useState(defaultCard?.expYear ?? '')
  const [cvc, setCvc] = useState('')

  const onStartEditCard = () => {
    setEditingCard(true)
    setHolderName(defaultCard?.holderName ?? '')
    setExpMonth(defaultCard?.expMonth ?? '')
    setExpYear(defaultCard?.expYear ?? '')
    setNumber('')
    setCvc('')
  }

  const onCancelCard = () => setEditingCard(false)

  const onSaveCard = () => {
    const numDigits = onlyDigits(number)
    const mm = onlyDigits(expMonth).slice(0, 2)
    const yy = onlyDigits(expYear).slice(0, 2)
    const cvcDigits = onlyDigits(cvc).slice(0, 4)

    if (!holderName.trim()) return Alert.alert('Erreur', 'Veuillez renseigner le nom du titulaire.')
    if (numDigits.length < 12) return Alert.alert('Erreur', 'Numéro de carte invalide.')
    if (!mm || Number(mm) < 1 || Number(mm) > 12) return Alert.alert('Erreur', 'Mois d’expiration invalide.')
    if (!yy) return Alert.alert('Erreur', 'Année d’expiration invalide.')
    if (cvcDigits.length < 3) return Alert.alert('Erreur', 'CVC invalide.')

    const brand = detectBrand(numDigits)
    const last4 = numDigits.slice(-4)

    const updated: CardPaymentMethod = {
      id: defaultCard?.id ?? `card_${Date.now()}`,
      brand,
      last4,
      expMonth: mm.padStart(2, '0'),
      expYear: yy.padStart(2, '0'),
      holderName: holderName.trim(),
      isDefault: true,
    }

    upsertCard(updated)
    setDefault(updated.id)
    setEditingCard(false)
    Alert.alert('OK', 'Carte mise à jour.')
  }

  const onDeleteCard = () => {
    if (!defaultCard) return
    Alert.alert('Supprimer la carte', 'Voulez-vous supprimer cette carte ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          removeCard(defaultCard.id)
          setEditingCard(false)
        },
      },
    ])
  }

  // -----------------------
  // Mobile Money
  // -----------------------
  const defaultMM = useMemo(() => mobileMoney.find((m) => m.isDefault) ?? mobileMoney[0], [mobileMoney])
  const [editingMM, setEditingMM] = useState(false)

  const [mmProvider, setMmProvider] = useState<MobileMoneyProvider>(defaultMM?.provider ?? 'Airtel Money')
  const [mmPhone, setMmPhone] = useState(defaultMM?.phone ?? '')
  const [mmHolder, setMmHolder] = useState(defaultMM?.holderName ?? '')

  const onStartEditMM = () => {
    setEditingMM(true)
    setMmProvider(defaultMM?.provider ?? 'Airtel Money')
    setMmPhone(defaultMM?.phone ?? '')
    setMmHolder(defaultMM?.holderName ?? '')
  }

  const onCancelMM = () => setEditingMM(false)

  const onSaveMM = () => {
    const phone = normalizePhone(mmPhone).trim()
    if (!phone || phone.length < 6) return Alert.alert('Erreur', 'Numéro Mobile Money invalide.')

    const updated: MobileMoneyMethod = {
      id: defaultMM?.id ?? `mm_${Date.now()}`,
      provider: mmProvider,
      phone,
      holderName: mmHolder.trim() || undefined,
      isDefault: true,
    }

    upsertMobileMoney(updated)
    setDefaultMobileMoney(updated.id)
    setEditingMM(false)
    Alert.alert('OK', 'Mobile Money mis à jour.')
  }

  const onDeleteMM = () => {
    if (!defaultMM) return
    Alert.alert('Supprimer Mobile Money', 'Voulez-vous supprimer ce moyen de paiement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          removeMobileMoney(defaultMM.id)
          setEditingMM(false)
        },
      },
    ])
  }

  return (
    <Screen noPadding style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.brandForeground} />
        </Pressable>

        <Text style={styles.headerTitle}>Moyens de paiement</Text>
        <Text style={styles.headerSubtitle}>Carte & Mobile Money</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ----------------------- */}
        {/* CARTE */}
        {/* ----------------------- */}
        <Card style={styles.cardBox}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardLabel}>Carte enregistrée</Text>
              {defaultCard ? (
                <>
                  <Text style={styles.cardValue}>{maskCard(defaultCard.last4)}</Text>
                  <Text style={styles.cardMeta}>
                    {defaultCard.brand ?? 'Carte'} • Exp. {defaultCard.expMonth}/{defaultCard.expYear}
                  </Text>
                  {!!defaultCard.holderName && <Text style={styles.cardMeta}>Titulaire : {defaultCard.holderName}</Text>}
                </>
              ) : (
                <Text style={styles.cardMeta}>Aucune carte enregistrée</Text>
              )}
            </View>

            {!editingCard && (
              <Pressable onPress={onStartEditCard} style={styles.editPill}>
                <Ionicons name="create-outline" size={16} color={colors.brand} />
                <Text style={styles.editPillText}>{defaultCard ? 'Modifier' : 'Ajouter'}</Text>
              </Pressable>
            )}
          </View>
        </Card>

        {editingCard && (
          <Card style={styles.formCard}>
            <Field label="Nom du titulaire">
              <TextInput
                value={holderName}
                onChangeText={setHolderName}
                placeholder="Ex: Marie Kouassi"
                placeholderTextColor={colors.placeholder}
                style={styles.input}
              />
            </Field>

            <Field label="Numéro de carte">
              <TextInput
                value={formatCardNumber(number)}
                onChangeText={(v) => setNumber(v)}
                keyboardType="number-pad"
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.placeholder}
                style={styles.input}
              />
              <Text style={styles.helperText}>Marque détectée : {detectBrand(onlyDigits(number))}</Text>
            </Field>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field label="Expiration (MM)">
                  <TextInput
                    value={expMonth}
                    onChangeText={(v) => setExpMonth(onlyDigits(v).slice(0, 2))}
                    keyboardType="number-pad"
                    placeholder="12"
                    placeholderTextColor={colors.placeholder}
                    style={styles.input}
                  />
                </Field>
              </View>

              <View style={{ flex: 1 }}>
                <Field label="Expiration (AA)">
                  <TextInput
                    value={expYear}
                    onChangeText={(v) => setExpYear(onlyDigits(v).slice(0, 2))}
                    keyboardType="number-pad"
                    placeholder="28"
                    placeholderTextColor={colors.placeholder}
                    style={styles.input}
                  />
                </Field>
              </View>

              <View style={{ flex: 1 }}>
                <Field label="CVC">
                  <TextInput
                    value={cvc}
                    onChangeText={(v) => setCvc(onlyDigits(v).slice(0, 4))}
                    keyboardType="number-pad"
                    placeholder="123"
                    placeholderTextColor={colors.placeholder}
                    style={styles.input}
                    secureTextEntry
                  />
                </Field>
              </View>
            </View>

            <View style={{ height: spacing.md }} />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button title="Annuler" variant="secondary" onPress={onCancelCard} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Enregistrer" onPress={onSaveCard} />
              </View>
            </View>

            {!!defaultCard && (
              <Pressable onPress={onDeleteCard} style={styles.deleteRow}>
                <Ionicons name="trash-outline" size={18} color={colors.dangerText} />
                <Text style={styles.deleteText}>Supprimer la carte</Text>
              </Pressable>
            )}
          </Card>
        )}

        {/* Spacer */}
        <View style={{ height: spacing.md }} />

        {/* ----------------------- */}
        {/* MOBILE MONEY */}
        {/* ----------------------- */}
        <Card style={styles.cardBox}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardLabel}>Mobile Money</Text>
              {defaultMM ? (
                <>
                  <Text style={styles.cardValue}>{defaultMM.provider}</Text>
                  <Text style={styles.cardMeta}>Numéro : {defaultMM.phone}</Text>
                  {!!defaultMM.holderName && <Text style={styles.cardMeta}>Titulaire : {defaultMM.holderName}</Text>}
                </>
              ) : (
                <Text style={styles.cardMeta}>Aucun Mobile Money enregistré</Text>
              )}
            </View>

            {!editingMM && (
              <Pressable onPress={onStartEditMM} style={styles.editPill}>
                <Ionicons name="create-outline" size={16} color={colors.brand} />
                <Text style={styles.editPillText}>{defaultMM ? 'Modifier' : 'Ajouter'}</Text>
              </Pressable>
            )}
          </View>
        </Card>

        {editingMM && (
          <Card style={styles.formCard}>
            <Text style={styles.label}>Opérateur</Text>
            <View style={styles.chipsRow}>
              {MM_PROVIDERS.map((p) => {
                const active = mmProvider === p
                return (
                  <Pressable
                    key={p}
                    onPress={() => setMmProvider(p)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{p}</Text>
                  </Pressable>
                )
              })}
            </View>

            <Field label="Numéro Mobile Money">
              <TextInput
                value={mmPhone}
                onChangeText={(v) => setMmPhone(normalizePhone(v))}
                keyboardType={Platform.select({ ios: 'phone-pad', android: 'phone-pad', default: 'phone-pad' })}
                placeholder="Ex: +241 06 12 34 56"
                placeholderTextColor={colors.placeholder}
                style={styles.input}
              />
            </Field>

            <Field label="Nom du titulaire (optionnel)">
              <TextInput
                value={mmHolder}
                onChangeText={setMmHolder}
                placeholder="Ex: Marie Kouassi"
                placeholderTextColor={colors.placeholder}
                style={styles.input}
              />
            </Field>

            <View style={{ height: spacing.md }} />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button title="Annuler" variant="secondary" onPress={onCancelMM} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Enregistrer" onPress={onSaveMM} />
              </View>
            </View>

            {!!defaultMM && (
              <Pressable onPress={onDeleteMM} style={styles.deleteRow}>
                <Ionicons name="trash-outline" size={18} color={colors.dangerText} />
                <Text style={styles.deleteText}>Supprimer Mobile Money</Text>
              </Pressable>
            )}
          </Card>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
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

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 },

  cardBox: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardLabel: { color: colors.textMuted, ...typography.small, fontWeight: '700' },
  cardValue: { color: colors.text, ...typography.h3, fontWeight: '900', marginTop: 6 },
  cardMeta: { color: colors.textMuted, ...typography.small, marginTop: 6 },

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

  formCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },

  label: { color: colors.text, ...typography.small, fontWeight: '800' },

  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: overlays.brand20,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontWeight: '700',
  },

  helperText: { marginTop: 8, color: colors.textMuted, ...typography.small },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: overlays.brand20,
  },
  chipActive: {
    backgroundColor: overlays.brand10,
    borderColor: overlays.brand30,
  },
  chipText: { color: colors.text, ...typography.small, fontWeight: '800' },
  chipTextActive: { color: colors.brand },

  deleteRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: overlays.premium10,
    borderWidth: 1,
    borderColor: overlays.premium20,
  },
  deleteText: { color: colors.dangerText, ...typography.small, fontWeight: '800' },
})