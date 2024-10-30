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

const alertRuleLangauge = {
  INFIX_OPS: {
    '+': function (a, b) {
      return a + b;
    },
    '-': function (a, b) {
      return a - b;
    },
    '*': function (a, b) {
      return a * b;
    },
    '/': function (a, b) {
      return a / b;
    },
    '>': function (a, b) {
      return a > b;
    },
    '<': function (a, b) {
      return a < b;
    },
    '>=': function (a, b) {
      return a >= b;
    },
    '<=': function (a, b) {
      return a <= b;
    },
    '==': function (a, b) {
      return a === b;
    },
    '!=': function (a, b) {
      return a !== b;
    },
  },
  PREFIX_OPS: {
    SQRT: function (expr) {
      return Math.sqrt(expr);
    },
    POW: function (expr) {
      return Math.pow(expr[0], expr[1]);
    },
  },
  PRECEDENCE: [['SQRT', 'POW'], ['*', '/'], ['+', '-'], [',']],
  GROUP_OPEN: '(',
  GROUP_CLOSE: ')',
  SEPARATOR: ' ',
  SYMBOLS: ['(', ')', '+', '-', '*', '/', ','],

  termDelegate: function (term: string) {
    // possible value [aggreation(AVG,COUNT,MIN,MAX,SUM)]([metrics]{service=[x,y,z],machineId=[a,b,c]})
    const alert = {
      aggregation: term.match(ruleTermRegex.aggregation),
      metric: term.match(ruleTermRegex.metrics),
      service: term.match(ruleTermRegex.service),
      machine: term.match(ruleTermRegex.machine),
    };
  },
};

// const validTerm = /^[(AVG)(SUM)(COUNT)(MIN)(MAX)]([(cpu)(mem)(request)(response)(error)(error_rate)(rx_net)(tx_net)])$/i

export const METRIC_QUERY = {
  cpu: (aggregation) => ``,
  mem: (aggregation) => ``,
  rxNetwork: (aggregation) => ``,
  txNetwork: (aggregation) => ``,
  request: (aggregation) => ``,
  response: (aggregation) => ``,
  errorRate: (aggregation) => ``,
  error: (aggregation) => ``,
};

const getDataFromRule = async (
  aggregation: string,
  metric: string,
  service: string[],
  machine: string[],
) => {
  const result = await pgClient.query({
    text: METRIC_QUERY[metric](aggregation),
  });
  return result.rows;
};

const ruleTermRegex = {
  aggregation: /[(AVG)(SUM)(COUNT)(MIN)(MAX)]/i,
  metrics:
    /[(cpu)(mem)(request)(response)(error)(error_rate)(rx_net)(tx_net)]/i,
  service: /{services=[.*]}/i,
  machine: /{machine_ids=[.*]}/,
};
