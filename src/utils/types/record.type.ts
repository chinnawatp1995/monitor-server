export type TCreateRequest = {
  service: string;
  machine: string;
  controller: string;
  path: string;
  statusCode: number | string;
  value: number;
};

export type TCreateResponseTime = {
  service: string;
  machine: string;
  controller: string;
  path: string;
  statusCode: number | string;
  count: number;
  sum: number;
  bucket_25: number;
  bucket_50: number;
  bucket_100: number;
  bucket_200: number;
  bucket_400: number;
  bucket_800: number;
  bucket_1600: number;
  bucket_3200: number;
  bucket_6400: number;
  bucket_12800: number;
};

export type TCreateError = {
  service: string;
  machine: string;
  controller: string;
  path: string;
  errorCode: string;
  errorTitle: string;
  value: number;
};

export type TCreateResource = {
  service: string;
  machine: string;
  value: number;
};

export type TCreateServerStatus = {
  machineId: string;
  status: boolean;
  service: string;
};

export type TAlertRuleQuery = {
  id?: string;
  name: string;
  expression: string;
  duration: string;
  severity: string;
  silence_time: string;
  message: string;
};

export type TRecipientQuery = {
  id?: string;
  name: string;
  app: string;
  token: string;
  url: string;
  room: string;
};

export type TBaseRecord = {
  bucket: string;
  value: number;
  machine: string;
  controller?: string;
  service: string;
};

export type TTotalRequestRecord = TBaseRecord;

export type TErrorRecord = { error_title: string } & TBaseRecord;

export type TAvgResponseTimeRecord = TBaseRecord;

export type TResourceRecord = TBaseRecord;

export type TRequestErrorRatioRecord = {
  bucket: string;
  total_request: number;
  total_error: number;
};

export type TRequestPathRecord = Record<string, number>;

export type TServerStatus = {
  machine_id: number;
  status: boolean;
  time: string;
};

export type TService = {
  service: string;
};

export type TMachine = {
  machine: string;
};

export type TErrorRanking = Record<string, number>;
