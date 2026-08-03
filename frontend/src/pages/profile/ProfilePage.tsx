import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, Lock, Calendar, LogOut, Trash2, Eye, EyeOff, User, Mail, Phone, Edit2, ChevronRight, CheckCircle, Shield, Bell, MessageCircle, Sparkles, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { userApi, appointmentsApi, authApi } from '@/api/services';
import { Card, Avatar, Button, Input, Badge, Modal,EmptyState, SectionHeader, TextArea } from '@/components/ui';
import type { Appointment } from '@/types';
import clsx from 'clsx';

// ── Change Password Modal ──────────────────────────────────────
const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type PwForm = z.infer<typeof pwSchema>;

function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [show, setShow] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PwForm>({ resolver: zodResolver(pwSchema) });
  const onSubmit = async (data: PwForm) => {
    try { await authApi.changePassword(data.currentPassword, data.newPassword); toast.success('Password changed!'); reset(); onClose(); }
    catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
        <Input label="Current password" type={show ? 'text' : 'password'} leftIcon={<Lock size={15} />}
          rightIcon={<button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>}
          error={errors.currentPassword?.message} {...register('currentPassword')} />
        <Input label="New password" type={show ? 'text' : 'password'} leftIcon={<Lock size={15} />} error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm new password" type={show ? 'text' : 'password'} leftIcon={<Lock size={15} />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" fullWidth loading={isSubmitting}>Change Password</Button>
      </form>
    </Modal>
  );
}

function DeleteAccountModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState('');
  const mutation = useMutation({
    mutationFn: () => userApi.deleteAccount(),
    onSuccess: async () => { await logout(); navigate('/'); toast.success('Account deleted'); },
  });
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Account">
      <div className="px-5 py-4 space-y-4">
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
          <p className="text-sm font-semibold text-red-700">⚠️ This action is permanent</p>
          <p className="text-xs text-red-600 mt-1">All your data including children's records and posts will be deleted.</p>
        </div>
        <div><label className="block text-sm font-medium text-ink-primary mb-1.5">Type <strong>DELETE</strong> to confirm</label>
          <Input placeholder="DELETE" value={confirmed} onChange={e => setConfirmed(e.target.value)} /></div>
        <Button variant="danger" fullWidth loading={mutation.isPending} disabled={confirmed !== 'DELETE'} onClick={() => mutation.mutate()}>Delete permanently</Button>
      </div>
    </Modal>
  );
}

const profileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  bio: z.string().max(300).optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

// ── Left profile sidebar ───────────────────────────────────────
function ProfileSidebar({ tab, setTab }: { tab: string; setTab: (t: any) => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarMutation = useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(file),
    onSuccess: () => toast.success('Avatar updated!'),
  });

  const navItems = [
    { id: 'profile',      label: 'My Profile',     icon: User },
    { id: 'appointments', label: 'Appointments',   icon: Calendar },
    { id: 'security',     label: 'Security',       icon: Shield },
  ];

  const quickLinks = [
    { label: 'Notifications', icon: Bell,          path: '/notifications' },
    { label: 'Messages',      icon: MessageCircle, path: '/messages' },
    { label: 'AI Assistant',  icon: Sparkles,      path: '/ai',      role: 'PARENT' },
    { label: 'Settings',      icon: Settings,      path: '/profile' },
  ].filter(l => !(l as any).role || (l as any).role === user?.role);

  return (
    <Card className="overflow-hidden sticky top-36">
      {/* Profile hero */}
      <div className="bg-primary-500 px-5 pt-6 pb-8 text-center">
        <div className="relative inline-block mb-3">
          <Avatar src={user?.avatarUrl} name={user?.fullName ?? ''} size="xl" className="w-20 h-20 border-4 border-white/30" />
          <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors">
            <Camera size={13} className="text-primary-500" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) avatarMutation.mutate(f); }} className="hidden" />
        </div>
        <p className="font-bold text-white">{user?.fullName}</p>
        <p className="text-primary-100 text-xs mt-0.5">{user?.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge variant="gray" className="capitalize bg-white/20 text-white border-0">{user?.role?.toLowerCase()}</Badge>
          {user?.isEmailVerified && <span className="flex items-center gap-1 text-xs text-white/80"><CheckCircle size={11} className="text-green-300" /> Verified</span>}
        </div>
      </div>

      {/* Nav */}
      <div className="p-3 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={clsx('w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors',
              tab === id ? 'bg-primary-50 text-primary-600' : 'text-ink-secondary hover:bg-gray-100'
            )}>
            <Icon size={16} className={tab === id ? 'text-primary-500' : 'text-ink-muted'} />
            {label}
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div className="px-3 pb-3 border-t border-gray-100 pt-3">
        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide px-4 mb-2">Quick links</p>
        {quickLinks.map(({ label, icon: Icon, path }) => (
          <Link key={label} to={path}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-ink-secondary hover:bg-gray-100 hover:text-ink-primary transition-colors">
            <Icon size={15} className="text-ink-muted" />
            {label}
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button onClick={async () => { await logout(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={16} />Sign out
        </button>
      </div>
    </Card>
  );
}

// ── Profile tab ────────────────────────────────────────────────
function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName, phone: user?.phone ?? '', bio: user?.bio ?? '' },
  });
  const onSubmit = async (data: ProfileForm) => {
    try { await userApi.updateProfile(data); await refreshUser(); toast.success('Profile updated!'); setEditMode(false); }
    catch { toast.error('Failed to update profile'); }
  };
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader title="Personal information" />
        <button onClick={() => setEditMode(!editMode)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary-500 hover:text-primary-600">
          <Edit2 size={14} />{editMode ? 'Cancel' : 'Edit'}
        </button>
      </div>
      {editMode ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full name" leftIcon={<User size={15} />} error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Email" leftIcon={<Mail size={15} />} value={user?.email} disabled className="opacity-50" />
          <Input label="Phone" leftIcon={<Phone size={15} />} {...register('phone')} />
          <TextArea label="Bio" rows={3} placeholder="Tell the community about yourself..." {...register('bio')} />
          {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
        </form>
      ) : (
        <div className="space-y-4">
          {[
            { icon: User,  label: 'Full name', value: user?.fullName },
            { icon: Mail,  label: 'Email',     value: user?.email },
            { icon: Phone, label: 'Phone',     value: user?.phone || 'Not set' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-white shadow-card flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-ink-muted">{label}</p>
                <p className="text-sm font-semibold text-ink-primary mt-0.5">{value}</p>
              </div>
            </div>
          ))}
          {user?.bio && (
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-xs text-ink-muted mb-1">Bio</p>
              <p className="text-sm text-ink-secondary">{user.bio}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Appointments tab ───────────────────────────────────────────
function AppointmentsTab() {
  const { data } = useQuery({ queryKey: ['appointments'], queryFn: () => appointmentsApi.list() });
  const appointments: Appointment[] = data?.data?.data ?? [];

  const STATUS_BADGE: Record<string, any> = {
    CONFIRMED: <Badge variant="primary">Upcoming</Badge>,
    PENDING:   <Badge variant="warning">Pending</Badge>,
    COMPLETED: <Badge variant="success">Completed</Badge>,
    CANCELLED: <Badge variant="danger">Cancelled</Badge>,
    NO_SHOW:   <Badge variant="gray">No show</Badge>,
  };

  if (appointments.length === 0) return (
    <Card className="p-6">
      <EmptyState icon={<Calendar size={28} />} title="No appointments yet" description="Book your first appointment with a specialist." />
    </Card>
  );

  return (
    <div className="space-y-3">
      {appointments.map(appt => (
        <Card key={appt.id} className="p-5">
          <div className="flex items-start gap-4">
            <Avatar src={appt.doctor.user?.avatarUrl} name={appt.doctor.user?.fullName ?? '?'} size="lg" className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-ink-primary">{appt.doctor.user?.fullName}</p>
                  <p className="text-sm text-primary-500">{appt.doctor.specialty}</p>
                </div>
                {STATUS_BADGE[appt.status]}
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-ink-muted">
                <span>📅 {format(new Date(appt.scheduledAt), 'EEE, MMM d yyyy • h:mm a')}</span>
                <span className="capitalize">📞 {appt.mode?.toLowerCase().replace('_', ' ')}</span>
                <span>⏱ {appt.durationMinutes} min</span>
                {appt.amountPaid && <span className="text-green-600 font-medium">₹{(appt.amountPaid / 100).toFixed(0)} paid</span>}
              </div>
              {appt.reason && <p className="text-sm text-ink-secondary mt-2 italic">"{appt.reason}"</p>}
              {appt.notes && <p className="text-sm text-ink-secondary mt-1 bg-gray-50 rounded-xl p-2.5">{appt.notes}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Security tab ───────────────────────────────────────────────
function SecurityTab({ onChangePw, onDelete }: { onChangePw: () => void; onDelete: () => void }) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <button onClick={onChangePw} className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0"><Lock size={20} className="text-primary-500" /></div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-ink-primary">Change password</p>
            <p className="text-sm text-ink-muted">Keep your account secure with a strong password</p>
          </div>
          <ChevronRight size={18} className="text-ink-muted flex-shrink-0" />
        </button>
      </Card>
      <Card className="overflow-hidden border border-red-100">
        <button onClick={onDelete} className="w-full flex items-center gap-4 p-5 hover:bg-red-50 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0"><Trash2 size={20} className="text-red-500" /></div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-red-600">Delete account</p>
            <p className="text-sm text-red-400">Permanently remove all your data from Parento</p>
          </div>
          <ChevronRight size={18} className="text-red-300 flex-shrink-0" />
        </button>
      </Card>
    </div>
  );
}

// ── Main Profile Page ──────────────────────────────────────────
export default function ProfilePage() {
  const [tab, setTab] = useState<'profile' | 'appointments' | 'security'>('profile');
  const [showPw, setShowPw] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="max-w-app mx-auto px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink-primary">My Account</h1>
        <p className="text-sm text-ink-muted">Manage your profile and preferences</p>
      </div>

      {/* ── Desktop: 2-col | Mobile: stacked ── */}
      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6">
        {/* Left sidebar */}
        <div className="hidden lg:block">
          <ProfileSidebar tab={tab} setTab={setTab} />
        </div>

        {/* Mobile tab bar */}
        <div className="lg:hidden flex bg-white rounded-2xl shadow-card overflow-hidden mb-4">
          {[
            { id: 'profile'      as const, label: 'Profile',      icon: User },
            { id: 'appointments' as const, label: 'Appointments', icon: Calendar },
            { id: 'security'     as const, label: 'Security',     icon: Shield },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={clsx('flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold border-b-2 transition-colors',
                tab === id ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-transparent text-ink-muted'
              )}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div>
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {tab === 'profile'      && <ProfileTab />}
            {tab === 'appointments' && <AppointmentsTab />}
            {tab === 'security'     && <SecurityTab onChangePw={() => setShowPw(true)} onDelete={() => setShowDelete(true)} />}
          </motion.div>
        </div>
      </div>

      <ChangePasswordModal isOpen={showPw}    onClose={() => setShowPw(false)} />
      <DeleteAccountModal  isOpen={showDelete} onClose={() => setShowDelete(false)} />
    </div>
  );
}
