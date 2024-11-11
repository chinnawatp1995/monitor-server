import {
  TCounterElement,
  TGuageElement,
  THistogramElement,
} from './metric.type';

export type TFilterReq = {
  startTime: string;
  endTime: string;
  resolution: string;
  services?: string[];
  machines?: string[];
  controllers: string[];
  resourceCollectionTimes?: number[];
};

export type TFilterIntervalReq = {
  interval: string;
  totalPoint: number;
  service?: string;
  services?: string[];
  machine?: string;
  machines?: string[];
  controller: string;
  controllers: string[];
};

export type TMetricsReq = {
  time: string | number;
  totalRequest: Record<string, TCounterElement>;
  responseTime: Record<string, THistogramElement>;
  error: Record<string, TCounterElement>;
  cpu: Record<string, TGuageElement>;
  mem: Record<string, TGuageElement>;
  rxNetwork: Record<string, TGuageElement>;
  txNetwork: Record<string, TGuageElement>;
};
