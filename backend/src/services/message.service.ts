import { prisma } from '../config/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';

export const MessageService = {
  async getConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
        },
      },
    });
  },

  async getOrCreateConversation(userId: string, otherUserId: string) {
    // Check if conversation already exists between these two users
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        },
      },
    });

    if (existing) return existing;

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        },
      },
    });

    return conversation;
  },
async getConversationByAppointment(
  appointmentId: string,
  userId: string
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new NotFoundError("Appointment");
  }

  if (
    appointment.patientId !== userId &&
    appointment.doctor.userId !== userId
  ) {
    throw new ForbiddenError();
  }

  if (appointment.status !== "CONFIRMED") {
    throw new ForbiddenError("Appointment is not confirmed yet.");
  }

  return this.getOrCreateConversation(
    appointment.patientId,
    appointment.doctor.userId
  );
},

  async getMessages(conversationId: string, userId: string, page: number, limit: number) {
    // Verify user is a participant
    const participant = await prisma.participant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenError();

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    // Update lastReadAt for participant
    await prisma.participant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    return { messages, total };
  },

  async sendMessage(conversationId: string, senderId: string, content: string) {
    // Verify sender is a participant
    const participant = await prisma.participant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!participant) throw new ForbiddenError();

    const message = await prisma.message.create({
      data: { conversationId, senderId, content },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    // Update conversation lastMessage
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessage: content, lastMessageAt: new Date() },
    });

    // Emit to all participants in room via Socket.io
    try {
      const { io } = await import('../config/socket');
      if (io) {
        io.to(`conversation:${conversationId}`).emit('message', message);
      }
    } catch { /* socket not yet initialized */ }

    return message;
  },
};
