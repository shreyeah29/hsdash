import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LoginBallpitBackdrop } from "@/components/login/LoginBallpitBackdrop";

export function LoginChoicePage() {
  return (
    <LoginBallpitBackdrop>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg text-center"
        >
          <img src="/hswf_logo_dark.png" alt="HSWF" className="mx-auto h-10 w-auto object-contain brightness-0 invert" />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">Wedding production</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">Sign in to HSWF</h1>
          <p className="mt-3 text-sm text-white/70 md:text-base">Admin control or crew workspace.</p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <Link
              to="/login/admin"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
            >
              Admin sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login/team"
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              Team sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <p className="mt-10 text-[11px] text-white/40">Secure username sign-in</p>
        </motion.div>
      </div>
    </LoginBallpitBackdrop>
  );
}
