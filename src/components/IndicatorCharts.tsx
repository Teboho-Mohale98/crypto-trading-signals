"use client";

import { formatCandleTime, formatPrice } from "@/lib/format";
import type { Interval } from "@/lib/types";

interface PanelProps {
  candles: { t: number }[];
  values: (number | null)[];
  interval: Interval;
  height?: number;
}

function useDomain(
  drummer: (number | null)[],
  fixed?: [number, number],
): [number, number] {
  const fixedTop = fixed ? fixed[1] : 100;
  const fixedBot = fixed ? fixed[0] : 0;
  return [fixedBot, fixedTop];
}

function SeriesGeometry(
  candles: { t: number }[],
  values: (number | null)[],
  height: number,
  width: number,
  yMin: number,
  yMax: number,
  padTop = 10,
  padBottom = 22,
) {
  const n = candles.length;
  const xAt = (i: number) => (i / Math.max(1, n - 1)) * width;
  const yAt = (v: number) =>
    padTop +
    (1 - (v - yMin) / (yMax - yMin)) * (height - padTop - padBottom);

  const linePoints: string[] = [];
  values.forEach((v, i) => {
    if (v === null || v === undefined) return;
    linePoints.push(`${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`);
  });

  const area = linePoints.length
    ? `M${linePoints[0].split(",")[0]},${yAt(yMin).toFixed(
        2,
      )} L${linePoints.join(" L")} L${
        linePoints[linePoints.length - 1].split(",")[0]
      },${yAt(yMin).toFixed(2)} Z`
    : "";

  return { xAt, yAt, linePoints: linePoints.join(" "), area };
}

function AxisLabels({
  candles,
  interval,
  width,
  height,
}: {
  candles: { t: number }[];
  interval: Interval;
  width: number;
  height: number;
}) {
  const n = candles.length;
  const inds = [0, Math.floor(n / 2), n - 1];
  return (
    <>
      {inds.map((i, k) => (
        <text
          key={k}
          x={(i / Math.max(1, n - 1)) * width}
          y={height - 6}
          textAnchor={k === 0 ? "start" : k === 1 ? "middle" : "end"}
          className="fill-slate-600"
          fontSize={9}
        >
          {formatCandleTime(candles[i]!.t, interval)}
        </text>
      ))}
    </>
  );
}

const PANEL_WIDTH = 800;

export function RsiPanel({
  candles,
  values,
  interval,
  height = 140,
}: PanelProps) {
  const [yMin, yMax] = useDomain(values, [0, 100]);
  const { yAt, linePoints } = SeriesGeometry(
    candles,
    values,
    height,
    PANEL_WIDTH,
    yMin,
    yMax,
  );

  const last = values
    .slice()
    .reverse()
    .find((v): v is number => v !== null);
  const rsi30 = yAt(30);
  const rsi70 = yAt(70);

  return (
    <svg viewBox={`0 0 ${PANEL_WIDTH} ${height}`} className="block w-full">
      <line
        x1={0}
        x2={PANEL_WIDTH}
        y1={rsi30}
        y2={rsi30}
        stroke="#34d399"
        strokeWidth={0.75}
        strokeDasharray="4 4"
        opacity={0.5}
      />
      <line
        x1={0}
        x2={PANEL_WIDTH}
        y1={rsi70}
        y2={rsi70}
        stroke="#fb7185"
        strokeWidth={0.75}
        strokeDasharray="4 4"
        opacity={0.5}
      />
      <text
        x={PANEL_WIDTH - 4}
        y={rsi70 + 10}
        textAnchor="end"
        className="fill-rose-400/80"
        fontSize={9}
      >
        70
      </text>
      <text
        x={PANEL_WIDTH - 4}
        y={rsi30 + 10}
        textAnchor="end"
        className="fill-emerald-400/80"
        fontSize={9}
      >
        30
      </text>
      <polyline
        points={linePoints}
        fill="none"
        stroke="#a78bfa"
        strokeWidth={1.5}
      />
      <polyline
        points={linePoints}
        fill="none"
        stroke="#a78bfa"
        strokeWidth={4}
        opacity={0.12}
      />
      <text
        x={4}
        y={10}
        className="fill-slate-400"
        fontSize={9}
        fontWeight={700}
      >
        RSI (14) {last != null ? last.toFixed(1) : "—"}
      </text>
      <AxisLabels candles={candles} interval={interval} width={PANEL_WIDTH} height={height} />
    </svg>
  );
}

export function MacdPanel({
  candles,
  macd,
  macdSignal,
  hist,
  interval,
  height = 150,
}: {
  candles: { t: number }[];
  macd: (number | null)[];
  macdSignal: (number | null)[];
  hist: (number | null)[];
  interval: Interval;
  height?: number;
}) {
  const valid = [...macd, ...macdSignal, ...hist].filter(
    (v): v is number => v !== null,
  );
  const maxAbs = valid.length
    ? Math.max(...valid.map((v) => Math.abs(v)), 1e-9)
    : 1;
  const yMin = -maxAbs * 1.2;
  const yMax = maxAbs * 1.2;
  const n = candles.length;
  const barWidth = PANEL_WIDTH / n;
  const { xAt, yAt, area } = SeriesGeometry(
    candles,
    hist,
    height,
    PANEL_WIDTH,
    yMin,
    yMax,
  );

  const macdPts: string[] = [];
  macd.forEach((v, i) => {
    if (v === null) return;
    const y = yAt(v);
    macdPts.push(`${xAt(i).toFixed(2)},${y.toFixed(2)}`);
  });
  const sigPts: string[] = [];
  macdSignal.forEach((v, i) => {
    if (v === null) return;
    const y = yAt(v);
    sigPts.push(`${xAt(i).toFixed(2)},${y.toFixed(2)}`);
  });

  const zeroY = yAt(0);
  const lastHist = hist
    .slice()
    .reverse()
    .find((v): v is number => v !== null);

  return (
    <svg viewBox={`0 0 ${PANEL_WIDTH} ${height}`} className="block w-full">
      <line
        x1={0}
        x2={PANEL_WIDTH}
        y1={zeroY}
        y2={zeroY}
        stroke="#334155"
        strokeWidth={0.75}
      />
      {hist.map((v, i) => {
        if (v === null) return null;
        const y = yAt(v);
        const h = Math.max(1, Math.abs(y - zeroY));
        return (
          <rect
            key={candles[i]?.t ?? i}
            x={xAt(i) - barWidth / 2 + 1}
            y={v >= 0 ? y : zeroY}
            width={Math.max(1, barWidth - 2)}
            height={h}
            fill={v >= 0 ? "#34d399" : "#fb7185"}
            opacity={0.9}
          />
        );
      })}
      <path d={area} fill="#60a5fa" opacity={0.05} />
      <polyline
        points={macdPts.join(" ")}
        fill="none"
        stroke="#60a5fa"
        strokeWidth={1.5}
      />
      <polyline
        points={sigPts.join(" ")}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={1.3}
        strokeDasharray="5 3"
      />
      <text
        x={4}
        y={10}
        className="fill-slate-300"
        fontSize={9}
        fontWeight={700}
      >
        MACD (12, 26, 9)
      </text>
      <text
        x={4}
        y={20}
        className="fill-slate-500"
        fontSize={9}
      >
        hist{" "}
        {lastHist !== null && lastHist !== undefined
          ? formatPrice(lastHist)
          : "—"}
      </text>
      <AxisLabels candles={candles} interval={interval} width={PANEL_WIDTH} height={height} />
    </svg>
  );
}