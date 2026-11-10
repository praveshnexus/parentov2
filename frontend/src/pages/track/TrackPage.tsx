import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { Gender } from "@/types";
import {
  Plus,
  TrendingUp,
  Syringe,
  Star,
  CheckCircle,
  Circle,
  Baby,
  Ruler,
  Weight,
  Activity,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { differenceInMonths, format } from "date-fns";
import toast from "react-hot-toast";
import { childrenApi } from "@/api/services";
import {
  Button,
  Card,
  Modal,
  Input,
  EmptyState,
  Skeleton,
  Badge,
} from "@/components/ui";
import type { Child, GrowthRecord, Milestone, Vaccination } from "@/types";
import clsx from "clsx";

// ── Add Child Modal (supports create + edit) ───────────────────
function AddChildModal({
  isOpen,
  onClose,
  child,
}: {
  isOpen: boolean;
  onClose: () => void;
  child?: Child | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: child?.name ?? "",
    dateOfBirth: child?.dateOfBirth?.slice(0, 10) ?? "",
    gender: child?.gender ?? "MALE",
    bloodType: child?.bloodType ?? "",
  });

  useEffect(() => {
    if (child) {
      setForm({
        name: child.name,
        dateOfBirth: child.dateOfBirth.slice(0, 10),
        gender: child.gender,
        bloodType: child.bloodType ?? "",
      });
    } else {
      setForm({
        name: "",
        dateOfBirth: "",
        gender: "MALE",
        bloodType: "",
      });
    }
  }, [child, isOpen]);

  const mutation = useMutation({
    mutationFn: () => {
      if (child) {
        return childrenApi.update(child.id, form);
      }
      return childrenApi.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      toast.success(child ? "Child updated successfully!" : "Child added!");
      onClose();
      setForm({ name: "", dateOfBirth: "", gender: "MALE", bloodType: "" });
    },
  });

  const genderOptions: { v: Gender; l: string }[] = [
    { v: "MALE", l: "👦 Boy" },
    { v: "FEMALE", l: "👧 Girl" },
    { v: "OTHER", l: "🧒 Other" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={child ? "Edit Child" : "Add Child"}
    >
      <div className="px-5 py-4 space-y-4">
        <Input
          label="Child's name"
          placeholder="e.g. Arjun"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Date of birth"
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium text-ink-primary mb-1.5">
            Gender
          </label>
          <div className="grid grid-cols-3 gap-2">
            {genderOptions.map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, gender: v })}
                className={clsx(
                  "py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                  form.gender === v
                    ? "border-primary-500 bg-primary-50 text-primary-600"
                    : "border-gray-100 text-ink-secondary hover:border-primary-200",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <Input
          label="Blood type (optional)"
          placeholder="e.g. O+"
          value={form.bloodType}
          onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
        />
        <Button
          fullWidth
          loading={mutation.isPending}
          disabled={!form.name || !form.dateOfBirth}
          onClick={() => mutation.mutate()}
        >
          {child ? "Save Changes" : "Add Child"}
        </Button>
      </div>
    </Modal>
  );
}

// ── Add Growth Modal ───────────────────────────────────────────
function AddGrowthModal({
  childId,
  isOpen,
  onClose,
}: {
  childId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    weight: "",
    height: "",
    headCirc: "",
    notes: "",
  });
  const mutation = useMutation({
    mutationFn: () =>
      childrenApi.addGrowth(childId, {
        weight: form.weight ? parseFloat(form.weight) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        headCirc: form.headCirc ? parseFloat(form.headCirc) : undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growth", childId] });
      toast.success("Record saved!");
      onClose();
      setForm({ weight: "", height: "", headCirc: "", notes: "" });
    },
  });
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Growth Record">
      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-1.5">
              Weight (kg)
            </label>
            <div className="relative">
              <Weight
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                className="input pl-9"
                type="number"
                step="0.1"
                placeholder="8.2"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-1.5">
              Height (cm)
            </label>
            <div className="relative">
              <Ruler
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                className="input pl-9"
                type="number"
                step="0.1"
                placeholder="72"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
              />
            </div>
          </div>
        </div>
        <Input
          label="Head circumference (cm)"
          type="number"
          step="0.1"
          placeholder="45"
          value={form.headCirc}
          onChange={(e) => setForm({ ...form, headCirc: e.target.value })}
        />
        <Input
          label="Notes"
          placeholder="Any observations..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <Button
          fullWidth
          loading={mutation.isPending}
          disabled={!form.weight && !form.height}
          onClick={() => mutation.mutate()}
        >
          Save Record
        </Button>
      </div>
    </Modal>
  );
}

// ── Growth chart ───────────────────────────────────────────────
function GrowthChart({ childId }: { childId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["growth", childId],
    queryFn: () => childrenApi.getGrowth(childId),
  });
  const records: GrowthRecord[] = data?.data?.data ?? [];
  if (isLoading) return <Skeleton className="h-52" />;
  if (records.length < 2)
    return (
      <div className="h-44 flex flex-col items-center justify-center text-center bg-gray-50 rounded-2xl">
        <TrendingUp size={28} className="text-gray-300 mb-2" />
        <p className="text-xs text-ink-muted">
          Add at least 2 measurements to see chart
        </p>
      </div>
    );
  const chartData = records.slice(-10).map((r) => ({
    date: format(new Date(r.recordedAt), "MMM d"),
    weight: r.weight,
    height: r.height,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
      >
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#29B6F6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#29B6F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="heightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00BCD4" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#00BCD4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#9AA5B8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#9AA5B8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="weight"
          stroke="#29B6F6"
          strokeWidth={2.5}
          fill="url(#weightGrad)"
          dot={{ r: 4, fill: "#29B6F6", strokeWidth: 0 }}
          name="Weight (kg)"
          activeDot={{ r: 6 }}
        />
        <Area
          type="monotone"
          dataKey="height"
          stroke="#00BCD4"
          strokeWidth={2.5}
          fill="url(#heightGrad)"
          dot={{ r: 4, fill: "#00BCD4", strokeWidth: 0 }}
          name="Height (cm)"
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Stats cards ────────────────────────────────────────────────
function GrowthStats({ childId }: { childId: string }) {
  const { data } = useQuery({
    queryKey: ["growth", childId],
    queryFn: () => childrenApi.getGrowth(childId),
  });
  const records: GrowthRecord[] = data?.data?.data ?? [];
  const latest = records[records.length - 1];
  const prev = records[records.length - 2];
  if (!latest) return null;
  const weightDiff =
    latest.weight && prev?.weight
      ? (latest.weight - prev.weight).toFixed(1)
      : null;
  const heightDiff =
    latest.height && prev?.height
      ? (latest.height - prev.height).toFixed(1)
      : null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Weight",
          value: latest.weight ? `${latest.weight} kg` : "—",
          diff: weightDiff ? `+${weightDiff} kg` : null,
          icon: "⚖️",
        },
        {
          label: "Height",
          value: latest.height ? `${latest.height} cm` : "—",
          diff: heightDiff ? `+${heightDiff} cm` : null,
          icon: "📏",
        },
        {
          label: "BMI",
          value: latest.bmi ? latest.bmi.toFixed(1) : "—",
          diff: null,
          icon: "📊",
        },
        {
          label: "Head",
          value: latest.headCirc ? `${latest.headCirc} cm` : "—",
          diff: null,
          icon: "🧠",
        },
      ].map(({ label, value, diff, icon }) => (
        <div
          key={label}
          className="bg-primary-50 rounded-2xl p-3.5 flex items-center gap-3"
        >
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-[11px] text-ink-muted font-medium">{label}</p>
            <p className="text-sm font-bold text-ink-primary">{value}</p>
            {diff && (
              <p className="text-[10px] text-green-500 font-medium">{diff}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Milestones ─────────────────────────────────────────────────
function MilestonesPanel({ childId }: { childId: string }) {
  const queryClient = useQueryClient();
  const [cat, setCat] = useState("physical");
  const { data, isLoading } = useQuery({
    queryKey: ["milestones", childId],
    queryFn: () => childrenApi.getMilestones(childId),
  });
  const milestones: Milestone[] = data?.data?.data ?? [];
  const toggleMutation = useMutation({
    mutationFn: (id: string) => childrenApi.toggleMilestone(childId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["milestones", childId] }),
  });
  const categories = ["physical", "cognitive", "social", "language"];
  const filtered = milestones.filter((m) => m.category === cat);
  const achieved = filtered.filter((m) => m.achieved).length;
  const pct = filtered.length
    ? Math.round((achieved / filtered.length) * 100)
    : 0;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={clsx(
              "px-4 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap flex-shrink-0 capitalize transition-all",
              cat === c
                ? "bg-primary-500 text-white shadow-sm"
                : "bg-white border border-gray-200 text-ink-secondary hover:border-primary-300",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-ink-secondary font-medium">
            {achieved}/{filtered.length} achieved
          </span>
          <span className="font-bold text-primary-600">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-400 to-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <motion.button
              key={m.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleMutation.mutate(m.id)}
              className={clsx(
                "w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                m.achieved
                  ? "border-green-200 bg-green-50"
                  : "border-gray-100 bg-white hover:border-primary-200",
              )}
            >
              {m.achieved ? (
                <CheckCircle
                  size={20}
                  className="text-green-500 flex-shrink-0"
                />
              ) : (
                <Circle size={20} className="text-gray-300 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    "text-sm font-medium",
                    m.achieved
                      ? "line-through text-green-600"
                      : "text-ink-primary",
                  )}
                >
                  {m.title}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Expected ~{m.ageMonth} months
                </p>
              </div>
              {m.achieved && m.achievedAt && (
                <span className="text-[10px] text-green-500 font-medium flex-shrink-0">
                  {format(new Date(m.achievedAt), "MMM d")}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Vaccinations ───────────────────────────────────────────────
function VaccinationsPanel({ childId }: { childId: string }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", scheduledDate: "", notes: "" });
  const { data } = useQuery({
    queryKey: ["vaccinations", childId],
    queryFn: () => childrenApi.getVaccinations(childId),
  });
  const vaccinations: Vaccination[] = data?.data?.data ?? [];
  const addMutation = useMutation({
    mutationFn: () => childrenApi.addVaccination(childId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinations", childId] });
      setShowAdd(false);
      setForm({ name: "", scheduledDate: "", notes: "" });
      toast.success("Added!");
    },
  });
  const now = new Date();
  const done = vaccinations.filter((v) => v.administeredAt).length;
  const upcoming = vaccinations.filter(
    (v) => !v.administeredAt && new Date(v.scheduledDate) >= now,
  ).length;
  const overdue = vaccinations.filter(
    (v) => !v.administeredAt && new Date(v.scheduledDate) < now,
  ).length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Completed", v: done, c: "bg-green-50 text-green-600" },
          { l: "Upcoming", v: upcoming, c: "bg-amber-50 text-amber-600" },
          { l: "Overdue", v: overdue, c: "bg-red-50 text-red-600" },
        ].map(({ l, v, c }) => (
          <div key={l} className={clsx("rounded-2xl p-3 text-center", c)}>
            <p className="text-xl font-bold">{v}</p>
            <p className="text-[11px] font-medium mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 space-y-3 border border-primary-100">
              <Input
                label="Vaccine name"
                placeholder="e.g. MMR"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Scheduled date"
                type="date"
                value={form.scheduledDate}
                onChange={(e) =>
                  setForm({ ...form, scheduledDate: e.target.value })
                }
              />
              <Button
                size="sm"
                fullWidth
                loading={addMutation.isPending}
                disabled={!form.name || !form.scheduledDate}
                onClick={() => addMutation.mutate()}
              >
                Save
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-primary">
          All Vaccinations
        </p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 text-xs text-primary-500 font-semibold hover:text-primary-600"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {vaccinations.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-6">
            No records yet
          </p>
        ) : (
          vaccinations.map((v) => (
            <div
              key={v.id}
              className={clsx(
                "flex items-center gap-3 p-3.5 rounded-2xl border",
                v.administeredAt
                  ? "border-green-100 bg-green-50"
                  : new Date(v.scheduledDate) < now
                    ? "border-red-100 bg-red-50"
                    : "border-gray-100 bg-white",
              )}
            >
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  v.administeredAt
                    ? "bg-green-100"
                    : new Date(v.scheduledDate) < now
                      ? "bg-red-100"
                      : "bg-amber-100",
                )}
              >
                <Syringe
                  size={15}
                  className={
                    v.administeredAt
                      ? "text-green-500"
                      : new Date(v.scheduledDate) < now
                        ? "text-red-500"
                        : "text-amber-500"
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-primary">{v.name}</p>
                <p className="text-xs text-ink-muted">
                  {v.administeredAt
                    ? `Given ${format(new Date(v.administeredAt), "MMM d, yyyy")}`
                    : `Due ${format(new Date(v.scheduledDate), "MMM d, yyyy")}`}
                </p>
              </div>
              {!v.administeredAt && new Date(v.scheduledDate) < now && (
                <Badge variant="danger">Overdue</Badge>
              )}
              {v.administeredAt && (
                <CheckCircle
                  size={16}
                  className="text-green-500 flex-shrink-0"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Child detail (right/main panel) ─────────────────────────────
// Retains the Edit action (onEdit) from the original implementation,
// styled with the new compact header from the refreshed design.
function ChildDetail({
  child,
  onEdit,
}: {
  child: Child;
  onEdit: (child: Child) => void;
}) {
  const [tab, setTab] = useState<"growth" | "milestones" | "vaccines">(
    "growth",
  );
  const [showGrowth, setShowGrowth] = useState(false);
  const ageMonths = differenceInMonths(new Date(), new Date(child.dateOfBirth));
  const ageLabel =
    ageMonths < 24
      ? `${ageMonths} months`
      : `${Math.floor(ageMonths / 12)}y ${ageMonths % 12}m`;
  const tabs = [
    { id: "growth" as const, label: "Growth", icon: TrendingUp },
    { id: "milestones" as const, label: "Milestones", icon: Star },
    { id: "vaccines" as const, label: "Vaccines", icon: Syringe },
  ];
  return (
    <Card className="overflow-hidden">
      {/* Cyan header */}
      <div className="bg-primary-500 px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">
            {child.gender === "FEMALE" ? "👧" : "👦"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{child.name}</h2>
            <p className="text-primary-100 text-sm mt-0.5">Age: {ageLabel}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {child.bloodType && (
                <span className="text-xs bg-white/20 text-white rounded-pill px-2.5 py-0.5 font-medium">
                  {child.bloodType}
                </span>
              )}
              {child.allergies?.length > 0 && (
                <span className="text-xs bg-red-400/30 text-white rounded-pill px-2.5 py-0.5 font-medium">
                  ⚠️ {child.allergies[0]}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="!border-white/60 !bg-transparent !text-white hover:!bg-white/10"
              onClick={() => onEdit(child)}
            >
              Edit
            </Button>
            {tab === "growth" && (
              <Button
                size="sm"
                variant="outline"
                className="!border-white/60 !bg-transparent !text-white hover:!bg-white/10"
                leftIcon={<Plus size={13} />}
                onClick={() => setShowGrowth(true)}
              >
                Record
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors",
              tab === id
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-ink-muted hover:text-ink-secondary",
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
      {/* Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5"
      >
        {tab === "growth" && (
          <div className="space-y-5">
            <GrowthStats childId={child.id} />
            <div>
              <p className="text-sm font-semibold text-ink-primary mb-3">
                Growth Chart
              </p>
              <GrowthChart childId={child.id} />
            </div>
            <AddGrowthModal
              childId={child.id}
              isOpen={showGrowth}
              onClose={() => setShowGrowth(false)}
            />
          </div>
        )}
        {tab === "milestones" && <MilestonesPanel childId={child.id} />}
        {tab === "vaccines" && <VaccinationsPanel childId={child.id} />}
      </motion.div>
    </Card>
  );
}

// ── Left child selector panel ──────────────────────────────────
function ChildSelector({
  children,
  selectedId,
  onSelect,
  onAdd,
}: {
  children: Child[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <Card className="p-4 sticky top-36">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-sm text-ink-primary">My Children</p>
        <button
          onClick={onAdd}
          className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 hover:bg-primary-100 transition-colors"
        >
          <Plus size={15} />
        </button>
      </div>
      <div className="space-y-2">
        {children.map((child) => {
          const ageMonths = differenceInMonths(
            new Date(),
            new Date(child.dateOfBirth),
          );
          const ageLabel =
            ageMonths < 24 ? `${ageMonths}m` : `${Math.floor(ageMonths / 12)}y`;
          const isSelected = (selectedId ?? children[0]?.id) === child.id;
          return (
            <button
              key={child.id}
              onClick={() => onSelect(child.id)}
              className={clsx(
                "w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left",
                isSelected
                  ? "border-primary-500 bg-primary-50"
                  : "border-transparent hover:bg-gray-50",
              )}
            >
              <div
                className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
                  isSelected ? "bg-primary-100" : "bg-gray-100",
                )}
              >
                {child.gender === "FEMALE" ? "👧" : "👦"}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    "text-sm font-semibold truncate",
                    isSelected ? "text-primary-700" : "text-ink-primary",
                  )}
                >
                  {child.name}
                </p>
                <p className="text-xs text-ink-muted">Age: {ageLabel}</p>
              </div>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
      {/* Quick stats */}
      {children.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            Quick Links
          </p>
          {[
            { icon: TrendingUp, label: "Growth Records" },
            { icon: Star, label: "Milestones" },
            { icon: Syringe, label: "Vaccinations" },
            { icon: Activity, label: "Health Reports" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Icon size={14} className="text-primary-400" />
              <p className="text-xs text-ink-secondary">{label}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Main Track Page ─────────────────────────────────────────────
export default function TrackPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["children"],
    queryFn: () => childrenApi.list(),
  });
  const children: Child[] = data?.data?.data ?? [];
  const selected = children.find((c) => c.id === selectedId) ?? children[0];

  return (
    <div className="max-w-app mx-auto">
      {/* Page header — sticky, matches refreshed design */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 md:top-16 z-20 mb-4">
        <div className="max-w-app mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-bold text-ink-primary">
              Track Growth
            </h1>
            <p className="text-xs text-primary-500 font-medium">
              Know your Child Better
            </p>
          </div>
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setShowAdd(true)}
          >
            Add Child
          </Button>
        </div>
      </div>

      <div className="px-4">
        {/* Mobile child chips */}
        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedId(child.id)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-pill border-2 text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all",
                  selected?.id === child.id
                    ? "border-primary-500 bg-primary-50 text-primary-600"
                    : "border-gray-200 text-ink-secondary hover:border-primary-300",
                )}
              >
                <span>{child.gender === "FEMALE" ? "👧" : "👦"}</span>
                {child.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Desktop: 2-col | Mobile: 1-col ── */}
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : children.length === 0 ? (
          <EmptyState
            icon={<Baby size={32} />}
            title="No children added yet"
            description="Add your child to start tracking growth, milestones, and vaccinations."
            action={
              <Button
                leftIcon={<Plus size={14} />}
                onClick={() => setShowAdd(true)}
              >
                Add your first child
              </Button>
            }
          />
        ) : (
          <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-5">
            {/* Left selector (desktop only) */}
            <div className="hidden lg:block">
              <ChildSelector
                children={children}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={() => setShowAdd(true)}
              />
            </div>
            {/* Detail panel */}
            {selected && (
              <ChildDetail
                child={selected}
                onEdit={(child) => {
                  setEditingChild(child);
                  setShowAdd(true);
                }}
              />
            )}
          </div>
        )}

        <AddChildModal
          isOpen={showAdd}
          child={editingChild}
          onClose={() => {
            setShowAdd(false);
            setEditingChild(null);
          }}
        />
      </div>
    </div>
  );
}
