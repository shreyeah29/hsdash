import { motion } from "framer-motion";
import "./DeskLampVisual.css";

export type LampPhase = "off" | "opening" | "on" | "closing";

type DeskLampVisualProps = {
  phase: LampPhase;
  breathing?: boolean;
};

const spring = { type: "spring" as const, stiffness: 200, damping: 20 };

function shadeAngle(phase: LampPhase) {
  if (phase === "opening") return -32;
  if (phase === "closing") return 32;
  return 0;
}

function glowStrength(phase: LampPhase) {
  if (phase === "on") return 1;
  if (phase === "opening") return 0.55;
  if (phase === "closing") return 0.25;
  return 0;
}

export function DeskLampVisual({ phase, breathing = false }: DeskLampVisualProps) {
  const lit = glowStrength(phase);
  const showParticles = phase === "on";

  return (
    <div
      className={`ref-lamp ${phase !== "off" ? "ref-lamp--active" : ""} ${breathing ? "ref-lamp--breathing" : ""}`}
      aria-hidden
    >
      <motion.div
        className="ref-lamp__room"
        initial={false}
        animate={{ opacity: lit * 0.7 }}
        transition={{ duration: 0.65 }}
      />

      <motion.div
        className="ref-lamp__cone"
        initial={false}
        animate={{ opacity: lit * 0.9 }}
        transition={{ duration: 0.7 }}
      />

      <motion.div
        className="ref-lamp__pool"
        initial={false}
        animate={{ opacity: lit, scale: lit > 0 ? 1 : 0.6 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      />

      {showParticles ? (
        <div className="ref-lamp__particles">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.span
              key={i}
              className="ref-lamp__particle"
              animate={{
                opacity: [0, 0.85, 0],
                y: [0, -18 - (i % 4) * 8],
                x: [(i % 2 === 0 ? -1 : 1) * (6 + (i % 5) * 4), (i % 2 === 0 ? 1 : -1) * (4 + (i % 3) * 3)],
              }}
              transition={{
                duration: 2.2 + (i % 4) * 0.3,
                repeat: Infinity,
                delay: i * 0.14,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="ref-lamp__desk" />

      <div className="ref-lamp__base" />

      <div className="ref-lamp__stem" />

      <motion.div
        className="ref-lamp__head"
        initial={false}
        animate={{ rotate: shadeAngle(phase) }}
        transition={spring}
        style={{ transformOrigin: "50% 100%" }}
      >
        <div className="ref-lamp__shade">
          <motion.div
            className="ref-lamp__shade-glow"
            initial={false}
            animate={{ opacity: lit }}
            transition={{ duration: 0.6 }}
          />
        </div>

        <motion.div
          className="ref-lamp__pull"
          animate={{ rotate: phase === "on" ? [0, 3, -2, 0] : 0 }}
          transition={{ duration: 3, repeat: phase === "on" ? Infinity : 0, ease: "easeInOut" }}
        >
          <span className="ref-lamp__pull-string" />
          <span className="ref-lamp__pull-knob" />
        </motion.div>
      </motion.div>
    </div>
  );
}
