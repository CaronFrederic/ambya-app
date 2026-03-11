import { useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import {
  useAppointmentGroupDetails,
  useCreateAppointmentReview,
} from '../../src/api/appointments'
import { Screen } from '../../src/components/Screen'
import { Card } from '../../src/components/Card'
import { Button } from '../../src/components/Button'
import { Input } from '../../src/components/Input'
import { spacing } from '../../src/theme/spacing'
import { colors, overlays } from '../../src/theme/colors'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'

export default function LeaveReviewScreen() {
  const params = useLocalSearchParams<{ groupId?: string }>()
  const groupId = params.groupId
  const { data, isLoading, isError } = useAppointmentGroupDetails(groupId)
  const createReview = useCreateAppointmentReview()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const canReview = useMemo(
    () => (data?.items ?? []).some((item) => item.status === 'COMPLETED'),
    [data?.items],
  )

  const submit = async () => {
    if (!groupId) return

    try {
      await createReview.mutateAsync({
        groupId,
        rating,
        comment,
      })
      Alert.alert('Avis envoyé', 'Votre avis est maintenant visible sur la fiche du salon.', [
        {
          text: 'Voir le salon',
          onPress: () =>
            router.replace(`/(screens)/salon?salonId=${data?.salon.id}` as never),
        },
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d’envoyer votre avis.'
      Alert.alert('Envoi impossible', message)
    }
  }

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.brandForeground} />
        </Pressable>
        <Text style={styles.headerTitle}>Laisser un avis</Text>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <Card>
            <Text>Chargement...</Text>
          </Card>
        ) : isError || !data ? (
          <Card>
            <Text>Impossible de charger ce rendez-vous.</Text>
          </Card>
        ) : !canReview ? (
          <Card>
            <Text>Seuls les rendez-vous terminés peuvent être notés.</Text>
          </Card>
        ) : (
          <>
            <Card>
              <Text style={styles.salonName}>{data.salon.name}</Text>
              <Text style={styles.helpText}>Note ton expérience et ajoute un commentaire.</Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = value <= rating
                  return (
                    <Pressable key={value} onPress={() => setRating(value)} style={styles.starBtn}>
                      <Ionicons
                        name={active ? 'star' : 'star-outline'}
                        size={28}
                        color={active ? colors.gold : colors.textMuted}
                      />
                    </Pressable>
                  )
                })}
              </View>

              <Input
                value={comment}
                onChangeText={setComment}
                placeholder="Décris ton expérience avec ce salon..."
                multiline
                numberOfLines={5}
                containerStyle={styles.commentInput}
                inputStyle={styles.commentInputText}
              />
            </Card>

            <Button
              title={createReview.isPending ? 'Envoi...' : 'Publier mon avis'}
              onPress={submit}
              disabled={createReview.isPending || comment.trim().length === 0}
            />
          </>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  header: {
    backgroundColor: colors.brand,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { color: colors.brandForeground, ...typography.h2 },
  content: { flex: 1, padding: spacing.lg, gap: spacing.md },
  salonName: { color: colors.text, ...typography.h3, marginBottom: spacing.xs },
  helpText: { color: colors.textMuted, ...typography.body, marginBottom: spacing.md },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  starBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: overlays.gold10,
  },
  commentInput: { marginTop: spacing.sm },
  commentInputText: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
})
