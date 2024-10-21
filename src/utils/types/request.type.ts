export type TMetric<T> = {
  name: string;
  type: string;
  time: any;
  labelNames: string[];
  hashMap: Record<string, T>;
};

export type TCounter = TMetric<{ value: number }>;

export type TGauge = TMetric<{ value: number }>;

export type THistogram = TMetric<{
  bucketValues: Record<string, number>;
  sum: number;
  count: number;
}> & {
  buckets: number[];
};

export type TMetricsReq = {
  requestRate: TCounter;
  responseTime: THistogram;
  errorRate: TCounter;
  cpuUsage: TGauge;
  memUsage: TGauge;
  request: any;
  cpu: any;
  mem: any;
};
