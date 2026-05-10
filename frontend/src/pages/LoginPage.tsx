import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, setAccessToken } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Role } from "@/types/domain";
import { ArrowLeft } from "lucide-react";

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

  const title = loginKind === "admin" ? "Admin sign in" : "Staff sign in";
  const description =
    loginKind === "admin"
      ? "Owner / manager — shoot calendar, analytics, and monitoring."
      : "Editors & Emmanuel — coordinators see calendar + assignments; editors see only their tasks.";

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
    <div className="min-h-full flex items-center justify-center bg-background text-foreground px-6">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <Link
          to="/login"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to login options
        </Link>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground pt-2">Wedding Production Dashboard</p>
        </div>

        <form className="mt-6 space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register("email")}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register("password")}
              autoComplete="current-password"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button className="w-full" type="submit">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
