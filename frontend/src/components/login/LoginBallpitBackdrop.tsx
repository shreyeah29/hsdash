import type { ReactNode } from "react";
import { Ballpit } from "@/components/login/Ballpit";

/** React Bits demo — bright white, grey, lavender, violet (no dark/black stops). */
const BALLPIT_COLORS = [0xffffff, 0xf4f4f5, 0xe4e4e7, 0xb497cf, 0x5227ff, 0xa78bfa];

export function LoginBallpitBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="fixed inset-0 z-0">
        <Ballpit
          count={110}
          gravity={0.7}
          friction={0.8}
          wallBounce={0.95}
          followCursor
          colors={BALLPIT_COLORS}
          ambientColor={0xffffff}
          ambientIntensity={1}
          lightIntensity={200}
          className="h-full w-full"
        />
      </div>
      <div className="relative z-10 grid min-h-screen w-full place-items-center px-6 py-10 lg:px-12">{children}</div>
    </div>
  );
}
