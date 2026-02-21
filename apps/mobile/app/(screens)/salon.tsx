// app/(tabs)/salon.tsx
import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import { Screen, TabPill, IconBubble, ReviewCard } from '../../src/components'
import { colors, overlays } from '../../src/theme/colors'
import { spacing } from '../../src/theme/spacing'
import { radius } from '../../src/theme/radius'
import { typography } from '../../src/theme/typography'
import { useBooking } from '../../src/providers/BookingProvider'

type TabKey = 'about' | 'services' | 'reviews'
type Service = { id: string; name: string; price: number; duration: number }
type CartItem = { id: string; name: string; price: number; duration?: number; quantity: number }

export default function SalonDetailScreen() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(4)
  const [activeTab, setActiveTab] = useState<TabKey>('about')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const { setCart: setBookingCart, patch } = useBooking()

  const galleryPhotos = useMemo(
    () => [
      {
        url: 'https://images.unsplash.com/photo-1681965823525-b684fb97e9fe?auto=format&fit=crop&w=1080&q=80',
        caption: 'Intérieur du salon',
      },
      {
        url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1080&q=80',
        caption: 'Coupe & Brushing',
      },
      {
        url: 'https://images.unsplash.com/photo-1712213396688-c6f2d536671f?auto=format&fit=crop&w=1080&q=80',
        caption: 'Coloration professionnelle',
      },
      {
        url: 'https://images.unsplash.com/photo-1659036354224-48dd0a9a6b86?auto=format&fit=crop&w=1080&q=80',
        caption: 'Coupe précise',
      },
      {
        url: 'https://images.unsplash.com/photo-1711274094763-ff442e4719ef?auto=format&fit=crop&w=1080&q=80',
        caption: 'Manucure & Beauté des mains',
      },
    ],
    []
  )

  const servicesByCategory: Record<string, Service[]> = useMemo(
    () => ({
      Manucure: [
        { id: '1', name: 'Manucure simple', price: 8000, duration: 30 },
        { id: '2', name: 'Manucure + vernis semi-permanent', price: 12000, duration: 45 },
        { id: '3', name: 'Extension ongles', price: 18000, duration: 90 },
      ],
      Pédicure: [
        { id: '4', name: 'Pédicure simple', price: 10000, duration: 40 },
        { id: '5', name: 'Pédicure spa', price: 15000, duration: 60 },
      ],
      Massage: [
        { id: '6', name: 'Massage relaxant', price: 25000, duration: 60 },
        { id: '7', name: 'Massage deep tissue', price: 35000, duration: 90 },
      ],
      'Soin du visage': [
        { id: '8', name: 'Nettoyage de peau', price: 20000, duration: 45 },
        { id: '9', name: 'Soin anti-âge', price: 30000, duration: 60 },
      ],
    }),
    []
  )

  const schedule = useMemo(
    () => [
      { day: 'Lundi', hours: '08:00 - 18:00' },
      { day: 'Mardi', hours: '08:00 - 18:00' },
      { day: 'Mercredi', hours: '08:00 - 18:00' },
      { day: 'Jeudi', hours: '08:00 - 18:00' },
      { day: 'Vendredi', hours: '08:00 - 19:00' },
      { day: 'Samedi', hours: '09:00 - 17:00' },
      { day: 'Dimanche', hours: 'Fermé' },
    ],
    []
  )

  const photo = galleryPhotos[currentPhotoIndex]

  const nextPhoto = () => setCurrentPhotoIndex((p) => (p + 1) % galleryPhotos.length)
  const prevPhoto = () => setCurrentPhotoIndex((p) => (p - 1 + galleryPhotos.length) % galleryPhotos.length)

  const addToCart = (service: Service) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === service.id)
      if (!found) {
        return [
          ...prev,
          {
            id: service.id,
            name: service.name,
            price: service.price,
            duration: service.duration,
            quantity: 1,
          },
        ]
      }
      return prev.map((x) => (x.id === service.id ? { ...x, quantity: x.quantity + 1 } : x))
    })
  }

  const removeFromCart = (serviceId: string) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === serviceId)
      if (!found) return prev
      if (found.quantity <= 1) return prev.filter((x) => x.id !== serviceId)
      return prev.map((x) => (x.id === serviceId ? { ...x, quantity: x.quantity - 1 } : x))
    })
  }

  const totalItems = cart.reduce((sum, x) => sum + x.quantity, 0)
  const totalPrice = cart.reduce((sum, x) => sum + x.price * x.quantity, 0)

  return (
    <Screen noPadding style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* GALLERY */}
        <View style={styles.galleryWrap}>
          <Image source={{ uri: photo.url }} style={styles.heroImage} />

          {/* Open badge */}
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>Ouvert</Text>
          </View>

          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.heroBtnLeft}>
            <Ionicons name="arrow-back" size={18} color={colors.brand} />
          </Pressable>

          {/* Camera */}
          <Pressable onPress={() => {}} style={styles.heroBtnRight}>
            <Ionicons name="camera-outline" size={18} color={colors.brand} />
          </Pressable>

          {/* arrows */}
          <Pressable onPress={prevPhoto} style={styles.heroArrowLeft}>
            <Ionicons name="chevron-back" size={18} color={colors.brand} />
          </Pressable>
          <Pressable onPress={nextPhoto} style={styles.heroArrowRight}>
            <Ionicons name="chevron-forward" size={18} color={colors.brand} />
          </Pressable>

          {/* caption + counter */}
          <LinearGradient
            colors={['rgba(0,0,0,0.70)', 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.heroCaption}
          >
            <Text style={styles.captionText} numberOfLines={1}>
              {photo.caption}
            </Text>
            <Text style={styles.counterText}>
              {currentPhotoIndex + 1} / {galleryPhotos.length}
            </Text>
          </LinearGradient>
        </View>

        {/* THUMBNAILS */}
        <View style={styles.thumbBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
            {galleryPhotos.map((p, idx) => {
              const active = idx === currentPhotoIndex
              return (
                <Pressable
                  key={idx}
                  onPress={() => setCurrentPhotoIndex(idx)}
                  style={[styles.thumb, active ? styles.thumbOn : styles.thumbOff]}
                >
                  <Image source={{ uri: p.url }} style={styles.thumbImg} />
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {/* SALON INFO */}
        <View style={styles.infoCard}>
          <Text style={styles.salonTitle}>Salon Élégance</Text>

          <View style={styles.ratingRow}>
            <View style={styles.ratingLeft}>
              <Ionicons name="star" size={14} color={colors.premium} />
              <Text style={styles.ratingText}>4.8 (120+)</Text>
            </View>

            <View style={styles.socialRow}>
              <IconBubble name="logo-instagram" onPress={() => {}} />
              <IconBubble name="logo-facebook" onPress={() => {}} />
              <IconBubble name="logo-tiktok" onPress={() => {}} />
              <IconBubble name="globe-outline" onPress={() => {}} />
            </View>
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={colors.premium} />
            <Text style={styles.addressText} numberOfLines={2}>
              123 Boulevard de l&apos;Indépendance, Libreville
            </Text>
          </View>
        </View>

        {/* TABS PILLS */}
        <View style={styles.tabsWrap}>
          <View style={styles.tabsRow}>
            <TabPill label="À propos" active={activeTab === 'about'} onPress={() => setActiveTab('about')} />
            <TabPill label="Services" active={activeTab === 'services'} onPress={() => setActiveTab('services')} />
            <TabPill label="Avis clients" active={activeTab === 'reviews'} onPress={() => setActiveTab('reviews')} />
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.body}>
          {activeTab === 'about' && (
            <View style={{ gap: spacing.lg }}>
              <View>
                <Text style={styles.blockTitle}>Description du salon</Text>
                <Text style={styles.paragraph}>
                  Salon premium spécialisé en coiffure afro et européenne. Notre équipe de professionnels qualifiés vous accueille dans un cadre élégant et chaleureux.
                </Text>
              </View>

              <View>
                <Text style={styles.blockTitle}>Horaires d'ouverture</Text>
                <View style={styles.whiteBox}>
                  {schedule.map((d, idx) => (
                    <View key={idx} style={styles.scheduleRow}>
                      <Text style={styles.scheduleDay}>{d.day}</Text>
                      <Text style={[styles.scheduleHours, d.hours === 'Fermé' && styles.scheduleClosed]}>
                        {d.hours}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <Text style={styles.blockTitle}>Conditions</Text>
                <View style={styles.whiteBox}>
                  <Text style={styles.bullet}>• Paiement : Espèces, Mobile Money, Carte bancaire</Text>
                  <Text style={styles.bullet}>• Annulation gratuite jusqu’à 24h avant</Text>
                  <Text style={styles.bullet}>• Retard de plus de 15 min = annulation automatique</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'services' && (
            <View style={{ gap: spacing.md }}>
              {Object.entries(servicesByCategory).map(([category, services]) => {
                const expanded = expandedCategory === category
                return (
                  <View key={category} style={styles.accordion}>
                    <Pressable
                      onPress={() => setExpandedCategory(expanded ? null : category)}
                      style={styles.accordionHeader}
                    >
                      <Text style={styles.accordionTitle}>{category}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.brand}
                        style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
                      />
                    </Pressable>

                    {expanded && (
                      <View style={styles.accordionBody}>
                        {services.map((s) => {
                          const qty = cart.find((x) => x.id === s.id)?.quantity ?? 0
                          return (
                            <View key={s.id} style={styles.serviceRow}>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={styles.serviceName} numberOfLines={2}>
                                  {s.name}
                                </Text>
                                <Text style={styles.serviceMeta}>Durée : {s.duration} min</Text>
                                <Text style={styles.servicePrice}>{formatFCFA(s.price)}</Text>
                              </View>

                              <View style={styles.qtyWrap}>
                                {qty > 0 && (
                                  <>
                                    <Pressable onPress={() => removeFromCart(s.id)} style={styles.qtyBtnGhost}>
                                      <Text style={styles.qtyBtnGhostText}>−</Text>
                                    </Pressable>
                                    <Text style={styles.qtyText}>{qty}</Text>
                                  </>
                                )}

                                <Pressable onPress={() => addToCart(s)} style={styles.qtyBtn}>
                                  <Ionicons name="add" size={16} color={colors.brandForeground} />
                                </Pressable>
                              </View>
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={{ gap: spacing.md }}>
              <ReviewCard name="Marie K." stars={4} text="Très beau salon, ambiance agréable." />
              <ReviewCard name="Sarah M." stars={5} text="Excellent service ! L'équipe est très professionnelle." />
              <ReviewCard name="Julie D." stars={5} text="Accueil chaleureux, services de qualité. Je recommande !" />
            </View>
          )}
        </View>
      </ScrollView>

      {/* CART BAR */}
      {totalItems > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartSmall}>
              {totalItems} service{totalItems > 1 ? 's' : ''}
            </Text>
            <Text style={styles.cartTotal}>{formatFCFA(totalPrice)}</Text>
          </View>

          <Pressable
            onPress={() => {
              setBookingCart(cart)
              patch({ salonId: 'salon-elegance', salonName: 'Salon Élégance' })
              router.push('/(screens)/recap')
            }}
            style={styles.cartCta}
          >
            <Text style={styles.cartCtaText}>Voir le récap</Text>
          </Pressable>

        </View>
      )}
    </Screen>
  )
}

function formatFCFA(v: number) {
  return `${v.toLocaleString('fr-FR')} FCFA`
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },

  galleryWrap: {
    height: 260,
    backgroundColor: '#000',
  },
  heroImage: { width: '100%', height: '100%' },

  openBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: '#22C55E',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  openBadgeText: { color: '#fff', ...typography.small, fontWeight: '600' },

  heroBtnLeft: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.90)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnRight: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.90)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroArrowLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArrowRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  captionText: { color: '#fff', ...typography.small, fontWeight: '600', flex: 1, marginRight: spacing.md },
  counterText: { color: 'rgba(255,255,255,0.80)', ...typography.small },

  thumbBar: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumbRow: { gap: spacing.sm },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
  },
  thumbOn: { borderColor: colors.brand },
  thumbOff: { borderColor: 'rgba(58,58,58,0.10)', opacity: 0.65 },
  thumbImg: { width: '100%', height: '100%' },

  infoCard: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  salonTitle: { color: colors.text, ...typography.h2, marginBottom: spacing.sm },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  ratingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingText: { color: colors.text, ...typography.small, fontWeight: '500' },

  socialRow: { flexDirection: 'row', gap: spacing.sm },

  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addressText: { color: colors.text, ...typography.small, flex: 1 },

  tabsWrap: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107,39,55,0.10)',
  },
  tabsRow: { flexDirection: 'row', gap: spacing.sm },

  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },

  blockTitle: { color: colors.text, ...typography.h3, marginBottom: spacing.sm },
  paragraph: { color: 'rgba(58,58,58,0.80)', ...typography.body, lineHeight: 20 },

  whiteBox: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: spacing.sm,
  },

  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleDay: { color: colors.text, ...typography.small },
  scheduleHours: { color: colors.brand, ...typography.small, fontWeight: '600' },
  scheduleClosed: { color: '#DC2626' },

  bullet: { color: 'rgba(58,58,58,0.80)', ...typography.small, lineHeight: 18 },

  accordion: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  accordionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionTitle: { color: colors.text, ...typography.body, fontWeight: '600' },

  accordionBody: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(107,39,55,0.10)',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  serviceRow: {
    paddingTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  serviceName: { color: colors.text, ...typography.small, fontWeight: '600' },
  serviceMeta: { color: colors.textMuted, ...typography.small, marginTop: 2 },
  servicePrice: { color: colors.brand, ...typography.small, fontWeight: '700', marginTop: 6 },

  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnGhost: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: overlays.brand20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnGhostText: { color: colors.brand, fontSize: 18, fontWeight: '800', marginTop: -1 },
  qtyText: { width: 22, textAlign: 'center', color: colors.text, ...typography.small, fontWeight: '700' },

  cartBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cartSmall: { color: 'rgba(255,255,255,0.80)', ...typography.small },
  cartTotal: { color: colors.brandForeground, ...typography.h3, fontWeight: '800' },

  cartCta: {
    backgroundColor: colors.premium,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  cartCtaText: { color: colors.brand, ...typography.small, fontWeight: '800' },
})
