// src/constants/questionnaireLabels.ts

export type LabelMap = Record<string, string>

const mapFromPairs = (pairs: Array<[string, string]>): LabelMap => {
  const m: LabelMap = {}
  for (const [k, v] of pairs) m[k] = v
  return m
}

// -----------------------
// General
// -----------------------
export const MAP_GENDER = mapFromPairs([
  ['female', 'Femme'],
  ['male', 'Homme'],
  ['other', 'Autre'],
  ['na', 'Préfère ne pas dire'],
])

export const MAP_AGE = mapFromPairs([
  ['18-24', '18–24 ans'],
  ['25-34', '25–34 ans'],
  ['35-44', '35–44 ans'],
  ['45-54', '45–54 ans'],
  ['55+', '55 ans et plus'],
])

export const MAP_ALLERGIES = mapFromPairs([
  ['yes', 'Oui'],
  ['no', 'Non'],
])

// -----------------------
// Hair
// -----------------------
export const MAP_HAIR_TYPES = mapFromPairs([
  ['straight', 'Raides'],
  ['wavy', 'Ondulés'],
  ['curly', 'Bouclés'],
  ['coily', 'Crépus'],
  ['locks', 'Locks'],
  ['extensions', 'Extensions'],
  ['other', 'Autres'],
])

export const MAP_HAIR_TEXTURE = mapFromPairs([
  ['thin', 'Fins'],
  ['medium', 'Moyens'],
  ['thick', 'Épais'],
  ['very_thick', 'Très épais'],
  ['na', 'Je ne sais pas'],
])

export const MAP_HAIR_LENGTH = mapFromPairs([
  ['very_short', 'Très courts'],
  ['short', 'Courts'],
  ['medium', 'Mi-longs'],
  ['long', 'Longs'],
  ['na', 'Je ne sais pas'],
])

export const MAP_HAIR_CONCERNS = mapFromPairs([
  ['fall', 'Chute'],
  ['dry', 'Sécheresse'],
  ['break', 'Casse'],
  ['frizz', 'Frisottis'],
  ['dandruff', 'Pellicules'],
  ['growth', 'Croissance'],
  ['volume', 'Manque de volume'],
  ['scalp_sensitive', 'Sensibilité du cuir chevelu'],
  ['na', 'Je ne sais pas'],
])

// -----------------------
// Nails
// -----------------------
export const MAP_NAIL_TYPE = mapFromPairs([
  ['smooth', 'Lisses'],
  ['ridged', 'Striés'],
  ['delicate', 'Délicats'],
  ['irregular', 'Irréguliers'],
  ['hard', 'Durs'],
  ['fragile', 'Fragiles'],
  ['na', 'Je ne sais pas'],
])

export const MAP_NAIL_STATE = mapFromPairs([
  ['brittle', 'Cassants'],
  ['soft', 'Mous'],
  ['split', 'Ongles qui se dédoublent'],
  ['irritated', 'Irrités'],
  ['normal', 'Ongles normaux'],
  ['na', 'Je ne sais pas'],
])

export const MAP_NAIL_CONCERNS = mapFromPairs([
  ['cuticles', 'Cuticules'],
  ['dehydration', 'Déshydratation'],
  ['heaviness', 'Lourdeur'],
  ['short', 'Ongles courts'],
  ['bitten', 'Ongles rongés'],
  ['product_allergy', 'Allergies produits'],
  ['na', 'Je ne sais pas'],
])

// -----------------------
// Face
// -----------------------
export const MAP_FACE_SKIN = mapFromPairs([
  ['dry', 'Sèche'],
  ['combo', 'Mixte'],
  ['oily', 'Grasse'],
  ['sensitive', 'Sensible'],
  ['normal', 'Normale'],
  ['na', 'Je ne sais pas'],
])

export const MAP_FACE_CONCERNS = mapFromPairs([
  ['acne', 'Acné'],
  ['redness', 'Rougeurs'],
  ['spots', 'Taches'],
  ['sensitivity', 'Sensibilité'],
  ['dehydration', 'Déshydratation'],
  ['aging', 'Rides & vieillissement'],
  ['texture', 'Texture'],
  ['dull', "Manque d'éclat"],
  ['na', 'Je ne sais pas'],
])

// -----------------------
// Body / Wellness
// -----------------------
export const MAP_BODY_SKIN = mapFromPairs([
  ['normal', 'Normale'],
  ['dry', 'Sèche'],
  ['sensitive', 'Sensible'],
  ['na', 'Je ne sais pas'],
])

export const MAP_ZONES = mapFromPairs([
  ['neck', 'Nuque'],
  ['shoulders', 'Épaules'],
  ['back', 'Dos'],
  ['lower_back', 'Lombaires'],
  ['arms', 'Bras'],
  ['legs', 'Jambes'],
  ['feet', 'Pieds'],
  ['na', 'Je ne sais pas'],
])

export const MAP_WELLBEING = mapFromPairs([
  ['stress', 'Stress'],
  ['muscle_pain', 'Douleurs musculaires'],
  ['circulation', 'Circulation'],
  ['detox', 'Détox'],
  ['water_retention', "Rétention d'eau"],
  ['relax', 'Relaxation'],
  ['na', 'Je ne sais pas'],
])

// -----------------------
// Fitness
// -----------------------
export const MAP_ACTIVITY = mapFromPairs([
  ['sedentary', 'Sédentaire'],
  ['occasional', 'Occasionnel'],
  ['regular', 'Régulier'],
  ['sporty', 'Sportif'],
  ['na', 'Je ne sais pas'],
])

export const MAP_FITNESS_GOALS = mapFromPairs([
  ['muscle', 'Prise de muscle'],
  ['weight_loss', 'Perte de poids'],
  ['endurance', 'Endurance'],
  ['fitness', 'Condition générale'],
  ['back_in_shape', 'Remise en forme'],
  ['na', 'Je ne sais pas'],
])

export const MAP_FITNESS_CONCERNS = mapFromPairs([
  ['joint_pain', 'Douleurs articulaires'],
  ['low_cardio', 'Cardio faible'],
  ['breath', 'Essoufflement'],
  ['slow_recovery', 'Récupération lente'],
  ['fatigue', 'Fatigue'],
  ['posture', 'Posture / mobilité'],
  ['na', 'Je ne sais pas'],
])

// -----------------------
// Practical
// -----------------------
export const MAP_PAYMENT_PREFS = mapFromPairs([
  ['momo', 'Mobile Money'],
  ['card', 'Carte bancaire'],
  ['cash', 'Cash'],
  ['mixed', 'Mixte'],
])

export const MAP_NOTIF_PREFS = mapFromPairs([
  ['push', 'Push'],
  ['email', 'Email'],
  ['sms', 'SMS'],
  ['none', 'Aucun'],
])

// -----------------------
// Helpers (exportés)
// -----------------------
export function labelOf(value: any, map: LabelMap) {
  if (value === null || value === undefined || value === '') return null
  const v = String(value)
  return map[v] ?? v
}

export function labelsOf(values: any, map: LabelMap) {
  const arr = Array.isArray(values) ? values : []
  return arr.map((x) => labelOf(x, map)).filter(Boolean) as string[]
}
