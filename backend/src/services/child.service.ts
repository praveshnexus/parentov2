import { prisma } from "../config/prisma";
import { NotFoundError, ForbiddenError } from "../utils/errors";
import { Gender } from "@prisma/client";

export const ChildService = {
  async getChildren(parentId: string) {
    return prisma.child.findMany({
      where: { parentId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { growthRecords: true, vaccinations: true, milestones: true },
        },
      },
    });
  },

  async getChild(parentId: string, childId: string) {
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        growthRecords: { orderBy: { recordedAt: "desc" }, take: 20 },
        vaccinations: { orderBy: { scheduledDate: "asc" } },
        milestones: { orderBy: { ageMonth: "asc" } },
        medications: { where: { isActive: true } },
      },
    });
    if (!child) throw new NotFoundError("Child");
    if (child.parentId !== parentId) throw new ForbiddenError();
    return child;
  },

  async createChild(
    parentId: string,
    data: {
      name: string;
      dateOfBirth: Date;
      gender: Gender;
      bloodType?: string;
      allergies?: string[];
    },
  ) {
    const child = await prisma.child.create({
      data: { parentId, ...data, allergies: data.allergies ?? [] },
    });

    // Auto-create standard milestones
    await ChildService._seedMilestones(child.id);
    return child;
  },

  async updateChild(
    parentId: string,
    childId: string,
    data: Partial<{
      name: string;
      dateOfBirth: string | Date;
      gender: Gender;
      bloodType: string;
      allergies: string[];
      photoUrl: string;
    }>,
  ) {
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) throw new NotFoundError("Child");
    if (child.parentId !== parentId) throw new ForbiddenError();
    return prisma.child.update({
      where: { id: childId },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });
  },

  async deleteChild(parentId: string, childId: string) {
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) throw new NotFoundError("Child");
    if (child.parentId !== parentId) throw new ForbiddenError();
    await prisma.child.delete({ where: { id: childId } });
  },

  // Growth Records
  async addGrowthRecord(
    parentId: string,
    childId: string,
    data: {
      weight?: number;
      height?: number;
      headCirc?: number;
      notes?: string;
    },
  ) {
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== parentId) throw new ForbiddenError();

    const bmi =
      data.weight && data.height
        ? data.weight / Math.pow(data.height / 100, 2)
        : undefined;

    return prisma.growthRecord.create({
      data: { childId, ...data, bmi },
    });
  },

  async getGrowthRecords(parentId: string, childId: string) {
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== parentId) throw new ForbiddenError();
    return prisma.growthRecord.findMany({
      where: { childId },
      orderBy: { recordedAt: "asc" },
    });
  },

  // Vaccinations
  async getVaccinations(parentId: string, childId: string) {
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== parentId) throw new ForbiddenError();
    return prisma.vaccination.findMany({
      where: { childId },
      orderBy: { scheduledDate: "asc" },
    });
  },

  async addVaccination(
    parentId: string,
    childId: string,
    data: {
      name: string;
      scheduledDate: Date;
      administeredAt?: Date;
      batchNumber?: string;
      notes?: string;
    },
  ) {
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== parentId) throw new ForbiddenError();
    return prisma.vaccination.create({ data: { childId, ...data } });
  },

  // Milestones
  async getMilestones(parentId: string, childId: string) {
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== parentId) throw new ForbiddenError();
    return prisma.milestone.findMany({
      where: { childId },
      orderBy: [{ category: "asc" }, { ageMonth: "asc" }],
    });
  },

  async toggleMilestone(
    parentId: string,
    childId: string,
    milestoneId: string,
  ) {
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child || child.parentId !== parentId) throw new ForbiddenError();
    const m = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!m) throw new NotFoundError("Milestone");
    return prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        achieved: !m.achieved,
        achievedAt: !m.achieved ? new Date() : null,
      },
    });
  },

  async _seedMilestones(childId: string) {
    const milestones = [
      // Physical
      { title: "Holds head up", category: "physical", ageMonth: 1 },
      { title: "Rolls over", category: "physical", ageMonth: 4 },
      { title: "Sits without support", category: "physical", ageMonth: 6 },
      { title: "Crawls", category: "physical", ageMonth: 8 },
      { title: "Stands with support", category: "physical", ageMonth: 9 },
      { title: "Walks independently", category: "physical", ageMonth: 12 },
      { title: "Runs", category: "physical", ageMonth: 18 },
      { title: "Jumps", category: "physical", ageMonth: 24 },
      // Cognitive
      { title: "Tracks moving objects", category: "cognitive", ageMonth: 2 },
      {
        title: "Recognizes familiar faces",
        category: "cognitive",
        ageMonth: 3,
      },
      { title: "Explores objects", category: "cognitive", ageMonth: 6 },
      { title: "Object permanence", category: "cognitive", ageMonth: 8 },
      { title: "Solves simple problems", category: "cognitive", ageMonth: 12 },
      { title: "Pretend play", category: "cognitive", ageMonth: 18 },
      // Social
      { title: "Social smile", category: "social", ageMonth: 2 },
      { title: "Laughs", category: "social", ageMonth: 4 },
      { title: "Responds to name", category: "social", ageMonth: 6 },
      { title: "Waves bye-bye", category: "social", ageMonth: 9 },
      { title: "Parallel play", category: "social", ageMonth: 18 },
      { title: "Cooperative play", category: "social", ageMonth: 36 },
      // Language
      { title: "Coos", category: "language", ageMonth: 2 },
      { title: "Babbles", category: "language", ageMonth: 4 },
      { title: "Says mama/dada", category: "language", ageMonth: 8 },
      { title: "First word", category: "language", ageMonth: 12 },
      { title: "10 words vocabulary", category: "language", ageMonth: 18 },
      { title: "50 words vocabulary", category: "language", ageMonth: 24 },
      { title: "Simple sentences", category: "language", ageMonth: 24 },
    ];

    await prisma.milestone.createMany({
      data: milestones.map((m) => ({ ...m, childId })),
    });
  },
};
