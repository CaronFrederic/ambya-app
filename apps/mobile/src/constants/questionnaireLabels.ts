export type LabelMap = Record<string, string>

const mapFromPairs = (pairs: Array<[string, string]>): LabelMap => {
  const map: LabelMap = {}
  for (const [key, value] of pairs) {
    map[key] = value
  }
  return map
}

export const MAP_GENDER = mapFromPairs([
  ['female', 'Femme'],
  ['male', 'Homme'],
  ['other', 'Autre'],
  ['na', 'Prefere ne pas dire'],
])

export const MAP_AGE = mapFromPairs([
  ['18-24', '18-24 ans'],
  ['25-34', '25-34 ans'],
  ['35-44', '35-44 ans'],
  ['45-54', '45-54 ans'],
  ['55+', '55 ans et plus'],
])

export const MAP_ALLERGIES = mapFromPairs([
  ['yes', 'Oui'],
  ['no', 'Non'],
])

export const MAP_HAIR_TYPES = mapFromPairs([
  ['straight', 'Raides'],
  ['wavy', 'Ondules'],
  ['curly', 'Boucles'],
  ['coily', 'Crepus'],
  ['locks', 'Locks'],
  ['extensions', 'Extensions'],
  ['other', 'Autres'],
])

export const MAP_HAIR_TEXTURE = mapFromPairs([
  ['thin', 'Fins'],
  ['medium', 'Moyens'],
  ['thick', 'Epais'],
  ['very_thick', 'Tres epais'],
  ['na', 'Je ne sais pas'],
])

export const MAP_HAIR_LENGTH = mapFromPairs([
  ['very_short', 'Tres courts'],
  ['short', 'Courts'],
  ['medium', 'Mi-longs'],
  ['long', 'Longs'],
  ['na', 'Je ne sais pas'],
])

export const MAP_HAIR_CONCERNS = mapFromPairs([
  ['fall', 'Chute'],
  ['dry', 'Secheresse'],
  ['break', 'Casse'],
  ['frizz', 'Frisottis'],
  ['dandruff', 'Pellicules'],
  ['growth', 'Croissance'],
  ['volume', 'Manque de volume'],
  ['scalp_sensitive', 'Sensibilite du cuir chevelu'],
  ['na', 'Je ne sais pas'],
])

export const MAP_NAIL_TYPE = mapFromPairs([
  ['smooth', 'Lisses'],
  ['ridged', 'Stries'],
  ['delicate', 'Delicats'],
  ['irregular', 'Irreguliers'],
  ['hard', 'Durs'],
  ['fragile', 'Fragiles'],
  ['na', 'Je ne sais pas'],
])

export const MAP_NAIL_STATE = mapFromPairs([
  ['brittle', 'Cassants'],
  ['soft', 'Mous'],
  ['split', 'Ongles qui se dedoublent'],
  ['irritated', 'Irrites'],
  ['normal', 'Ongles normaux'],
  ['na', 'Je ne sais pas'],
])

export const MAP_NAIL_CONCERNS = mapFromPairs([
  ['cuticles', 'Cuticules'],
  ['dehydration', 'Deshydratation'],
  ['heaviness', 'Lourdeur'],
  ['short', 'Ongles courts'],
  ['bitten', 'Ongles ronges'],
  ['product_allergy', 'Allergies produits'],
  ['na', 'Je ne sais pas'],
])

export const MAP_FACE_SKIN = mapFromPairs([
  ['dry', 'Seche'],
  ['combo', 'Mixte'],
  ['oily', 'Grasse'],
  ['sensitive', 'Sensible'],
  ['normal', 'Normale'],
  ['na', 'Je ne sais pas'],
])

export const MAP_FACE_CONCERNS = mapFromPairs([
  ['acne', 'Acne'],
  ['redness', 'Rougeurs'],
  ['spots', 'Taches'],
  ['sensitivity', 'Sensibilite'],
  ['dehydration', 'Deshydratation'],
  ['aging', 'Rides et vieillissement'],
  ['texture', 'Texture'],
  ['dull', "Manque d'eclat"],
  ['na', 'Je ne sais pas'],
])

export const MAP_BODY_SKIN = mapFromPairs([
  ['normal', 'Normale'],
  ['dry', 'Seche'],
  ['sensitive', 'Sensible'],
  ['na', 'Je ne sais pas'],
])

export const MAP_ZONES = mapFromPairs([
  ['neck', 'Nuque'],
  ['shoulders', 'Epaules'],
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
  ['detox', 'Detox'],
  ['water_retention', "Retention d'eau"],
  ['relax', 'Relaxation'],
  ['na', 'Je ne sais pas'],
])

export const MAP_ACTIVITY = mapFromPairs([
  ['sedentary', 'Sedentaire'],
  ['occasional', 'Occasionnel'],
  ['regular', 'Regulier'],
  ['sporty', 'Sportif'],
  ['na', 'Je ne sais pas'],
])

export const MAP_FITNESS_GOALS = mapFromPairs([
  ['muscle', 'Prise de muscle'],
  ['weight_loss', 'Perte de poids'],
  ['endurance', 'Endurance'],
  ['fitness', 'Condition generale'],
  ['back_in_shape', 'Remise en forme'],
  ['na', 'Je ne sais pas'],
])

export const MAP_FITNESS_CONCERNS = mapFromPairs([
  ['joint_pain', 'Douleurs articulaires'],
  ['low_cardio', 'Cardio faible'],
  ['breath', 'Essoufflement'],
  ['slow_recovery', 'Recuperation lente'],
  ['fatigue', 'Fatigue'],
  ['posture', 'Posture / mobilite'],
  ['na', 'Je ne sais pas'],
])

export const MAP_PAYMENT_PREFS = mapFromPairs([
  ['momo', 'Mobile Money'],
  ['card', 'Carte bancaire'],
  ['cash', 'Especes'],
  ['mixed', 'Mixte'],
])

export const MAP_NOTIF_PREFS = mapFromPairs([
  ['push', 'Push'],
  ['email', 'Email'],
  ['sms', 'SMS'],
  ['none', 'Aucun'],
])

export function labelOf(value: unknown, map: LabelMap) {
  if (value === null || value === undefined || value === '') return null
  const key = String(value)
  return map[key] ?? key
}

export function labelsOf(values: unknown, map: LabelMap) {
  const list = Array.isArray(values) ? values : []
  return list.map((value) => labelOf(value, map)).filter(Boolean) as string[]
}
