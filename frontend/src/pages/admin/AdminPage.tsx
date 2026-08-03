import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  Stethoscope,
  FileText,
  BarChart2,
  Shield,
  CheckCircle,
  XCircle,
  UserX,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import toast from "react-hot-toast";
import { adminApi, doctorsApi } from "@/api/services";
import {
  Card,
  Avatar,
  Badge,
  Button,
  Skeleton,
  Input,
  SectionHeader,
} from "@/components/ui";
import clsx from "clsx";

type Tab = "overview" | "users" | "doctors" | "reports" | "logs";

// ── Left admin sidebar ─────────────────────────────────────────
function AdminSidebar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { data } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.dashboard(),
  });
  const s = data?.data?.data;

  const navItems: Array<{ id: Tab; label: string; icon: any; badge?: number }> =
    [
      { id: "overview", label: "Overview", icon: BarChart2 },
      { id: "users", label: "Users", icon: Users, badge: s?.totalUsers },
      {
        id: "doctors",
        label: "Doctors",
        icon: Stethoscope,
        badge: s?.pendingDoctors,
      },
      {
        id: "reports",
        label: "Reports",
        icon: AlertTriangle,
        badge: s?.pendingReports,
      },
      { id: "logs", label: "Audit Logs", icon: FileText },
    ];

  return (
    <Card className="p-4 sticky top-36">
      <div className="flex items-center gap-3 mb-5 px-2">
        <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-ink-primary text-sm">Admin Panel</p>
          <p className="text-[11px] text-red-500 font-medium">
            Platform management
          </p>
        </div>
      </div>

      <div className="space-y-0.5">
        {navItems.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
              tab === id
                ? "bg-primary-500 text-white shadow-sm"
                : "text-ink-secondary hover:bg-gray-100",
            )}
          >
            <Icon
              size={16}
              className={tab === id ? "text-white" : "text-ink-muted"}
            />
            <span className="flex-1 text-left">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className={clsx(
                  "text-[11px] font-bold px-2 py-0.5 rounded-full",
                  tab === id
                    ? "bg-white/20 text-white"
                    : "bg-primary-100 text-primary-600",
                )}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mini stats */}
      {s && (
        <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide px-2">
            Quick stats
          </p>
          {[
            {
              label: "Total users",
              value: s.totalUsers,
              color: "text-blue-500",
            },
            {
              label: "Active doctors",
              value: s.totalDoctors,
              color: "text-green-500",
            },
            {
              label: "Total posts",
              value: s.totalPosts,
              color: "text-purple-500",
            },
            {
              label: "Appointments",
              value: s.totalAppointments,
              color: "text-orange-500",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between px-2">
              <span className="text-xs text-ink-muted">{label}</span>
              <span className={clsx("text-sm font-bold", color)}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Overview tab ───────────────────────────────────────────────
function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.dashboard(),
  });
  const s = data?.data?.data;

  const statCards = [
    {
      label: "Total users",
      value: s?.totalUsers ?? 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "New (30d)",
      value: s?.newUsers30d ?? 0,
      icon: TrendingUp,
      color: "bg-indigo-500",
    },
    {
      label: "Verified doctors",
      value: s?.totalDoctors ?? 0,
      icon: Stethoscope,
      color: "bg-green-500",
    },
    {
      label: "Pending approval",
      value: s?.pendingDoctors ?? 0,
      icon: Stethoscope,
      color: "bg-amber-500",
    },
    {
      label: "Total posts",
      value: s?.totalPosts ?? 0,
      icon: FileText,
      color: "bg-pink-500",
    },
    {
      label: "Total appts",
      value: s?.totalAppointments ?? 0,
      icon: BarChart2,
      color: "bg-purple-500",
    },
    {
      label: "Appts this week",
      value: s?.appointmentsThisWeek ?? 0,
      icon: Activity,
      color: "bg-orange-500",
    },
    {
      label: "Pending reports",
      value: s?.pendingReports ?? 0,
      icon: AlertTriangle,
      color: "bg-red-500",
    },
  ];

  if (isLoading)
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div
              className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-2.5",
                color,
              )}
            >
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-ink-primary">{value}</p>
            <p className="text-xs text-ink-muted mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      {s?.monthlySignups?.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-5">
          <Card className="p-5">
            <SectionHeader title="User signups — last 6 months" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.monthlySignups}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9AA5B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9AA5B8" }}
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
                <Bar
                  dataKey="count"
                  fill="#29B6F6"
                  radius={[6, 6, 0, 0]}
                  name="Signups"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5">
            <SectionHeader title="Growth trend" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={s.monthlySignups}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9AA5B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9AA5B8" }}
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
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#00BCD4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#00BCD4", strokeWidth: 0 }}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Users tab ──────────────────────────────────────────────────
function UsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", debounced],
    queryFn: () => adminApi.getUsers({ search: debounced }),
  });
  const users = data?.data?.data ?? [];
  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Updated");
    },
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or email..."
        leftIcon={<Users size={15} />}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setTimeout(() => setDebounced(e.target.value), 400);
        }}
      />
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <Card key={u.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar src={u.avatarUrl} name={u.fullName} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-ink-primary">
                      {u.fullName}
                    </p>
                    <Badge
                      variant={
                        u.role === "ADMIN"
                          ? "danger"
                          : u.role === "DOCTOR"
                            ? "primary"
                            : "gray"
                      }
                      className="text-[10px] capitalize"
                    >
                      {u.role?.toLowerCase()}
                    </Badge>
                    {!u.isActive && (
                      <Badge variant="danger" className="text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted">{u.email}</p>
                  {u.doctor && (
                    <p className="text-xs text-primary-500">
                      {u.doctor.specialty} · {u.doctor.status?.toLowerCase()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-xs text-ink-muted hidden sm:block">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                  <Button
                    variant={u.isActive ? "outline" : "primary"}
                    size="sm"
                    onClick={() => toggleMutation.mutate(u.id)}
                    loading={toggleMutation.isPending}
                    leftIcon={
                      u.isActive ? <UserX size={12} /> : <UserCheck size={12} />
                    }
                  >
                    {u.isActive ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Doctors tab ────────────────────────────────────────────────
function DoctorsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pendingDoctors"],
    queryFn: () => adminApi.getPendingDoctors(),
  });
  const doctors = data?.data?.data ?? [];

  const verify = async (id: string, approved: boolean) => {
    try {
      await doctorsApi.verify(id, approved);
      queryClient.invalidateQueries({ queryKey: ["admin", "pendingDoctors"] });
      toast.success(approved ? "Doctor approved!" : "Doctor rejected");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {doctors.length} application(s) awaiting review
        </p>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
          <p className="text-sm text-ink-muted">All applications reviewed!</p>
        </Card>
      ) : (
        doctors.map((doc: any) => (
          <Card key={doc.id} className="p-5">
            <div className="flex items-start gap-4">
              <Avatar
                src={doc.user?.avatarUrl}
                name={doc.user?.fullName ?? "?"}
                size="lg"
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink-primary">
                  {doc.user?.fullName}
                </p>
                <p className="text-sm text-primary-500 font-medium">
                  {doc.specialty}
                </p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-ink-muted">
                  <span>{doc.qualifications}</span>
                  <span>·</span>
                  <span>{doc.experience}y exp</span>
                  {doc.licenseNumber && (
                    <>
                      <span>·</span>
                      <span>Lic: {doc.licenseNumber}</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  {doc.user?.email}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50"
                  leftIcon={<XCircle size={13} />}
                  onClick={() => verify(doc.id, false)}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  leftIcon={<CheckCircle size={13} />}
                  onClick={() => verify(doc.id, true)}
                >
                  Approve
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Reports tab ────────────────────────────────────────────────
function ReportsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => adminApi.getReports(),
  });
  const reports = data?.data?.data ?? [];
  const resolveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      adminApi.resolveReport(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      toast.success("Report resolved");
    },
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center">
          <Shield size={32} className="text-green-400 mx-auto mb-2" />
          <p className="text-sm text-ink-muted">No pending reports!</p>
        </Card>
      ) : (
        reports.map((r: any) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="danger" className="text-[10px] capitalize">
                    {r.reason?.toLowerCase().replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-ink-muted">
                    Reported by {r.reportedBy?.fullName}
                  </span>
                </div>
                {r.reportedUser && (
                  <p className="text-sm font-medium text-ink-primary">
                    User: {r.reportedUser.fullName} ({r.reportedUser.email})
                  </p>
                )}
                {r.post && (
                  <p className="text-sm text-ink-secondary mt-0.5 line-clamp-2 bg-gray-50 p-2 rounded-xl">
                    "{r.post.content}"
                  </p>
                )}
                {r.description && (
                  <p className="text-xs text-ink-muted mt-1 italic">
                    Note: "{r.description}"
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    resolveMutation.mutate({ id: r.id, action: "DISMISS" })
                  }
                >
                  Dismiss
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    resolveMutation.mutate({ id: r.id, action: "ACTION_TAKEN" })
                  }
                >
                  Take action
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Logs tab ───────────────────────────────────────────────────
function LogsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "auditLogs"],
    queryFn: () => adminApi.getAuditLogs(),
  });
  const logs = data?.data?.data ?? [];
  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : (
        logs.map((log: any) => (
          <div
            key={log.id}
            className="flex items-center gap-3 p-3.5 bg-white rounded-2xl shadow-card text-xs"
          >
            <code className="bg-primary-50 text-primary-600 px-2.5 py-1 rounded-xl font-mono text-[11px] flex-shrink-0">
              {log.action}
            </code>
            <span className="text-ink-muted flex-shrink-0 hidden sm:inline">
              {log.entity}
            </span>
            {log.user && (
              <span className="text-ink-secondary truncate flex-1">
                by {log.user.fullName}
              </span>
            )}
            <span className="ml-auto text-ink-muted flex-shrink-0 hidden sm:inline">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");

  // Mobile tab chips
  const mobileTabItems: Array<{ id: Tab; label: string; icon: any }> = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "users", label: "Users", icon: Users },
    { id: "doctors", label: "Doctors", icon: Stethoscope },
    { id: "reports", label: "Reports", icon: AlertTriangle },
    { id: "logs", label: "Logs", icon: FileText },
  ];

  return (
    <div className="max-w-app mx-auto px-4 py-5">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-primary">Admin Panel</h1>
        <p className="text-sm text-ink-muted">
          Platform management and analytics
        </p>
      </div>

      {/* Mobile tab chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 lg:hidden">
        {mobileTabItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              "flex items-center gap-1.5 px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all",
              tab === id
                ? "bg-primary-500 text-white shadow-sm"
                : "bg-white border border-gray-200 text-ink-secondary hover:border-primary-300",
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Desktop: 2-col | Mobile: 1-col ── */}
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        {/* Left sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar tab={tab} setTab={setTab} />
        </div>

        {/* Main content */}
        <div>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {tab === "overview" && <OverviewTab />}
            {tab === "users" && <UsersTab />}
            {tab === "doctors" && <DoctorsTab />}
            {tab === "reports" && <ReportsTab />}
            {tab === "logs" && <LogsTab />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
