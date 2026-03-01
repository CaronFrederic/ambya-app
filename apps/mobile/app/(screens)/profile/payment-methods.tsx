// app/(screens)/profile/payment-methods.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { Screen } from '../../../src/components/Screen'
import { Button } from '../../../src/components/Button'
import { Card } from '../../../src/components/Card'

import { colors, overlays } from '../../../src/theme/colors'
import { spacing } from '../../../src/theme/spacing'
import { radius } from '../../../src/theme/radius'
import { typography } from '../../../src/theme/typography'

// -------------------------
// Helpers
// -------------------------
function onlyDigits(v: string) {
  return (v ?? '').replace(/\D/g, '')
}
function formatCardNumber(v: string) {
  const d = onlyDigits(v).slice(0, 19)
  return d.replace(/(.{4})/g, '$1 ').trim()
}
type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Autre'
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
  return (v ?? '').replace(/[^\d+]/g, '').slice(0, 20)
}

type MobileMoneyProvider = 'Airtel Money' | 'Moov Money' | 'Orange Money' | 'MTN' | 'Autre'
const MM_PROVIDERS: MobileMoneyProvider[] = ['Airtel Money', 'Moov Money', 'Orange Money', 'MTN', 'Autre']

// -------------------------
// API types (aligné à ton Prisma PaymentMethod)
// -------------------------
type PaymentType = 'MOMO' | 'CARD' | 'CASH'

type PaymentMethodApi = {
  id: string
  userId: string
  type: PaymentType
  provider: string | null
  providerRef: string | null
  providerData: any
  label: string | null
  phone: string | null
  last4: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type CreatePaymentMethodBody = {
  type: PaymentType
  provider?: string | null
  label?: string | null
  phone?: string | null
  last4?: string | null
  isDefault?: boolean
}

const API_URL = process.env.EXPO_PUBLIC_API_URL
const BASE = '/me/payment-methods'

async function apiFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL manquant')
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  // certains DELETE renvoient {success:true}
  return (await res.json()) as T
}

// -------------------------
// Queries / Mutations
// -------------------------
function usePaymentMethods(enabled: boolean, token: string | null) {
  return useQuery({
    queryKey: ['me', 'payment-methods'],
    enabled: enabled && !!token,
    queryFn: () => apiFetch<PaymentMethodApi[]>(token!, BASE),
  })
}

function useCreatePaymentMethod(token: string | null) {
  return useMutation({
    mutationFn: (body: CreatePaymentMethodBody) =>
      apiFetch<PaymentMethodApi>(token!, BASE, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  })
}

function useSetDefaultPaymentMethod(token: string | null) {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<PaymentMethodApi>(token!, `${BASE}/${id}/set-default`, { method: 'PATCH' }),
  })
}

function useDeletePaymentMethod(token: string | null) {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: true }>(token!, `${BASE}/${id}`, { method: 'DELETE' }),
  })
}

// -------------------------
// Screen
// -------------------------
export default function PaymentMethodsScreen() {
  const qc = useQueryClient()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    SecureStore.getItemAsync('accessToken').then(setToken)
  }, [])

  const { data, isLoading, isRefetching, refetch } = usePaymentMethods(!!token, token)
  const createPM = useCreatePaymentMethod(token)
  const setDefaultPM = useSetDefaultPaymentMethod(token)
  const deletePM = useDeletePaymentMethod(token)

  const methods = data ?? []
  const cards = useMemo(() => methods.filter((m) => m.type === 'CARD' && m.isActive), [methods])
  const momos = useMemo(() => methods.filter((m) => m.type === 'MOMO' && m.isActive), [methods])

  const defaultCard = useMemo(() => cards.find((c) => c.isDefault) ?? cards[0], [cards])
  const defaultMomo = useMemo(() => momos.find((m) => m.isDefault) ?? momos[0], [momos])

  // -----------------------
  // Card form
  // -----------------------
  const [editingCard, setEditingCard] = useState(false)

  const [holderName, setHolderName] = useState(defaultCard?.label ?? '')
  const [number, setNumber] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvc, setCvc] = useState('')

  const startEditCard = () => {
    setEditingCard(true)
    setHolderName(defaultCard?.label ?? '')
    setNumber('')
    setExpMonth('')
    setExpYear('')
    setCvc('')
  }

  const saveCard = async () => {
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

    try {
      // ⚠️ pas de PATCH :id côté back => stratégie bêta :
      // si une carte existe, on la supprime puis on recrée
      if (defaultCard?.id) {
        await deletePM.mutateAsync(defaultCard.id)
      }

      const created = await createPM.mutateAsync({
        type: 'CARD',
        provider: brand, // provider = marque
        last4,
        label: holderName.trim(), // label = titulaire
        isDefault: true,
      })

      // set default (au cas où)
      await setDefaultPM.mutateAsync(created.id)

      await qc.invalidateQueries({ queryKey: ['me', 'payment-methods'] })
      setEditingCard(false)
      Alert.alert('OK', 'Carte enregistrée.')
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de sauvegarder la carte.')
    }
  }

  const removeCard = () => {
    if (!defaultCard) return
    Alert.alert('Supprimer la carte', 'Voulez-vous supprimer cette carte ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePM.mutateAsync(defaultCard.id)
            await qc.invalidateQueries({ queryKey: ['me', 'payment-methods'] })
            setEditingCard(false)
          } catch (e: any) {
            Alert.alert('Erreur', e?.message ?? 'Suppression impossible.')
          }
        },
      },
    ])
  }

  // -----------------------
  // MOMO form
  // -----------------------
  const [editingMomo, setEditingMomo] = useState(false)

  const [momoProvider, setMomoProvider] = useState<MobileMoneyProvider>(
    (defaultMomo?.provider as MobileMoneyProvider) ?? 'Airtel Money',
  )
  const [momoPhone, setMomoPhone] = useState(defaultMomo?.phone ?? '')
  const [momoHolder, setMomoHolder] = useState(defaultMomo?.label ?? '')

  const startEditMomo = () => {
    setEditingMomo(true)
    setMomoProvider(((defaultMomo?.provider as MobileMoneyProvider) ?? 'Airtel Money') as MobileMoneyProvider)
    setMomoPhone(defaultMomo?.phone ?? '')
    setMomoHolder(defaultMomo?.label ?? '')
  }

  const saveMomo = async () => {
    const phone = normalizePhone(momoPhone).trim()
    if (!phone || phone.length < 6) return Alert.alert('Erreur', 'Numéro Mobile Money invalide.')

    try {
      // même stratégie (pas d'update endpoint)
      if (defaultMomo?.id) {
        await deletePM.mutateAsync(defaultMomo.id)
      }

      const created = await createPM.mutateAsync({
        type: 'MOMO',
        provider: momoProvider,
        phone,
        label: momoHolder.trim() || null,
        isDefault: true,
      })

      await setDefaultPM.mutateAsync(created.id)

      await qc.invalidateQueries({ queryKey: ['me', 'payment-methods'] })
      setEditingMomo(false)
      Alert.alert('OK', 'Mobile Money enregistré.')
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? "Impossible de sauvegarder Mobile Money.")
    }
  }

  const removeMomo = () => {
    if (!defaultMomo) return
    Alert.alert('Supprimer Mobile Money', 'Voulez-vous supprimer ce moyen de paiement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePM.mutateAsync(defaultMomo.id)
            await qc.invalidateQueries({ queryKey: ['me', 'payment-methods'] })
            setEditingMomo(false)
          } catch (e: any) {
            Alert.alert('Erreur', e?.message ?? 'Suppression impossible.')
          }
        },
      },
    ])
  }

  const busy =
    isLoading ||
    createPM.isPending ||
    setDefaultPM.isPending ||
    deletePM.isPending

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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {busy && (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Synchronisation…</Text>
          </View>
        )}

        {/* ----------------------- */}
        {/* CARD */}
        {/* ----------------------- */}
        <Card style={styles.cardBox}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardLabel}>Carte enregistrée</Text>

              {defaultCard ? (
                <>
                  <Text style={styles.cardValue}>{maskCard(defaultCard.last4 ?? '••••')}</Text>
                  <Text style={styles.cardMeta}>
                    {defaultCard.provider ?? 'Carte'} • Par défaut
                  </Text>
                  {!!defaultCard.label && <Text style={styles.cardMeta}>Titulaire : {defaultCard.label}</Text>}
                </>
              ) : (
                <Text style={styles.cardMeta}>Aucune carte enregistrée</Text>
              )}
            </View>

            {!editingCard && (
              <Pressable onPress={startEditCard} style={styles.editPill}>
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
                <Button title="Annuler" variant="secondary" onPress={() => setEditingCard(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Enregistrer" onPress={saveCard} />
              </View>
            </View>

            {!!defaultCard && (
              <Pressable onPress={removeCard} style={styles.deleteRow}>
                <Ionicons name="trash-outline" size={18} color={colors.dangerText} />
                <Text style={styles.deleteText}>Supprimer la carte</Text>
              </Pressable>
            )}
          </Card>
        )}

        <View style={{ height: spacing.md }} />

        {/* ----------------------- */}
        {/* MOMO */}
        {/* ----------------------- */}
        <Card style={styles.cardBox}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardLabel}>Mobile Money</Text>

              {defaultMomo ? (
                <>
                  <Text style={styles.cardValue}>{defaultMomo.provider ?? 'Mobile Money'}</Text>
                  <Text style={styles.cardMeta}>Numéro : {defaultMomo.phone}</Text>
                  {!!defaultMomo.label && <Text style={styles.cardMeta}>Titulaire : {defaultMomo.label}</Text>}
                </>
              ) : (
                <Text style={styles.cardMeta}>Aucun Mobile Money enregistré</Text>
              )}
            </View>

            {!editingMomo && (
              <Pressable onPress={startEditMomo} style={styles.editPill}>
                <Ionicons name="create-outline" size={16} color={colors.brand} />
                <Text style={styles.editPillText}>{defaultMomo ? 'Modifier' : 'Ajouter'}</Text>
              </Pressable>
            )}
          </View>
        </Card>

        {editingMomo && (
          <Card style={styles.formCard}>
            <Text style={styles.label}>Opérateur</Text>
            <View style={styles.chipsRow}>
              {MM_PROVIDERS.map((p) => {
                const active = momoProvider === p
                return (
                  <Pressable
                    key={p}
                    onPress={() => setMomoProvider(p)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{p}</Text>
                  </Pressable>
                )
              })}
            </View>

            <Field label="Numéro Mobile Money">
              <TextInput
                value={momoPhone}
                onChangeText={(v) => setMomoPhone(normalizePhone(v))}
                keyboardType={Platform.select({ ios: 'phone-pad', android: 'phone-pad', default: 'phone-pad' })}
                placeholder="Ex: +241 06 12 34 56"
                placeholderTextColor={colors.placeholder}
                style={styles.input}
              />
            </Field>

            <Field label="Nom du titulaire (optionnel)">
              <TextInput
                value={momoHolder}
                onChangeText={setMomoHolder}
                placeholder="Ex: Marie Kouassi"
                placeholderTextColor={colors.placeholder}
                style={styles.input}
              />
            </Field>

            <View style={{ height: spacing.md }} />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button title="Annuler" variant="secondary" onPress={() => setEditingMomo(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Enregistrer" onPress={saveMomo} />
              </View>
            </View>

            {!!defaultMomo && (
              <Pressable onPress={removeMomo} style={styles.deleteRow}>
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

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  loadingText: { color: colors.textMuted, ...typography.small, fontWeight: '700' },

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
