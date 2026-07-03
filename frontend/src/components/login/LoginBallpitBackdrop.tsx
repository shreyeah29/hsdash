import type { ReactNode } from "react";
import { Ballpit } from "@/components/login/Ballpit";

/** React Bits Ballpit demo palette — purple, lavender, off-white, navy, blue. */
const BALLPIT_COLORS = [0x5227ff, 0xb497cf, 0xe8e8ec, 0x14141f, 0x5b6cff];

export function LoginBallpitBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 z-0">
        <Ballpit
          count={88}
          gravity={0.38}
          friction={0.9985}
          wallBounce={0.92}
          followCursor
          colors={BALLPIT_COLORS}
          minSize={0.35}
          maxSize={0.62}
          size0={0.68}
          maxVelocity={0.09}
          className="h-full w-full"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/5" />
      <div className="relative z-10 grid min-h-screen w-full place-items-center px-6 py-10">{children}</div>
    </div>
  );
}
