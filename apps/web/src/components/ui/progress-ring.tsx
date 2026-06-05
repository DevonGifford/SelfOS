import type { ReactNode } from "react";
import { Link } from "react-router";

type ProgressRingProps = {
  /** 0..1 */
  progress: number;
  value: ReactNode;
  label: ReactNode;
  size?: number;
  strokeWidth?: number;
  valueClassName?: string;
  href?: string;
  linkClassName?: string;
  className?: string;
};

export function ProgressRing({
  progress,
  value,
  label,
  size = 128,
  strokeWidth = 8,
  valueClassName,
  href,
  linkClassName,
  className,
}: ProgressRingProps) {
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(progress, 1));
  const offset = circumference * (1 - fraction);

  const ring = (
    <div
      className={`relative shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
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
        <p className={valueClassName}>{value}</p>
        <p className="text-center font-mono text-[9px] uppercase leading-tight text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link to={href} className={linkClassName}>
      {ring}
    </Link>
  ) : (
    ring
  );
}
