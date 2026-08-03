import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Calendar,
  Video,
  Phone,
  Clock,
  ChevronRight,
  Mic,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { doctorsApi, appointmentsApi } from "@/api/services";
import {
  Avatar,
  Button,
  Card,
  Badge,
  Modal,
  Input,
  Skeleton,
  EmptyState,
  SectionHeader,
  StarRating,
} from "@/components/ui";
import type { Doctor, Appointment } from "@/types";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";

const SPECIALTIES = [
  "Pediatrician",
  "Nutritionist",
  "Child Psychologist",
  "Neonatologist",
  "Physiotherapist",
  "Child Neurologist",
  "Pediatric Surgeon",
];

// ── Left filter panel ──────────────────────────────────────────
function FilterPanel({
  specialty,
  setSpecialty,
}: {
  specialty: string;
  setSpecialty: (s: string) => void;
}) {
  return (
    <Card className="p-4 sticky top-36">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={15} className="text-primary-500" />
        <p className="font-semibold text-sm text-ink-primary">Filters</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
          Specialty
        </p>
        <div className="space-y-1">
          <button
            onClick={() => setSpecialty("")}
            className={clsx(
              "w-full text-left px-3 py-2 rounded-xl text-sm transition-colors",
              !specialty
                ? "bg-primary-500 text-white font-medium"
                : "text-ink-secondary hover:bg-gray-100",
            )}
          >
            All Specialists
          </button>
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s === specialty ? "" : s)}
              className={clsx(
                "w-full text-left px-3 py-2 rounded-xl text-sm transition-colors",
                specialty === s
                  ? "bg-primary-500 text-white font-medium"
                  : "text-ink-secondary hover:bg-gray-100",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Book Appointment Modal ─────────────────────────────────────
function BookModal({
  doctor,
  isOpen,
  onClose,
}: {
  doctor: Doctor;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    scheduledAt: "",
    mode: "VIDEO",
    reason: "",
  });
  const mutation = useMutation({
    mutationFn: () =>
      appointmentsApi.book({
        doctorId: doctor.id,
        scheduledAt: form.scheduledAt,
        mode: form.mode,
        reason: form.reason,
      }),
    onSuccess: () => {
      toast.success("Appointment booked!");
      onClose();
    },
  });
  const fee = `₹${(doctor.consultationFee / 100).toFixed(0)}`;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Appointment">
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary-50">
          <Avatar
            src={doctor.user?.avatarUrl}
            name={doctor.user?.fullName ?? ""}
            size="md"
          />
          <div className="flex-1">
            <p className="font-semibold text-sm">{doctor.user?.fullName}</p>
            <p className="text-xs text-primary-500">{doctor.specialty}</p>
            <StarRating rating={doctor.rating} size={11} />
          </div>
          <div className="text-right">
            <p className="font-bold text-primary-600">{fee}</p>
            <p className="text-xs text-ink-muted">per session</p>
          </div>
        </div>
        <Input
          label="Date & time"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          min={new Date().toISOString().slice(0, 16)}
        />
        <div>
          <p className="text-sm font-medium text-ink-primary mb-2">Mode</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "VIDEO", l: "Video", i: Video },
              { v: "CALL", l: "Call", i: Phone },
              { v: "IN_PERSON", l: "In person", i: MapPin },
            ].map(({ v, l, i: Icon }) => (
              <button
                key={v}
                onClick={() => setForm({ ...form, mode: v })}
                className={clsx(
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-xs font-medium transition-all",
                  form.mode === v
                    ? "border-primary-500 bg-primary-50 text-primary-600"
                    : "border-gray-100 text-ink-secondary hover:border-primary-200",
                )}
              >
                <Icon
                  size={18}
                  className={
                    form.mode === v ? "text-primary-500" : "text-ink-muted"
                  }
                />
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-primary mb-1.5">
            Reason for visit
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Briefly describe your concern..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
        <Button
          fullWidth
          loading={mutation.isPending}
          disabled={!form.scheduledAt}
          onClick={() => mutation.mutate()}
        >
          Book for {fee}
        </Button>
      </div>
    </Modal>
  );
}

// ── Doctor Profile Modal ───────────────────────────────────────
function DoctorProfileModal({
  doctor,
  isOpen,
  onClose,
  onBook,
}: {
  doctor: Doctor;
  isOpen: boolean;
  onClose: () => void;
  onBook: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="bg-primary-500 px-5 pt-6 pb-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full border-4 border-white overflow-hidden shadow-md mb-3">
          <Avatar
            src={doctor.user?.avatarUrl}
            name={doctor.user?.fullName ?? ""}
            size="xl"
            className="w-full h-full"
          />
        </div>
        <h2 className="text-lg font-bold text-white">
          {doctor.user?.fullName}
        </h2>
        <p className="text-primary-100 text-sm">{doctor.specialty}</p>
        <div className="flex justify-center gap-3 mt-3">
          <div className="bg-white/20 rounded-2xl px-4 py-2 text-center">
            <p className="text-lg font-bold text-white">{doctor.experience}y</p>
            <p className="text-[11px] text-white/70">Experience</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-2 text-center">
            <p className="text-lg font-bold text-white">
              {doctor.rating.toFixed(1)}
            </p>
            <p className="text-[11px] text-white/70">Rating</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-2 text-center">
            <p className="text-lg font-bold text-white">{doctor.reviewCount}</p>
            <p className="text-[11px] text-white/70">Reviews</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div className="p-4 rounded-2xl bg-gray-50">
          <h3 className="font-semibold text-sm text-ink-primary mb-1.5">
            About
          </h3>
          <p className="text-sm text-ink-secondary leading-relaxed">
            {doctor.bio ??
              `Experienced ${doctor.specialty} with ${doctor.experience}+ years of practice.`}
          </p>
        </div>
        {doctor.reviews &&doctor.reviews.length > 0 && (
          <div>
            <p className="font-semibold text-sm text-ink-primary mb-2">
              Patient Reviews
            </p>
            {doctor.reviews.slice(0, 2).map((r) => (
              <div key={r.id} className="flex gap-2.5 mb-2">
                <Avatar
                  src={r.author?.avatarUrl}
                  name={r.author?.fullName ?? "?"}
                  size="xs"
                  className="flex-shrink-0"
                />
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                  <p className="text-xs font-medium">{r.author?.fullName}</p>
                  <p className="text-xs text-ink-secondary mt-0.5 line-clamp-2">
                    {r.comment ?? "Great doctor!"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {doctor.location && (
            <div className="p-3 rounded-xl bg-gray-50">
              <p className="text-xs text-ink-muted mb-0.5">Location</p>
              <p className="text-sm font-medium">{doctor.location}</p>
            </div>
          )}
          <div className="p-3 rounded-xl bg-gray-50">
            <p className="text-xs text-ink-muted mb-0.5">Fee</p>
            <p className="text-sm font-bold text-primary-600">
              ₹{(doctor.consultationFee / 100).toFixed(0)}
            </p>
          </div>
        </div>
        <Button fullWidth onClick={onBook}>
          Book Appointment
        </Button>
      </div>
    </Modal>
  );
}

// ── Doctor card (list view) ────────────────────────────────────
function DoctorCard({
  doctor,
  appointment,
  onConsult,
}: {
  doctor: Doctor;
  appointment?: Appointment;
  onConsult: (appointment: Appointment) => void;
}) {
  const [showBook, setShowBook] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  return (
    <>
      <Card className="p-4 hover:shadow-card-hover transition-shadow">
        <div className="flex gap-4">
          <Avatar
            src={doctor.user?.avatarUrl}
            name={doctor.user?.fullName ?? ""}
            size="lg"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-ink-primary">
              {doctor.user?.fullName}
            </p>
            <p className="text-xs text-primary-500 font-medium">
              {doctor.specialty}
            </p>
            <StarRating rating={doctor.rating} size={12} />
            <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted flex-wrap">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {doctor.experience}y exp
              </span>
              {doctor.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {doctor.location.split(",")[0]}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end justify-between gap-2">
            <div className="text-right">
              <p className="font-bold text-base text-primary-600">
                ₹{(doctor.consultationFee / 100).toFixed(0)}
              </p>
              <p className="text-[10px] text-ink-muted">per session</p>
            </div>
            <Badge variant="success" className="text-[10px]">
              Verified
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowProfile(true)}
          >
            View Profile
          </Button>

          {appointment ? (
            <Button
              size="sm"
              className="flex-1"
              variant={
                appointment.status === "CONFIRMED" ? "primary" : "outline"
              }
              disabled={appointment.status === "PENDING"}
              onClick={() => {
                if (appointment.status === "CONFIRMED") {
                  onConsult(appointment);
                }
              }}
            >
              {appointment.status === "PENDING"
                ? "Pending Approval"
                : "Consult Now"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              leftIcon={<Calendar size={13} />}
              onClick={() => setShowBook(true)}
            >
              Book Now
            </Button>
          )}
        </div>
      </Card>
      <DoctorProfileModal
        doctor={doctor}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onBook={() => {
          setShowProfile(false);
          setShowBook(true);
        }}
      />
      <BookModal
        doctor={doctor}
        isOpen={showBook}
        onClose={() => setShowBook(false)}
      />
    </>
  );
}

// ── Appointment history sidebar ────────────────────────────────
function AppointmentSidebar() {
  const { data } = useQuery({
    queryKey: ["appointments", "CONFIRMED"],
    queryFn: () => appointmentsApi.list("CONFIRMED"),
  });
  const upcoming: Appointment[] = (data?.data?.data ?? [])
    .filter((a: Appointment) => new Date(a.scheduledAt) > new Date())
    .slice(0, 3);
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionHeader title="Upcoming Appointments" />
        {upcoming.length === 0 ? (
          <p className="text-xs text-ink-muted text-center py-3">
            No upcoming appointments
          </p>
        ) : (
          upcoming.map((appt) => (
            <div
              key={appt.id}
              className="py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <Avatar
                  src={appt.doctor.user?.avatarUrl}
                  name={appt.doctor.user?.fullName ?? "?"}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-primary truncate">
                    {appt.doctor.user?.fullName}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {format(new Date(appt.scheduledAt), "MMM d • h:mm a")}
                  </p>
                </div>
              </div>
              <Button size="sm" fullWidth leftIcon={<Video size={13} />}>
                Join Call
              </Button>
            </div>
          ))
        )}
      </Card>
      <Card className="p-4">
        <p className="font-semibold text-sm text-ink-primary mb-3">
          Quick Book
        </p>
        <p className="text-xs text-ink-muted mb-3">
          Need urgent consultation? Find a doctor available today.
        </p>
        <div className="space-y-1.5">
          {SPECIALTIES.slice(0, 4).map((s) => (
            <div key={s} className="flex items-center justify-between py-1.5">
              <p className="text-xs text-ink-secondary">{s}</p>
              <ChevronRight size={13} className="text-ink-muted" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function ConsultPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [specialty, setSpecialty] = useState("");
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["doctors", debounced, specialty],
    queryFn: () => doctorsApi.list({ search: debounced, specialty }),
  });
  const doctors: Doctor[] = data?.data?.data ?? [];
  const { data: appointmentsData } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: async () => {
      const res = await appointmentsApi.list();

      console.log("RAW RESPONSE", res);
      console.log("RAW DATA", res.data);

      return res;
    },
  });

  const appointments: Appointment[] = appointmentsData?.data?.data ?? [];
  console.log("Appointments:", appointments);

  const handleSearch = (val: string) => {
    setSearch(val);
    const t = setTimeout(() => setDebounced(val), 400);
    return () => clearTimeout(t);
  };

  return (
    <div className="max-w-app mx-auto px-4 py-5">
      {/* Search bar — full width */}
      <div className="mb-5">
        <div className="relative max-w-2xl">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            className="w-full bg-white rounded-pill border border-gray-200 pl-11 pr-12 py-3.5 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-card transition-all"
            placeholder="Search doctors by name or specialty..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-primary-50 text-primary-500 hover:bg-primary-100 transition-colors">
            <Mic size={16} />
          </button>
        </div>
      </div>

      {/* Mobile specialty chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden">
        {["All", ...SPECIALTIES].map((s) => (
          <button
            key={s}
            onClick={() =>
              setSpecialty(s === "All" ? "" : s === specialty ? "" : s)
            }
            className={clsx(
              "px-4 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all",
              (s === "All" && !specialty) || s === specialty
                ? "bg-primary-500 text-white"
                : "bg-white border border-gray-200 text-ink-secondary hover:border-primary-300",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Desktop: 3-col | Mobile: 1-col ── */}
      <div className="lg:grid lg:grid-cols-[220px_1fr_260px] lg:gap-5">
        {/* Left filter panel */}
        <div className="hidden lg:block">
          <FilterPanel specialty={specialty} setSpecialty={setSpecialty} />
        </div>

        {/* Doctor list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-primary">
              Available Specialists{" "}
              {doctors.length > 0 && (
                <span className="text-ink-muted font-normal text-sm">
                  ({doctors.length})
                </span>
              )}
            </h2>
          </div>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))
          ) : doctors.length === 0 ? (
            <EmptyState
              icon={<Search size={28} />}
              title="No doctors found"
              description="Try different keywords or filters."
            />
          ) : (
            doctors.map((doc, i) => {
              console.log("Doctor ID:", doc.id);

              const appointment = appointments.find(
                (a) =>
                  a.doctorId === doc.id &&
                  ["PENDING", "CONFIRMED"].includes(a.status),
              );

              console.log("Matched Appointment:", appointment);

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <DoctorCard
                    doctor={doc}
                    appointment={appointment}
                    onConsult={(appointment) =>
                      navigate(`/messages?appointmentId=${appointment.id}`)
                    }
                  />
                </motion.div>
              );
            })
          )}
        </div>

        {/* Right sidebar */}
        <div className="hidden lg:block">
          <AppointmentSidebar />
        </div>
      </div>
    </div>
  );
}
