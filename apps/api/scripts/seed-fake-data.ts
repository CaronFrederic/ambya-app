import 'dotenv/config';
import {
  PrismaClient,
  AppointmentStatus,
  UserRole,
  Employee,
  Service,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing');
}

const SALON_COUNT = Number(process.env.FAKE_SALONS_COUNT ?? 8);
const EMPLOYEES_PER_SALON = Number(process.env.FAKE_EMPLOYEES_PER_SALON ?? 4);
const SERVICES_PER_SALON = Number(process.env.FAKE_SERVICES_PER_SALON ?? 8);
const APPOINTMENTS_PER_SALON = Number(
  process.env.FAKE_APPOINTMENTS_PER_SALON ?? 10,
);
const REVIEWS_PER_SALON = Number(process.env.FAKE_REVIEWS_PER_SALON ?? 5);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const cities = [
  'Libreville',
  'Port-Gentil',
  'Franceville',
  'Owendo',
  'Lambaréné',
];
const salonPrefixes = [
  'Élégance',
  'Belleza',
  'Glow',
  'Prestige',
  'Zen',
  'Nubia',
  'Aura',
  'Velvet',
];
const serviceCatalog = [
  { name: 'Coupe Femme', basePrice: 12000, durationMin: 45 },
  { name: 'Brushing', basePrice: 10000, durationMin: 40 },
  { name: 'Coloration', basePrice: 25000, durationMin: 90 },
  { name: 'Massage Relaxant', basePrice: 20000, durationMin: 60 },
  { name: 'Massage Deep Tissue', basePrice: 28000, durationMin: 90 },
  { name: 'Manucure', basePrice: 9000, durationMin: 35 },
  { name: 'Pédicure', basePrice: 11000, durationMin: 45 },
  { name: 'Soin du visage', basePrice: 18000, durationMin: 60 },
  { name: 'Maquillage Soirée', basePrice: 22000, durationMin: 70 },
  { name: 'Lissage', basePrice: 30000, durationMin: 120 },
];

const reviewComments = [
  "Excellent service ! L'équipe est très professionnelle.",
  'Très beau salon, ambiance agréable.',
  'Accueil chaleureux et prestation au top.',
  'Je recommande, résultat impeccable.',
  'Service rapide et personnel attentionné.',
  'Ponctuel et très propre, merci !',
];

const galleryImages = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=700&q=80',
];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitterPrice(price: number) {
  const factor = 0.85 + Math.random() * 0.4;
  return Math.max(3000, Math.round(price * factor));
}

function randomPastDate(daysBackMax: number) {
  const now = Date.now();
  const backMs = Math.floor(Math.random() * daysBackMax * 24 * 60 * 60 * 1000);
  return new Date(now - backMs);
}

function randomFutureDate(daysAheadMax: number) {
  const now = Date.now();
  const aheadMs = Math.floor(
    Math.random() * daysAheadMax * 24 * 60 * 60 * 1000,
  );
  return new Date(now + aheadMs);
}

function randomRating() {
  const values = [4, 4, 5, 5, 5, 3];
  return pick(values);
}

function socialLinksFromSalonName(salonName: string) {
  const slug =
    salonName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 20) || 'salon';
  return {
    instagram: `https://instagram.com/${slug}`,
    facebook: `https://facebook.com/${slug}`,
    tiktok: `https://tiktok.com/@${slug}`,
    website: `https://ambya.app/salons/${slug}`,
  };
}

function buildSalonMediaPayload(salonName: string) {
  return {
    coverImageUrl: galleryImages[0],
    galleryImageUrls: galleryImages,
    socialLinks: socialLinksFromSalonName(salonName),
  };
}

async function ensureReferenceCountries() {
  await prisma.country.upsert({
    where: { code: 'GA' },
    update: { name: 'Gabon', currency: 'FCFA', isActive: true },
    create: { code: 'GA', name: 'Gabon', currency: 'FCFA', isActive: true },
  });

  await prisma.country.upsert({
    where: { code: 'CD' },
    update: { name: 'RDC', currency: '$', isActive: true },
    create: { code: 'CD', name: 'RDC', currency: '$', isActive: true },
  });
}

async function ensureReviewClients(passwordHash: string) {
  const templates = [
    { email: 'reviewer1+fake@ambya.com', nickname: 'Sarah M.' },
    { email: 'reviewer2+fake@ambya.com', nickname: 'Marie K.' },
    { email: 'reviewer3+fake@ambya.com', nickname: 'Julie D.' },
  ];

  const clients = [] as Array<{ id: string; nickname: string }>;

  for (const tpl of templates) {
    const user = await prisma.user.upsert({
      where: { email: tpl.email },
      update: { password: passwordHash, role: UserRole.CLIENT, isActive: true },
      create: {
        email: tpl.email,
        password: passwordHash,
        role: UserRole.CLIENT,
      },
    });

    await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {
        nickname: tpl.nickname,
        gender: 'female',
        ageRange: '25-34',
        city: 'Libreville',
        country: 'Gabon',
      },
      create: {
        userId: user.id,
        nickname: tpl.nickname,
        gender: 'female',
        ageRange: '25-34',
        city: 'Libreville',
        country: 'Gabon',
      },
    });

    clients.push({ id: user.id, nickname: tpl.nickname });
  }

  return clients;
}

async function ensureSalonReviews(
  salonId: string,
  reviewClients: Array<{ id: string; nickname: string }>,
) {
  const existingCount = await prisma.salonReview.count({ where: { salonId } });
  if (existingCount > 0) return;

  for (let i = 0; i < REVIEWS_PER_SALON; i++) {
    const client = pick(reviewClients);
    await prisma.salonReview.create({
      data: {
        salonId,
        clientId: client.id,
        rating: randomRating(),
        comment: pick(reviewComments),
        createdAt: randomPastDate(90),
      },
    });
  }
}

async function backfillExistingSalons(
  reviewClients: Array<{ id: string; nickname: string }>,
) {
  const salons = await prisma.salon.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      coverImageUrl: true,
      galleryImageUrls: true,
      socialLinks: true,
    },
    take: 1000,
  });

  for (const salon of salons) {
    const media = buildSalonMediaPayload(salon.name);

    await prisma.salon.update({
      where: { id: salon.id },
      data: {
        coverImageUrl: salon.coverImageUrl ?? media.coverImageUrl,
        galleryImageUrls: Array.isArray(salon.galleryImageUrls)
          ? salon.galleryImageUrls
          : media.galleryImageUrls,
        socialLinks: salon.socialLinks ?? media.socialLinks,
      },
    });

    await ensureSalonReviews(salon.id, reviewClients);
  }
}

async function main() {
  console.log('🌱 Generating fake salons/services/employees ...');
  console.log(`- salons: ${SALON_COUNT}`);
  console.log(`- employees/salon: ${EMPLOYEES_PER_SALON}`);
  console.log(`- services/salon: ${SERVICES_PER_SALON}`);
  console.log(`- appointments/salon: ${APPOINTMENTS_PER_SALON}`);
  console.log(`- reviews/salon: ${REVIEWS_PER_SALON}`);

  await ensureReferenceCountries();

  const passwordHash = await bcrypt.hash('password123', 10);
  const runTag = Date.now();

  const demoClient = await prisma.user.upsert({
    where: { email: 'client+fake@ambya.com' },
    update: { password: passwordHash, role: UserRole.CLIENT, isActive: true },
    create: {
      email: 'client+fake@ambya.com',
      password: passwordHash,
      role: UserRole.CLIENT,
    },
  });

  const reviewClients = await ensureReviewClients(passwordHash);
  await backfillExistingSalons(reviewClients);

  for (let i = 0; i < SALON_COUNT; i++) {
    const ownerEmail = `pro+fake-${runTag}-${i}@ambya.com`;
    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        password: passwordHash,
        role: UserRole.PROFESSIONAL,
        isActive: true,
      },
    });

    const city = pick(cities);
    const salonName = `${pick(salonPrefixes)} Beauty #${i + 1}`;
    const salon = await prisma.salon.create({
      data: {
        name: salonName,
        description: `Salon premium spécialisé en coiffure afro et européenne. Notre équipe de professionnels qualifiés vous accueille dans un cadre élégant et chaleureux.`,
        address: `${10 + i} Boulevard de l'Indépendance`,
        city,
        country: 'Gabon',
        phone: `+241 77 00 ${String(10 + i).padStart(2, '0')}`,
        ...buildSalonMediaPayload(salonName),
        ownerId: owner.id,
      },
    });

    const employees: Employee[] = [];
    for (let e = 0; e < EMPLOYEES_PER_SALON; e++) {
      const employeeUser = await prisma.user.create({
        data: {
          email: `employee+fake-${runTag}-${i}-${e}@ambya.com`,
          password: passwordHash,
          role: UserRole.EMPLOYEE,
          isActive: true,
        },
      });

      const employee = await prisma.employee.create({
        data: {
          salonId: salon.id,
          userId: employeeUser.id,
          displayName: `Employé ${i + 1}-${e + 1}`,
          isActive: true,
        },
      });
      employees.push(employee);
    }

    const chosenServices = [...serviceCatalog]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(SERVICES_PER_SALON, serviceCatalog.length));

    const services: Service[] = [];
    for (const svc of chosenServices) {
      const service = await prisma.service.create({
        data: {
          salonId: salon.id,
          name: svc.name,
          description: `${svc.name} - service de démonstration`,
          price: jitterPrice(svc.basePrice),
          durationMin: svc.durationMin,
          isActive: true,
        },
      });
      services.push(service);
    }

    for (let a = 0; a < APPOINTMENTS_PER_SALON; a++) {
      const employee = pick(employees);
      const service = pick(services);
      const isPast = a < Math.floor(APPOINTMENTS_PER_SALON * 0.6);
      const startAt = isPast ? randomPastDate(60) : randomFutureDate(14);
      const endAt = new Date(startAt.getTime() + service.durationMin * 60_000);

      await prisma.appointment.create({
        data: {
          salonId: salon.id,
          clientId: demoClient.id,
          serviceId: service.id,
          employeeId: employee.id,
          status: isPast
            ? AppointmentStatus.COMPLETED
            : AppointmentStatus.PENDING,
          startAt,
          endAt,
          note: 'RDV généré automatiquement (seed fake)',
        },
      });
    }

    await ensureSalonReviews(salon.id, reviewClients);
  }

  console.log('✅ Fake data generation done');
  console.log(
    `Comptes pro créés: email pattern pro+fake-${runTag}-<index>@ambya.com`,
  );
  console.log('Mot de passe de test: password123');
}

main()
  .catch((error) => {
    console.error('❌ Fake data generation failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
