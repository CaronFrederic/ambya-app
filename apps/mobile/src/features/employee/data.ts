export type EmployeeAppointmentStatus = 'upcoming' | 'completed'
export type LeaveStatus = 'pending' | 'approved'
export type EmployeeServiceKind = 'hair' | 'fitness' | 'wellness'

export type ClientInsightSection = {
  title: string
  items: string[]
}

export type EmployeeAppointment = {
  id: string
  clientName: string
  service: string
  date: string
  time: string
  duration: string
  status: EmployeeAppointmentStatus
  paid: boolean
  serviceKind: EmployeeServiceKind
  priceLabel: string
  note?: string
  rating?: number
  clientInsights: ClientInsightSection[]
}

export type AvailableSlot = {
  id: string
  service: string
  date: string
  time: string
}

export type LeaveRequest = {
  id: string
  title: string
  period: string
  duration: string
  status: LeaveStatus
}

export type EmployeeProfile = {
  firstName: string
  lastName: string
  role: string
  salon: string
  email: string
  phone: string
}

export type BlockedSlot = {
  id: string
  date: string
  time: string
  service: string
  clientName: string
  phone: string
  note?: string
}

export const initialEmployeeProfile: EmployeeProfile = {
  firstName: 'Marie',
  lastName: 'Kouassi',
  role: 'Coiffeuse',
  salon: 'Salon Elegance',
  email: 'marie.kouassi@example.com',
  phone: '+241 XX XX XX XX',
}

export const initialEmployeeAppointments: EmployeeAppointment[] = [
  {
    id: 'apt-1',
    clientName: 'Fatou Diallo',
    service: 'Coupe + Brushing',
    date: '28/01/2026',
    time: '09:00',
    duration: '1h',
    status: 'upcoming',
    paid: false,
    serviceKind: 'hair',
    priceLabel: '18 000 FCFA',
    note: 'Cliente prefere un brushing souple.',
    clientInsights: [
      {
        title: 'Profil cheveux',
        items: ['Cheveux boucles', 'Longueur mi-longue', 'Sensibilite au cuir chevelu'],
      },
      {
        title: 'Habitudes',
        items: ['Evite la chaleur forte', 'Souhaite un rendu rapide a entretenir'],
      },
    ],
  },
  {
    id: 'apt-2',
    clientName: 'Aminata Sow',
    service: 'Tresses',
    date: '28/01/2026',
    time: '10:30',
    duration: '2h',
    status: 'upcoming',
    paid: false,
    serviceKind: 'hair',
    priceLabel: '25 000 FCFA',
    note: 'Apporter des rajouts bruns.',
    clientInsights: [
      {
        title: 'Profil cheveux',
        items: ['Cheveux crepus', 'Densite forte', 'Prefere une tension legere'],
      },
      {
        title: 'Preferences',
        items: ['Tresses mi-longues', 'Pas de produits parfumes'],
      },
    ],
  },
  {
    id: 'apt-3',
    clientName: 'Nadia Bongo',
    service: 'Coloration',
    date: '27/01/2026',
    time: '14:00',
    duration: '1h30',
    status: 'completed',
    paid: true,
    serviceKind: 'hair',
    priceLabel: '32 000 FCFA',
    rating: 5,
    clientInsights: [
      {
        title: 'Profil cheveux',
        items: ['Cheveux fins', 'Coloration precedente il y a 3 mois', 'Cuir chevelu sensible'],
      },
    ],
  },
  {
    id: 'apt-4',
    clientName: 'Sophie Mbongo',
    service: 'Coaching fitness',
    date: '27/01/2026',
    time: '16:00',
    duration: '1h',
    status: 'completed',
    paid: false,
    serviceKind: 'fitness',
    priceLabel: '20 000 FCFA',
    rating: 4,
    clientInsights: [
      {
        title: 'Bien-etre',
        items: ['Sommeil irregulier', 'Stress modere', 'Souhaite reprendre une routine'],
      },
      {
        title: 'Fitness',
        items: ['Objectif tonification', 'Niveau intermediaire', 'Douleur legere au genou droit'],
      },
    ],
  },
]

export const initialAvailableSlots: AvailableSlot[] = [
  {
    id: 'slot-1',
    service: 'Coupe',
    date: '29/01/2026',
    time: '11:00',
  },
  {
    id: 'slot-2',
    service: 'Brushing',
    date: '29/01/2026',
    time: '15:30',
  },
  {
    id: 'slot-3',
    service: 'Soin capillaire',
    date: '30/01/2026',
    time: '09:30',
  },
]

export const initialLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-1',
    title: 'Conges annuels',
    period: '10/02/2026 - 14/02/2026',
    duration: '5 jours',
    status: 'pending',
  },
  {
    id: 'leave-2',
    title: 'Evenement familial',
    period: '15/01/2026 - 16/01/2026',
    duration: '2 jours',
    status: 'approved',
  },
]

export const services = [
  'Coupe',
  'Coupe + Brushing',
  'Tresses',
  'Coloration',
  'Balayage',
  'Lissage',
  'Soin capillaire',
  'Soins capillaires',
  'Brushing',
  'Coaching fitness',
]
