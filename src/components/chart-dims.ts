export interface ChartDims {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  priceTop: number;
  priceBottom: number;
}

export function makeDims(
  height: number,
  margin: { top: number; right: number; bottom: number; left: number } = {
    top: 12,
    right: 54,
    bottom: 18,
    left: 12,
  },
): ChartDims {
  const width = 800;
  return {
    width,
    height,
    margin,
    priceTop: margin.top,
    priceBottom: height - margin.bottom,
  };
}

export const CandleChartDims = (height: number): ChartDims => {
  const m = { top: 14, right: 58, bottom: 22, left: 12 };
  const d = makeDims(height, m);
  return {
    ...d,
    priceTop: m.top,
    priceBottom: height - 60,
  };
};