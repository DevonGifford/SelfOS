import type { PropsWithChildren } from "react";

type ProgressRingProps = PropsWithChildren<{
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}>;

export function ProgressRing({
  value,
  max,
  size = 128,
  strokeWidth = 8,
  children,
}: ProgressRingProps) {
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const fraction = max > 0 ? Math.max(0, Math.min(value / max, 1)) : 0;
  const offset = circumference * (1 - fraction);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="fill-none stroke-primary transition-[stroke-dashoffset]"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
