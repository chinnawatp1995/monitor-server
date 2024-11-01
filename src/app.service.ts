import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import {
  addRecipientToAlertQuery,
  createAlertQuery,
  createCpuQuery,
  createMemQuery,
  createNetworkQuery,
  createRecipientQuery,
  createRequestQuery,
  createServerStatus,
  getAlertQuery,
  getCpuQuery,
  getCurrentServerStatusQuery,
  getMemQuery,
  getReceivedNetworkQuery,
  getRequestQuery,
  getResponseAvgQuery,
  getResponseDistQuery,
  getResponseTimePercentile,
  getTransferedNetworkQuery,
  serverTimeline,
  updateAlertQuery,
} from './utils/rawSql';
import { fillMissingBuckets, testRuleParser } from './utils/util-functions';
import { TFilterReq, TMetricsReq } from './utils/types/request.type';
import { AlertManager } from './utils/alert/AlertManager';

export const TRACK_STATUS = new Map<string, boolean[]>();
export let pgClient: any;

@Injectable()
export class AppService {
  private pgClient: any;
  // constructor() {}

  async onModuleInit() {
    const pgPool = new Pool({
      host: 'localhost',
      user: 'postgres',
      password: 'password',
      database: 'monitor_server',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    this.pgClient = await pgPool.connect();
    pgClient = this.pgClient;
    this.serverStatus();
    await this.initStatus();

    const alertManager = new AlertManager();

    setInterval(() => {
      alertManager.checkRules();
    }, 5000);
    // await testRuleParser();
  }

  async collectMetrics(metrics: TMetricsReq) {
    const { request, cpu, mem, network, resourceCollectionTimes } = metrics;
    try {
      this.updateStatus(metrics.tags[0], metrics.tags[1]);
      if (Object.keys(request).length > 0) {
        const requestValue = {
          tags: metrics.tags,
          values: Object.entries(request ?? {}).flatMap(([k, v]) => {
            return (v as any).map((r) => {
              return {
                time: new Date(r[0]).toISOString(),
                statusCode: r[1],
                responseTime: r[2],
                errorMessage: r[3],
                controller: r[4],
                path: k,
              };
            });
          }),
        };

        await this.pgClient.query({ text: createRequestQuery(requestValue) });
      }
      if (Object.values(cpu ?? {}).length > 0) {
        const cpuValue = {
          tags: metrics.tags,
          values: Object.values(cpu).flatMap((v) => {
            return (v as any).map((r, index) => {
              return {
                time: new Date(resourceCollectionTimes[index]).toISOString(),
                usage: r,
              };
            });
          }),
        };
        // console.log(cpuValue);
        // console.log(createCpuQuery(cpuValue));
        await this.pgClient.query({ text: createCpuQuery(cpuValue) });
      }
      if (Object.values(mem ?? {}).length > 0) {
        const memValue = {
          tags: metrics.tags,
          values: Object.values(mem).flatMap((v) => {
            return (v as any).map((r, index) => {
              return {
                time: new Date(resourceCollectionTimes[index]).toISOString(),
                usage: r,
              };
            });
          }),
        };
        await this.pgClient.query({ text: createMemQuery(memValue) });
      }

      if (Object.values(network ?? {}).length > 0) {
        const networkValue = {
          tags: metrics.tags,
          values: Object.values(network).flatMap((v) => {
            return (v as any).map((r, index) => {
              // console.log(r);
              return {
                time: new Date(resourceCollectionTimes[index]).toISOString(),
                rx_sec: r[0],
                tx_sec: r[1],
              };
            });
          }),
        };
        // console.log(createNetworkQuery(networkValue));
        // console.log(networkValue);
        await this.pgClient.query({
          text: createNetworkQuery(networkValue),
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  async initStatus() {
    const result = (
      await this.pgClient.query({
        text: `SELECT DISTINCT ON (machine_id, service) machine_id, service FROM server_status;`,
      })
    ).rows;
    // console.log(result);
    result.map((r) => {
      TRACK_STATUS.set(`${r.service}:${r.machine_id}`, []);
    });
    // console.log(TRACK_STATUS);
  }

  private updateStatus(service: string, machineId: string) {
    const mapValue = TRACK_STATUS.get(`${service}:${machineId}`) ?? [];
    mapValue.push(true);
    TRACK_STATUS.set(`${service}:${machineId}`, mapValue.slice(-3));
  }

  private maxPooling(arr: boolean[]): boolean {
    const result = Math.max(...arr.map((b) => Number(b)));
    return Boolean(result);
  }

  async serverStatus() {
    setInterval(async () => {
      // console.log(...TRACK_STATUS.entries());
      const recs =
        [...TRACK_STATUS.entries()].map(([k, v]) => {
          const [service, machineId] = k.split(':');
          return {
            machineId,
            service,
            status: this.maxPooling(v),
          };
        }) ?? [];
      // console.log(recs);
      if (recs.length > 0) {
        // console.log(createServerStatus(recs));
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
    return (
      await this.pgClient.query({
        text: `SELECT DISTINCT ON (service) service FROM cpu_usage;`,
      })
    ).rows.map((r) => r.service);
  }

  async getMachineByService(service: string) {
    return (
      await this.pgClient.query({
        text: `SELECT DISTINCT ON (machine_id) machine_id FROM cpu_usage WHERE service = '${service}';`,
      })
    ).rows.map((r) => r.machine_id);
  }

  async getMachineInfo(machineId: string) {
    debugger;
  }

  async getTotalRequestPath(service: string) {
    return (
      await this.pgClient.query({
        text: `SELECT path, COUNT(*) AS total FROM request WHERE service = '${service}' GROUP BY path`,
      })
    ).rows;
  }

  async getCurrentServerStatus(machineIds?: string[]) {
    // console.log(getCurrentServerStatusQuery(machineIds));
    return (
      await this.pgClient.query({
        text: getCurrentServerStatusQuery(machineIds),
      })
    ).rows;
  }

  async getRequestData(filterObj: TFilterReq) {
    const { startTime, endTime, resolution, services, machineIds } = filterObj;
    // console.log(
    //   getRequestQuery(startTime, endTime, resolution, services, machineIds),
    // );
    const records = (
      await this.pgClient.query({
        text: getRequestQuery(
          startTime,
          endTime,
          resolution,
          services,
          machineIds,
        ),
      })
    ).rows;
    return fillMissingBuckets(
      records,
      'bucket',
      'total_requests',
      'machine_id',
    );
  }

  async getResponseAvgData(filterObj: TFilterReq) {
    const { startTime, endTime, resolution, services, machineIds } = filterObj;
    // console.log(
    //   getResponseAvgQuery(startTime, endTime, resolution, services, machineIds),
    // );
    const records = (
      await this.pgClient.query({
        text: getResponseAvgQuery(
          startTime,
          endTime,
          resolution,
          services,
          machineIds,
        ),
      })
    ).rows;
    return fillMissingBuckets(records, 'bucket', 'avg', 'machine_id');
  }

  async getResponseDistData(filterObj: TFilterReq) {
    const { startTime, endTime, resolution, services, controllers } = filterObj;
    // console.log(getResponseTimePercentile(startTime, endTime, resolution));
    const records = (
      await this.pgClient.query({
        text: getResponseTimePercentile(
          startTime,
          endTime,
          resolution,
          services,
          controllers,
        ),
      })
    ).rows;
    // console.log(records);
    return (Object as any).groupBy(records, ({ machine_id }) => machine_id);
  }

  async getCpuData(filter: TFilterReq) {
    const { startTime, endTime, resolution, machineIds } = filter;
    // console.log(getCpuQuery(startTime, endTime, resolution, machineIds));
    const records = (
      await this.pgClient.query({
        text: getCpuQuery(startTime, endTime, resolution, machineIds),
      })
    ).rows;
    return fillMissingBuckets(records, 'bucket', 'avg', 'machine_id');
  }

  async getMemData(filter: TFilterReq) {
    // console.log(getTIMESTAMPTZ());
    const { startTime, endTime, resolution, machineIds } = filter;
    // console.log(getMemQuery(startTime, endTime, resolution, machineIds));
    const records = (
      await this.pgClient.query({
        text: getMemQuery(startTime, endTime, resolution, machineIds),
      })
    ).rows;
    return fillMissingBuckets(records, 'bucket', 'avg', 'machine_id');
  }

  async getReceivedNetworkData(filter: TFilterReq) {
    const { startTime, endTime, resolution, machineIds } = filter;
    const records = (
      await this.pgClient.query({
        text: getReceivedNetworkQuery(
          startTime,
          endTime,
          resolution,
          machineIds,
        ),
      })
    ).rows;
    return fillMissingBuckets(records, 'bucket', 'avg', 'machine_id');
  }

  async getTransferedNetworkData(filter: TFilterReq) {
    const { startTime, endTime, resolution, machineIds } = filter;
    const records = (
      await this.pgClient.query({
        text: getTransferedNetworkQuery(
          startTime,
          endTime,
          resolution,
          machineIds,
        ),
      })
    ).rows;
    return fillMissingBuckets(records, 'bucket', 'avg', 'machine_id');
  }

  async getErrorToReqRatio(service: string) {
    return (
      await this.pgClient.query({
        text:
          `SELECT COUNT(*) AS total_requests, ` +
          `COUNT(CASE WHEN status_code >= 400 THEN 1 END) AS total_errors ` +
          `FROM request WHERE service = '${service}';`,
      })
    ).rows[0];
  }

  async getErrorReason(service: string) {
    return (
      await this.pgClient.query({
        text: `SELECT 
        error_message, 
        COUNT(*) AS error_count
      FROM request
      WHERE status_code >= 400 AND error_message IS NOT NULL 
            AND service = '${service}'
      GROUP BY error_message
      ORDER BY error_count DESC
      LIMIT 10;
`,
      })
    ).rows;
  }

  async serverTimeline(filterObj: any) {
    const { startTime, endTime, services, machineIds } = filterObj;
    const records = (
      await this.pgClient.query({
        text: serverTimeline(startTime, endTime, machineIds),
      })
    ).rows;
    return fillMissingBuckets(records, 'time', 'status', 'machine_id');
    // return records;
  }

  async createAlert(alert: any) {
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

  async createRecipient(recipient: any) {
    await this.pgClient.query({
      text: createRecipientQuery(recipient),
    });
    return {};
  }

  async addRecipientToAlert({ recipientId, ruleId }) {
    await this.pgClient.query({
      text: addRecipientToAlertQuery(ruleId, recipientId),
    });
  }

  async getAlert() {
    return (
      await this.pgClient.query({
        text: getAlertQuery(),
      })
    ).rows;
  }

  async updateAlert(alert: any) {
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

  async getRecipients() {
    return (
      await this.pgClient.query({
        text: `SELECT * FROM recipient`,
      })
    ).rows;
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
}
