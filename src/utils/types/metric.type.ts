export type TCounterElement = {
  labels: Record<string, string>;
  value: number;
};

export type TGuageElement = {
  labels: Record<string, string>;
  value: number;
};

export type THistogramElement = {
  metricName?: string;
  labels: Record<string, string>;
  sum: number;
  count: number;
  value: number;
};

export type TGroupedResponseTime = Record<
  string,
  {
    sum: number;
    count: number;
    '25': number;
    '50': number;
    '100': number;
    '200': number;
    '400': number;
    '800': number;
    '1600': number;
    '3200': number;
    '6400': number;
    '12800': number;
  }
>;
