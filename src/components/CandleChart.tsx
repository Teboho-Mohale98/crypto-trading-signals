"use client";

import { useState } from "react";

import { formatCandleTime, formatPrice } from "@/lib/format";
import type { Candle, Interval } from "@/lib/types";

import { CandleChartDims } from "./chart-dims";

interface CandleChartProps {
  candles: Candle[];
  ema20: (number | null)[];
  ema50: (number | null)[];
  interval: Interval;
  accent: string;
  height?: number;
}

interface HoverState {
  index: number;
  x: number;
  candle: Candle;
}

export function CandleChart({
  candles,
  ema20,
  ema50,
  interval,
  accent,
  height = 340,
}: CandleChartProps) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const dims = CandleChartDims(height);

  const validE20 = ema20.filter((v): v is number => v !== null);
  const validE50 = ema50.filter((v): v is number => v !== null);

  const lows = candles.map((c) => c.l);
  const highs = candles.map((c) => c.h);
  const domainMin = Math.min(...lows, ...validE20, ...validE50);
  const domainMax = Math.max(...highs, ...validE20, ...validE50);
  const pad = (domainMax - domainMin) * 0.08 || 1;
  const yMin = domainMin - pad;
  const yMax = domainMax + pad;

  const n = candles.length;
  const barWidth = dims.width / n;
  const bodyWidth = Math.max(1, barWidth * 0.65);
  const xAt = (i: number) => i * barWidth + barWidth / 2;
  const yAt = (v: number) =>
    dims.priceBottom -
    ((v - yMin) / (yMax - yMin)) * (dims.priceBottom - dims.priceTop);

  const maxVolume = Math.max(...candles.map((c) => c.v), 1);

  const toPoly = (series: (number | null)[]): string => {
    const pts: string[] = [];
    series.forEach((v, i) => {
      if (v === null) return;
      pts.push(`${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`);
    });
    return pts.join(" ");
  };

  const lastPrice = candles[n - 1].c;
  const lastY = yAt(lastPrice);
  const up = lastPrice >= candles[Math.max(0, n - 2)].c;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const v = yMin + (yMax - yMin) * t;
    return { y: yAt(v), label: v };
  });

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * dims.width;
    const idx = Math.max(
      0,
      Math.min(n - 1, Math.floor(relX / barWidth)),
    );
    setHover({
      index: idx,
      x: xAt(idx),
      candle: candles[idx],
    });
  }

  const hoverUp = hover ? hover.candle.c >= candles[hover.index - 1]?.c : true;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        className="block w-full select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={0}
              x2={dims.width}
              y1={g.y}
              y2={g.y}
              stroke="#1e293b"
              strokeDasharray={i === gridLines.length - 1 ? "" : "3 5"}
              strokeWidth={1}
            />
            <text
              x={dims.width - 6}
              y={g.y - 4}
              textAnchor="end"
              className="fill-slate-500"
              fontSize={10}
            >
              {formatPrice(g.label)}
            </text>
          </g>
        ))}

        {candles.map((c, i) => {
          const green = c.c >= c.o;
          const color = green ? "#34d399" : "#fb7185";
          const yOpen = yAt(c.o);
          const yClose = yAt(c.c);
          const yHigh = yAt(c.h);
          const yLow = yAt(c.l);
          const x = xAt(i);
          const bodyTop = Math.min(yOpen, yClose);
          const bodyH = Math.max(1, Math.abs(yClose - yOpen));

          const volH = (c.v / maxVolume) * (dims.height - dims.priceBottom - 8);
          const volY = dims.height - 4 - volH;

          return (
            <g key={c.t}>
              <line
                x1={x}
                x2={x}
                y1={yHigh}
                y2={yLow}
                stroke={color}
                strokeWidth={1}
              />
              <rect
                x={x - bodyWidth / 2}
                y={bodyTop}
                width={bodyWidth}
                height={bodyH}
                fill={color}
                rx={0.75}
              />
              <rect
                x={x - barWidth / 2}
                y={volY}
                width={barWidth}
                height={volH}
                fill="url(#volGrad)"
                rx={0.5}
              />
            </g>
          );
        })}

        <polyline
          points={toPoly(ema20)}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          opacity={0.9}
        />
        <polyline
          points={toPoly(ema50)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.5}
          opacity={0.9}
        />

        <line
          x1={0}
          x2={dims.width}
          y1={lastY}
          y2={lastY}
          stroke={up ? "#34d399" : "#fb7185"}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.7}
        />
        <text
          x={4}
          y={lastY - 4}
          className={up ? "fill-emerald-400" : "fill-rose-400"}
          fontSize={10}
          fontWeight={700}
        >
          {formatPrice(lastPrice)}
        </text>

        {hover && (
          <>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={0}
              y2={dims.height}
              stroke="#64748b"
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={0.6}
            />
            <line
              x1={hover.x - bodyWidth}
              x2={hover.x + bodyWidth}
              y1={yAt(hover.candle.o)}
              y2={yAt(hover.candle.o)}
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.5}
            />
            <line
              x1={hover.x - bodyWidth}
              x2={hover.x + bodyWidth}
              y1={yAt(hover.candle.c)}
              y2={yAt(hover.candle.c)}
              stroke={hoverUp ? "#34d399" : "#fb7185"}
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.7}
            />
          </>
        )}
      </svg>

      {hover && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-slate-700/80 bg-slate-900/95 px-3 py-2 shadow-xl shadow-black/40">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            {formatCandleTime(hover.candle.t, interval)}
          </p>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs tabular-nums">
            <span className="text-slate-400">O</span>
            <span className="text-right text-slate-200">
              {formatPrice(hover.candle.o)}
            </span>
            <span className="text-slate-400">H</span>
            <span className="text-right text-slate-200">
              {formatPrice(hover.candle.h)}
            </span>
            <span className="text-slate-400">L</span>
            <span className="text-right text-slate-200">
              {formatPrice(hover.candle.l)}
            </span>
            <span className="text-slate-400">C</span>
            <span
              className={`text-right ${
                hoverUp ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatPrice(hover.candle.c)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}