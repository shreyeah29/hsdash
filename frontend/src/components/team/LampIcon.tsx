import { motion } from "framer-motion";

type LampIconProps = {
  isOn: boolean;
};

/** Side-profile desk lamp — designed to swing from shade-up (off) to shade-down (on). */
export function LampIcon({ isOn }: LampIconProps) {
  return (
    <svg viewBox="0 0 140 220" className="lamp-icon" aria-hidden>
      <defs>
        <linearGradient id="lampMetal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#52525b" />
          <stop offset="45%" stopColor="#f4f4f5" />
          <stop offset="100%" stopColor="#3f3f46" />
        </linearGradient>
        <linearGradient id="lampShade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fafafa" />
          <stop offset="55%" stopColor="#d4d4d8" />
          <stop offset="100%" stopColor="#71717a" />
        </linearGradient>
        <radialGradient id="lampBulbOn" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fffef0" />
          <stop offset="55%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <filter id="lampBulbGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* desk shadow */}
      <ellipse cx="70" cy="212" rx="46" ry="7" fill="rgba(0,0,0,0.35)" />

      {/* weighted base */}
      <ellipse cx="70" cy="204" rx="40" ry="9" fill="#27272a" />
      <ellipse cx="70" cy="201" rx="36" ry="7" fill="url(#lampMetal)" />

      {/* stem */}
      <rect x="63" y="158" width="14" height="46" rx="4" fill="url(#lampMetal)" />

      {/* curved neck */}
      <path
        d="M70 158 C70 132 48 118 38 102"
        fill="none"
        stroke="url(#lampMetal)"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* second arm segment to shade */}
      <path
        d="M38 102 C52 88 78 78 92 68"
        fill="none"
        stroke="url(#lampMetal)"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* joint knobs */}
      <circle cx="70" cy="158" r="5.5" fill="#71717a" stroke="#3f3f46" strokeWidth="1" />
      <circle cx="38" cy="102" r="5" fill="#71717a" stroke="#3f3f46" strokeWidth="1" />

      {/* shade housing */}
      <path
        d="M72 52 C98 48 118 62 122 78 C126 94 110 108 86 112 C62 116 48 102 50 86 C52 70 58 56 72 52 Z"
        fill="url(#lampShade)"
        stroke="#52525b"
        strokeWidth="1.5"
      />
      <path
        d="M76 58 C94 55 108 66 110 80 C112 94 100 102 84 104 C68 106 56 96 58 84 C60 72 66 61 76 58 Z"
        fill="#3f3f46"
        opacity="0.85"
      />

      {/* bulb */}
      <motion.circle
        cx="84"
        cy="82"
        r="11"
        fill={isOn ? "url(#lampBulbOn)" : "#52525b"}
        filter={isOn ? "url(#lampBulbGlow)" : undefined}
        animate={{
          opacity: isOn ? 1 : 0.35,
          r: isOn ? 11 : 9,
        }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      />

      <motion.circle
        cx="84"
        cy="82"
        r="4"
        fill="#fef9c3"
        animate={{ opacity: isOn ? 0.95 : 0 }}
        transition={{ duration: 0.5 }}
      />
    </svg>
  );
}
