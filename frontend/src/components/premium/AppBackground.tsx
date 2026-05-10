import { cn } from "@/lib/utils";

export type AppAccent = "admin" | "coordinator" | "editor";

export function AppBackground({ accent }: { accent: AppAccent }) {
  const orbPrimary =
    accent === "coordinator"
      ? "bg-amber-400/[0.12]"
      : accent === "editor"
        ? "bg-emerald-400/[0.11]"
        : "bg-violet-500/[0.14]";
  const orbSecondary =
    accent === "coordinator" ? "bg-orange-600/[0.08]" : accent === "editor" ? "bg-teal-500/[0.08]" : "bg-cyan-500/[0.1]";

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#0B0F19]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-15%,hsla(263,70%,58%,0.16),transparent_58%)]" />
      <div
        className={cn(
          "absolute -right-24 -top-32 h-[min(560px,80vw)] w-[min(560px,80vw)] rounded-full blur-[110px]",
          orbPrimary,
        )}
      />
      <div
        className={cn(
          "absolute -bottom-32 left-[15%] h-[380px] w-[380px] rounded-full blur-[100px]",
          orbSecondary,
        )}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsla(0,0%,100%,0.028)_1px,transparent_1px),linear-gradient(to_bottom,hsla(0,0%,100%,0.028)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
    </div>
  );
}
