"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

import { formatCompact, formatPrice } from "@/lib/format";
import type { AnalysisSeries, Candle } from "@/lib/types";

export interface ProChartProps {
  symbol: string;
  interval: string;
  candles: Candle[];
  series: AnalysisSeries;
  accent?: string;
  height?: number;
}

interface LegendState {
  time: string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  rsi: number | null;
  macd: number | null;
}

function toTime(ms: number): UTCTimestamp {
  return Math.floor(ms / 1000) as UTCTimestamp;
}

function seriesLine(
  values: (number | null)[],
  candles: Candle[],
): { time: UTCTimestamp; value: number }[] {
  const out: { time: UTCTimestamp; value: number }[] = [];
  const len = Math.min(values.length, candles.length);
  for (let i = 0; i < len; i++) {
    const v = values[i];
    if (v !== null && Number.isFinite(v)) {
      out.push({ time: toTime(candles[i].t), value: v });
    }
  }
  return out;
}

function seriesHist(
  values: (number | null)[],
  candles: Candle[],
  positive: string,
  negative: string,
): { time: UTCTimestamp; value: number; color: string }[] {
  const out: { time: UTCTimestamp; value: number; color: string }[] = [];
  const len = Math.min(values.length, candles.length);
  for (let i = 0; i < len; i++) {
    const v = values[i];
    if (v === null || !Number.isFinite(v)) continue;
    out.push({ time: toTime(candles[i].t), value: v, color: v >= 0 ? positive : negative });
  }
  return out;
}

function candleData(candles: Candle[]) {
  return candles.map((c) => ({
    time: toTime(c.t),
    open: c.o,
    high: c.h,
    low: c.l,
    close: c.c,
  }));
}

function volumeData(candles: Candle[]) {
  return candles
    .map((c) => ({
      time: toTime(c.t),
      value: c.v,
      color: c.c >= c.o ? "rgba(16,185,129,0.45)" : "rgba(251,113,133,0.45)",
    }))
    .filter((d) => Number.isFinite(d.value));
}

export function ProChart({
  symbol,
  interval,
  candles,
  series,
  accent = "#34d399",
  height = 430,
}: ProChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ema20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ema50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const rsiRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [legend, setLegend] = useState<LegendState>({
    time: "",
    o: null,
    h: null,
    l: null,
    c: null,
    rsi: null,
    macd: null,
  });

  const buildChart = () => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(51,65,85,0.25)" },
        horzLines: { color: "rgba(51,65,85,0.25)" },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: "rgba(148,163,184,0.4)",
          labelBackgroundColor: "#0f172a",
        },
        horzLine: {
          color: "rgba(148,163,184,0.4)",
          labelBackgroundColor: "#0f172a",
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 3,
      },
      handleScale: { axisPressedMouseMove: true },
    });

    const panes = chart.panes();
    if (panes[0]) panes[0].setStretchFactor(1.7);

    const volumeIndex = chart.addPane().paneIndex();
    const rsiIndex = chart.addPane().paneIndex();
    const macdIndex = chart.addPane().paneIndex();

    chart.panes()[volumeIndex].setStretchFactor(0.55);
    chart.panes()[rsiIndex].setStretchFactor(0.5);
    chart.panes()[macdIndex].setStretchFactor(0.55);

    const candleSeries = chart.addSeries(
      CandlestickSeries,
      {
        upColor: "#10b981",
        downColor: "#fb7185",
        borderUpColor: "#10b981",
        borderDownColor: "#fb7185",
        wickUpColor: "#10b981",
        wickDownColor: "#fb7185",
        priceLineColor: accent,
      },
      0,
    );
    candleSeries.setData(candleData(candles));
    candleRef.current = candleSeries;

    const ema20 = chart.addSeries(
      LineSeries,
      {
        color: "#38bdf8",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      0,
    );
    ema20.setData(seriesLine(series.ema20, candles));
    ema20Ref.current = ema20;

    const ema50 = chart.addSeries(
      LineSeries,
      {
        color: "#fbbf24",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      0,
    );
    ema50.setData(seriesLine(series.ema50, candles));
    ema50Ref.current = ema50;

    const bbUpper = chart.addSeries(
      LineSeries,
      {
        color: "rgba(167,139,250,0.45)",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      0,
    );
    bbUpper.setData(seriesLine(series.bbUpper, candles));
    bbUpperRef.current = bbUpper;

    const bbLower = chart.addSeries(
      LineSeries,
      {
        color: "rgba(167,139,250,0.45)",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      0,
    );
    bbLower.setData(seriesLine(series.bbLower, candles));
    bbLowerRef.current = bbLower;

    const volume = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
        lastValueVisible: false,
        priceLineVisible: false,
      },
      volumeIndex,
    );
    volume.setData(volumeData(candles));
    chart.panes()[volumeIndex]
      .priceScale("vol")
      .applyOptions({ scaleMargins: { top: 0.15, bottom: 0.05 } });
    volumeRef.current = volume;

    const rsi = chart.addSeries(
      LineSeries,
      {
        color: "#a78bfa",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      rsiIndex,
    );
    rsi.setData(seriesLine(series.rsi, candles));
    rsiRef.current = rsi;
    chart.panes()[rsiIndex]
      .priceScale("right")
      .applyOptions({ scaleMargins: { top: 0.12, bottom: 0.12 } });
    rsi.createPriceLine({
      price: 70,
      color: "rgba(251,113,133,0.6)",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "OB 70",
    });
    rsi.createPriceLine({
      price: 30,
      color: "rgba(16,185,129,0.6)",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "OS 30",
    });

    const macd = chart.addSeries(
      LineSeries,
      {
        color: "#38bdf8",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      },
      macdIndex,
    );
    macd.setData(seriesLine(series.macd, candles));
    macdRef.current = macd;

    const macdSignal = chart.addSeries(
      LineSeries,
      {
        color: "#f59e0b",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      macdIndex,
    );
    macdSignal.setData(seriesLine(series.macdSignal, candles));
    macdSignalRef.current = macdSignal;

    const macdHist = chart.addSeries(
      HistogramSeries,
      {
        priceLineVisible: false,
        lastValueVisible: false,
      },
      macdIndex,
    );
    macdHist.setData(
      seriesHist(series.macdHistogram, candles, "rgba(16,185,129,0.5)", "rgba(251,113,133,0.5)"),
    );
    macdHistRef.current = macdHist;

    chart.timeScale().fitContent();

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || param.seriesData.size === 0) return;
      const candle = param.seriesData.get(candleSeries as never);
      const rsiVal = param.seriesData.get(rsi as never);
      const macdVal = param.seriesData.get(macd as never);
      setLegend({
        time: String(param.time),
        o: candle && "open" in (candle as object) ? (candle as { open: number }).open : null,
        h: candle && "high" in (candle as object) ? (candle as { high: number }).high : null,
        l: candle && "low" in (candle as object) ? (candle as { low: number }).low : null,
        c: candle && "close" in (candle as object) ? (candle as { close: number }).close : null,
        rsi: rsiVal && "value" in (rsiVal as object) ? (rsiVal as { value: number }).value : null,
        macd: macdVal && "value" in (macdVal as object) ? (macdVal as { value: number }).value : null,
      });
    });

    chartRef.current = chart;
  };

  useEffect(() => {
    buildChart();
    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    candleRef.current?.setData(candleData(candles));
    ema20Ref.current?.setData(seriesLine(series.ema20, candles));
    ema50Ref.current?.setData(seriesLine(series.ema50, candles));
    bbUpperRef.current?.setData(seriesLine(series.bbUpper, candles));
    bbLowerRef.current?.setData(seriesLine(series.bbLower, candles));
    volumeRef.current?.setData(volumeData(candles));
    rsiRef.current?.setData(seriesLine(series.rsi, candles));
    macdRef.current?.setData(seriesLine(series.macd, candles));
    macdSignalRef.current?.setData(seriesLine(series.macdSignal, candles));
    macdHistRef.current?.setData(
      seriesHist(series.macdHistogram, candles, "rgba(16,185,129,0.5)", "rgba(251,113,133,0.5)"),
    );
    if (candles.length > 0) {
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles, series]);

  const latest = candles[candles.length - 1];
  const latestRsi = series.rsi[series.rsi.length - 1] ?? null;
  const latestMacd = series.macd[series.macd.length - 1] ?? null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400">
          <span className="font-semibold text-slate-200">{symbol}</span>
          <span>{interval}</span>
          {legend.time && (
            <>
              <span>O <b className="text-slate-200">{legend.o !== null ? formatPrice(legend.o) : "—"}</b></span>
              <span>H <b className="text-rose-400">{legend.h !== null ? formatPrice(legend.h) : "—"}</b></span>
              <span>L <b className="text-emerald-400">{legend.l !== null ? formatPrice(legend.l) : "—"}</b></span>
              <span>C <b className="text-slate-200">{legend.c !== null ? formatPrice(legend.c) : "—"}</b></span>
              <span>RSI <b className="text-violet-400">{legend.rsi !== null ? legend.rsi.toFixed(1) : "—"}</b></span>
              <span>MACD <b className="text-sky-400">{legend.macd !== null ? legend.macd.toFixed(2) : "—"}</b></span>
            </>
          )}
          {!legend.time && latest && (
            <>
              <span>O <b className="text-slate-200">{formatPrice(latest.o)}</b></span>
              <span>H <b className="text-rose-400">{formatPrice(latest.h)}</b></span>
              <span>L <b className="text-emerald-400">{formatPrice(latest.l)}</b></span>
              <span>C <b className="text-slate-200">{formatPrice(latest.c)}</b></span>
              <span>Vol <b className="text-slate-200">{formatCompact(latest.v)}</b></span>
              <span>RSI <b className="text-violet-400">{latestRsi !== null ? latestRsi.toFixed(1) : "—"}</b></span>
              <span>MACD <b className="text-sky-400">{latestMacd !== null ? latestMacd.toFixed(2) : "—"}</b></span>
            </>
          )}
        </div>
      </div>
      <div ref={containerRef} style={{ height }} className="w-full" />
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-sky-400" />EMA 20</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-amber-400" />EMA 50</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-violet-400/60" />Bollinger</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-400/60" />Volume</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-violet-400" />RSI</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-sky-400" />MACD</span>
      </div>
    </div>
  );
}