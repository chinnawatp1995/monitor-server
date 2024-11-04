export type TCreateQuery<T> = {
  tags: string[];
  values: T[];
};

export type TRequestValue = {
  time: string;
  path: string;
  statusCode: number;
  responseTime: number;
  errorMessage: string;
};

export type TCpuValue = {
  time: string;
  usage: number;
};

export type TMemValue = TCpuValue;

export type TNetworkValue = {
  time: string;
  rx_sec: number;
  tx_sec: number;
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
