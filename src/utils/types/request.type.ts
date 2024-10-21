export type TFilterReq = {
  startTime: string;
  endTime: string;
  resolution: string;
  services?: string[];
  machineIds?: string[];
};

export type TMetricsReq = {
  tags: string[];
  request: Record<string, any>;
  cpu: Record<string, any>;
  mem: Record<string, any>;
};
