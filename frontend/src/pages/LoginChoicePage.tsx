import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Users } from "lucide-react";
import { LoginBallpitBackdrop } from "@/components/login/LoginBallpitBackdrop";

function LoginChoiceCard({
  icon: Icon,
  title,
  subtitle,
  description,
  to,
  accent,
}: {
  icon: typeof Shield;
  title: string;
  subtitle: string;
  description: string;
  to: string;
  accent: "violet" | "emerald";
}) {
  const accentStyles =
    accent === "violet"
      ? {
          iconBg: "bg-violet-500/15 text-violet-200 ring-violet-400/30",
          button: "bg-white text-zinc-950 hover:bg-zinc-100",
        }
      : {
          iconBg: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
          button: "border border-white/20 bg-white/10 text-white hover:bg-white/15",
        };

  return (
    <Link
      to={to}
      className="group block rounded-[28px] border border-white/10 bg-white/[0.06] p-7 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.09] sm:p-8"
    >
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${accentStyles.iconBg}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{subtitle}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">{description}</p>
      <span
        className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors ${accentStyles.button}`}
      >
        Continue
        <ArrowRight className="h-4 w-4 opacity-90 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function LoginChoicePage() {
  return (
    <LoginBallpitBackdrop>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-lg text-center"
        >
          <img src="/hswf_logo_dark.png" alt="HSWF" className="mx-auto h-10 w-auto object-contain brightness-0 invert" />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">Wedding production</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">Sign in to HSWF</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/65 md:text-[15px]">
            Choose your lane — admin control or crew workspace.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06 }}
          className="grid w-full max-w-xl gap-5 sm:max-w-2xl sm:grid-cols-2"
        >
          <LoginChoiceCard
            icon={Shield}
            title="Admin login"
            subtitle="Owners & administrators"
            description="Calendar, deliverables, leads, and team — one control center."
            to="/login/admin"
            accent="violet"
          />
          <LoginChoiceCard
            icon={Users}
            title="Team login"
            subtitle="Editors & coordinators"
            description="Tasks, shoots, and handoffs — your production lane."
            to="/login/team"
            accent="emerald"
          />
        </motion.div>

        <p className="mt-12 text-center text-[11px] text-white/40">Secure username sign-in</p>
      </div>
    </LoginBallpitBackdrop>
  );
}
