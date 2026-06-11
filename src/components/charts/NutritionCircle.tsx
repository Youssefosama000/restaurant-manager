interface NutritionCircleProps {
  label: string;
  percentage: number;
  grams: number | null;
  color: string;
  size?: number;
}

export default function NutritionCircle({
  label,
  percentage,
  grams,
  color,
  size = 72,
}: NutritionCircleProps) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#EDE5D5"
            strokeWidth="6"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-[11px] font-bold text-slyce-dark leading-none">
            {grams !== null ? `${Math.round(grams * 10) / 10}g` : "-g"}
          </span>
          <span className="text-[9px] text-slyce-grey leading-none mt-0.5">
            {percentage}%
          </span>
        </div>
      </div>
      <span className="text-[11px] text-slyce-grey font-medium">{label}</span>
    </div>
  );
}
