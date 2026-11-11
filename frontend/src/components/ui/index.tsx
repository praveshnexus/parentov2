import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Star } from 'lucide-react';
import clsx from 'clsx';

// ── Button ────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary', size = 'md', loading, leftIcon, rightIcon,
  children, className, disabled, fullWidth, ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const variants = {
    primary: 'bg-primary-500 text-white rounded-pill shadow-sm hover:bg-primary-600',
    outline: 'border-2 border-primary-500 text-primary-500 bg-white rounded-pill hover:bg-primary-50',
    ghost:   'text-ink-secondary rounded-xl hover:bg-gray-100',
    danger:  'bg-red-500 text-white rounded-pill shadow-sm hover:bg-red-600',
  };
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
Button.displayName = 'Button';

// ── Input ─────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, hint, leftIcon, rightIcon, className, ...props
}, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-ink-primary mb-1.5">{label}</label>
    )}
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted">{leftIcon}</span>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary-100',
          error ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-primary-400',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          className
        )}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted">{rightIcon}</span>
      )}
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    {hint && !error && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
  </div>
));
Input.displayName = 'Input';

// ── TextArea ──────────────────────────────────────────────────
interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-ink-primary mb-1.5">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted resize-none',
          'focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all duration-150',
          error ? 'border-red-400' : 'border-gray-200 focus:border-primary-400',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
);
TextArea.displayName = 'TextArea';

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, className, onClick, ...rest }: {
  children: ReactNode; className?: string; onClick?: () => void; [k: string]: unknown;
}) {
  return (
    <div
      className={clsx('bg-white rounded-card shadow-card', onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow duration-200', className)}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'outline';
  className?: string;
}
export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-500 text-white',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger:  'bg-red-100 text-red-700',
    gray:    'bg-gray-100 text-ink-secondary',
    outline: 'border border-primary-400 text-primary-600 bg-white',
  };
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-badge text-xs font-semibold px-2.5 py-0.5', variants[variant], className)}>
      {children}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────
interface AvatarProps { src?: string | null; name?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string; }
export function Avatar({ src, name = '', size = 'md', className }: AvatarProps) {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-[72px] h-[72px] text-xl',
  };
  const initials = (name || '')
    .trim()
    .split(/\s+/)
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
  if (src) {
    return <img src={src} alt={name || 'Avatar'} className={clsx('rounded-full object-cover flex-shrink-0', sizes[size], className)} />;
  }
  return (
    <div className={clsx('rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold flex-shrink-0', sizes[size], className)}>
      {initials}
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────
export function StarRating({ rating, max = 5, size = 14 }: { rating: number; max?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
      <span className="text-xs text-ink-secondary ml-1 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
interface ModalProps { isOpen: boolean; onClose: () => void; title?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg'; }
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={clsx(
              'w-full bg-white rounded-t-3xl md:rounded-card shadow-xl overflow-hidden',
              `md:${sizes[size]}`
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-ink-primary">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={18} className="text-ink-secondary" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx('animate-spin text-primary-500', className)} />;
}

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse bg-gray-100 rounded-xl', className)} />;
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4 text-primary-400">
        {icon}
      </div>
      <h3 className="font-semibold text-ink-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-muted mb-5 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0" />
        <h2 className="text-base font-semibold text-ink-primary">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ── Page Header (top bar matching designer style) ─────────────
export function PageHeader({ title, subtitle, back, actions }: {
  title: string; subtitle?: string; back?: ReactNode; actions?: ReactNode;
}) {
  return (
    <div className="bg-white shadow-top sticky top-16 z-20 px-4 py-3">
      <div className="flex items-center gap-3">
        {back}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-ink-primary leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-primary-500 font-medium">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export { ErrorBoundary } from './ErrorBoundary';
