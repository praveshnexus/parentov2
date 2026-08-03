import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, Reply, Calendar, Shield, Check, TrendingUp, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { notificationsApi } from '@/api/services';
import { Card, Button, Avatar, Skeleton, EmptyState, SectionHeader } from '@/components/ui';
import type { Notification } from '@/types';
import clsx from 'clsx';

const TYPE_CFG: Record<string, { icon: any; color: string; bg: string }> = {
  LIKE:                  { icon: Heart,          color: 'text-red-500',     bg: 'bg-red-50' },
  COMMENT:               { icon: MessageCircle,  color: 'text-blue-500',    bg: 'bg-blue-50' },
  REPLY:                 { icon: Reply,          color: 'text-purple-500',  bg: 'bg-purple-50' },
  APPOINTMENT_BOOKED:    { icon: Calendar,       color: 'text-green-500',   bg: 'bg-green-50' },
  APPOINTMENT_CONFIRMED: { icon: Calendar,       color: 'text-green-500',   bg: 'bg-green-50' },
  APPOINTMENT_CANCELLED: { icon: Calendar,       color: 'text-red-500',     bg: 'bg-red-50' },
  APPOINTMENT_REMINDER:  { icon: Calendar,       color: 'text-amber-500',   bg: 'bg-amber-50' },
  DOCTOR_VERIFIED:       { icon: Shield,         color: 'text-primary-500', bg: 'bg-primary-50' },
  MENTION:               { icon: MessageCircle,  color: 'text-primary-500', bg: 'bg-primary-50' },
  SYSTEM:                { icon: Bell,           color: 'text-ink-secondary',bg:'bg-gray-100' },
};

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const cfg = TYPE_CFG[notif.type] ?? TYPE_CFG.SYSTEM;
  const Icon = cfg.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div onClick={() => !notif.isRead && onRead(notif.id)}
        className={clsx('flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all',
          notif.isRead ? 'bg-white shadow-card' : 'bg-primary-50 border border-primary-100'
        )}>
        <div className="relative flex-shrink-0">
          {notif.actor
            ? <Avatar src={notif.actor.avatarUrl} name={notif.actor.fullName} size="md" />
            : <div className={clsx('w-11 h-11 rounded-full flex items-center justify-center', cfg.bg)}><Icon size={18} className={cfg.color} /></div>
          }
          {notif.actor && (
            <div className={clsx('absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm bg-white')}>
              <Icon size={11} className={cfg.color} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm leading-snug', notif.isRead ? 'font-medium text-ink-primary' : 'font-semibold text-ink-primary')}>{notif.title}</p>
          <p className="text-xs text-ink-secondary mt-0.5 line-clamp-2">{notif.body}</p>
          <p className="text-[11px] text-ink-muted mt-1">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
        </div>
        {!notif.isRead && <div className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
      </div>
    </motion.div>
  );
}

// ── Right sidebar ──────────────────────────────────────────────
function NotifSidebar() {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionHeader title="Activity summary" />
        <div className="space-y-3 mt-2">
          {[
            { icon: Heart,          label: 'Likes received',     value: '12', color: 'bg-red-50 text-red-500' },
            { icon: MessageCircle,  label: 'Comments',           value: '5',  color: 'bg-blue-50 text-blue-500' },
            { icon: Calendar,       label: 'Appointments',       value: '2',  color: 'bg-green-50 text-green-500' },
            { icon: Users,          label: 'Community mentions', value: '3',  color: 'bg-purple-50 text-purple-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', color)}><Icon size={14} /></div>
              <span className="text-sm text-ink-secondary flex-1">{label}</span>
              <span className="text-sm font-bold text-ink-primary">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <SectionHeader title="Quick actions" />
        <div className="space-y-2 mt-1">
          {[
            { label: 'Go to community', path: '/community', icon: Users },
            { label: 'Book appointment', path: '/consult',   icon: Calendar },
            { label: 'Track growth',     path: '/track',     icon: TrendingUp },
          ].map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 transition-colors group">
              <Icon size={15} className="text-ink-muted group-hover:text-primary-500 transition-colors" />
              <span className="text-sm text-ink-secondary group-hover:text-primary-600">{label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list() });
  const notifications: Notification[] = data?.data?.data ?? [];

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const today       = notifications.filter(n => { const d = new Date(n.createdAt); const now = new Date(); return d.toDateString() === now.toDateString(); });
  const earlier     = notifications.filter(n => { const d = new Date(n.createdAt); const now = new Date(); return d.toDateString() !== now.toDateString(); });

  return (
    <div className="max-w-app mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink-primary">Notifications</h1>
          <p className="text-sm text-ink-muted">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" leftIcon={<Check size={13} />} onClick={() => markAllMutation.mutate()} loading={markAllMutation.isPending}>
            Mark all read
          </Button>
        )}
      </div>

      {/* ── Desktop: 2-col | Mobile: 1-col ── */}
      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
        {/* Notifications list */}
        <div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : notifications.length === 0 ? (
            <Card className="p-8"><EmptyState icon={<Bell size={32} />} title="No notifications yet" description="When someone likes your post or books an appointment, you'll see it here." /></Card>
          ) : (
            <div className="space-y-5">
              {today.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3 px-1">Today</p>
                  <div className="space-y-2">
                    {today.map((n, i) => (
                      <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <NotifItem notif={n} onRead={id => markReadMutation.mutate(id)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {earlier.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3 px-1">Earlier</p>
                  <div className="space-y-2">
                    {earlier.map((n, i) => (
                      <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <NotifItem notif={n} onRead={id => markReadMutation.mutate(id)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="hidden lg:block">
          <NotifSidebar />
        </div>
      </div>
    </div>
  );
}
