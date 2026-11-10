import { prisma } from "../config/prisma";
import { NotFoundError, ForbiddenError } from "../utils/errors";
import { Gender } from "@prisma/client";
import cdcMilestones from "../data/knowledge/milestones.json";

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

  /**
   * Creates the standard milestone checklist for a new child from the official
   * CDC "Learn the Signs. Act Early." checklists (src/data/knowledge/milestones.json),
   * 2 months to 5 years, grouped as physical / cognitive / social / language.
   */
  async _seedMilestones(childId: string) {
    const milestones = cdcMilestones.ages.flatMap((band) =>
      (["physical", "cognitive", "social", "language"] as const).flatMap((category) =>
        band[category].map((title) => ({ title, category, ageMonth: band.ageMonth })),
      ),
    );

    await prisma.milestone.createMany({
      data: milestones.map((m) => ({ ...m, childId })),
    });
  },
};
