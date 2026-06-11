interface SlyceIconProps {
  size?: number;
  /** "color" = green strokes on transparent bg | "white" = white strokes on green bg */
  variant?: "color" | "white";
}

/**
 * Slyce watermelon slice icon.
 *
 * Geometry: quarter-circle sector, center at (20, 80), outer radius 70.
 * Fan opens toward upper-right; bite mark replaces the lower-left apex.
 * All arcs are true SVG circular arcs so they scale perfectly at any size.
 */
export default function SlyceIcon({ size = 22, variant = "color" }: SlyceIconProps) {
  const c = variant === "white" ? "white" : "#3DBF52";
  const sw = 5.5; // stroke width in 95-unit viewBox

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 95 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === "white" && (
        <rect width="95" height="95" rx="18" fill="#3DBF52" />
      )}

      {/*
        Arc center: (20, 80)
        Outer arc r=70 : from (7,11) to (89,68)  — clockwise, small arc
        Second arc r=62 : from (9,19) to (81,69)  — clockwise, small arc
        Flesh arc  r=50 : from (10,31) to (69,71) — clockwise, small arc
      */}

      {/* ── Outer rind arc 1 (outermost edge) ── */}
      <path
        d="M 7 11 A 70 70 0 0 1 89 68"
        stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"
      />
      {/* ── Outer rind arc 2 (parallel, ~8 units inward) ── */}
      <path
        d="M 9 19 A 62 62 0 0 1 81 69"
        stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"
      />
      {/* ── Flesh boundary arc ── */}
      <path
        d="M 10 31 A 50 50 0 0 1 69 71"
        stroke={c} strokeWidth={sw - 0.5} strokeLinecap="round" fill="none"
      />

      {/* ── Left flat edge (rind face, above the bite) ── */}
      <path
        d="M 7 11 L 9 44"
        stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"
      />

      {/* ── Bite mark (replaces clean apex at lower-left) ── */}
      <path
        d="M 9 44 Q 4 52 9 58 Q 3 65 10 71 Q 5 79 20 79"
        stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none"
      />

      {/* ── Bottom flat edge ── */}
      <path
        d="M 20 79 L 89 68"
        stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"
      />

      {/*
        Seeds — 5 rounded rects radiating from center (20,80).
        Each seed is placed at radius ~55 from center and rotated so
        its long axis points toward the center (bite corner).

        Positions computed via: cx = 20 + 55·cos(θ), cy = 80 + 55·sin(θ)
        Rotations = θ_from_seed_to_center - 90°  (rect long axis = y by default)

        θ values (SVG, CW from +x): 269°, 283°, 302°, 322°, 343°
      */}
      {/* seed 1 — far left  (20, 25) */}
      <rect x="-2.5" y="-5" width="5" height="10" rx="2.5" fill={c}
        transform="translate(20,25) rotate(1)" />
      {/* seed 2  (34, 27) */}
      <rect x="-2.5" y="-5" width="5" height="10" rx="2.5" fill={c}
        transform="translate(34,27) rotate(15)" />
      {/* seed 3 — center  (52, 35) */}
      <rect x="-2.5" y="-5" width="5" height="10" rx="2.5" fill={c}
        transform="translate(52,35) rotate(35)" />
      {/* seed 4  (63, 46) */}
      <rect x="-2.5" y="-5" width="5" height="10" rx="2.5" fill={c}
        transform="translate(63,46) rotate(50)" />
      {/* seed 5 — far right  (73, 61) */}
      <rect x="-2.5" y="-5" width="5" height="10" rx="2.5" fill={c}
        transform="translate(73,61) rotate(68)" />
    </svg>
  );
}
