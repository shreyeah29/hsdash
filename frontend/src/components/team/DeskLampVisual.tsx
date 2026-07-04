import { motion } from "framer-motion";
import { LampIcon } from "@/components/team/LampIcon";
import "./DeskLampVisual.css";

type DeskLampVisualProps = {
  on: boolean;
  breathing?: boolean;
};

const spring = { type: "spring" as const, stiffness: 200, damping: 20 };

export function DeskLampVisual({ on, breathing = false }: DeskLampVisualProps) {
  return (
    <div className={`lamp-toggle ${on ? "lamp-toggle--on" : ""} ${breathing ? "lamp-toggle--breathing" : ""}`}>
      <motion.div
        className="lamp-toggle__ambient"
        initial={false}
        animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.75 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="lamp-toggle__pool"
        initial={false}
        animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.6 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="lamp-toggle__beam"
        initial={false}
        animate={{ opacity: on ? 0.85 : 0 }}
        transition={{ duration: 0.8 }}
      />

      <motion.div
        className="lamp-toggle__swing"
        initial={false}
        animate={{ rotate: on ? 180 : 0 }}
        transition={spring}
        style={{ transformOrigin: "50% 90%" }}
      >
        <LampIcon isOn={on} />
      </motion.div>
    </div>
  );
}
