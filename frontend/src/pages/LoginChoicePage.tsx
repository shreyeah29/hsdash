import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { AppBackground } from "@/components/premium/AppBackground";
import { BorderBeam } from "@/components/premium/BorderBeam";
import { GradientShimmerText } from "@/components/premium/GradientShimmerText";
import { Spotlight } from "@/components/premium/Spotlight";
import { Shield, Users, ArrowUpRight } from "lucide-react";
import { api, setAccessToken } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Role } from "@/types/domain";

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
      if (portal === "admin") {
        navigate("/admin", { replace: true });
        return;
      }
      if (u.role === Role.COORDINATOR) navigate("/coordinator", { replace: true });
      else navigate("/team", { replace: true });
    } catch {
      setDemoErr(
        "Could not start demo. On Render add DEMO_LOGIN=true to the API, redeploy, then try again — or sign in with email and password.",
      );
    } finally {
      setDemoBusy(false);
    }
  }

  return (
    <div className="relative min-h-full text-zinc-900">
      <AppBackground accent="admin" />
      <div className="relative z-10 flex min-h-full flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-xl text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Wedding production OS</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-zinc-900 md:text-5xl">
            Craft celebrations with <GradientShimmerText className="font-semibold">studio-grade calm.</GradientShimmerText>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 md:text-base">
            Orchestrate shoots, coordinate editors, and delight couples — one cinematic dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="grid w-full max-w-3xl gap-5 sm:grid-cols-2"
        >
          <Spotlight className="rounded-2xl" glowColor="rgba(139, 92, 246, 0.08)">
            <BorderBeam>
              <GlassPanel shine className="p-8 transition-transform duration-300 group-hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-cyan-50 shadow-sm ring-1 ring-zinc-100">
                  <Shield className="h-6 w-6 text-violet-700" strokeWidth={1.75} />
                </div>
                <h2 className="mt-6 text-xl font-semibold text-zinc-900">Studio principal</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">Mission overview, calendar intelligence, deliverables radar.</p>
                <Button variant="premium" className="mt-8 w-full rounded-xl py-6 text-[15px]" asChild>
                  <Link to="/login/admin" className="inline-flex items-center justify-center gap-2">
                    Continue as admin
                    <ArrowUpRight className="h-4 w-4 opacity-80" />
                  </Link>
                </Button>
              </GlassPanel>
            </BorderBeam>
          </Spotlight>

          <Spotlight className="rounded-2xl" glowColor="rgba(52, 211, 153, 0.07)">
            <BorderBeam>
              <GlassPanel shine className="p-8 transition-transform duration-300 group-hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm ring-1 ring-zinc-100">
                  <Users className="h-6 w-6 text-emerald-700" strokeWidth={1.75} />
                </div>
                <h2 className="mt-6 text-xl font-semibold text-zinc-900">Creative crew</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">Editors own tasks; coordinators steer shoots & assignments.</p>
                <Button variant="glass" className="mt-8 w-full rounded-xl py-6 text-[15px]" asChild>
                  <Link to="/login/team" className="inline-flex items-center justify-center gap-2">
                    Staff portal
                    <ArrowUpRight className="h-4 w-4 opacity-70" />
                  </Link>
                </Button>
              </GlassPanel>
            </BorderBeam>
          </Spotlight>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-14 w-full max-w-3xl space-y-4 rounded-2xl border border-dashed border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl"
        >
          <p className="text-sm font-medium text-zinc-900">Demo mode</p>
          <p className="text-xs leading-relaxed text-zinc-600">
            Requires <code className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-emerald-700">DEMO_LOGIN=true</code> on the API.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="glass" disabled={demoBusy} onClick={() => void tryDemo("admin")}>
              Demo · Admin
            </Button>
            <Button type="button" variant="outline" className="rounded-xl border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50" disabled={demoBusy} onClick={() => void tryDemo("team")}>
              Demo · Staff
            </Button>
          </div>
          {demoErr ? <p className="text-sm text-rose-600">{demoErr}</p> : null}
        </motion.div>

        <p className="relative z-10 mt-10 max-w-md text-center text-[11px] text-zinc-600">
          Bearer tokens keep sessions seamless across Vercel + Render — encrypted transit, zero theatrics.
        </p>
      </div>
    </div>
  );
}
