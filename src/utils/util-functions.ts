import { groupBy, keyBy } from 'lodash';
import * as moment from 'moment';

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
  data,
  bucketField,
  valueField,
  groupByField,
  interval = 'hour',
  defaultValue = 0,
) {
  // Step 1: Parse the data and find the full time range
  const parsedData = data.map((item) => ({
    ...item,
    [bucketField]: moment(item[bucketField]).toISOString(),
    [valueField]: parseInt(item[valueField], 10),
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

// Example usage:
const sampleData = [
  {
    bucket: '2024-10-08T21:00:00.000Z',
    total_requests: 21,
    machine_id: 'machine_01',
    service: 'jobA',
  },
  {
    bucket: '2024-10-08T21:00:00.000Z',
    total_requests: 1,
    machine_id: 'machine_02',
    service: 'jobA',
  },
  {
    bucket: '2024-10-08T22:00:00.000Z',
    total_requests: 128,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-08T22:00:00.000Z',
    total_requests: 229,
    machine_id: 'machine_01',
    service: 'jobA',
  },
  {
    bucket: '2024-10-08T23:00:00.000Z',
    total_requests: 57,
    machine_id: 'machine_02',
    service: 'jobB',
  },
];

const cpuData = [
  {
    bucket: '2024-10-08T21:00:00.000Z',
    avg: 0.15253196254071646,
    machine_id: 'machine_01',
  },
  {
    bucket: '2024-10-08T22:00:00.000Z',
    avg: 0.22406259469696957,
    machine_id: 'machine_01',
  },
  {
    bucket: '2024-10-08T22:00:00.000Z',
    avg: 0.271751554726368,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-08T23:00:00.000Z',
    avg: 0.2776527320359283,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T00:00:00.000Z',
    avg: 0.18253142497200453,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T01:00:00.000Z',
    avg: 0.14870476653696468,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T02:00:00.000Z',
    avg: 0.15188888888888885,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T03:00:00.000Z',
    avg: 0.1726023485269596,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T04:00:00.000Z',
    avg: 0.16413661710037153,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T05:00:00.000Z',
    avg: 0.1755625,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T06:00:00.000Z',
    avg: 0.2507613636363637,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T07:00:00.000Z',
    avg: 0.21459374999999997,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T08:00:00.000Z',
    avg: 0.22106249999999997,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T09:00:00.000Z',
    avg: 0.1333125,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T10:00:00.000Z',
    avg: 0.1587916666666667,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T11:00:00.000Z',
    avg: 0.17821874999999998,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T12:00:00.000Z',
    avg: 0.1671607142857143,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T13:00:00.000Z',
    avg: 0.25510714285714287,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T14:00:00.000Z',
    avg: 0.189765625,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T15:00:00.000Z',
    avg: 0.16259375,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T16:00:00.000Z',
    avg: 0.20082812499999997,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T17:00:00.000Z',
    avg: 0.16734374999999999,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T18:00:00.000Z',
    avg: 0.15097916666666666,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T19:00:00.000Z',
    avg: 0.2147790527343749,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T20:00:00.000Z',
    avg: 0.1448749305169542,
    machine_id: 'machine_02',
  },
  {
    bucket: '2024-10-09T21:00:00.000Z',
    avg: 0.14950851616628177,
    machine_id: 'machine_02',
  },
].map((a) => {
  a.avg *= 100;
  return a;
});
export const testFunc = () => {
  const result = fillMissingBuckets(cpuData, 'bucket', 'avg', 'machine_id');
  console.log(result);
};
