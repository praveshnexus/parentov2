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
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const from = (location.state as any)?.from?.pathname ?? '/dashboard';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
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

  return (
    <AuthLayout>
      <div className="space-y-5">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-ink-primary">Welcome back!</h2>
          <p className="text-sm text-ink-muted mt-1">Sign in to your Parento account</p>
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

          <Button type="submit" fullWidth loading={isSubmitting} size="lg">
            Sign in
          </Button>
        </form>

        {/* Demo credentials hint */}
        <div className="bg-primary-50 rounded-2xl p-4 text-xs text-ink-secondary space-y-1">
          <p className="font-semibold text-primary-600 mb-1.5">Demo accounts:</p>
          <p>👤 parent@parento.com / Parent@123</p>
          <p>🩺 doctor@parento.com / Doctor@123</p>
          <p>🛡️ admin@parento.com / Admin@123</p>
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
