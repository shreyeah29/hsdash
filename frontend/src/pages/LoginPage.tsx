import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { api, setAccessToken } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { useAdminWorkspaceStore } from "@/store/adminWorkspace";
import { Role, type User } from "@/types/domain";
import { LoginBallpitBackdrop } from "@/components/login/LoginBallpitBackdrop";
import "@/components/login/NeubrutalistLoginForm.css";

const schema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export type LoginKind = "admin" | "team";

export function LoginPage({ loginKind }: { loginKind: LoginKind }) {
  const navigate = useNavigate();
  const acceptSession = useAuthStore((s) => s.acceptSession);
  const logout = useAuthStore((s) => s.logout);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const isAdmin = loginKind === "admin";
  const title = isAdmin ? "Admin login" : "Team login";
  const subtitle = isAdmin
    ? "Owner access — analytics, calendar, leads, and team roster."
    : "Editors & coordinators — tasks, shoots, and handoffs.";

  async function onSubmit(values: FormValues) {
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<{ user: User; accessToken?: string }>("/auth/login", values);
      if (data.accessToken) setAccessToken(data.accessToken);
      acceptSession(data.user);
      const user = data.user;

      if (!user) {
        setError("Could not load session. Try again.");
        return;
      }

      if (isAdmin) {
        if (user.role !== Role.ADMIN) {
          await logout();
          setError("This account is not an administrator. Use Team login.");
          return;
        }
        useAdminWorkspaceStore.getState().clearProfile();
        navigate("/admin/profiles", { replace: true });
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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginBallpitBackdrop>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full max-w-[400px] flex-col items-stretch"
      >
        <Link to="/login" className="nb-back">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>

        <form
          className={`nb-form${isAdmin ? "" : " nb-form--team"}`}
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <h1 className="nb-title">
            {title}
            <span>{subtitle}</span>
          </h1>

          <label className="nb-label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="nb-input"
            autoComplete="username"
            placeholder="e.g. laxman"
            {...form.register("username")}
          />
          {form.formState.errors.username ? (
            <p className="nb-error">{form.formState.errors.username.message}</p>
          ) : null}

          <label className="nb-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="nb-input"
            autoComplete="current-password"
            placeholder="••••••••"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="nb-error">{form.formState.errors.password.message}</p>
          ) : null}

          {error ? <p className="nb-error">{error}</p> : null}

          <button type="submit" className="nb-button-confirm" disabled={submitting}>
            {submitting ? "Signing in…" : "Enter dashboard"}
          </button>
        </form>
      </motion.div>
    </LoginBallpitBackdrop>
  );
}
