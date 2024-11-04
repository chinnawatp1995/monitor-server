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

export const delegateTerm = async (rule: any) => {
  const matchString = rule.expression.match(validTerm);
  let delegatedExpression = rule.expression;
  for (const expression of matchString) {
    const delegatedTerm = await delegate(expression, rule.duration);
    // console.log(delegatedExp);
    delegatedExpression = delegatedExpression.replace(
      expression,
      delegatedTerm,
    );
  }
  return delegatedExpression;
};

const validTerm =
  /(AVG|SUM|COUNT|MIN|MAX)\((cpu|mem|request|response|error|error_rate|rx_net|tx_net)(\{[^}]*\})*(,.*'(\d+ (minute|hour|day|week|month|year)s*)')*\)/gi;

export const METRIC_QUERY = {
  cpu: (alert: any) =>
    `SELECT ${
      alert.aggregation
    }(value) as value FROM cpu_usage WHERE time >= now() - interval '${
      alert.duration
    }' 
    ${
      alert.service
        ? `AND service IN (${alert.service.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machine
        ? `AND machine_id IN (${alert.machine.map((m) => `'${m}'`).join(',')})`
        : ''
    }
  `,
  mem: (alert: any) =>
    `SELECT ${
      alert.aggregation
    }(value) as value FROM mem_usage WHERE time >= now() - interval '${
      alert.duration
    }' 
    ${
      alert.service
        ? `AND service IN (${alert.service.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machine
        ? `AND machine_id IN (${alert.machine.map((m) => `'${m}'`).join(',')})`
        : ''
    }
  `,
  rx_network: (alert: any) => `
    SELECT ${alert.aggregation}(rx_sec) as value 
    FROM network_usage 
    WHERE time >= now() - interval '${alert.duration}'
    ${
      alert.service
        ? `AND service IN (${alert.service.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machine
        ? `AND machine_id IN (${alert.machine.map((m) => `'${m}'`).join(',')})`
        : ''
    }
  `,
  tx_network: (alert: any) => `
    SELECT ${alert.aggregation}(tx_sec) as value 
    FROM network_usage 
    WHERE time >= now() - interval '${alert.duration}'
    ${
      alert.service
        ? `AND service IN (${alert.service.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machine
        ? `AND machine_id IN (${alert.machine.map((m) => `'${m}'`).join(',')})`
        : ''
    }
  `,
  request: (alert: any) => `
    SELECT COUNT(*) as value 
    FROM (
      SELECT COUNT(*) as total_requests 
      FROM request 
      WHERE time >= now() - interval '${alert.duration}'
      ${
        alert.service
          ? `AND service IN (${alert.service.map((s) => `'${s}'`).join(',')})`
          : ''
      }
      ${
        alert.machine
          ? `AND machine_id IN (${alert.machine
              .map((m) => `'${m}'`)
              .join(',')})`
          : ''
      }
    )
  `,
  response: (alert: any) => `
    SELECT ${alert.aggregation}(response_time) as value 
    FROM request 
    WHERE time >= now() - interval '${alert.duration}'
    ${
      alert.service
        ? `AND service IN (${alert.service.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machine
        ? `AND machine_id IN (${alert.machine.map((m) => `'${m}'`).join(',')})`
        : ''
    }
  `,
  error_rate: (alert: any) => `
    SELECT (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)) as value 
    FROM request 
    WHERE time >= now() - interval '${alert.duration}'
    ${
      alert.service
        ? `AND service IN (${alert.service.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machine
        ? `AND machine_id IN (${alert.machine.map((m) => `'${m}'`).join(',')})`
        : ''
    }
  `,
  error: (alert: any) => `
    SELECT ${alert.aggregation}(error_count) as value 
    FROM (
      SELECT COUNT(*) as error_count 
      FROM request 
      WHERE status_code >= 400 
      AND time >= now() - interval '${alert.duration}'
      ${
        alert.service
          ? `AND service IN (${alert.service.map((s) => `'${s}'`).join(',')})`
          : ''
      }
      ${
        alert.machine
          ? `AND machine_id IN (${alert.machine
              .map((m) => `'${m}'`)
              .join(',')})`
          : ''
      }
    )
  `,
  server_status: (alert: any) =>
    `SELECT COUNT(*)
     FROM server_status
     WHERE status = FALSE
     AND time >= now() - interval ${alert.duration} 
     ${
       alert.service
         ? `AND service IN (${alert.service.map((s) => `'${s}'`).join(',')})`
         : ''
     }
    ${
      alert.machine
        ? `AND machine_id IN (${alert.machine.map((m) => `'${m}'`).join(',')})`
        : ''
    }
     ;`,
};

const getDataFromRule = async (
  aggregation: string,
  metric: string,
  service: string[],
  machine: string[],
  duration: string,
) => {
  const result = await pgClient.query({
    text: METRIC_QUERY[metric.toLowerCase()]({
      aggregation,
      service,
      machine,
      duration,
    }),
  });
  return result.rows[0].value;
};

const ruleTermRegex = {
  aggregation: /AVG|SUM|COUNT|MIN|MAX/i,
  metrics: /cpu|mem|request|response|error|error_rate|rx_net|tx_net/i,
  paramRegex: /{.*}/,
  service: /services=\[([\w,\-]+)\]/i,
  machine: /machines=\[([\w,\-]+)\]/i,
  time: /'(\d+ (minute|hour|day|week|month|year)s*)'/,
};

async function delegate(term: string, duration = '1 days') {
  const param = term.match(ruleTermRegex.paramRegex)?.[0];

  const alert = {
    aggregation: term.match(ruleTermRegex.aggregation)[0],
    metric: term.match(ruleTermRegex.metrics)[0],
    service: param?.match(ruleTermRegex.service)?.[1]?.split(','),
    machine: param?.match(ruleTermRegex.machine)?.[1]?.split(','),
    duration: term.match(ruleTermRegex.time)?.[1] ?? duration,
  };
  return await getDataFromRule(
    alert.aggregation,
    alert.metric,
    alert.service,
    alert.machine,
    alert.duration,
  );
}

const testExpressions = [
  'AVG(CPU{services=[s1,s2,s3],machines=[x,y,z]})',
  'COUNT(error{services=[s1]})',
  'MAX(response{machine=[mid_01,mid_02]})',
];

const testRules = [
  "AVG(CPU{services=[liberator-api],machines=[machine_03]}) > AVG(CPU, '1 days')",
  'COUNT(error{services=[s1]}) > 0',
  "MAX(response{machine=[mid_01,mid_02]}) > MAX(response, '3 days')",
];

export const testExpressionParser = () => {
  for (const exp of testExpressions) {
    const alert = {
      aggregation: exp.match(ruleTermRegex.aggregation)[0],
      metric: exp.match(ruleTermRegex.metrics)[0],
      service: exp.match(ruleTermRegex.service)?.[1].split(','),
      machine: exp.match(ruleTermRegex.machine)?.[1].split(','),
      duration: exp.match(ruleTermRegex.time)?.[1],
    };
  }
};

export const testRuleParser = async () => {
  for (const rule of testRules) {
    const alertRule = {
      rule,
      duration: '7 days',
    };
    const a = await delegateTerm(alertRule);
    console.log(a);
    console.log(`eval(${a})`, eval(a));
  }
};

export const templateStringFormat = (str: string, ...args: any[]) => {
  return str.replace(/\$\{([\w+\d+]+)\}/g, (_, key) => args[key]);
};
