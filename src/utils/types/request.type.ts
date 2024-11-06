export type TFilterReq = {
  startTime: string;
  endTime: string;
  resolution: string;
  services?: string[];
  machines?: string[];
  controllers: string[];
  resourceCollectionTimes?: number[];
};

export type TMetricsReq = {
  tags: string[];
  request: Record<string, any>;
  cpu: Record<string, any>;
  mem: Record<string, any>;
  network?: Record<string, any>;
  resourceCollectionTimes: number[];
};
