import { groupBy, keyBy } from 'lodash';
import * as moment from 'moment';
import axios from 'axios';
import { cpuData } from './test-data';
import { pgClient } from 'src/app.service';

export const getTIMESTAMPTZ = () => {
  const date = new Date();
  let offset: any = -date.getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '-';
  offset = Math.abs(offset);
  offset = offset < 10 ? '0' + offset : offset;
  let TIMESTAMPTZ = date.toISOString();
  TIMESTAMPTZ = TIMESTAMPTZ.replace('T', ' ');
  TIMESTAMPTZ = TIMESTAMPTZ.replace('Z', `000${sign}${offset}`);
  return TIMESTAMPTZ;
};

export function fillMissingBuckets(
  data: any,
  bucketField: string,
  valueField: string,
  groupByField: string,
  interval = 'hour',
  defaultValue = 0,
) {
  const parsedData = data.map((item) => ({
    ...item,
    [bucketField]: moment(item[bucketField]).toISOString(),
    [valueField]: Number(item[valueField]),
  }));

  const minTime = moment.min(parsedData.map((d) => moment(d[bucketField])));
  const maxTime = moment.max(parsedData.map((d) => moment(d[bucketField])));

  const allBuckets = [];
  let current = minTime.clone();
  while (current <= maxTime) {
    allBuckets.push(current.toISOString());
    current = current.add(1, interval as any); // Ensure 'interval' matches a valid moment unit like 'hour', 'minute', etc.
  }

  const groupedData = groupBy(parsedData, groupByField);
  const completeData = Object.keys(groupedData).reduce((result, groupId) => {
    const groupData = groupedData[groupId];

    const dataMap = keyBy(groupData, bucketField);

    const filledData = allBuckets.map((bucket) => ({
      [bucketField]: bucket,
      [valueField]: dataMap[bucket]
        ? dataMap[bucket][valueField]
        : defaultValue,
      [groupByField]: groupId,
    }));

    result[groupId] = filledData;
    return result;
  }, {});

  return completeData;
}

export const testFunc = () => {
  const result = fillMissingBuckets(cpuData, 'bucket', 'avg', 'machine_id');
  console.log(result);
};

export const toChart = (data: any) => {
  debugger;
};

export const timestampToISO = (timestamp: string, timezone: string) => {
  debugger;
};

export const changeTimeZone = (
  time: string,
  fromTimeZone: string,
  toTimeZone: string,
) => {
  debugger;
};

export const alertRuleParser = (rules: string) => {
  const token = rules.split(/'\s+'/);
};

export async function sendTelegram(
  url: string,
  token: string,
  chatId: string,
  msg: string,
) {
  // console.log(url, token, chatId);
  await axios({
    method: 'post',
    url: url + token + '/sendMessage',
    data: {
      chat_id: chatId,
      text: msg,
    },
  }).catch(function (error) {
    console.log(error);
  });
}

export const delegateTerm = async (alert: any) => {
  const delegatedString = await (alert.rule as any).replaceAll(
    validTerm,
    async (match: string) => {
      return await termDelegate(match, alert.duration);
    },
  );
  return delegatedString;
};

const validTerm =
  /^(AVG|SUM|COUNT|MIN|MAX)\((cpu|mem|request|response|error|error_rate|rx_net|tx_net)\)$/i;

export const METRIC_QUERY = {
  cpu: (alert: any) =>
    `SELECT ${
      alert.aggregation
    }(cpu_usage) as value WHERE time >= now() - interval '${alert.duration}' 
    ${alert.service ? `AND service IN (${alert.service.join(',')})` : ''}
    ${alert.machine ? `AND machine_id IN (${alert.machine.join(',')})` : ''}
  `,
  mem: (alert: any) =>
    `SELECT ${
      alert.aggregation
    }(memory_usage) as value WHERE time >= now() - interval '${alert.duration}' 
    ${alert.service ? `AND service IN (${alert.service.join(',')})` : ''}
    ${alert.machine ? `AND machine_id IN (${alert.machine.join(',')})` : ''}
  `,
  rxNetwork: (alert: any) => `
    SELECT ${alert.aggregation}(rx_sec) as value 
    FROM network_usage 
    WHERE time >= now() - interval '${alert.duration}'
    ${alert.service ? `AND service IN (${alert.service.join(',')})` : ''}
    ${alert.machine ? `AND machine_id IN (${alert.machine.join(',')})` : ''}
  `,
  txNetwork: (alert: any) => `
    SELECT ${alert.aggregation}(tx_sec) as value 
    FROM network_usage 
    WHERE time >= now() - interval '${alert.duration}'
    ${alert.service ? `AND service IN (${alert.service.join(',')})` : ''}
    ${alert.machine ? `AND machine_id IN (${alert.machine.join(',')})` : ''}
  `,
  request: (alert: any) => `
    SELECT COUNT(*) as value 
    FROM (
      SELECT COUNT(*) as total_requests 
      FROM request 
      WHERE time >= now() - interval '${alert.duration}'
      ${alert.service ? `AND service IN (${alert.service.join(',')})` : ''}
      ${alert.machine ? `AND machine_id IN (${alert.machine.join(',')})` : ''}
    ) sub
  `,
  response: (alert: any) => `
    SELECT ${alert.aggregation}(response_time) as value 
    FROM request 
    WHERE time >= now() - interval '${alert.duration}'
    ${alert.service ? `AND service IN (${alert.service.join(',')})` : ''}
    ${alert.machine ? `AND machine_id IN (${alert.machine.join(',')})` : ''}
  `,
  errorRate: (alert: any) => `
    SELECT (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)) as value 
    FROM request 
    WHERE time >= now() - interval '${alert.duration}'
    ${alert.service ? `AND service IN (${alert.service.join(',')})` : ''}
    ${alert.machine ? `AND machine_id IN (${alert.machine.join(',')})` : ''}
  `,
  error: (alert: any) => `
    SELECT ${alert.aggregation}(error_count) as value 
    FROM (
      SELECT COUNT(*) as error_count 
      FROM request 
      WHERE status_code >= 400 
      AND time >= now() - interval '${alert.duration}'
      ${alert.service ? `AND service IN (${alert.service.join(',')})` : ''}
      ${alert.machine ? `AND machine_id IN (${alert.machine.join(',')})` : ''}
    ) sub
  `,
};

const getDataFromRule = async (
  aggregation: string,
  metric: string,
  service: string[],
  machine: string[],
  duration: string,
) => {
  const result = await pgClient.query({
    text: METRIC_QUERY[metric]({ aggregation, service, machine, duration }),
  });
  return result.rows;
};

const ruleTermRegex = {
  aggregation: /AVG|SUM|COUNT|MIN|MAX/i,
  metrics: /cpu|mem|request|response|error|error_rate|rx_net|tx_net/i,
  service: /{services=\[([\w,]+)\]}$/i,
  machine: /{machine_ids=\[([\w,]+)\]}$/i,
};

async function termDelegate(term: string, duration: string) {
  const alert = {
    aggregation: term.match(ruleTermRegex.aggregation)[0],
    metric: term.match(ruleTermRegex.metrics)[0],
    service: term.match(ruleTermRegex.service)[0].split('=')[1].split(','),
    machine: term.match(ruleTermRegex.machine)[0].split('=')[1].split(','),
    duration,
  };
  return getDataFromRule(
    alert.aggregation,
    alert.metric,
    alert.service,
    alert.machine,
    alert.duration,
  );
}
