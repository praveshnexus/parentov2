import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/components/layout';
import { Button, Input } from '@/components/ui';

const schema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const from = (location.state as any)?.from?.pathname ?? '/dashboard';

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Invalid email or password');
    }
  };

  const handleQuickDemoLogin = async (email: string, pw: string, label: string) => {
    setValue('email', email);
    setValue('password', pw);
    setDemoLoading(label);
    try {
      await login(email, pw);
      toast.success(`Signed in as ${label}`);
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Demo login failed');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-5">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-ink-primary">Welcome back!</h2>
          <p className="text-sm text-ink-muted mt-1">Sign in to your Parento account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email or username"
            type="text"
            placeholder="you@example.com or parent"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button type="button" onClick={() => setShowPw(!showPw)} className="focus:outline-none">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-primary-500 font-medium hover:text-primary-600">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={isSubmitting || !!demoLoading} size="lg">
            Sign in
          </Button>
        </form>

        {/* Quick 1-Click Demo / Dummy Login */}
        <div className="bg-primary-50/70 border border-primary-100 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-xs text-primary-700">Quick 1-Click Demo Login:</p>
            <span className="text-[10px] bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
              Instant
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={!!demoLoading || isSubmitting}
              onClick={() => handleQuickDemoLogin('parent@parento.com', 'Parent@123', 'Parent')}
              className="px-2 py-2.5 bg-white rounded-xl text-xs font-semibold text-ink-primary shadow-sm border border-gray-100 hover:border-primary-400 hover:bg-primary-50/50 transition-all text-center flex flex-col items-center gap-1 active:scale-95 disabled:opacity-50"
            >
              <span className="text-base">👤</span>
              <span className="font-semibold text-[11px] text-ink-primary">Parent</span>
            </button>
            <button
              type="button"
              disabled={!!demoLoading || isSubmitting}
              onClick={() => handleQuickDemoLogin('doctor@parento.com', 'Doctor@123', 'Doctor')}
              className="px-2 py-2.5 bg-white rounded-xl text-xs font-semibold text-ink-primary shadow-sm border border-gray-100 hover:border-primary-400 hover:bg-primary-50/50 transition-all text-center flex flex-col items-center gap-1 active:scale-95 disabled:opacity-50"
            >
              <span className="text-base">🩺</span>
              <span className="font-semibold text-[11px] text-ink-primary">Doctor</span>
            </button>
            <button
              type="button"
              disabled={!!demoLoading || isSubmitting}
              onClick={() => handleQuickDemoLogin('admin@parento.com', 'Admin@123', 'Admin')}
              className="px-2 py-2.5 bg-white rounded-xl text-xs font-semibold text-ink-primary shadow-sm border border-gray-100 hover:border-primary-400 hover:bg-primary-50/50 transition-all text-center flex flex-col items-center gap-1 active:scale-95 disabled:opacity-50"
            >
              <span className="text-base">🛡️</span>
              <span className="font-semibold text-[11px] text-ink-primary">Admin</span>
            </button>
          </div>

          <p className="text-[11px] text-ink-muted text-center leading-relaxed pt-0.5">
            You can also log in with any dummy email (e.g. <span className="font-mono text-primary-600">test@dummy.com</span>).
          </p>
        </div>

        <p className="text-center text-sm text-ink-secondary">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-500 font-semibold hover:text-primary-600">
            Sign up free
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
