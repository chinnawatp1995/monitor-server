import { groupBy, keyBy } from 'lodash';
import * as moment from 'moment';
import axios from 'axios';
import { cpuData } from './test-data';
import { pgClient } from 'src/app.service';
import { AlertRule, Expression } from './types/alert.type';

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
  data: Record<string, string | number>[],
  bucketField: string,
  valueField: string,
  groupByField: string,
  interval = 'hour',
  defaultValue = 0,
  n = 1,
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
    current = current.add(n, interval as moment.DurationInputArg2);
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

const validTerm =
  /(AVG|SUM|COUNT|MIN|MAX)\((cpu|mem|request|response|error|error_rate|rx_net|tx_net)(\{[^}]*\})*(,.*'(\d+ (minute|hour|day|week|month|year)s*)')*\)/gi;

export const METRIC_QUERY = {
  cpu: (alert: Expression) =>
    `SELECT ${
      alert.aggregation
    }(value) as value FROM cpu WHERE time >= now() - interval '${
      alert.duration
    }' 
    ${
      alert.services
        ? `AND service IN (${alert.services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machines
        ? `AND machine IN (${alert.machines.map((m) => `'${m}'`).join(',')})`
        : ''
    }
    ${alert.aggregation.toUpperCase() === 'LAST' ? 'LIMIT 1' : ''}
  `,
  mem: (alert: Expression) =>
    `SELECT ${
      alert.aggregation
    }(value) as value FROM mem WHERE time >= now() - interval '${
      alert.duration
    }' 
    ${
      alert.services
        ? `AND service IN (${alert.services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machines
        ? `AND machine IN (${alert.machines.map((m) => `'${m}'`).join(',')})`
        : ''
    }
    ${alert.aggregation.toUpperCase() === 'LAST' ? 'LIMIT 1' : ''}
  `,
  rx_network: (alert: Expression) => `
    SELECT ${alert.aggregation}(rx_sec) as value 
    FROM rx_network 
    WHERE time >= now() - interval '${alert.duration}'
    ${
      alert.services
        ? `AND service IN (${alert.services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machines
        ? `AND machine IN (${alert.machines.map((m) => `'${m}'`).join(',')})`
        : ''
    }
    ${alert.aggregation.toUpperCase() === 'LAST' ? 'LIMIT 1' : ''}
  `,
  tx_network: (alert: Expression) => `
    SELECT ${alert.aggregation}(tx_sec) as value 
    FROM tx_network 
    WHERE time >= now() - interval '${alert.duration}'
    ${
      alert.services
        ? `AND service IN (${alert.services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machines
        ? `AND machine IN (${alert.machines.map((m) => `'${m}'`).join(',')})`
        : ''
    }
    ${alert.aggregation.toUpperCase() === 'LAST' ? 'LIMIT 1' : ''}
  `,
  request: (alert: Expression) => `
    WITH request_deltas AS (
      SELECT
          time,
          path,
          service,
          machine,
          controller,
          error_title,
          CASE
              WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time) 
              THEN value  
              ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time)
          END AS request_in_interval
      FROM
          error
      WHERE time >= now() - interval '${alert.duration}'
      ${
        (alert.services ?? []).length > 0
          ? `AND service IN  ( ${alert.services
              .map((s) => `'${s}'`)
              .join(',')})`
          : ''
      }
      ${
        (alert.machines ?? []).length > 0
          ? `AND machine IN  ( ${alert.machines
              .map((s) => `'${s}'`)
              .join(',')})`
          : ''
      }
      ${
        (alert.controllers ?? []).length > 0
          ? `AND controller IN  ( ${alert.controllers
              .map((s) => `'${s}'`)
              .join(',')})`
          : ''
      }
    )
    SELECT ${
      alert.aggregation
    }(request_in_interval) AS value FROM request_deltas 
  `,
  response: (alert: Expression) => `
    SELECT ${alert.aggregation}(sum/count) as value 
    FROM response_time 
    WHERE time >= now() - interval '${alert.duration}'
    ${
      alert.services
        ? `AND service IN (${alert.services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      alert.machines
        ? `AND machine_id IN (${alert.machines.map((m) => `'${m}'`).join(',')})`
        : ''
    }
    ${alert.aggregation.toUpperCase() === 'LAST' ? 'LIMIT 1' : ''}
  `,
  error: (alert: Expression) => `
    WITH error_deltas AS (
      SELECT
          time,
          path,
          service,
          machine,
          controller,
          error_title,
          CASE
              WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time) 
              THEN value  
              ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time)
          END AS errors_in_interval
      FROM
          error
      WHERE time >= now() - interval '${alert.duration}'
      ${
        (alert.services ?? []).length > 0
          ? `AND service IN  ( ${alert.services
              .map((s) => `'${s}'`)
              .join(',')})`
          : ''
      }
      ${
        (alert.machines ?? []).length > 0
          ? `AND machine IN  ( ${alert.machines
              .map((s) => `'${s}'`)
              .join(',')})`
          : ''
      }
      ${
        (alert.controllers ?? []).length > 0
          ? `AND controller IN  ( ${alert.controllers
              .map((s) => `'${s}'`)
              .join(',')})`
          : ''
      }
    )
    SELECT ${alert.aggregation}(errors_in_interval) AS value FROM error_deltas 
  `,
  server_status: (alert: Expression) =>
    `SELECT ${alert.aggregation}(status) as value
     FROM server_status
     WHERE status = FALSE
     AND time >= now() - interval '${alert.duration}' 
     ${
       alert.services
         ? `AND service IN (${alert.services.map((s) => `'${s}'`).join(',')})`
         : ''
     }
    ${
      alert.machines
        ? `AND machine_id IN (${alert.machines.map((m) => `'${m}'`).join(',')})`
        : ''
    }
     ${
       alert.value
         ? `AND status IN (${alert.value.map((s) => `'${s}'`).join(',')})`
         : ''
     }
     ;`,
};

export const delegateTerm = async (rule: {
  expression: string;
  duration: string;
}) => {
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

export const testExpressions = [
  'AVG(CPU{services=[s1,s2,s3],machines=[x,y,z]})',
  'COUNT(error{services=[s1]})',
  'MAX(response{machine=[mid_01,mid_02]})',
];

export const testRules = [
  "AVG(CPU{services=[liberator-api],machines=[machine_03]}) > AVG(CPU, '1 days')",
  'COUNT(error{services=[s1]}) > 0',
  "MAX(response{machine=[mid_01,mid_02]}) > MAX(response, '3 days')",
];

export const testRuleParser = async () => {
  for (const rule of testRules) {
    const alertRule = {
      expression: rule,
      duration: '7 days',
    };
    const a = await delegateTerm(alertRule);
    console.log(a);
    console.log(`eval(${a})`, eval(a));
  }
};

export function groups<T>(
  arr: T[],
  groupDominator: (t: T) => string,
): Record<string, T[]> {
  const results: Record<string, T[]> = {};
  for (const t of arr) {
    const d = groupDominator(t);
    let list = results[d];
    if (!list) {
      list = [];
      results[d] = list;
    }
    list.push(t);
  }
  return results;
}
