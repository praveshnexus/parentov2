import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  DollarSign,
  Save,
  User,
  Users,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { doctorsApi, appointmentsApi } from "@/api/services";
import {
  Card,
  Button,
  Input,
  Avatar,
  Badge,
  Skeleton,
  Modal,
  EmptyState,
  SectionHeader,
  TextArea,
  StarRating,
} from "@/components/ui";
import type { Appointment } from "@/types";
import clsx from "clsx";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SPECIALTIES = [
  "Pediatrician",
  "Neonatologist",
  "Child Neurologist",
  "Pediatric Cardiologist",
  "Child Psychologist",
  "Pediatric Surgeon",
  "Nutritionist",
  "Physiotherapist",
  "Other",
];

const STATUS_BADGE: Record<string, React.ReactNode> = {
  CONFIRMED: <Badge variant="primary">Confirmed</Badge>,
  PENDING: <Badge variant="warning">Pending</Badge>,
  COMPLETED: <Badge variant="success">Completed</Badge>,
  CANCELLED: <Badge variant="danger">Cancelled</Badge>,
  NO_SHOW: <Badge variant="gray">No show</Badge>,
};

// ── Profile form ───────────────────────────────────────────────
function DoctorProfileForm({ existing }: { existing?: any }) {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    specialty: existing?.specialty ?? "",
    qualifications: existing?.qualifications ?? "",
    experience: existing?.experience?.toString() ?? "",
    bio: existing?.bio ?? "",
    location: existing?.location ?? "",
    consultationFee: existing
      ? (existing.consultationFee / 100).toString()
      : "",
    licenseNumber: existing?.licenseNumber ?? "",
  });
  const registerMutation = useMutation({
    mutationFn: () =>
      doctorsApi.register({
        ...form,
        experience: parseInt(form.experience),
        consultationFee: Math.round(parseFloat(form.consultationFee) * 100),
      }),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      toast.success("Doctor profile created successfully!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });
  const updateMutation = useMutation({
    mutationFn: () =>
      doctorsApi.update({
        ...form,
        experience: parseInt(form.experience),
        consultationFee: Math.round(parseFloat(form.consultationFee) * 100),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      toast.success("Profile updated!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
  });
  const isPending = registerMutation.isPending || updateMutation.isPending;
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-primary mb-1.5">
          Specialty
        </label>
        <select
          className="input"
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
        >
          <option value="">Select specialty</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <Input
        label="Qualifications"
        placeholder="MBBS, MD Pediatrics"
        value={form.qualifications}
        onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Years experience"
          type="number"
          min="0"
          value={form.experience}
          onChange={(e) => setForm({ ...form, experience: e.target.value })}
        />
        <Input
          label="Consultation fee (₹)"
          type="number"
          min="0"
          placeholder="500"
          value={form.consultationFee}
          onChange={(e) =>
            setForm({ ...form, consultationFee: e.target.value })
          }
        />
      </div>
      <Input
        label="City / Location"
        placeholder="Mumbai, Maharashtra"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
      />
      <Input
        label="License number (optional)"
        value={form.licenseNumber}
        onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
      />
      <TextArea
        label="Bio (visible to patients)"
        rows={3}
        value={form.bio}
        onChange={(e) => setForm({ ...form, bio: e.target.value })}
        placeholder="Tell patients about your expertise..."
      />
      <Button
        fullWidth
        loading={isPending}
        disabled={
          !form.specialty ||
          !form.qualifications ||
          !form.experience ||
          !form.consultationFee
        }
        onClick={() =>
          existing ? updateMutation.mutate() : registerMutation.mutate()
        }
        leftIcon={<Save size={15} />}
      >
        {existing ? "Save changes" : "Create Profile"}
      </Button>
    </div>
  );
}

// ── Availability manager ───────────────────────────────────────
function AvailabilityManager({ doctorId }: { doctorId: string }) {
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState(
    DAYS.map((_, i) => ({
      dayOfWeek: i,
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: i >= 1 && i <= 5,
    })),
  );
  const { data } = useQuery({
    queryKey: ["doctor-availability", doctorId],
    queryFn: () => doctorsApi.getById(doctorId),
    staleTime: 60_000,
  });
  useEffect(() => {
    const avail = (data as any)?.data?.data?.availability;
    if (avail?.length)
      setSlots(
        DAYS.map(
          (_, i) =>
            avail.find((a: any) => a.dayOfWeek === i) ?? {
              dayOfWeek: i,
              startTime: "09:00",
              endTime: "17:00",
              isAvailable: false,
            },
        ),
      );
  }, [data]);
  const mutation = useMutation({
    mutationFn: () => doctorsApi.setAvailability(slots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-availability"] });
      toast.success("Availability updated!");
    },
  });
  return (
    <div className="space-y-3">
      {DAYS.map((day, i) => {
        const slot = slots[i];
        return (
          <div
            key={day}
            className={clsx(
              "flex items-center gap-3 p-3.5 rounded-2xl border transition-all",
              slot.isAvailable
                ? "border-primary-200 bg-primary-50"
                : "border-gray-100 bg-white opacity-70",
            )}
          >
            <button
              onClick={() =>
                setSlots(
                  slots.map((s, j) =>
                    j === i ? { ...s, isAvailable: !s.isAvailable } : s,
                  ),
                )
              }
              className={clsx(
                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                slot.isAvailable
                  ? "bg-primary-500 border-primary-500"
                  : "border-gray-300",
              )}
            >
              {slot.isAvailable && (
                <CheckCircle size={12} className="text-white" />
              )}
            </button>
            <span className="w-8 text-sm font-semibold text-ink-primary">
              {day}
            </span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <input
                type="time"
                value={slot.startTime}
                disabled={!slot.isAvailable}
                onChange={(e) =>
                  setSlots(
                    slots.map((s, j) =>
                      j === i ? { ...s, startTime: e.target.value } : s,
                    ),
                  )
                }
                className="text-xs rounded-xl border border-gray-200 px-2.5 py-1.5 bg-white focus:outline-none focus:border-primary-400 disabled:opacity-40"
              />
              <span className="text-xs text-ink-muted">to</span>
              <input
                type="time"
                value={slot.endTime}
                disabled={!slot.isAvailable}
                onChange={(e) =>
                  setSlots(
                    slots.map((s, j) =>
                      j === i ? { ...s, endTime: e.target.value } : s,
                    ),
                  )
                }
                className="text-xs rounded-xl border border-gray-200 px-2.5 py-1.5 bg-white focus:outline-none focus:border-primary-400 disabled:opacity-40"
              />
            </div>
          </div>
        );
      })}
      <Button
        fullWidth
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
        leftIcon={<Save size={15} />}
      >
        Save availability
      </Button>
    </div>
  );
}

// ── Stats row ──────────────────────────────────────────────────
function StatsRow() {
  const { data } = useQuery({
    queryKey: ["doctor-appointments", ""],
    queryFn: () => appointmentsApi.list(),
  });
  const appts: Appointment[] = data?.data?.data ?? [];
  const pending = appts.filter((a) => a.status === "PENDING").length;
  const confirmed = appts.filter((a) => a.status === "CONFIRMED").length;
  const completed = appts.filter((a) => a.status === "COMPLETED").length;
  const earned = appts
    .filter((a) => a.status === "COMPLETED" && a.amountPaid)
    .reduce((s, a) => s + (a.amountPaid ?? 0), 0);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Pending",
          value: pending,
          icon: Clock,
          color: "bg-amber-50 text-amber-500",
        },
        {
          label: "Confirmed",
          value: confirmed,
          icon: CheckCircle,
          color: "bg-blue-50 text-blue-500",
        },
        {
          label: "Completed",
          value: completed,
          icon: Star,
          color: "bg-green-50 text-green-500",
        },
        {
          label: "Earned",
          value: `₹${(earned / 100).toFixed(0)}`,
          icon: DollarSign,
          color: "bg-purple-50 text-purple-500",
        },
      ].map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="p-4 flex items-center gap-3">
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              color,
            )}
          >
            <Icon size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-ink-primary">{value}</p>
            <p className="text-xs text-ink-muted">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Appointments tab ───────────────────────────────────────────
function AppointmentsTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [notesModal, setNotesModal] = useState<{
    id: string;
    notes: string;
  } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["doctor-appointments", filter],
    queryFn: () => appointmentsApi.list(filter || undefined),
  });
  console.log("Doctor appointments response:", data);
  const appts: Appointment[] = data?.data?.data ?? [];
  console.log("Appointments:", appts);
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string;
    }) => appointmentsApi.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      toast.success("Updated!");
      setNotesModal(null);
    },
  });
  const filters = [
    { v: "", l: "All" },
    { v: "PENDING", l: "Pending" },
    { v: "CONFIRMED", l: "Confirmed" },
    { v: "COMPLETED", l: "Done" },
    { v: "CANCELLED", l: "Cancelled" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(({ v, l }) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={clsx(
              "px-4 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all",
              filter === v
                ? "bg-primary-500 text-white shadow-sm"
                : "bg-white border border-gray-200 text-ink-secondary hover:border-primary-300",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : appts.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} />}
          title="No appointments"
          description="Appointments will appear here when patients book with you."
        />
      ) : (
        appts.map((appt) => {
          const isFuture = new Date(appt.scheduledAt) > new Date();
          const canConfirm = appt.status === "PENDING";
          const canComplete = appt.status === "CONFIRMED" && !isFuture;
          const canCancel = ["PENDING", "CONFIRMED"].includes(appt.status);
          return (
            <Card key={appt.id} className="p-5">
              <div className="flex items-start gap-4">
                <Avatar
                  src={appt.patient?.avatarUrl}
                  name={appt.patient?.fullName ?? "?"}
                  size="lg"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-ink-primary">
                        {appt.patient?.fullName}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {appt.patient?.email}
                      </p>
                    </div>
                    {STATUS_BADGE[appt.status]}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-ink-muted">
                    <span className="text-primary-600 font-medium">
                      {format(
                        new Date(appt.scheduledAt),
                        "EEE, MMM d • h:mm a",
                      )}
                    </span>
                    <span className="capitalize">
                      {appt.mode?.toLowerCase().replace("_", " ")}
                    </span>
                    <span>{appt.durationMinutes} min</span>
                    {appt.amountPaid && (
                      <span className="text-green-600 font-semibold">
                        ₹{(appt.amountPaid / 100).toFixed(0)}
                      </span>
                    )}
                  </div>
                  {appt.reason && (
                    <p className="text-sm text-ink-secondary mt-1 italic">
                      "{appt.reason}"
                    </p>
                  )}
                  {appt.notes && (
                    <p className="text-sm text-ink-secondary mt-1 bg-gray-50 rounded-xl p-2.5">
                      {appt.notes}
                    </p>
                  )}
                </div>
              </div>
              {(canConfirm || canComplete || canCancel) && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  {canConfirm && (
                    <Button
                      size="sm"
                      leftIcon={<CheckCircle size={13} />}
                      onClick={() =>
                        statusMutation.mutate({
                          id: appt.id,
                          status: "CONFIRMED",
                        })
                      }
                      loading={statusMutation.isPending}
                    >
                      Confirm
                    </Button>
                  )}
                  {canComplete && (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<CheckCircle size={13} />}
                      onClick={() => setNotesModal({ id: appt.id, notes: "" })}
                    >
                      Mark complete
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-red-500 hover:bg-red-50"
                      leftIcon={<XCircle size={13} />}
                      onClick={() =>
                        statusMutation.mutate({
                          id: appt.id,
                          status: "CANCELLED",
                        })
                      }
                      loading={statusMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}
      <Modal
        isOpen={!!notesModal}
        onClose={() => setNotesModal(null)}
        title="Complete appointment"
      >
        <div className="px-5 py-4 space-y-4">
          <TextArea
            label="Medical notes (optional)"
            rows={4}
            value={notesModal?.notes ?? ""}
            onChange={(e) =>
              setNotesModal((n) => (n ? { ...n, notes: e.target.value } : n))
            }
            placeholder="Add clinical notes, follow-up instructions..."
          />
          <Button
            fullWidth
            leftIcon={<CheckCircle size={14} />}
            onClick={() =>
              notesModal &&
              statusMutation.mutate({
                id: notesModal.id,
                status: "COMPLETED",
                notes: notesModal.notes,
              })
            }
            loading={statusMutation.isPending}
          >
            Mark as completed
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ── Right sidebar ──────────────────────────────────────────────
function DoctorRightSidebar({ doctor }: { doctor: any }) {
  return (
    <div className="space-y-4">
      {/* Public profile preview */}
      {doctor && (
        <Card className="p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3 text-2xl">
            {doctor.user?.avatarUrl ? (
              <img
                src={doctor.user.avatarUrl}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              "👨‍⚕️"
            )}
          </div>
          <p className="font-bold text-ink-primary">{doctor.user?.fullName}</p>
          <p className="text-xs text-primary-500 font-medium">
            {doctor.specialty}
          </p>
          <StarRating rating={doctor.rating} size={13} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold text-ink-primary">
                {doctor._count?.appointments ?? 0}
              </p>
              <p className="text-[10px] text-ink-muted">Patients</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold text-ink-primary">
                {doctor.reviewCount}
              </p>
              <p className="text-[10px] text-ink-muted">Reviews</p>
            </div>
          </div>
        </Card>
      )}
      {/* Quick links */}
      <Card className="p-4">
        <SectionHeader title="Quick actions" />
        <div className="space-y-1 mt-1">
          {[
            { label: "Community feed", path: "/community", icon: Users },
            { label: "Messages", path: "/messages", icon: MessageCircle },
            { label: "My profile", path: "/profile", icon: User },
          ].map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 transition-colors group"
            >
              <Icon
                size={15}
                className="text-ink-muted group-hover:text-primary-500 transition-colors"
              />
              <span className="text-sm text-ink-secondary group-hover:text-ink-primary flex-1">
                {label}
              </span>
              <ArrowRight
                size={13}
                className="text-ink-muted group-hover:text-primary-400"
              />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Main Doctor Dashboard ──────────────────────────────────────
export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"appointments" | "profile" | "availability">(
    "appointments",
  );

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: async () => {
      if (!user?.doctor?.id) return null;
      return doctorsApi.getById(user.doctor.id);
    },
    enabled: !!user?.doctor?.id,
  });
  const doctor = profileData?.data?.data;

  const tabs = [
    { id: "appointments" as const, label: "Appointments", icon: Calendar },
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "availability" as const, label: "Availability", icon: Clock },
  ];

  return (
    <div className="max-w-app mx-auto px-4 py-5">
      {/* Hero header */}
      <div className="bg-primary-500 rounded-card p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Stethoscope size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{user?.fullName}</h1>
              
            </div>
            <p className="text-primary-100 text-sm mt-0.5">
              {user?.doctor?.specialty ?? "Complete your profile to start"}
            </p>
            {user?.doctor && (
              <StarRating rating={user.doctor.rating} size={13} />
            )}
          </div>
        </div>
      </div>

      

      {/* Stats */}
      {user?.doctor && (
        <div className="mb-6">
          <StatsRow />
        </div>
      )}

      {/* No profile */}
      {!user?.doctor ? (
        <Card className="p-6">
          <SectionHeader title="Complete your profile" />
          <p className="text-sm text-ink-muted mb-5">
            Fill in your professional details to become visible to parents.
          </p>
          <DoctorProfileForm />
        </Card>
      ) : (
        /* ── Desktop: 2-col | Mobile: tabbed ── */
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
          {/* Main area */}
          <div>
            {/* Tab bar */}
            <div className="flex bg-white rounded-2xl shadow-card overflow-hidden mb-5">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={clsx(
                    "flex-1 flex flex-col items-center gap-1.5 py-3.5 text-xs font-semibold border-b-2 transition-colors",
                    tab === id
                      ? "border-primary-500 text-primary-600 bg-primary-50"
                      : "border-transparent text-ink-muted hover:text-ink-secondary",
                  )}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </div>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {tab === "appointments" && <AppointmentsTab />}
              {tab === "profile" && (
                <Card className="p-6">
                  <SectionHeader title="Edit doctor profile" />
                  {isLoading ? (
                    <Skeleton className="h-64 mt-4" />
                  ) : (
                    <DoctorProfileForm existing={doctor} />
                  )}
                </Card>
              )}
              {tab === "availability" && (
                <Card className="p-6">
                  <SectionHeader title="Weekly availability" />
                  <p className="text-sm text-ink-muted mb-4">
                    Set the hours patients can book appointments with you.
                  </p>
                  <AvailabilityManager doctorId={user.doctor.id} />
                </Card>
              )}
            </motion.div>
          </div>
          {/* Right sidebar (desktop only) */}
          <div className="hidden lg:block">
            <DoctorRightSidebar doctor={doctor} />
          </div>
        </div>
      )}
    </div>
  );
}
