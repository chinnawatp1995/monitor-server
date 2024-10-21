type TBaseRec = {
  created: any;
  job?: string;
  machineId: string;
};

export type TRequestRateRec = TBaseRec & {
  count: number;
  path: string;
};

export type TResponseDurRec = TBaseRec & {
  lowerBound: number;
  upperBound: number;
  count: number;
  path: string;
};

export type TErrorRateRec = TBaseRec & {
  errorCode: string;
  path: string;
};

export type TResourceUsageRec = TBaseRec & {
  value: number;
};

type TBaseRec2 = {
  time: any;
  service?: string;
  machineId: string;
};

export type TRequestRec = TBaseRec2 & {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  errorMessage: string;
};

export type TResourceUsageRec2 = TBaseRec & {
  value: number;
};
