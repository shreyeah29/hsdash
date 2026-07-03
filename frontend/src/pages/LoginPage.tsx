import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { api, setAccessToken } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Role, type User } from "@/types/domain";
import { LoginBallpitBackdrop } from "@/components/login/LoginBallpitBackdrop";
import { Input } from "@/components/ui/input";

const schema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export type LoginKind = "admin" | "team";

export function LoginPage({ loginKind }: { loginKind: LoginKind }) {
  const navigate = useNavigate();
  const acceptSession = useAuthStore((s) => s.acceptSession);
  const logout = useAuthStore((s) => s.logout);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const title = loginKind === "admin" ? "Admin login" : "Team login";
  const description =
    loginKind === "admin"
      ? "Owner access — analytics, calendar, leads, and team roster."
      : "Editors & coordinators — your tailored workspace after sign-in.";

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const { data } = await api.post<{ user: User; accessToken?: string }>("/auth/login", values);
      if (data.accessToken) setAccessToken(data.accessToken);
      acceptSession(data.user);
      const user = data.user;

      if (!user) {
        setError("Could not load session. Try again.");
        return;
      }

      if (loginKind === "admin") {
        if (user.role !== Role.ADMIN) {
          await logout();
          setError("This account is not an administrator. Use Team login.");
          return;
        }
        navigate("/admin", { replace: true });
        return;
      }

      if (user.role === Role.ADMIN) {
        await logout();
        setError("Administrators sign in through Admin login.");
        return;
      }

      if (user.role === Role.COORDINATOR) {
        navigate("/coordinator", { replace: true });
        return;
      }

      if (user.role === Role.EDITOR) {
        navigate("/team", { replace: true });
        return;
      }

      await logout();
      setError("This account cannot access the staff portal.");
    } catch {
      setError("Invalid username or password.");
    }
  }

  return (
    <LoginBallpitBackdrop>
      <div className="flex min-h-full items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Link
            to="/login"
            className="mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
            <p className="text-sm text-white/65">{description}</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80">Username</label>
                <Input
                  {...form.register("username")}
                  autoComplete="username"
                  placeholder="e.g. laxman"
                  className="border-white/15 bg-white/10 text-white placeholder:text-white/35 focus-visible:ring-violet-400/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80">Password</label>
                <Input
                  type="password"
                  {...form.register("password")}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="border-white/15 bg-white/10 text-white placeholder:text-white/35 focus-visible:ring-violet-400/40"
                />
              </div>

              {error ? <p className="text-sm text-rose-300">{error}</p> : null}

              <Button
                type="submit"
                className="mt-2 w-full rounded-xl bg-white py-6 text-[15px] font-semibold text-zinc-950 hover:bg-zinc-100"
              >
                Enter dashboard
              </Button>
            </form>
        </motion.div>
      </div>
    </LoginBallpitBackdrop>
  );
}
