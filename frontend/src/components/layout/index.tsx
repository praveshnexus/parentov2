import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BarChart2, Users, Stethoscope, User, Bell, Baby,
  Shield, Sparkles, MessageCircle, Search, BookOpen, LogOut,
  ChevronDown, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/services';
import clsx from 'clsx';
import { useSocket } from '@/context/SocketContext';

// ── Per-role nav ───────────────────────────────────────────────
const parentDesktopNav = [
  { path: '/dashboard', label: 'Home',      icon: Home },
  { path: '/track',     label: 'Track',     icon: BarChart2 },
  { path: '/consult',   label: 'Consult',   icon: Stethoscope },
  { path: '/learn',     label: 'Learn',     icon: BookOpen },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/messages',  label: 'Messages',  icon: MessageCircle },
];
const doctorDesktopNav = [
  { path: '/dashboard', label: 'Home',      icon: Home },
  { path: '/doctor',    label: 'Dashboard', icon: Stethoscope },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/messages',  label: 'Messages',  icon: MessageCircle },
];
const adminDesktopNav = [
  { path: '/dashboard', label: 'Home',      icon: Home },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/admin',     label: 'Admin',     icon: Shield },
];

// Mobile bottom nav — exactly 5 items per designer
const parentBottomNav = [
  { path: '/dashboard', label: 'Home',      icon: Home },
  { path: '/track',     label: 'Track',     icon: BarChart2 },
  { path: '/consult',   label: 'Consult',   icon: Stethoscope },
  { path: '/learn',     label: 'Learn',     icon: BookOpen },
  { path: '/community', label: 'Community', icon: Users },
];
const doctorBottomNav = [
  { path: '/dashboard', label: 'Home',      icon: Home },
  { path: '/doctor',    label: 'Consult',   icon: Stethoscope },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/messages',  label: 'Messages',  icon: MessageCircle },
  { path: '/profile',   label: 'Profile',   icon: User },
];
const adminBottomNav = [
  { path: '/dashboard', label: 'Home',      icon: Home },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/admin',     label: 'Admin',     icon: Shield },
  { path: '/profile',   label: 'Profile',   icon: User },
];

// ── Profile dropdown (desktop) ───────────────────────────────────
function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/'); onClose(); };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-card-hover border border-gray-100 overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-gray-100 bg-primary-50">
        <p className="text-sm font-semibold text-ink-primary truncate">{user?.fullName}</p>
        <p className="text-xs text-ink-muted truncate">{user?.email}</p>
      </div>
      <div className="py-1.5">
        {[
          { label: 'My Profile',       path: '/profile' },
          { label: 'Notifications',    path: '/notifications' },
          { label: 'Search',           path: '/search' },
        ].map(({ label, path }) => (
          <Link key={path} to={path} onClick={onClose}
            className="flex items-center px-4 py-2.5 text-sm text-ink-secondary hover:bg-gray-50 hover:text-ink-primary transition-colors">
            {label}
          </Link>
        ))}
      </div>
      <div className="border-t border-gray-100 py-1.5">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </motion.div>
  );
}

// ── Mobile navigation drawer ─────────────────────────────────────
// The refreshed top-nav design moves primary navigation into a
// horizontal desktop bar, but on narrow screens that bar is hidden
// and the bottom tab bar only fits 5 items — so routes like
// Messages/Profile still need a reachable entry point. This drawer
// (opened via the hamburger button below) carries the full,
// role-aware nav list plus sign-out, preserving that reachability.
function MobileNavDrawer({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems =
    user?.role === 'ADMIN'  ? adminDesktopNav :
    user?.role === 'DOCTOR' ? doctorDesktopNav :
    parentDesktopNav;

  const handleLogout = async () => { await logout(); navigate('/'); onClose(); };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
            <Baby size={16} className="text-white" />
          </div>
          <span className="font-bold text-ink-primary">Parento</span>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <X size={16} className="text-ink-muted" />
        </button>
      </div>

      <Link to="/profile" onClick={onClose}
        className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 hover:bg-primary-50 transition-colors">
        <Avatar src={user?.avatarUrl} name={user?.fullName ?? ''} size="md" />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-ink-primary truncate">{user?.fullName}</p>
          <p className="text-xs text-ink-muted truncate">{user?.email}</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path} onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all',
                isActive ? 'bg-primary-500 text-white shadow-sm' : 'text-ink-secondary hover:bg-gray-100 hover:text-ink-primary',
              )}>
              <Icon size={18} className={isActive ? 'text-white' : 'text-ink-muted'} />
              {label}
            </Link>
          );
        })}
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-0.5">
          {[
            { path: '/search', label: 'Search', icon: Search },
            { path: '/notifications', label: 'Notifications', icon: Bell },
          ].map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium text-ink-muted hover:bg-gray-100 hover:text-ink-primary transition-colors">
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Top Navigation Bar ───────────────────────────────────────────
export function TopNav() {
  const { user } = useAuth();
  const location = useLocation();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.data?.data?.count ?? 0;

  // Real-time notification updates over socket — restored from the
  // original implementation so badge/list counts stay live.
  useEffect(() => {
    if (!socket) return;

    const onNotification = (data: any) => {
      console.log('🔥 Notification received', data);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    };

    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, [socket, queryClient]);

  const desktopNav =
    user?.role === 'ADMIN'  ? adminDesktopNav :
    user?.role === 'DOCTOR' ? doctorDesktopNav :
    parentDesktopNav;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-top h-14 md:h-16">
        <div className="h-full max-w-app mx-auto px-4 flex items-center gap-3">

          {/* Mobile hamburger — opens full nav drawer */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <Menu size={20} className="text-ink-secondary" />
            </button>
          )}

          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm">
              <Baby size={16} className="text-white" />
            </div>
            <span className="font-bold text-[15px] text-ink-primary hidden sm:block">Parento</span>
          </Link>

          {/* Desktop nav links */}
          {user && (
            <nav className="hidden lg:flex items-center gap-0.5 ml-4 flex-1">
              {desktopNav.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link key={path} to={path}
                    className={clsx(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all',
                      isActive
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'text-ink-secondary hover:bg-gray-100 hover:text-ink-primary'
                    )}>
                    <Icon size={15} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Spacer */}
          <div className="flex-1 lg:flex-none" />

          {/* Right actions */}
          {user ? (
            <div className="flex items-center gap-0.5">
              {/* AI assistant (parents only — the /ai route is parent-only) */}
              {user.role === 'PARENT' && <Link to="/ai" title="Parento AI"
                className={clsx(
                  'w-9 h-9 flex items-center justify-center rounded-full transition-colors',
                  location.pathname === '/ai' ? 'text-primary-500 bg-primary-50' : 'text-ink-secondary hover:bg-gray-100'
                )}>
                <Sparkles size={18} />
              </Link>}

              {/* Search */}
              <Link to="/search"
                className={clsx(
                  'w-9 h-9 flex items-center justify-center rounded-full transition-colors',
                  location.pathname === '/search' ? 'text-primary-500 bg-primary-50' : 'text-ink-secondary hover:bg-gray-100'
                )}>
                <Search size={18} />
              </Link>

              {/* Notifications */}
              <Link to="/notifications"
                className={clsx(
                  'relative w-9 h-9 flex items-center justify-center rounded-full transition-colors',
                  location.pathname === '/notifications' ? 'text-primary-500 bg-primary-50' : 'text-ink-secondary hover:bg-gray-100'
                )}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-red-500 rounded-full border border-white" />
                )}
              </Link>

              {/* Profile dropdown — desktop */}
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors">
                  <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                  <ChevronDown size={14} className={clsx('text-ink-muted transition-transform', profileOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <ProfileDropdown onClose={() => setProfileOpen(false)} />
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile profile avatar */}
              <Link to="/profile" className="lg:hidden ml-0.5">
                <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium text-ink-secondary px-3 py-1.5 hover:text-ink-primary transition-colors hidden sm:block">
                Sign in
              </Link>
              <Link to="/signup" className="btn-primary btn-sm text-xs">Get started</Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile navigation drawer — fully wired with role-aware links */}
      <AnimatePresence>
        {mobileMenuOpen && user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl"
              onClick={e => e.stopPropagation()}>
              <MobileNavDrawer onClose={() => setMobileMenuOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Bottom tab bar — mobile only ─────────────────────────────────
export function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const items =
    user.role === 'ADMIN'  ? adminBottomNav :
    user.role === 'DOCTOR' ? doctorBottomNav :
    parentBottomNav;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-nav border-t border-gray-100">
      <div className={clsx('grid h-[60px]', `grid-cols-${items.length}`)}>
        {items.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path}
              className={clsx(
                'relative flex flex-col items-center justify-center gap-[3px] transition-colors',
                isActive ? 'text-primary-500' : 'text-ink-muted'
              )}>
              {isActive && (
                <motion.div
                  layoutId="tabIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2.5px] bg-primary-500 rounded-b-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── App Layout ───────────────────────────────────────────────────
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-bg">
      <TopNav />
      <main className="pt-14 md:pt-16 pb-20 lg:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

// ── Auth Layout ────────────────────────────────────────────────
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <div className="bg-primary-500 pt-12 pb-16 px-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-3">
          <Baby size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Parento</h1>
        <p className="text-primary-100 text-sm mt-1">Your trusted companion in parenting</p>
      </div>
      <div className="flex-1 -mt-6 bg-surface-bg rounded-t-3xl px-5 pt-6 pb-8 max-w-md mx-auto w-full">
        {children}
      </div>
    </div>
  );
}
