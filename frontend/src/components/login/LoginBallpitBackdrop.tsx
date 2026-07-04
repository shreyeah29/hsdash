import type { ReactNode } from "react";
import { Ballpit } from "@/components/login/Ballpit";

/**
 * React Bits Ballpit demo palette — white, grey, lavender, violet, indigo.
 * Matches the reactbits.dev preview (glossy mixed spheres on black).
 */
const BALLPIT_COLORS = [0xffffff, 0xe4e4e7, 0xb497cf, 0x5227ff, 0x4338ca, 0x52525b];

export function LoginBallpitBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="fixed inset-0 z-0">
        <Ballpit
          count={200}
          gravity={0.7}
          friction={0.8}
          wallBounce={0.95}
          followCursor
          colors={BALLPIT_COLORS}
          className="h-full w-full"
        />
      </div>
      <div className="relative z-10 grid min-h-screen w-full place-items-center px-6 py-10 lg:px-12">{children}</div>
    </div>
  );
}
