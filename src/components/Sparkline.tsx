"use client";

interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  strokeWidth?: number;
}

export function Sparkline({
  values,
  color = "#38bdf8",
  height = 48,
  strokeWidth = 1.5,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <div className="flex items-center justify-center text-xs text-slate-600">
        No data
      </div>
    );
  }

  const width = 100;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const last = values[values.length - 1];
  const lastY = pad + (1 - (last - min) / range) * (height - pad * 2);

  return (
    <svg
      className="block w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ height }}
      role="img"
      aria-label="Price sparkline"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.95}
      />
      <circle cx={width} cy={lastY} r={2} fill={color} />
    </svg>
  );
}