import type { ReactNode } from "react";
import { Ballpit } from "@/components/login/Ballpit";
import { GRAINIENT_PROPS, adminGradientStyle } from "@/lib/adminTheme";

/** Ball colors aligned with Grainient — purple, lavender, gray, soft white. */
const BALLPIT_COLORS = [0x9c6dc8, 0xb0a7d1, 0x919191, 0xf4f0fa, 0x7c3aad];

export function LoginBallpitBackdrop({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden text-white"
      style={adminGradientStyle(GRAINIENT_PROPS)}
    >
      <div className="fixed inset-0 z-0">
        <Ballpit
          count={200}
          gravity={0.42}
          friction={0.9985}
          wallBounce={0.9}
          followCursor
          colors={BALLPIT_COLORS}
          minSize={0.32}
          maxSize={0.58}
          size0={0.55}
          maxVelocity={0.085}
          className="h-full w-full"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_72%_58%_at_50%_40%,rgba(255,255,255,0.22)_0%,transparent_70%)]" />
      <div className="relative z-10 grid min-h-screen w-full place-items-center px-6 py-10">{children}</div>
    </div>
  );
}
