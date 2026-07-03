import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LoginBallpitBackdrop } from "@/components/login/LoginBallpitBackdrop";
import { VariableProximity } from "@/components/login/VariableProximity";
import "@/components/login/NeubrutalistLoginForm.css";

export function LoginChoicePage() {
  const headlineRef = useRef<HTMLDivElement>(null);

  return (
    <LoginBallpitBackdrop>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 w-full max-w-2xl text-center"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90" style={{ textShadow: "0 1px 8px rgba(26,18,40,0.3)" }}>
          Wedding production
        </p>

        <div ref={headlineRef} className="relative mt-4 px-2">
          <VariableProximity
            label="Sign in to HSWF"
            className="login-proximity-title"
            fromFontVariationSettings="'wght' 420, 'opsz' 14"
            toFontVariationSettings="'wght' 1000, 'opsz' 48"
            containerRef={headlineRef}
            radius={140}
            falloff="gaussian"
          />
        </div>

        <p className="mt-4 text-sm text-white/90 md:text-base" style={{ textShadow: "0 1px 8px rgba(26,18,40,0.28)" }}>
          Admin control or crew workspace.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="relative z-20 mx-auto mt-12 flex max-w-md flex-col items-stretch gap-4 sm:max-w-none sm:flex-row sm:justify-center"
        >
          <Link to="/login/admin" className="login-choice-btn login-choice-btn--primary sm:flex-none sm:min-w-[240px] sm:text-lg">
            Admin sign in
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link to="/login/team" className="login-choice-btn login-choice-btn--ghost sm:flex-none sm:min-w-[240px] sm:text-lg">
            Team sign in
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <p className="relative z-20 mt-12 text-xs text-white/75" style={{ textShadow: "0 1px 6px rgba(26,18,40,0.25)" }}>
          Secure username sign-in
        </p>
      </motion.div>
    </LoginBallpitBackdrop>
  );
}
