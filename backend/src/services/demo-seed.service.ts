import { Role, DoctorStatus, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import vaccineSchedule from '../data/knowledge/vaccination-schedule.json';
import whoGrowth from '../data/knowledge/who-growth-standards.json';
import { ChildService } from './child.service';

export function isDummyEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  const dummyDomains = [
    '@parento.com',
    '@example.com',
    '@test.com',
    '@dummy.com',
    '@demo.com',
    '@sample.com',
    '@mailinator.com',
  ];

  if (dummyDomains.some((d) => lower.endsWith(d))) return true;
  if (/^(demo|dummy|guest|test|sample)[._-]?/i.test(lower)) return true;
  if (['parent', 'doctor', 'admin', 'guest', 'dummy'].includes(lower)) return true;

  return false;
}

export function normalizeLoginEmail(email: string): string {
  const lower = email.trim().toLowerCase();
  if (lower === 'parent') return 'parent@parento.com';
  if (lower === 'doctor') return 'doctor@parento.com';
  if (lower === 'admin') return 'admin@parento.com';
  if (lower === 'guest' || lower === 'dummy') return 'guest@parento.com';
  return lower;
}

type Lms = [number, number, number];
type GrowthZ = { weight: number; lengthHeight: number; headCircumference: number };

function whoValue(indicator: keyof GrowthZ, gender: Gender, ageDays: number, z: number): number {
  const sex = gender === Gender.FEMALE ? 'FEMALE' : 'MALE';
  const table = (whoGrowth.indicators as unknown as Record<string, Record<string, Lms[]>>)[indicator][sex];
  const [l, m, s] = table[Math.min(ageDays, table.length - 1)];
  const v = l === 0 ? m * Math.exp(s * z) : m * Math.pow(1 + l * s * z, 1 / l);
  return Math.round(v * 10) / 10;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function seedDemoChild(
  parentId: string,
  opts: {
    name: string;
    gender: Gender;
    ageMonths: number;
    bloodType: string;
    allergies: string[];
    growthMonths: number[];
    growthZ: GrowthZ;
    skipLatestDueVaccines: boolean;
  },
) {
  const existing = await prisma.child.findFirst({ where: { parentId, name: opts.name } });
  if (existing) return;

  const today = new Date();
  const dob = addMonths(today, -opts.ageMonths);
  const child = await prisma.child.create({
    data: {
      parentId,
      name: opts.name,
      dateOfBirth: dob,
      gender: opts.gender,
      bloodType: opts.bloodType,
      allergies: opts.allergies,
    },
  });

  await prisma.growthRecord.createMany({
    data: opts.growthMonths.map((month) => {
      const recordedAt = addDays(addMonths(dob, month), month === 0 ? 2 : 0);
      const days = Math.round((recordedAt.getTime() - dob.getTime()) / (24 * 60 * 60 * 1000));
      const weight = whoValue('weight', opts.gender, days, opts.growthZ.weight);
      const height = whoValue('lengthHeight', opts.gender, days, opts.growthZ.lengthHeight);
      const headCirc = whoValue('headCircumference', opts.gender, days, opts.growthZ.headCircumference);
      return {
        childId: child.id,
        weight,
        height,
        headCirc,
        bmi: Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10,
        recordedAt,
      };
    }),
  });

  const ageWeeks = (today.getTime() - dob.getTime()) / (7 * 24 * 60 * 60 * 1000);
  const timed = (
    vaccineSchedule.schedule as {
      ageLabel: string;
      ageWeeks: number | null;
      vaccines: string[];
      catchUpOnly?: boolean;
    }[]
  ).filter(
    (s): s is { ageLabel: string; ageWeeks: number; vaccines: string[] } =>
      s.ageWeeks !== null && !s.catchUpOnly,
  );
  const due = timed.filter((s) => s.ageWeeks <= ageWeeks);
  const upcoming = timed.filter((s) => s.ageWeeks > ageWeeks).slice(0, 2);
  const skipped = opts.skipLatestDueVaccines ? due[due.length - 1] : undefined;

  const vaccinationRows = [
    ...due.flatMap((slot) => {
      const date = addDays(dob, slot.ageWeeks * 7);
      return slot.vaccines.map((name) => ({
        childId: child.id,
        name,
        scheduledDate: date,
        administeredAt: slot === skipped ? null : date,
      }));
    }),
    ...upcoming.flatMap((slot) =>
      slot.vaccines.map((name) => ({
        childId: child.id,
        name,
        scheduledDate: addDays(dob, slot.ageWeeks * 7),
        administeredAt: null,
      })),
    ),
  ];
  await prisma.vaccination.createMany({ data: vaccinationRows });

  await ChildService._seedMilestones(child.id);
  const milestones = await prisma.milestone.findMany({ where: { childId: child.id } });
  for (const m of milestones) {
    if (m.ageMonth <= opts.ageMonths - 1) {
      await prisma.milestone.update({
        where: { id: m.id },
        data: { achieved: true, achievedAt: addMonths(dob, m.ageMonth) },
      });
    }
  }
}

export async function ensureDemoAccounts(): Promise<void> {
  try {
    const hash = (pw: string) => bcrypt.hash(pw, 12);

    // Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@parento.com' },
      update: {},
      create: {
        email: 'admin@parento.com',
        password: await hash('Admin@123'),
        fullName: 'Parento Admin',
        role: Role.ADMIN,
        isEmailVerified: true,
      },
    });

    // Doctor
    const doctorUser = await prisma.user.upsert({
      where: { email: 'doctor@parento.com' },
      update: {},
      create: {
        email: 'doctor@parento.com',
        password: await hash('Doctor@123'),
        fullName: 'Dr. Priya Sharma',
        role: Role.DOCTOR,
        isEmailVerified: true,
        bio: 'Experienced pediatrician with 12 years of practice.',
      },
    });

    await prisma.doctor.upsert({
      where: { userId: doctorUser.id },
      update: {},
      create: {
        userId: doctorUser.id,
        specialty: 'Pediatrician',
        qualifications: 'MBBS, MD Pediatrics, PGPN',
        experience: 12,
        bio: 'Dedicated to providing compassionate care for children from newborn to adolescence.',
        location: 'Mumbai, Maharashtra',
        consultationFee: 50000,
        licenseNumber: 'MCI-123456',
        status: DoctorStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedBy: admin.id,
        rating: 4.8,
        reviewCount: 47,
      },
    });

    // Parent
    const parent = await prisma.user.upsert({
      where: { email: 'parent@parento.com' },
      update: {},
      create: {
        email: 'parent@parento.com',
        password: await hash('Parent@123'),
        fullName: 'Anjali Mehta',
        role: Role.PARENT,
        isEmailVerified: true,
        bio: 'Proud mom of two little ones. Love sharing parenting tips!',
      },
    });

    // Children
    await seedDemoChild(parent.id, {
      name: 'Arjun',
      gender: Gender.MALE,
      ageMonths: 14,
      bloodType: 'O+',
      allergies: ['peanuts'],
      growthMonths: [0, 2, 4, 6, 9, 12, 14],
      growthZ: { weight: -0.3, lengthHeight: -0.1, headCircumference: 0.2 },
      skipLatestDueVaccines: true,
    });

    await seedDemoChild(parent.id, {
      name: 'Anaya',
      gender: Gender.FEMALE,
      ageMonths: 50,
      bloodType: 'B+',
      allergies: [],
      growthMonths: [0, 6, 12, 18, 24, 36, 48],
      growthZ: { weight: 0.4, lengthHeight: 0.5, headCircumference: 0.1 },
      skipLatestDueVaccines: false,
    });

    // Sample posts
    const existingPosts = await prisma.post.count({ where: { authorId: parent.id } });
    if (existingPosts === 0) {
      await prisma.post.createMany({
        data: [
          {
            authorId: parent.id,
            content:
              'Arjun took his first steps today! 🎉 Such an amazing milestone. Any tips for encouraging more walking practice? #toddlerlife #milestones #firststeps',
            hashtags: ['#toddlerlife', '#milestones', '#firststeps'],
            likesCount: 12,
            commentsCount: 4,
          },
          {
            authorId: parent.id,
            content:
              'Sleep regression hit us hard this week 😩 Our 14-month-old was sleeping through the night and now wakes up 3-4 times. This too shall pass! #babysleep #parentinglife #sleepregression',
            hashtags: ['#babysleep', '#parentinglife', '#sleepregression'],
            likesCount: 28,
            commentsCount: 15,
          },
          {
            authorId: parent.id,
            content:
              'Had a wonderful consultation with Dr. Priya on Parento! She gave such detailed advice about introducing solids. Highly recommend booking through the app 💙 #pediatrician #babyfood #solidfoods',
            hashtags: ['#pediatrician', '#babyfood', '#solidfoods'],
            likesCount: 9,
            commentsCount: 2,
          },
        ],
      });
    }

    logger.info('✅ Demo accounts and data verified/seeded');
  } catch (err) {
    logger.warn('Failed to ensure demo accounts during boot/login:', err);
  }
}

export async function provisionDummyUser(email: string, passwordPlain: string) {
  const hash = await bcrypt.hash(passwordPlain || 'Parent@123', 12);
  const lower = email.trim().toLowerCase();
  const role = lower.includes('doctor')
    ? Role.DOCTOR
    : lower.includes('admin')
      ? Role.ADMIN
      : Role.PARENT;

  const rawName = lower.split('@')[0].replace(/[._-]/g, ' ');
  const fullName =
    rawName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Demo User';

  const user = await prisma.user.create({
    data: {
      email: lower,
      password: hash,
      fullName,
      role,
      isEmailVerified: true,
      isActive: true,
    },
  });

  if (role === Role.DOCTOR) {
    await prisma.doctor.create({
      data: {
        userId: user.id,
        specialty: 'General Pediatrics',
        qualifications: 'MBBS, MD',
        experience: 5,
        location: 'Demo Hospital',
        consultationFee: 50000,
        licenseNumber: `DEMO-${Date.now().toString().slice(-6)}`,
        status: DoctorStatus.VERIFIED,
        rating: 5.0,
        reviewCount: 5,
      },
    });
  }

  return user;
}

