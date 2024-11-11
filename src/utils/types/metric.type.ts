export type TCounterElement = {
  labels: string[];
  value: number;
};

export type TGuageElement = {
  labels: string[];
  value: number;
};

export type THistogramElement = {
  labels: string[];
  sum: number;
  count: number;
  bucket: Record<number, number>;
};
