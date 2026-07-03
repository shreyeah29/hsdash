import type { ReactNode } from "react";
import { Ballpit } from "@/components/login/Ballpit";

const BALLPIT_COLORS = [0x8b5cf6, 0xd4d4d8, 0xffffff];

export function LoginBallpitBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full w-full overflow-hidden bg-black text-white">
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
      <div className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-black/30 via-black/10 to-black/50" />
      <div className="relative z-10 min-h-full">{children}</div>
    </div>
  );
}
