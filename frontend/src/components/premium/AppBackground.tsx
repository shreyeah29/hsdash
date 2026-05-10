import { cn } from "@/lib/utils";

export type AppAccent = "admin" | "coordinator" | "editor";

export function AppBackground({ accent }: { accent: AppAccent }) {
  const orbPrimary =
    accent === "coordinator"
      ? "bg-amber-300/[0.35]"
      : accent === "editor"
        ? "bg-emerald-300/[0.3]"
        : "bg-violet-300/[0.35]";
  const orbSecondary =
    accent === "coordinator" ? "bg-orange-200/[0.4]" : accent === "editor" ? "bg-teal-200/[0.35]" : "bg-cyan-200/[0.35]";

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#fafafa]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_50%_-10%,hsla(263,65%,92%,0.9),transparent_55%)]" />
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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsla(240,6%,70%,0.12)_1px,transparent_1px),linear-gradient(to_bottom,hsla(240,6%,70%,0.12)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}
