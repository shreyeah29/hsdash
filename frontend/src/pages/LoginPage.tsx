import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await api.post("/auth/login", values);
      await refreshMe();
      const user = useAuthStore.getState().user;
      navigate(user?.role === "ADMIN" ? "/admin" : "/team", { replace: true });
    } catch {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-background text-foreground px-6">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Wedding Production Dashboard</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
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

