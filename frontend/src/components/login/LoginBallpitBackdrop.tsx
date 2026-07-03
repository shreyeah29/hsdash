import type { ReactNode } from "react";
import { Ballpit } from "@/components/login/Ballpit";

/** React Bits Ballpit — purple, lavender, white, soft grey (no dark/black spheres). */
const BALLPIT_COLORS = [0x5227ff, 0xb497cf, 0xffffff, 0xe8e8ec, 0x5b6cff];

export function LoginBallpitBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 z-0">
        <Ballpit
          count={200}
          gravity={0.42}
          friction={0.9985}
          wallBounce={0.9}
          followCursor
          colors={BALLPIT_COLORS}
          ambientIntensity={1.2}
          lightIntensity={220}
          minSize={0.32}
          maxSize={0.58}
          size0={0.55}
          maxVelocity={0.085}
          className="h-full w-full"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_70%_55%_at_50%_42%,rgba(10,10,15,0.55)_0%,transparent_68%)]" />
      <div className="relative z-10 grid min-h-screen w-full place-items-center px-6 py-10 lg:px-12">{children}</div>
    </div>
  );
}
