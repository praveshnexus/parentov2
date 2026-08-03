import { PrismaClient, Role, DoctorStatus, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ── Admin ────────────────────────────────────────────────────
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
  console.log('✅ Admin created:', admin.email);

  // ── Demo Doctor ───────────────────────────────────────────────
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
      consultationFee: 50000, // ₹500 in paise
      licenseNumber: 'MCI-123456',
      status: DoctorStatus.VERIFIED,
      verifiedAt: new Date(),
      verifiedBy: admin.id,
      rating: 4.8,
      reviewCount: 47,
    },
  });
  console.log('✅ Doctor created:', doctorUser.email);

  // ── Demo Parent ───────────────────────────────────────────────
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

  // ── Demo Child ────────────────────────────────────────────────
  const existingChild = await prisma.child.findFirst({ where: { parentId: parent.id } });
  if (!existingChild) {
    const child = await prisma.child.create({
      data: {
        parentId: parent.id,
        name: 'Arjun',
        dateOfBirth: new Date('2023-01-15'),
        gender: Gender.MALE,
        bloodType: 'O+',
        allergies: ['peanuts'],
      },
    });

    // Seed growth records
    await prisma.growthRecord.createMany({
      data: [
        { childId: child.id, weight: 3.2, height: 50, headCirc: 34, bmi: 12.8, recordedAt: new Date('2023-01-20') },
        { childId: child.id, weight: 4.5, height: 55, headCirc: 37, bmi: 14.9, recordedAt: new Date('2023-03-15') },
        { childId: child.id, weight: 6.2, height: 62, headCirc: 40, bmi: 16.1, recordedAt: new Date('2023-06-10') },
        { childId: child.id, weight: 8.1, height: 69, headCirc: 43, bmi: 17.0, recordedAt: new Date('2023-09-05') },
        { childId: child.id, weight: 9.4, height: 74, headCirc: 45, bmi: 17.2, recordedAt: new Date('2023-12-01') },
        { childId: child.id, weight: 10.2, height: 78, headCirc: 46, bmi: 16.8, recordedAt: new Date('2024-03-10') },
      ],
    });

    // Seed vaccinations
    await prisma.vaccination.createMany({
      data: [
        { childId: child.id, name: 'BCG', scheduledDate: new Date('2023-01-20'), administeredAt: new Date('2023-01-20'), batchNumber: 'BCG2023A' },
        { childId: child.id, name: 'OPV-0', scheduledDate: new Date('2023-01-20'), administeredAt: new Date('2023-01-20') },
        { childId: child.id, name: 'Hepatitis B (1st)', scheduledDate: new Date('2023-01-20'), administeredAt: new Date('2023-01-20') },
        { childId: child.id, name: 'DTP (1st)', scheduledDate: new Date('2023-03-15'), administeredAt: new Date('2023-03-15') },
        { childId: child.id, name: 'OPV (1st)', scheduledDate: new Date('2023-03-15'), administeredAt: new Date('2023-03-15') },
        { childId: child.id, name: 'IPV (1st)', scheduledDate: new Date('2023-03-15'), administeredAt: new Date('2023-03-15') },
        { childId: child.id, name: 'DTP (2nd)', scheduledDate: new Date('2023-05-15') },
        { childId: child.id, name: 'MMR', scheduledDate: new Date('2024-01-15') },
      ],
    });

    // Seed milestones
    await prisma.milestone.createMany({
      data: [
        { childId: child.id, title: 'Holds head up', category: 'physical', ageMonth: 1, achieved: true, achievedAt: new Date('2023-02-15') },
        { childId: child.id, title: 'Social smile', category: 'social', ageMonth: 2, achieved: true, achievedAt: new Date('2023-03-20') },
        { childId: child.id, title: 'Rolls over', category: 'physical', ageMonth: 4, achieved: true, achievedAt: new Date('2023-05-10') },
        { childId: child.id, title: 'Sits without support', category: 'physical', ageMonth: 6, achieved: true, achievedAt: new Date('2023-07-15') },
        { childId: child.id, title: 'Crawls', category: 'physical', ageMonth: 8, achieved: true, achievedAt: new Date('2023-09-20') },
        { childId: child.id, title: 'Says mama/dada', category: 'language', ageMonth: 8, achieved: true, achievedAt: new Date('2023-10-01') },
        { childId: child.id, title: 'Stands with support', category: 'physical', ageMonth: 9, achieved: false },
        { childId: child.id, title: 'Walks independently', category: 'physical', ageMonth: 12, achieved: false },
        { childId: child.id, title: 'First word', category: 'language', ageMonth: 12, achieved: false },
        { childId: child.id, title: 'Object permanence', category: 'cognitive', ageMonth: 8, achieved: true, achievedAt: new Date('2023-09-15') },
        { childId: child.id, title: 'Pretend play', category: 'cognitive', ageMonth: 18, achieved: false },
        { childId: child.id, title: 'Parallel play', category: 'social', ageMonth: 18, achieved: false },
      ],
    });

    console.log('✅ Child Arjun created with health records');
  }

  // ── Sample Posts ──────────────────────────────────────────────
  const existingPosts = await prisma.post.count({ where: { authorId: parent.id } });
  if (existingPosts === 0) {
    await prisma.post.createMany({
      data: [
        {
          authorId: parent.id,
          content: 'Arjun took his first steps today! 🎉 Such an amazing milestone. Any tips for encouraging more walking practice? #toddlerlife #milestones #firststeps',
          hashtags: ['#toddlerlife', '#milestones', '#firststeps'],
          likesCount: 12,
          commentsCount: 4,
        },
        {
          authorId: parent.id,
          content: 'Sleep regression hit us hard this week 😩 Our 14-month-old was sleeping through the night and now wakes up 3-4 times. This too shall pass! #babysleep #parentinglife #sleepregression',
          hashtags: ['#babysleep', '#parentinglife', '#sleepregression'],
          likesCount: 28,
          commentsCount: 15,
        },
        {
          authorId: parent.id,
          content: 'Had a wonderful consultation with Dr. Priya on Parento! She gave such detailed advice about introducing solids. Highly recommend booking through the app 💙 #pediatrician #babyfood #solidfoods',
          hashtags: ['#pediatrician', '#babyfood', '#solidfoods'],
          likesCount: 9,
          commentsCount: 2,
        },
      ],
    });
    console.log('✅ Sample posts created');
  }

  console.log('\n🎉 Seeding complete!\n');
  console.log('Test accounts:');
  console.log('  Admin:  admin@parento.com  / Admin@123');
  console.log('  Doctor: doctor@parento.com / Doctor@123');
  console.log('  Parent: parent@parento.com / Parent@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
