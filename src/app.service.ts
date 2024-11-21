import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import {
  addRecipientToAlertQuery,
  cpuGapFillQuery,
  createAlertQuery,
  createCpuQuery,
  createErrorQuery,
  createMemQuery,
  createRecipientQuery,
  createRequestQuery,
  createResponseQuery,
  createRxNetworkQuery,
  createServerStatus,
  createTxNetworkQuery,
  errorRanking,
  errorRate,
  getAlertQuery,
  getAverageResponseTimeGapFill,
  getCurrentServerStatusQuery,
  getPathRatio,
  getRequestErrorRatioGapFill,
  getRequestPath,
  getTotalRequestGapFill,
  memGapFillQuery,
  rxNetworkGapFillQuery,
  serverTimeline,
  txNetworkGapFillQuery,
  updateAlertQuery,
} from './utils/rawSql';
import { fillMissingBuckets, groups } from './utils/util-functions';
import {
  TFilterIntervalReq,
  TFilterReq,
  TMetricsReq,
} from './utils/types/request.type';
import { AlertManager } from './utils/alert/AlertManager';
import {
  TAlertRecord,
  TAlertRuleQuery,
  TAvgResponseTimeRecord,
  TCreateError,
  TCreateRequest,
  TCreateResource,
  TCreateResponseTime,
  TErrorRanking,
  TErrorRecord,
  TMachine,
  TRecipientQuery,
  TRecipientRecord,
  TRequestErrorRatioRecord,
  TRequestPathRecord,
  TResourceRecord,
  TServerStatus,
  TService,
  TTotalRequestRecord,
} from './utils/types/record.type';
import { TGroupedResponseTime } from './utils/types/metric.type';

export const TRACK_STATUS = new Map<string, boolean[]>();
export let pgClient: PoolClient;

@Injectable()
export class AppService {
  private pgClient: PoolClient;
  // constructor() {}

  async onModuleInit() {
    const pgPool: Pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'monitor_server_',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    this.pgClient = await pgPool.connect();
    pgClient = this.pgClient;
    this.serverStatus();
    await this.initStatus();

    // const alertManager = new AlertManager();

    // setInterval(() => {
    //   alertManager.checkRules();
    // }, 5000);
    // await testRuleParser();
  }

  async collectMetrics(metrics: TMetricsReq) {
    const {
      time,
      totalRequest,
      responseTime,
      error,
      cpu,
      mem,
      rxNetwork,
      txNetwork,
    } = metrics;

    if (cpu.length === 0) return;

    this.updateStatus(cpu[0].labels);

    if (totalRequest.length > 0) {
      const recs: TCreateRequest[] = totalRequest.map((v) => {
        const { service, machine, controller, path, statusCode } = v.labels;
        return {
          service,
          machine,
          controller,
          path,
          statusCode,
          value: v.value,
        };
      });

      await this.pgClient.query({
        text: createRequestQuery(recs, new Date(time).toISOString()),
      });
    }

    if (responseTime.length > 0) {
      // console.log(responseTime);
      const groupObj: TGroupedResponseTime = {};
      responseTime.forEach((r) => {
        const { le, service, machine, controller, path, statusCode } = r.labels;
        const label = `${service}:${machine}:${controller}:${path}:${statusCode}`;
        if (!groupObj[label]) {
          groupObj[label] = {
            sum: 0,
            count: 0,
            '25': 0,
            '50': 0,
            '100': 0,
            '200': 0,
            '400': 0,
            '800': 0,
            '1600': 0,
            '3200': 0,
            '6400': 0,
            '12800': 0,
          };
        }
        if (r.metricName === 'avg_response_time_bucket') {
          groupObj[label][le] = Number(r.value);
        } else if (r.metricName === 'avg_response_time_sum') {
          groupObj[label].sum = r.value;
        } else if (r.metricName === 'avg_response_time_count')
          groupObj[label].count = r.value;
      });

      const resArr = Object.entries(groupObj).map(([k, v]) => {
        const [service, machine, controller, path, statusCode] = k.split(':');
        return {
          labels: {
            service,
            machine,
            controller,
            path,
            statusCode,
          },
          sum: v.sum,
          count: v.count,
          bucket_25: Number(v['25']),
          bucket_50: Number(v['50']),
          bucket_100: Number(v['100']),
          bucket_200: Number(v['200']),
          bucket_400: Number(v['400']),
          bucket_800: Number(v['800']),
          bucket_1600: Number(v['1600']),
          bucket_3200: Number(v['3200']),
          bucket_6400: Number(v['6400']),
          bucket_12800: Number(v['12800']),
        };
      });

      const recs: TCreateResponseTime[] = resArr.map((v) => {
        const { labels, sum, count } = v;
        const { service, machine, controller, path, statusCode } = labels;
        return {
          service,
          machine,
          controller,
          path,
          statusCode,
          sum,
          count,
          bucket_25: v.bucket_25,
          bucket_50: v.bucket_50,
          bucket_100: v.bucket_100,
          bucket_200: v.bucket_200,
          bucket_400: v.bucket_400,
          bucket_800: v.bucket_800,
          bucket_1600: v.bucket_1600,
          bucket_3200: v.bucket_3200,
          bucket_6400: v.bucket_6400,
          bucket_12800: v.bucket_12800,
        };
      });
      await this.pgClient.query({
        text: createResponseQuery(recs, new Date(time).toISOString()),
      });
    }

    if (error.length > 0) {
      const recs: TCreateError[] = error.map((v) => {
        const { service, machine, controller, path, errorCode, errorTitle } =
          v.labels;
        return {
          service,
          machine,
          controller,
          path,
          errorCode,
          errorTitle,
          value: v.value,
        };
      });
      await this.pgClient.query({
        text: createErrorQuery(recs, new Date(time).toISOString()),
      });
    }

    if (cpu.length > 0) {
      const recs: TCreateResource[] = cpu
        .map((v) => {
          const { service, machine } = v.labels;
          return {
            service,
            machine,
            value: v.value,
          };
        })
        .filter((r) => r.value !== null && r.value !== undefined);

      if (recs.length > 0) {
        await this.pgClient.query({
          text: createCpuQuery(recs, new Date(time).toISOString()),
        });
      }
    }

    if (mem.length > 0) {
      const recs: TCreateResource[] = mem
        .map((v) => {
          const { service, machine } = v.labels;
          return {
            service,
            machine,
            value: v.value,
          };
        })
        .filter((r) => r.value !== null && r.value !== undefined);

      if (recs.length > 0)
        await this.pgClient.query({
          text: createMemQuery(recs, new Date(time).toISOString()),
        });
    }

    if (rxNetwork.length > 0) {
      const recs: TCreateResource[] = rxNetwork
        .map((v) => {
          const { service, machine } = v.labels;
          return {
            service,
            machine,
            value: v.value,
          };
        })
        .filter((r) => r.value !== null && r.value !== undefined);

      if (recs.length > 0) {
        await this.pgClient.query({
          text: createRxNetworkQuery(recs, new Date(time).toISOString()),
        });
      }
    }

    if (txNetwork.length > 0) {
      const recs: TCreateResource[] = txNetwork
        .map((v) => {
          const { service, machine } = v.labels;
          return {
            service,
            machine,
            value: v.value,
          };
        })
        .filter((r) => r.value !== null && r.value !== undefined);

      if (recs.length > 0) {
        await this.pgClient.query({
          text: createTxNetworkQuery(recs, new Date(time).toISOString()),
        });
      }
    }
  }

  async initStatus() {
    const result: { service: string; machine_id: string }[] = (
      await this.pgClient.query({
        text: `SELECT DISTINCT ON (machine_id, service) machine_id, service FROM server_status;`,
      })
    ).rows;
    result.map((r) => {
      TRACK_STATUS.set(`${r.service}:${r.machine_id}`, Array(3).fill(false));
    });
  }

  heartbeat(machine: string, service: string) {
    this.updateStatus({
      machine,
      service,
    });
  }

  private updateStatus(labels: Record<string, string>) {
    const { service, machine } = labels;
    const mapValue = TRACK_STATUS.get(`${service}:${machine}`) ?? [];
    mapValue.push(true);
    TRACK_STATUS.set(`${service}:${machine}`, mapValue.slice(-3));
  }

  private maxPooling(arr: boolean[]): boolean {
    const result = Math.max(...arr.map((b) => Number(b)));
    return Boolean(result);
  }

  async serverStatus() {
    setInterval(async () => {
      const recs: { machineId: string; service: string; status: boolean }[] =
        [...TRACK_STATUS.entries()].map(([k, v]) => {
          const [service, machineId] = k.split(':');
          return {
            machineId,
            service,
            status: this.maxPooling(v),
          };
        }) ?? [];
      if (recs.length > 0) {
        await this.pgClient.query({
          text: createServerStatus(recs),
        });
      }

      TRACK_STATUS.forEach((value, key, map) => {
        const v = map.get(key) ?? [];
        v.push(false);
        map.set(key, v.slice(-3));
      });
    }, 1_000 * 10);
  }

  async getService() {
    const records: TService[] = (
      await this.pgClient.query({
        text: `SELECT DISTINCT ON (service) service FROM cpu;`,
      })
    ).rows;

    return records.map((r: TService) => r.service);
  }

  async getMachineByService(service: string) {
    const records: TMachine[] = (
      await this.pgClient.query({
        text: `SELECT DISTINCT ON (machine) machine FROM cpu WHERE service = '${service}';`,
      })
    ).rows;
    return records?.map((r: TMachine) => r.machine);
  }

  async getMachineInfo(machineId: string) {
    debugger;
  }

  async getTotalRequestPath(service: string) {
    const records: TTotalRequestRecord[] = (
      await this.pgClient.query({
        text: getRequestPath(service),
      })
    ).rows;

    return records;
  }

  async getCurrentServerStatus(machineIds?: string[], service?: string) {
    const serverStatus: TServerStatus[] = (
      await this.pgClient.query({
        text: getCurrentServerStatusQuery(machineIds, service),
      })
    ).rows;
    return serverStatus;
  }

  async getRequestDataGapFill(filterObj: TFilterIntervalReq) {
    const {
      interval,
      totalPoint,
      services,
      machines,
      groupField,
      controllers,
    } = filterObj;
    const records: TTotalRequestRecord[] = (
      await this.pgClient.query({
        text: getTotalRequestGapFill(
          interval,
          totalPoint,
          services,
          machines,
          controllers,
          groupField,
        ),
      })
    ).rows;
    return groups(records, (r) => r[groupField ?? 'machine']);
  }

  async getResponseAvgDataGapFill(filterObj: TFilterIntervalReq) {
    const {
      interval,
      totalPoint,
      services,
      machines,
      groupField,
      controllers,
    } = filterObj;
    const records: TAvgResponseTimeRecord[] = (
      await this.pgClient.query({
        text: getAverageResponseTimeGapFill(
          interval,
          totalPoint,
          services,
          machines,
          controllers,
          groupField,
        ),
      })
    ).rows;
    return groups(records, (r) => r[groupField ?? 'machine']);
  }

  // async getResponseDistData(filterObj: TFilterReq) {
  //   const { startTime, endTime, resolution, services, controllers } = filterObj;
  //   // console.log(getResponseTimePercentile(startTime, endTime, resolution));
  //   const records = (
  //     await this.pgClient.query({
  //       text: getResponseTimePercentile(
  //         startTime,
  //         endTime,
  //         resolution,
  //         services,
  //         controllers,
  //       ),
  //     })
  //   ).rows;
  //   // console.log(records);
  //   return (Object as any).groupBy(records, ({ machine_id }) => machine_id);
  // }

  async getPathRatio(filter: TFilterReq) {
    const { startTime, endTime, services, machines, controllers } = filter;

    const records: TRequestPathRecord[] = (
      await this.pgClient.query({
        text: getPathRatio(startTime, endTime, services, machines, controllers),
      })
    ).rows;
    return records;
  }

  async getCpuGapFillData(filter: TFilterIntervalReq) {
    const { interval, totalPoint, machines, groupField } = filter;
    const records: TResourceRecord[] = (
      await this.pgClient.query({
        text: cpuGapFillQuery(interval, totalPoint, machines),
      })
    ).rows;
    return groups(records, (r) => r[groupField ?? 'machine']);
  }

  async getMemGapFillData(filter: TFilterIntervalReq) {
    const { interval, totalPoint, machines, groupField } = filter;
    const records: TResourceRecord[] = (
      await this.pgClient.query({
        text: memGapFillQuery(interval, totalPoint, machines),
      })
    ).rows;
    return groups(records, (r) => r[groupField ?? 'machine']);
  }

  async getRxNetowrkGapFillData(filter: TFilterIntervalReq) {
    const { interval, totalPoint, machines, groupField } = filter;
    const records: TResourceRecord[] = (
      await this.pgClient.query({
        text: rxNetworkGapFillQuery(interval, totalPoint, machines),
      })
    ).rows;
    return groups(records, (r) => r[groupField ?? 'machine']);
  }

  async getTxNetowrkGapFillData(filter: TFilterIntervalReq) {
    const { interval, totalPoint, machines, groupField } = filter;
    const records: TResourceRecord[] = (
      await this.pgClient.query({
        text: txNetworkGapFillQuery(interval, totalPoint, machines),
      })
    ).rows;
    return groups(records, (r) => r[groupField ?? 'machine']);
  }

  async getErrorRate(filterObj: TFilterReq) {
    const {
      startTime,
      endTime,
      resolution,
      services,
      machines,
      controllers,
      groupField,
    } = filterObj;
    const unit = (resolution ?? '1 hour').split(' ')[1].replace('s', '');
    const records: TErrorRecord[] = (
      await this.pgClient.query({
        text: errorRate(
          startTime,
          endTime,
          resolution,
          services,
          machines,
          controllers,
          groupField,
        ),
      })
    ).rows;
    return records;
  }

  async getRequestErrorRatioGapFill(filterObj: TFilterIntervalReq) {
    const { interval, services, machines, controllers } = filterObj;
    const records: TRequestErrorRatioRecord[] = (
      await this.pgClient.query({
        text: getRequestErrorRatioGapFill(
          interval,
          services,
          machines,
          controllers,
        ),
      })
    ).rows;
    return records;
  }

  async getErrorRanking(service: string) {
    const records: TErrorRanking[] = (
      await this.pgClient.query({
        text: errorRanking(service),
      })
    ).rows;
    return records;
  }

  async serverTimeline(filterObj: TFilterReq) {
    const { startTime, endTime, services, machines } = filterObj;
    const records = (
      await this.pgClient.query({
        text: serverTimeline(startTime, endTime, machines),
      })
    ).rows;
    return fillMissingBuckets(records, 'time', 'status', 'machine_id');
  }

  async createAlert(alert: TAlertRuleQuery) {
    try {
      await this.pgClient.query({
        text: createAlertQuery(alert),
      });
    } catch (e) {
      console.log(e);
    }
    return {
      success: true,
    };
  }

  async createRecipient(recipient: TRecipientQuery) {
    await this.pgClient.query({
      text: createRecipientQuery(recipient),
    });
    return {};
  }

  async addRecipientToAlert(params: {
    ruleId: string;
    recipientIds: string[];
  }) {
    await this.pgClient.query({
      text: addRecipientToAlertQuery(params.ruleId, params.recipientIds),
    });
  }

  async getAlert() {
    const alerts: TAlertRecord[] = (
      await this.pgClient.query({
        text: getAlertQuery(),
      })
    ).rows;
    return alerts;
  }

  async updateAlert(alert: TAlertRuleQuery) {
    await this.pgClient.query({
      text: updateAlertQuery(alert),
    });
  }

  async enableRule(ruleId: string) {
    await this.pgClient.query({
      text: `UPDATE alert_rule SET enabled = true WHERE id = ${ruleId}`,
    });
  }

  async disableRule(ruleId: string) {
    await this.pgClient.query({
      text: `UPDATE alert_rule SET enabled = false WHERE id = ${ruleId}`,
    });
  }

  async getRecipients(ruleId: string) {
    const recipients: TRecipientRecord[] = (
      await this.pgClient.query({
        text: `SELECT * FROM recipient ${
          ruleId
            ? `WHERE id IN (SELECT alert_recipient.recipient_id FROM alert_recipient WHERE alert_recipient.rule_id = ${ruleId})`
            : ''
        }`,
      })
    ).rows;
    return recipients;
  }

  async deleteRule(ruleId: string) {
    await this.pgClient.query({
      text: `DELETE FROM alert_rule WHERE id = ${ruleId}`,
    });
  }

  async removeRecipientFromRule(ruleId: string, recipientId: string) {
    await this.pgClient.query({
      text: `DELETE FROM alert_recipient WHERE rule_id = ${ruleId} AND recipient_id = ${recipientId}`,
    });
  }

  async removeRecipient(recipientId: string) {
    await this.pgClient.query({
      text: `DELETE FROM recipient WHERE id = ${recipientId}`,
    });
  }
}
