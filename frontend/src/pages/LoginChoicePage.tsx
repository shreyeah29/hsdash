import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";
import { api, setAccessToken } from "@/services/api";
import { useAuthStore } from "@/store/auth";

export function LoginChoicePage() {
  const navigate = useNavigate();
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const [demoErr, setDemoErr] = useState<string | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);

  async function tryDemo(portal: "admin" | "team") {
    setDemoErr(null);
    setDemoBusy(true);
    try {
      const { data } = await api.post<{ accessToken?: string }>("/auth/demo", { portal });
      if (data.accessToken) setAccessToken(data.accessToken);
      await refreshMe();
      const u = useAuthStore.getState().user;
      if (!u) {
        setDemoErr("Could not load session.");
        return;
      }
      navigate(portal === "admin" ? "/admin" : "/team", { replace: true });
    } catch {
      setDemoErr(
        "Could not start demo. On Render add DEMO_LOGIN=true to the API, redeploy, then try again — or sign in with email and password.",
      );
    } finally {
      setDemoBusy(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Wedding Production Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose how you sign in</p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle>Admin login</CardTitle>
            <CardDescription>Events, tasks, team management, analytics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/login/admin">Continue as Admin</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle>Staff login</CardTitle>
            <CardDescription>Editors focus on deliverables; Emmanuel coordinates shoots + assignments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <Link to="/login/team">Continue as Staff</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 w-full max-w-2xl space-y-3 rounded-xl border border-dashed bg-muted/30 p-4">
        <p className="text-sm font-medium">Try without a password (temporary)</p>
        <p className="text-xs text-muted-foreground">
          Requires <code className="rounded bg-muted px-1">DEMO_LOGIN=true</code> on the Render API. Turn off when you use real logins only.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={demoBusy} onClick={() => void tryDemo("admin")}>
            Open admin dashboard (demo)
          </Button>
          <Button type="button" variant="outline" disabled={demoBusy} onClick={() => void tryDemo("team")}>
            Open team dashboard (demo)
          </Button>
        </div>
        {demoErr ? <p className="text-sm text-destructive">{demoErr}</p> : null}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Signed-in sessions use a Bearer token in the browser (works across Vercel + Render).
      </p>
    </div>
  );
}
