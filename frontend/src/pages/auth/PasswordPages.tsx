import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/services';
import { AuthLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';

// ── Forgot Password ────────────────────────────────────────────
const forgotSchema = z.object({ email: z.string().email('Invalid email address') });
type ForgotData = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotData) => {
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-5">
        {sent ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-ink-primary mb-2">Check your inbox</h2>
            <p className="text-sm text-ink-secondary mb-6">
              If the email exists in our system, we've sent a reset link. Check your spam folder too.
            </p>
            <Link to="/login" className="text-primary-500 font-semibold text-sm hover:text-primary-600">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-ink-primary">Forgot password?</h2>
              <p className="text-sm text-ink-muted mt-1">Enter your email to receive a reset link</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail size={16} />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" fullWidth loading={isSubmitting} size="lg">
                Send reset link
              </Button>
            </form>

            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-ink-secondary hover:text-ink-primary transition-colors">
              <ArrowLeft size={15} /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

// ── Reset Password ─────────────────────────────────────────────
const resetSchema = z.object({
  password: z.string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type ResetData = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetData) => {
    try {
      await authApi.resetPassword(token, data.password);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Reset link may be expired. Request a new one.');
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-5">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-ink-primary">Set new password</h2>
          <p className="text-sm text-ink-muted mt-1">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New password"
            type={showPw ? 'text' : 'password'}
            placeholder="At least 8 characters"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button type="button" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm new password"
            type={showPw ? 'text' : 'password'}
            placeholder="Repeat your password"
            leftIcon={<Lock size={16} />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" fullWidth loading={isSubmitting} size="lg">
            Reset password
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
