import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { AppBackground } from "@/components/premium/AppBackground";
import { BorderBeam } from "@/components/premium/BorderBeam";
import { GradientShimmerText } from "@/components/premium/GradientShimmerText";
import { Spotlight } from "@/components/premium/Spotlight";
import { Shield, Users, ArrowRight } from "lucide-react";

export function LoginChoicePage() {
  return (
    <div className="relative min-h-full text-zinc-900">
      <AppBackground accent="admin" />
      <div className="relative z-10 flex min-h-full flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-11 max-w-md text-center"
        >
          <img
            src="/hswf_logo_dark.png"
            alt="HSWF"
            className="mx-auto h-10 w-auto object-contain"
          />
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Wedding production</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 md:text-[15px]">
            Calm operations for <GradientShimmerText className="font-semibold">your studio</GradientShimmerText> — choose how you sign in.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid w-full max-w-xl gap-5 sm:max-w-2xl sm:grid-cols-2"
        >
          <Spotlight className="rounded-2xl" glowColor="rgba(139, 92, 246, 0.06)">
            <BorderBeam>
              <GlassPanel shine className="p-7 transition-transform duration-300 group-hover:-translate-y-0.5 sm:p-8">
                <div className="relative z-[1] flex flex-col">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700 shadow-sm">
                    <Shield className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold tracking-tight text-zinc-950">Admin login</h2>
                  <p className="mt-1.5 text-xs font-medium text-zinc-500">Owners &amp; administrators</p>
                  <p className="mt-3 text-sm leading-snug text-zinc-600">Calendar, deliverables, and team — one view.</p>
                  <Button variant="premium" className="mt-7 w-full rounded-xl py-5 text-sm font-semibold" asChild>
                    <Link to="/login/admin" className="inline-flex items-center justify-center gap-2 text-white">
                      Continue
                      <ArrowRight className="h-4 w-4 opacity-90" />
                    </Link>
                  </Button>
                </div>
              </GlassPanel>
            </BorderBeam>
          </Spotlight>

          <Spotlight className="rounded-2xl" glowColor="rgba(52, 211, 153, 0.05)">
            <BorderBeam>
              <GlassPanel shine className="p-7 transition-transform duration-300 group-hover:-translate-y-0.5 sm:p-8">
                <div className="relative z-[1] flex flex-col">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm">
                    <Users className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold tracking-tight text-zinc-950">Team login</h2>
                  <p className="mt-1.5 text-xs font-medium text-zinc-500">Editors &amp; coordinators</p>
                  <p className="mt-3 text-sm leading-snug text-zinc-600">Tasks, shoots, and handoffs — your lane.</p>
                  <Button
                    variant="glass"
                    className="mt-7 w-full rounded-xl border-zinc-200 bg-white py-5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
                    asChild
                  >
                    <Link to="/login/team" className="inline-flex items-center justify-center gap-2">
                      Continue
                      <ArrowRight className="h-4 w-4 opacity-80" />
                    </Link>
                  </Button>
                </div>
              </GlassPanel>
            </BorderBeam>
          </Spotlight>
        </motion.div>

        <p className="relative z-10 mt-12 text-center text-[11px] text-zinc-500">Secure email sign-in</p>
      </div>
    </div>
  );
}
