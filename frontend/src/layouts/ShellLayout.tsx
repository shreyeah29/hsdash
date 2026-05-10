import type { LucideIcon } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Lenis from "lenis/react";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { AppBackground } from "@/components/premium/AppBackground";
import type { AppAccent } from "@/components/premium/AppBackground";
import { cn } from "@/lib/utils";

export type ShellNavItem = { to: string; label: string; icon?: LucideIcon };

const shellLenisOptions = {
  lerp: 0.085,
  smoothWheel: true as const,
  wheelMultiplier: 0.92,
};

export function ShellLayout({
  title,
  subtitle,
  links,
  variant = "default",
}: {
  title: string;
  subtitle?: string;
  links: ShellNavItem[];
  variant?: "default" | "coordinator" | "editor";
}) {
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  const accent: AppAccent =
    variant === "coordinator" ? "coordinator" : variant === "editor" ? "editor" : "admin";

  const navSkin =
    variant === "coordinator"
      ? {
          active:
            "bg-gradient-to-r from-amber-100 to-orange-50 text-amber-950 ring-1 ring-amber-200/80 shadow-sm shadow-amber-200/40",
          idle: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        }
      : variant === "editor"
        ? {
            active:
              "bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-950 ring-1 ring-emerald-200/80 shadow-sm shadow-emerald-200/35",
            idle: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
          }
        : {
            active:
              "bg-gradient-to-r from-violet-100 to-cyan-50 text-violet-950 ring-1 ring-violet-200/80 shadow-sm shadow-violet-200/40",
            idle: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
          };

  return (
    <div className="relative min-h-full text-zinc-900">
      <AppBackground accent={accent} />

      <div className="relative z-10 flex min-h-screen gap-3 p-3 md:gap-5 md:p-5 lg:p-6">
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel shine-border flex w-[248px] shrink-0 flex-col md:w-[268px]"
        >
          <div className="border-b border-zinc-200/80 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">HS Dash</p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight text-zinc-900">{title}</h1>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {subtitle ??
                (variant === "coordinator"
                  ? "Operations pipeline"
                  : variant === "editor"
                    ? "Creative focus"
                    : "Production control")}
            </p>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 p-3">
            {links.map((l, i) => (
              <motion.div
                key={l.to}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * i + 0.1, duration: 0.35 }}
              >
                <NavLink
                  to={l.to}
                  end={l.to === "/admin" || l.to === "/coordinator" || l.to === "/team"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                      isActive ? navSkin.active : navSkin.idle,
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {l.icon ? (
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700",
                            isActive && "border-zinc-300 bg-white shadow-sm",
                          )}
                        >
                          <l.icon className="h-[18px] w-[18px] opacity-90" strokeWidth={1.75} />
                        </span>
                      ) : null}
                      <span className="truncate">{l.label}</span>
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          <div className="border-t border-zinc-200/80 p-3">
            <Button
              variant="outline"
              className="w-full justify-center gap-2 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              onClick={() => void logout()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </motion.aside>

        <main className="glass-panel relative flex min-h-[calc(100vh-24px)] min-w-0 flex-1 flex-col overflow-hidden md:min-h-[calc(100vh-40px)]">
          <Lenis
            options={shellLenisOptions}
            className="flex min-h-0 flex-1 flex-col overflow-hidden outline-none"
          >
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col"
            >
              <div className="flex-1 px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
                <Outlet />
              </div>
            </motion.div>
          </Lenis>
        </main>
      </div>
    </div>
  );
}
