import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Baby, Stethoscope, Bell, Calendar, ArrowRight, Sparkles,
  TrendingUp, Users, BookOpen, MessageCircle, ChevronRight,
  Activity, Brain
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { formatDistanceToNow, differenceInMonths } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { childrenApi, appointmentsApi, notificationsApi, doctorsApi, postsApi } from '@/api/services';
import { Card, Avatar,  SectionHeader, StarRating } from '@/components/ui';
import type { Appointment, Notification, Doctor } from '@/types';
import clsx from 'clsx';

// ── Service tile (colorful quick-action grid) ──────────────────
function ServiceTile({ icon: Icon, label, path, bg, iconBg }: {
  icon: any; label: string; path: string; bg: string; iconBg: string;
}) {
  return (
    <Link to={path}>
      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
        className={clsx('rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 h-28 cursor-pointer transition-shadow hover:shadow-card-hover', bg)}>
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon size={22} className="text-white" />
        </div>
        <p className="text-sm font-semibold text-ink-primary text-center leading-tight">{label}</p>
      </motion.div>
    </Link>
  );
}

// ── Today's activity card ──────────────────────────────────────
function ActivityCard({ child }: { child: any }) {
  const ageMonths = child?.dateOfBirth ? differenceInMonths(new Date(), new Date(child.dateOfBirth)) : 0;
  return (
    <Card className="overflow-hidden">
      <div className="relative h-44 bg-gradient-to-br from-primary-400 to-teal-500 flex items-end">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">
            {child?.gender === 'FEMALE' ? '👧' : '👦'}
          </div>
        </div>
        <div className="relative w-full px-4 pb-3 pt-8 bg-gradient-to-t from-black/40 to-transparent">
          <p className="text-white font-semibold text-sm">Motor Skill development through play</p>
          <p className="text-white/80 text-xs mt-0.5">Age {ageMonths}m · Recommended for {child?.name}</p>
        </div>
        <button className="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center shadow-md">
          <ChevronRight size={18} className="text-white" />
        </button>
      </div>
    </Card>
  );
}

// ── Development tracking bars (real milestone data) ─────────────
function TrackingBars({ childId }: { childId: string }) {
  const { data } = useQuery({
    queryKey: ['milestones', childId],
    queryFn: () => childrenApi.getMilestones(childId),
    staleTime: 60_000,
  });
  const milestones = data?.data?.data ?? [];
  const categories = ['physical', 'cognitive', 'social', 'language'];
  const stats = categories.slice(0, 2).map(cat => {
    const all = milestones.filter((m: any) => m.category === cat);
    const done = all.filter((m: any) => m.achieved).length;
    const pct = all.length ? Math.round((done / all.length) * 100) : 65;
    const labels: Record<string, string> = { physical: 'Motor Skill', cognitive: 'Communication Skill', social: 'Social Skill', language: 'Language' };
    return { label: labels[cat] ?? cat, pct };
  });

  if (stats.length === 0) return null;
  return (
    <div className="space-y-4">
      {stats.map(({ label, pct }) => (
        <div key={label}>
          <div className="flex justify-between mb-1.5">
            <span className="text-sm font-medium text-ink-primary">{label}</span>
            <span className="text-sm font-bold text-primary-600">{pct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full bg-primary-500 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Expert Connect (real doctor data) ────────────────────────────
function ExpertConnect({ doctors }: { doctors: Doctor[] }) {
  return (
    <div>
      <SectionHeader title="Expert Connect" action={<Link to="/consult" className="text-xs text-primary-500 font-semibold">View all</Link>} />
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
        {doctors.slice(0, 4).map(doc => (
          <div key={doc.id} className="flex-shrink-0 w-44">
            <Card className="p-4 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-2.5 overflow-hidden bg-primary-50">
                <Avatar src={doc.user?.avatarUrl} name={doc.user?.fullName ?? '?'} size="lg" className="w-14 h-14" />
              </div>
              <p className="text-sm font-semibold text-ink-primary leading-tight line-clamp-1">{doc.user?.fullName}</p>
              <p className="text-xs text-primary-500 mt-0.5 line-clamp-1">{doc.specialty}</p>
              <StarRating rating={doc.rating} size={11} />
              <Link to="/consult">
                <button className="mt-3 w-full py-2 rounded-pill bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 transition-colors">
                  Book Consultation
                </button>
              </Link>
            </Card>
          </div>
        ))}
        {doctors.length === 0 && (
          <Link to="/consult" className="flex-shrink-0 w-44">
            <Card className="p-4 text-center h-full flex flex-col items-center justify-center gap-2 hover:shadow-card-hover transition-shadow">
              <Stethoscope size={24} className="text-gray-300" />
              <p className="text-xs text-ink-muted">Find doctors</p>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Community highlights (real feed data) ───────────────────────
function CommunityHighlights() {
  const { data } = useQuery({
    queryKey: ['feed'],
    queryFn: () => postsApi.getFeed(1),
    staleTime: 60_000,
  });
  const posts = data?.data?.data?.slice(0, 3) ?? [];
  return (
    <div>
      <SectionHeader title="Community Highlights" action={<Link to="/community" className="text-xs text-primary-500 font-semibold">View all</Link>} />
      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-ink-muted text-center py-2">Join the community discussion</p>
            <Link to="/community"><button className="mt-2 w-full py-2 rounded-pill border border-primary-300 text-primary-600 text-xs font-semibold hover:bg-primary-50 transition-colors">Go to Community</button></Link>
          </Card>
        ) : posts.map((post: any) => (
          <Card key={post.id} className="p-4">
            <div className="flex gap-3">
              <Avatar src={post.author?.avatarUrl} name={post.author?.fullName ?? '?'} size="sm" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-primary">{post.author?.fullName}</p>
                <p className="text-xs text-ink-muted">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                <p className="text-sm text-ink-secondary mt-1.5 line-clamp-2 leading-relaxed">{post.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PhysicalGrowthPanel({ childId }: { childId: string }) {
  const { data } = useQuery({
    queryKey: ['growth', childId],
    queryFn: () => childrenApi.getGrowth(childId),
    staleTime: 60_000,
  });
  const records = data?.data?.data ?? [];
  const latest = records[records.length - 1];
  if (!latest) return <p className="text-xs text-ink-muted text-center py-3">No growth records yet</p>;

  const stats = [
    { label: 'Height', value: latest.height ? `${latest.height} cm` : '—', pct: 75, sub: '75th percentile' },
    { label: 'Weight', value: latest.weight ? `${latest.weight} kg` : '—', pct: 65, sub: '65th percentile' },
  ];

  return (
    <div className="space-y-3.5">
      {stats.map(({ label, value, pct, sub }) => (
        <div key={label}>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-ink-primary">{label}</span>
            <span className="text-sm font-bold text-ink-primary">{value}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
              className="h-full bg-primary-500 rounded-full" />
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Recent Alerts (real notifications, preserved from original) ─
function RecentAlerts({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) return null;
  return (
    <Card className="p-4">
      <SectionHeader
        title="Recent Alerts"
        action={<Link to="/notifications" className="text-xs text-primary-500 font-semibold">View all</Link>}
      />
      <div className="space-y-2.5">
        {notifications.map((notif) => (
          <div key={notif.id} className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
            {notif.actor ? (
              <Avatar src={notif.actor.avatarUrl} name={notif.actor.fullName} size="sm" className="flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Bell size={15} className="text-primary-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink-primary">{notif.title}</p>
              <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{notif.body}</p>
              <p className="text-[10px] text-ink-muted mt-0.5">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Right sidebar (desktop) ─────────────────────────────────────
function RightPanel({ child, notifications }: { child: any; notifications: Notification[] }) {
  return (
    <div className="space-y-5">
      {/* Physical growth */}
      {child && (
        <Card className="p-4">
          <SectionHeader title="Physical Growth" />
          <PhysicalGrowthPanel childId={child.id} />
        </Card>
      )}

      {/* Recent Alerts — retained from original dashboard */}
      <RecentAlerts notifications={notifications} />

      {/* Development milestone */}
      {child && (
        <Card className="p-4">
          <SectionHeader title="Development Milestone" />
          <div className="space-y-3">
            {[
              { icon: Activity, label: 'Motor Skill', desc: 'Can run, jump, and climb stairs' },
              { icon: MessageCircle, label: 'Language', desc: 'Uses 3–4 word sentences' },
              { icon: Brain, label: 'Cognitive', desc: 'Can sort shapes and colors' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-primary">{label}</p>
                  <p className="text-xs text-ink-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Important sectors */}
      <Card className="p-4">
        <SectionHeader title="Important Sectors" />
        <div className="space-y-3">
          <div className="p-3 bg-primary-50 rounded-xl">
            <p className="text-sm font-semibold text-primary-700">Next Check-up</p>
            <p className="text-xs text-ink-muted mt-0.5">Schedule your next wellness visit</p>
            <Link to="/consult" className="text-xs font-semibold text-primary-500 hover:underline mt-1 block">Book Appointment →</Link>
          </div>
          <div className="p-3 bg-teal-400/10 rounded-xl">
            <p className="text-sm font-semibold text-teal-600">Suggested Activities</p>
            <p className="text-xs text-ink-muted mt-0.5">Age-appropriate games and exercises</p>
            <Link to="/learn" className="text-xs font-semibold text-teal-600 hover:underline mt-1 block">Know more →</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === 'DOCTOR') return <Navigate to="/doctor" replace />;

  const { data: childrenData } = useQuery({ queryKey: ['children'], queryFn: childrenApi.list, enabled: user?.role === 'PARENT' });
  const { data: appointmentsData } = useQuery({ queryKey: ['appointments'], queryFn: () => appointmentsApi.list() });
  const { data: notifData } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list() });
  const { data: doctorsData } = useQuery({ queryKey: ['doctors', '', ''], queryFn: () => doctorsApi.list() });

  const children: any[] = childrenData?.data?.data ?? [];
  const appointments: Appointment[] = appointmentsData?.data?.data ?? [];
  const notifications: Notification[] = notifData?.data?.data ?? [];
  const doctors: Doctor[] = doctorsData?.data?.data ?? [];
  const firstChild = children[0];
  const upcoming = appointments.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.scheduledAt) > new Date());
  const unread = notifications.filter(n => !n.isRead).slice(0, 5);

  // Role-filtered quick actions — preserves original per-role visibility
  const services = [
    { icon: TrendingUp, label: 'Track Progress', path: '/track', bg: 'bg-blue-50', iconBg: 'bg-primary-500', role: 'PARENT' },
    { icon: Sparkles, label: 'Parento AI', path: '/ai', bg: 'bg-primary-50', iconBg: 'bg-primary-400', role: 'PARENT' },
    { icon: Stethoscope, label: 'Consult Expert', path: '/consult', bg: 'bg-green-50', iconBg: 'bg-green-500' },
    { icon: Users, label: 'Community', path: '/community', bg: 'bg-purple-50', iconBg: 'bg-purple-500' },
    { icon: BookOpen, label: 'Learn', path: '/learn', bg: 'bg-amber-50', iconBg: 'bg-amber-500', role: 'PARENT' },
    { icon: MessageCircle, label: 'Messages', path: '/messages', bg: 'bg-teal-50', iconBg: 'bg-teal-500' },
  ].filter(s => !(s as any).role || (s as any).role === user?.role);

  return (
    <div className="max-w-app mx-auto">
      {/* ── Mobile: single col | Desktop: 2-col ── */}
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-0 lg:min-h-[calc(100vh-4rem)]">

        {/* ── Main column ── */}
        <div className="px-4 py-5 space-y-6 lg:border-r lg:border-gray-100">

          {/* Hero greeting */}
          <div className="bg-primary-500 rounded-card p-5 text-white relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm font-medium">
                  {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'},
                </p>
                <h1 className="text-2xl font-bold text-white mt-0.5">
                  {user?.fullName?.split(' ')[0]} 👋
                </h1>
                {firstChild && (
                  <p className="text-primary-200 text-sm mt-1">
                    Tracking {firstChild.name}'s journey
                  </p>
                )}
              </div>
              <Avatar src={user?.avatarUrl} name={user?.fullName ?? ''} size="lg"
                className="border-[3px] border-white/30 flex-shrink-0" />
            </div>
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: 'Children', value: children.length, icon: Baby },
                { label: 'Upcoming', value: upcoming.length, icon: Calendar },
                { label: 'Alerts', value: unread.length, icon: Bell },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/15 rounded-2xl p-3 text-center">
                  <Icon size={14} className="text-white/70 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-[10px] text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Services grid — colorful tiles, role-filtered */}
          <div>
            <SectionHeader title="Top Services" />
            <div className="grid grid-cols-2 gap-3">
              {services.map(s => <ServiceTile key={s.path} {...s} />)}
            </div>
          </div>

          {/* Today's Activity */}
          {firstChild && (
            <div>
              <SectionHeader title="Today's Activity Plan for you" />
              <ActivityCard child={firstChild} />
            </div>
          )}

          {/* Development Tracking */}
          {firstChild && (
            <div>
              <SectionHeader title="Development Tracking"
                action={<Link to="/track" className="text-xs text-primary-500 font-semibold flex items-center gap-1">View all <ArrowRight size={12} /></Link>} />
              <Card className="p-4">
                <TrackingBars childId={firstChild.id} />
              </Card>
            </div>
          )}

          {/* Expert Connect */}
          <ExpertConnect doctors={doctors} />

          {/* Community Highlights */}
          <CommunityHighlights />

          {/* Recent Alerts — shown inline on mobile since right panel is desktop-only */}
          <div className="lg:hidden">
            <RecentAlerts notifications={unread} />
          </div>
        </div>

        {/* ── Right panel (desktop only) ── */}
        <div className="hidden lg:block px-5 py-5 bg-surface-bg">
          <RightPanel child={firstChild} notifications={unread} />
        </div>
      </div>
    </div>
  );
}
