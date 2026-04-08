import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@fitbook.com" },
    update: {},
    create: {
      email: "admin@fitbook.com",
      name: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  })
  console.log("Admin user created:", admin.email)

  // Create customer user
  const customerPassword = await bcrypt.hash("customer123", 12)
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Maria Silva",
      phone: "+351912345678",
      passwordHash: customerPassword,
      role: "CUSTOMER",
    },
  })
  console.log("Customer created:", customer.email)

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: "Personal Training",
        description: "One-on-one session tailored to your fitness goals.",
        type: "PERSONAL",
        durationMinutes: 60,
        price: 5000, // €50
        maxParticipants: 1,
        color: "#3B82F6",
      },
    }),
    prisma.service.create({
      data: {
        name: "Yoga Class",
        description: "Group yoga session for all levels. Improve flexibility and mindfulness.",
        type: "CLASS",
        durationMinutes: 75,
        price: 2000, // €20
        maxParticipants: 15,
        color: "#10B981",
      },
    }),
    prisma.service.create({
      data: {
        name: "HIIT Circuit",
        description: "High-intensity interval training to boost cardio and burn fat.",
        type: "CLASS",
        durationMinutes: 45,
        price: 1500, // €15
        maxParticipants: 20,
        color: "#EF4444",
      },
    }),
    prisma.service.create({
      data: {
        name: "Strength & Conditioning",
        description: "Build muscle and improve functional strength with compound movements.",
        type: "PERSONAL",
        durationMinutes: 90,
        price: 7000, // €70
        maxParticipants: 1,
        color: "#F59E0B",
      },
    }),
    prisma.service.create({
      data: {
        name: "Pilates",
        description: "Core-focused class improving posture, flexibility, and body awareness.",
        type: "CLASS",
        durationMinutes: 60,
        price: 1800, // €18
        maxParticipants: 12,
        color: "#8B5CF6",
      },
    }),
    prisma.service.create({
      data: {
        name: "Studio Rental",
        description: "Private studio space for your own workout or small group session.",
        type: "STUDIO",
        durationMinutes: 60,
        price: 3500, // €35
        maxParticipants: 1,
        color: "#6366F1",
      },
    }),
  ])
  console.log(`Created ${services.length} services`)

  // Create trainer users and profiles
  const trainersData = [
    {
      name: "Ana Costa",
      email: "ana@fitbook.com",
      bio: "Certified yoga instructor with 10 years of experience. Specializes in Vinyasa and Hatha yoga, with a focus on mindful movement and breathwork.",
      specialties: ["Yoga", "Pilates", "Meditation"],
      certifications: ["RYT-500", "ACE Group Fitness"],
      yearsExperience: 10,
      color: "#10B981",
      serviceNames: ["Yoga Class", "Pilates", "Personal Training"],
    },
    {
      name: "Pedro Santos",
      email: "pedro@fitbook.com",
      bio: "Former competitive athlete turned personal trainer. Expert in strength training, HIIT, and sports-specific conditioning.",
      specialties: ["Strength Training", "HIIT", "Sports Conditioning"],
      certifications: ["NSCA-CSCS", "NASM-CPT"],
      yearsExperience: 8,
      color: "#EF4444",
      serviceNames: ["Personal Training", "HIIT Circuit", "Strength & Conditioning"],
    },
    {
      name: "Sofia Oliveira",
      email: "sofia@fitbook.com",
      bio: "Holistic wellness coach combining movement, nutrition, and mindset work. Passionate about helping clients build sustainable healthy habits.",
      specialties: ["Pilates", "Functional Training", "Wellness Coaching"],
      certifications: ["PMA-CPT", "ACE Health Coach", "TRX Certified"],
      yearsExperience: 6,
      color: "#8B5CF6",
      serviceNames: ["Pilates", "Personal Training", "Yoga Class"],
    },
    {
      name: "Ricardo Ferreira",
      email: "ricardo@fitbook.com",
      bio: "High-energy trainer specializing in group fitness and fat loss programs. Known for motivating clients to push beyond their limits.",
      specialties: ["HIIT", "CrossFit", "Boxing"],
      certifications: ["CrossFit L2", "NASM-CPT", "Boxing Fitness Cert"],
      yearsExperience: 5,
      color: "#F59E0B",
      serviceNames: ["HIIT Circuit", "Personal Training", "Strength & Conditioning"],
    },
  ]

  for (const data of trainersData) {
    const password = await bcrypt.hash("trainer123", 12)
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        passwordHash: password,
        role: "TRAINER",
      },
    })

    const serviceIds = services
      .filter((s: { name: string }) => data.serviceNames.includes(s.name))
      .map((s: { id: string }) => s.id)

    await prisma.trainerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bio: data.bio,
        specialties: data.specialties,
        certifications: data.certifications,
        yearsExperience: data.yearsExperience,
        color: data.color,
        services: {
          create: serviceIds.map((serviceId: string) => ({ serviceId })),
        },
        // Monday to Friday, 8:00 - 18:00
        schedules: {
          create: [1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            startTime: "08:00",
            endTime: "18:00",
          })),
        },
      },
    })

    console.log(`Created trainer: ${data.name}`)
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
