import type { ReactNode } from "react";
import { Ballpit } from "@/components/login/Ballpit";

/** React Bits demo palette — white, ash, violet (3 stops, even mix). */
const BALLPIT_COLORS = [0xffffff, 0x3a3a42, 0x5227ff];

export function LoginBallpitBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="fixed inset-0 z-0">
        <Ballpit
          count={100}
          gravity={0.7}
          friction={0.8}
          wallBounce={0.95}
          followCursor
          colors={BALLPIT_COLORS}
          ambientColor={0xffffff}
          ambientIntensity={1}
          lightIntensity={200}
          materialParams={{ metalness: 0.5, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15 }}
          className="h-full w-full"
        />
      </div>
      <div className="relative z-10 grid min-h-screen w-full place-items-center px-6 py-10 lg:px-12">{children}</div>
    </div>
  );
}
