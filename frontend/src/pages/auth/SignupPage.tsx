import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Baby,
  Stethoscope
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/components/layout";
import { Button, Input } from "@/components/ui";
import clsx from "clsx";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number"),
  role: z.enum(["PARENT", "DOCTOR"]),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"PARENT" | "DOCTOR">(
    "PARENT",
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "PARENT" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await signup(data);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ?? "Signup failed. Please try again.",
      );
    }
  };

  const roles = [
    {
      value: "PARENT" as const,
      label: "Parent",
      icon: Baby,
      desc: "Track my child's growth",
    },
    {
      value: "DOCTOR" as const,
      label: "Doctor",
      icon: Stethoscope,
      desc: "Consult with families",
    },
  ];


  return (
    <AuthLayout>
      <div className="space-y-4">
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold text-ink-primary">
            Create your account
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            Join thousands of parents on Parento
          </p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          {roles.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSelectedRole(value);
                setValue("role", value);
              }}
              className={clsx(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
                selectedRole === value
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-100 bg-white hover:border-primary-200",
              )}
            >
              <div
                className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  selectedRole === value ? "bg-primary-500" : "bg-gray-100",
                )}
              >
                <Icon
                  size={20}
                  className={
                    selectedRole === value ? "text-white" : "text-ink-muted"
                  }
                />
              </div>
              <div>
                <p
                  className={clsx(
                    "text-sm font-bold",
                    selectedRole === value
                      ? "text-primary-600"
                      : "text-ink-primary",
                  )}
                >
                  {label}
                </p>
                <p className="text-[11px] text-ink-muted">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <Input
            label="Full name"
            placeholder="Jane Smith"
            leftIcon={<User size={16} />}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="+91 98765 43210"
            leftIcon={<Phone size={16} />}
            {...register("phone")}
          />
          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            placeholder="Create a strong password"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button type="button" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password?.message}
            {...register("password")}
          />

          <Button type="submit" fullWidth loading={isSubmitting} size="lg">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-ink-secondary">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary-500 font-semibold hover:text-primary-600"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
