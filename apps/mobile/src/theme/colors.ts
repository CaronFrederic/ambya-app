export const colors = {
  // Brand (Ambya)
  brand: '#6B2737',          // Bordeaux (CTA / header / active)
  brandForeground: '#FFFFFF',
  premium: '#D4AF6A',        // Or
  gold: '#D4AF6A',  
  text: '#3A3A3A',           // Graphite
  textMuted: '#717182',

  // Surfaces
  background: '#FAF7F2',     // Crème
  card: '#FFFFFF',
  inputBackground: '#FFFFFF', // sur Figma souvent blanc dans card

  // Neutrals
  border: 'rgba(58,58,58,0.12)', // graphite léger
  muted: '#ECECF0',

  // Status (soft badges)
  successSoft: '#DDF5E5',
  successText: '#1F7A3A',

  warningSoft: '#FFF2CC',
  warningText: '#946200',

  dangerSoft: '#FCE1E6',
  dangerText: '#9F1239',

  // Aliases existants (compat)
  primary: '#6B2737',
  primaryForeground: '#FFFFFF',
  backgroundSoft: '#FAF7F2',

  // UI helpers
  placeholder: 'rgba(58,58,58,0.35)',
  disabled: 'rgba(58,58,58,0.28)',
  surfaceMuted: '#F3F1EE', // variante crème/gris très légère
  overlayDark: 'rgba(0,0,0,0.18)',
  hairline: 'rgba(58,58,58,0.08)',

  promo: '#22C55E',
  promoForeground: '#FFFFFF',
  shadowColor: '#000',
}

// Overlays (pour éviter rgba inline partout)
export const overlays = {
  white10: 'rgba(255,255,255,0.10)',
  white06: 'rgba(255,255,255,0.06)',

  premium30: 'rgba(212,175,106,0.30)',
  premium20: 'rgba(212,175,106,0.20)',
  premium10: 'rgba(212,175,106,0.10)',

  gold30: 'rgba(212,175,106,0.30)',   // ✅ alias
  gold20: 'rgba(212,175,106,0.20)',
  gold10: 'rgba(212,175,106,0.10)',

  brand30: 'rgba(107,39,55,0.30)',
  brand20: 'rgba(107,39,55,0.20)',
  brand10: 'rgba(107,39,55,0.10)',
  brand05: 'rgba(107,39,55,0.05)',
}

