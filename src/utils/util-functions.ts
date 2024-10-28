import { groupBy, keyBy } from 'lodash';
import * as moment from 'moment';
import axios from 'axios';
import { cpuData } from './test-data';

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
  /*
  {
    name,
    rules: {
      expression: /aggregationFunction(identifier)/  /operator/  /aggregationFunc(identifier)/  ** can be recursive ,
      duration,
      severity possible value [danger, ],
      message
    }
  }
  */
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
