export type TCounterElement = {
  labels: Record<string, string>;
  value: number;
};

export type TGuageElement = {
  labels: Record<string, string>;
  value: number;
};

export type THistogramElement = {
  labels: Record<string, string>;
  sum: number;
  count: number;
  bucketValues: Record<number, number>;
};
