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
  groupField?: string;
};

export type TFilterIntervalReq = {
  interval: string;
  totalPoint: number;
  service?: string;
  services?: string[];
  machine?: string;
  machines?: string[];
  controller?: string;
  controllers?: string[];
  groupField?: string;
};

export type TMetricsReq = {
  time: string | number;
  totalRequest: TCounterElement[];
  responseTime: THistogramElement[];
  error: TCounterElement[];
  cpu: TGuageElement[];
  mem: TGuageElement[];
  rxNetwork: TGuageElement[];
  txNetwork: TGuageElement[];
};
