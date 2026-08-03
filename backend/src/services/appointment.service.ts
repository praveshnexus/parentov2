import { prisma } from '../config/prisma';
import { NotFoundError, ForbiddenError, ConflictError, AppError } from '../utils/errors';
import { sendEmail, emailTemplates } from '../utils/email';
import { NotificationService } from './notification.service';
import { AppointmentMode, AppointmentStatus } from '@prisma/client';

export const AppointmentService = {
  async bookAppointment(patientId: string, data: {
    doctorId: string;
    scheduledAt: Date;
    mode: AppointmentMode;
    reason?: string;
    durationMinutes?: number;
  }) {
    // Check doctor exists and is verified
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      include: { user: true },
    });
    if (!doctor || doctor.status !== 'VERIFIED') {
      throw new NotFoundError('Doctor');
    }

    const existingAppointment = await prisma.appointment.findFirst({
  where: {
    patientId,
    doctorId: data.doctorId,
    status: {
      in: ["PENDING", "CONFIRMED"],
    },
  },
});

if (existingAppointment) {
  throw new ConflictError(
    "You already have an active appointment with this doctor."
  );
}

    // Check no conflict
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        scheduledAt: {
          gte: new Date(data.scheduledAt.getTime() - 30 * 60 * 1000),
          lte: new Date(data.scheduledAt.getTime() + 30 * 60 * 1000),
        },
      },
    });
    if (conflict) throw new ConflictError('This time slot is not available');

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: data.doctorId,
        scheduledAt: data.scheduledAt,
        mode: data.mode,
        reason: data.reason,
        durationMinutes: data.durationMinutes ?? 30,
        amountPaid: doctor.consultationFee,
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        doctor: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      },
    });

    // Notify doctor
    await NotificationService.create({
      recipientId: doctor.userId,
      actorId: patientId,
      type: 'APPOINTMENT_BOOKED',
      title: 'New appointment request',
      body: `${appointment.patient.fullName} has booked an appointment`,
      data: { appointmentId: appointment.id },
    });

    return appointment;
  },

  async getAppointments(
  userId: string,
  role: string,
  status?: AppointmentStatus
) {
  const where: any = {};

  if (role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!doctor) return [];

    where.doctorId = doctor.id;
  } else if (role === "PARENT") {
    where.patientId = userId;
  }

  if (status) {
    where.status = status;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: {
      scheduledAt: "asc",
    },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          email: true,
        },
      },
      doctor: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return appointments;
},

  async updateStatus(
    appointmentId: string,
    userId: string,
    userRole: string,
    status: AppointmentStatus,
    notes?: string
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });
    if (!appointment) throw new NotFoundError('Appointment');

    // Authorization: only doctor or admin can confirm/cancel
    const isDoctor = appointment.doctor.userId === userId;
    const isPatient = appointment.patientId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isDoctor && !isPatient && !isAdmin) throw new ForbiddenError();

    // State machine
    const validTransitions: Record<string, AppointmentStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['CANCELLED', 'COMPLETED', 'NO_SHOW'],
      CANCELLED: [],
      COMPLETED: [],
      NO_SHOW: [],
    };

    if (!validTransitions[appointment.status]?.includes(status)) {
      throw new AppError(`Cannot transition from ${appointment.status} to ${status}`, 400);
    }

    const updateData: any = { status, notes };
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });

    // Notify patient if doctor confirmed/cancelled
    // Notify patient if doctor confirmed/cancelled
if (status === "CONFIRMED" && isDoctor) {

  // Create conversation automatically
  const { MessageService } = await import("./message.service");

  await MessageService.getOrCreateConversation(
    appointment.patientId,
    appointment.doctor.userId
  );

  const dateStr = appointment.scheduledAt.toLocaleString();

  await sendEmail({
    to: appointment.patient.email,
    subject: "Appointment Confirmed",
    html: emailTemplates.appointmentConfirmed(
      appointment.patient.fullName,
      appointment.doctor.user.fullName,
      dateStr
    ),
  });

  await NotificationService.create({
    recipientId: appointment.patientId,
    actorId: userId,
    type: "APPOINTMENT_CONFIRMED",
    title: "Appointment confirmed",
    body: `Your appointment on ${dateStr} is confirmed`,
    data: { appointmentId },
  });
}

    return updated;
  },
};
