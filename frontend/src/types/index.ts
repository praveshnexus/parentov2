export type Role = 'PARENT' | 'DOCTOR' | 'ADMIN';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type AppointmentMode = 'VIDEO' | 'CALL' | 'IN_PERSON';
export type DoctorStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type NotificationType = 'LIKE' | 'COMMENT' | 'REPLY' | 'APPOINTMENT_BOOKED' | 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_CANCELLED' | 'DOCTOR_VERIFIED' | 'SYSTEM' | 'MENTION';
export type PostStatus = 'ACTIVE' | 'HIDDEN' | 'DELETED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  role: Role;
  isEmailVerified: boolean;
  createdAt: string;
  doctor?: {
    id: string;
    specialty: string;
    status: DoctorStatus;
    rating: number;
    reviewCount: number;
  };
  _count?: { posts: number; children: number };
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  hashtags: string[];
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'role'>;
  _count: { likes: number; comments: number; bookmarks: number };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId?: string;
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  author: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'role'>;
  replies?: Comment[];
  _count: { replies: number; likes: number };
}

export interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  qualifications: string;
  experience: number;
  bio?: string;
  location?: string;
  consultationFee: number;
  currency: string;
  status: DoctorStatus;
  rating: number;
  reviewCount: number;
  availability?: DoctorAvailability[];
  user: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'email'>;
  reviews?: Review[];
  _count: { reviews: number; appointments: number };
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: AppointmentMode;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  amountPaid?: number;
  createdAt: string;
  patient: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'email'>;
  doctor: Doctor & { user: Pick<User, 'id' | 'fullName' | 'avatarUrl'> };
}

export interface Review {
  id: string;
  doctorId: string;
  authorId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  author: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  dateOfBirth: string;
  gender: Gender;
  bloodType?: string;
  allergies: string[];
  photoUrl?: string;
  createdAt: string;
  _count?: { growthRecords: number; vaccinations: number; milestones: number };
}

export interface GrowthRecord {
  id: string;
  childId: string;
  recordedAt: string;
  weight?: number;
  height?: number;
  headCirc?: number;
  bmi?: number;
  notes?: string;
}

export interface Milestone {
  id: string;
  childId: string;
  title: string;
  category: 'physical' | 'cognitive' | 'social' | 'language';
  ageMonth: number;
  achieved: boolean;
  achievedAt?: string;
  notes?: string;
}

export interface Vaccination {
  id: string;
  childId: string;
  name: string;
  scheduledDate: string;
  administeredAt?: string;
  batchNumber?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  actor?: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
