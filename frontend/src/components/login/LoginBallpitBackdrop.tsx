import { useEffect, useState, type ReactNode } from "react";
import { Ballpit } from "@/components/login/Ballpit";

/** React Bits demo palette — white, ash, violet (3 stops, even mix). */
const BALLPIT_COLORS = [0xffffff, 0x3a3a42, 0x5227ff];

const MOBILE_BALLPIT_QUERY = "(max-width: 768px)";

function useIsMobileBallpit() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_BALLPIT_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BALLPIT_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function LoginBallpitBackdrop({ children }: { children: ReactNode }) {
  const isMobile = useIsMobileBallpit();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="fixed inset-0 z-0">
        <Ballpit
          key={isMobile ? "mobile" : "desktop"}
          count={isMobile ? 48 : 100}
          minSize={isMobile ? 0.28 : 0.5}
          maxSize={isMobile ? 0.55 : 1}
          size0={isMobile ? 0.55 : 1}
          maxZ={isMobile ? 1.35 : 2}
          gravity={0.5}
          friction={0.9975}
          wallBounce={0.98}
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
