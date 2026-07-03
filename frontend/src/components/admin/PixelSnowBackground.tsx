import { useEffect, useRef } from "react";

type Flake = { x: number; y: number; depth: number };

const CONFIG = {
  density: 0.3,
  pixelResolution: 500,
  speed: 1.25,
  direction: 125,
  minFlakeSize: 1.25,
  flakeSize: 0.01,
  depthFade: 8,
  farPlane: 20,
  brightness: 1,
  gamma: 0.4545,
};

export function PixelSnowBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flakesRef = useRef<Flake[]>([]);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const baseCount = CONFIG.pixelResolution * CONFIG.pixelResolution * CONFIG.density * 0.0012;
      const areaScale = (width * height) / (390 * 844);
      const count = Math.min(420, Math.max(90, Math.round(baseCount * areaScale)));

      const flakes: Flake[] = [];
      for (let i = 0; i < count; i++) {
        flakes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          depth: Math.random(),
        });
      }
      flakesRef.current = flakes;
    };

    const draw = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const seconds = (ts - startRef.current) / 1000;
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      const rad = (CONFIG.direction * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);

      for (const flake of flakesRef.current) {
        const near = 1 - flake.depth;
        const velocity = CONFIG.speed * (0.35 + near * 0.65) * 28;
        const travel = seconds * velocity;
        let x = (flake.x + dx * travel) % width;
        let y = (flake.y + dy * travel) % height;
        if (x < 0) x += width;
        if (y < 0) y += height;

        const side = CONFIG.minFlakeSize + near * CONFIG.flakeSize * width * 0.22;
        const depthAttenuation = Math.max(0.08, 1 - (flake.depth * CONFIG.depthFade) / CONFIG.farPlane);
        const gammaLift = Math.pow(Math.min(1, Math.max(0, near)), CONFIG.gamma);
        const alpha = Math.min(0.92, Math.max(0.04, CONFIG.brightness * gammaLift * depthAttenuation));

        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(x, y, side, side);
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      startRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
