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
import { Role } from "@/types/domain";
import { AppBackground } from "@/components/premium/AppBackground";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { BorderBeam } from "@/components/premium/BorderBeam";
import { Spotlight } from "@/components/premium/Spotlight";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export type LoginKind = "admin" | "team";

export function LoginPage({ loginKind }: { loginKind: LoginKind }) {
  const navigate = useNavigate();
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const logout = useAuthStore((s) => s.logout);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const title = loginKind === "admin" ? "Principal access" : "Crew access";
  const description =
    loginKind === "admin"
      ? "Owner login — analytics, calendar intelligence, team roster."
      : "Editors & coordinators — tailored workspaces after authentication.";

  const spotlightTint =
    loginKind === "admin" ? "rgba(139, 92, 246, 0.08)" : "rgba(52, 211, 153, 0.06)";

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const { data } = await api.post<{ user?: unknown; accessToken?: string }>("/auth/login", values);
      if (data.accessToken) setAccessToken(data.accessToken);
      await refreshMe();
      const user = useAuthStore.getState().user;

      if (!user) {
        setError("Could not load session. Try again.");
        return;
      }

      if (loginKind === "admin") {
        if (user.role !== Role.ADMIN) {
          await logout();
          setError("This account is not an administrator. Use Staff login.");
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
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="relative min-h-full text-zinc-900">
      <AppBackground accent={loginKind === "admin" ? "admin" : "editor"} />
      <div className="relative z-10 flex min-h-full items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Spotlight className="rounded-2xl" glowColor={spotlightTint}>
            <BorderBeam>
              <GlassPanel shine className="p-8 transition-transform duration-300 group-hover:-translate-y-0.5 md:p-10">
                <div className="relative z-[1]">
                  <Link
                    to="/login"
                    className="mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-600 transition-colors hover:text-zinc-950"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back
                  </Link>

                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
                      {loginKind === "admin" ? "Admin lane" : "Staff lane"}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h1>
                    <p className="text-sm leading-relaxed text-zinc-600">{description}</p>
                  </div>

                  <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-800">Email</label>
                      <Input {...form.register("email")} autoComplete="email" placeholder="you@studio.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-800">Password</label>
                      <Input
                        type="password"
                        {...form.register("password")}
                        autoComplete="current-password"
                        placeholder="••••••••"
                      />
                    </div>

                    {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                    <Button type="submit" variant="premium" className="mt-2 w-full rounded-xl py-6 text-[15px] font-semibold">
                      Enter dashboard
                    </Button>
                  </form>
                </div>
              </GlassPanel>
            </BorderBeam>
          </Spotlight>
        </motion.div>
      </div>
    </div>
  );
}
