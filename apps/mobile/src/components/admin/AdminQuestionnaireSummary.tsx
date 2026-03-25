import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import {
  MAP_ACTIVITY,
  MAP_ALLERGIES,
  MAP_BODY_SKIN,
  MAP_FACE_CONCERNS,
  MAP_FACE_SKIN,
  MAP_FITNESS_CONCERNS,
  MAP_FITNESS_GOALS,
  MAP_GENDER,
  MAP_HAIR_CONCERNS,
  MAP_HAIR_LENGTH,
  MAP_HAIR_TEXTURE,
  MAP_HAIR_TYPES,
  MAP_NAIL_CONCERNS,
  MAP_NAIL_STATE,
  MAP_NAIL_TYPE,
  MAP_NOTIF_PREFS,
  MAP_PAYMENT_PREFS,
  MAP_WELLBEING,
  MAP_ZONES,
  labelOf,
  labelsOf,
} from '../../constants/questionnaireLabels'
import { colors } from '../../theme/colors'
import { radius } from '../../theme/radius'
import { spacing } from '../../theme/spacing'

type Props = {
  gender?: string | null
  allergies?: string | null
  comments?: string | null
  questionnaire?: Record<string, any> | null
}

export function AdminQuestionnaireSummary({
  gender,
  allergies,
  comments,
  questionnaire,
}: Props) {
  const sections = buildSections(gender, allergies, comments, questionnaire)

  if (sections.length === 0) {
    return <Text style={styles.empty}>Aucune information complementaire renseignee.</Text>
  }

  return (
    <View style={styles.wrap}>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.items}>
            {section.items.map((item) => (
              <View key={`${section.title}-${item.label}`} style={styles.itemRow}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

function buildSections(
  gender?: string | null,
  allergies?: string | null,
  comments?: string | null,
  questionnaire?: Record<string, any> | null,
) {
  const q = questionnaire ?? {}
  const sections: Array<{ title: string; items: Array<{ label: string; value: string }> }> = []

  pushSection(sections, 'Informations importantes', [
    toSingle('Genre', labelOf(gender, MAP_GENDER)),
    toSingle('Allergies', labelOf(allergies, MAP_ALLERGIES)),
    toSingle('Commentaires', safeText(comments)),
  ])

  pushSection(sections, 'Profil capillaire', [
    toList('Types de cheveux', labelsOf(q?.hair?.hairTypes, MAP_HAIR_TYPES)),
    toSingle('Texture', labelOf(q?.hair?.hairTexture, MAP_HAIR_TEXTURE)),
    toSingle('Longueur', labelOf(q?.hair?.hairLength, MAP_HAIR_LENGTH)),
    toList('Besoins', labelsOf(q?.hair?.hairConcerns, MAP_HAIR_CONCERNS)),
  ])

  pushSection(sections, 'Ongles', [
    toList('Type', labelsOf(q?.nails?.nailTypes, MAP_NAIL_TYPE)),
    toList('Etat', labelsOf(q?.nails?.nailStates, MAP_NAIL_STATE)),
    toList('Besoins', labelsOf(q?.nails?.nailConcerns, MAP_NAIL_CONCERNS)),
  ])

  pushSection(sections, 'Peau visage', [
    toSingle('Type de peau', labelOf(q?.face?.faceSkin, MAP_FACE_SKIN)),
    toList('Preoccupations', labelsOf(q?.face?.faceConcerns, MAP_FACE_CONCERNS)),
  ])

  pushSection(sections, 'Bien-etre', [
    toSingle('Peau du corps', labelOf(q?.body?.bodySkin ?? q?.body?.skinType, MAP_BODY_SKIN)),
    toList('Zones de tension', labelsOf(q?.body?.tensionZones ?? q?.body?.focusAreas, MAP_ZONES)),
    toList('Preoccupations', labelsOf(q?.body?.wellbeingConcerns ?? q?.body?.concerns, MAP_WELLBEING)),
    toList('Zones sensibles massage', labelsOf(q?.body?.massageSensitiveZones ?? q?.body?.sensitiveZones, MAP_ZONES)),
  ])

  pushSection(sections, 'Fitness', [
    toSingle('Niveau d activite', labelOf(q?.fitness?.activityLevel, MAP_ACTIVITY)),
    toList('Objectifs', labelsOf(q?.fitness?.fitnessGoals, MAP_FITNESS_GOALS)),
    toList('Points d attention', labelsOf(q?.fitness?.fitnessConcerns, MAP_FITNESS_CONCERNS)),
  ])

  pushSection(sections, 'Preferences pratiques', [
    toList('Paiement', labelsOf(q?.practical?.paymentPrefs, MAP_PAYMENT_PREFS)),
    toList('Notifications', labelsOf(q?.practical?.notifPrefs, MAP_NOTIF_PREFS)),
  ])

  return sections
}

function pushSection(
  sections: Array<{ title: string; items: Array<{ label: string; value: string }> }>,
  title: string,
  items: Array<{ label: string; value: string | null }>,
) {
  const visibleItems = items.filter((item) => item.value)
  if (visibleItems.length > 0) {
    sections.push({
      title,
      items: visibleItems as Array<{ label: string; value: string }>,
    })
  }
}

function toSingle(label: string, value: string | null) {
  return { label, value: value ? String(value) : null }
}

function toList(label: string, values: string[]) {
  return { label, value: values.length ? values.join(', ') : null }
}

function safeText(value?: string | null) {
  const text = value?.trim()
  return text ? text : null
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FCF8F9',
    borderWidth: 1,
    borderColor: 'rgba(107,39,55,0.08)',
  },
  sectionTitle: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  items: {
    gap: spacing.sm,
  },
  itemRow: {
    gap: 2,
  },
  itemLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  itemValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
})
