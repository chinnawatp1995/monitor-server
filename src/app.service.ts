import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import {
  createCpuQuery,
  createMemQuery,
  createRequestQuery,
  createServerStatus,
  getCpuQuery,
  getCurrentServerStatusQuery,
  getMemQuery,
  getRequestQuery,
  getResponseAvgQuery,
  getResponseDistQuery,
  getResponseTimePercentile,
  serverTimeline,
} from './utils/rawSql';
import { fillMissingBuckets, getTIMESTAMPTZ } from './utils/util-functions';
import { TFilterReq, TMetricsReq } from './utils/types/request.type';

export const TRACK_STATUS = new Map<string, boolean>();

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
    this.serverStatus();
  }

  async collectMetrics(metrics: TMetricsReq) {
    // console.log(metrics);
    const { request, cpu, mem } = metrics;
    try {
      this.updateStatus(metrics.tags[0], metrics.tags[1]);

      if (Object.keys(request).length > 0) {
        const requestValue = {
          tags: metrics.tags,
          values: Object.entries(request ?? {}).flatMap(([k, v]) => {
            return (v as any).map((r) => {
              return {
                time: getTIMESTAMPTZ(),
                statusCode: r[1],
                responseTime: r[2],
                errorMessage: r[3],
                path: k,
              };
            });
          }),
        };
        // console.log(requestValue);
        // console.log(createRequestQuery(requestValue));

        await this.pgClient.query({ text: createRequestQuery(requestValue) });
      }
      if (Object.values(cpu ?? {}).length > 0) {
        const cpuValue = {
          tags: metrics.tags,
          values: Object.values(cpu).flatMap((v) => {
            return (v as any).map((r) => {
              return {
                time: getTIMESTAMPTZ(),
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
            return (v as any).map((r) => {
              return {
                time: getTIMESTAMPTZ(),
                usage: r,
              };
            });
          }),
        };
        await this.pgClient.query({ text: createMemQuery(memValue) });
      }
    } catch (e) {
      console.log(e);
    }
  }

  private updateStatus(service: string, machineId: string) {
    TRACK_STATUS.set(`${service}:${machineId}`, true);
  }

  async serverStatus() {
    setInterval(async () => {
      console.log(...TRACK_STATUS.entries());
      const recs =
        [...TRACK_STATUS.entries()].map(([k, v]) => {
          const [_, machineId] = k.split(':');
          return {
            machineId,
            status: v,
          };
        }) ?? [];
      // console.log(recs);
      if (recs.length > 0) {
        console.log(createServerStatus(recs));
        await this.pgClient.query({
          text: createServerStatus(recs),
        });
      }

      TRACK_STATUS.forEach((value, key, map) => {
        map.set(key, false);
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
    console.log(
      getResponseAvgQuery(startTime, endTime, resolution, services, machineIds),
    );
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
    return fillMissingBuckets(records, 'bucket', 'avg_response', 'machine_id');
  }

  async getResponseDistData(filterObj: TFilterReq) {
    const { startTime, endTime, resolution, services } = filterObj;
    // console.log(getResponseTimePercentile(startTime, endTime, resolution));
    const records = (
      await this.pgClient.query({
        text: getResponseTimePercentile(startTime, endTime, resolution),
      })
    ).rows;
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
    return fillMissingBuckets(
      records.map((r) => {
        r.avg *= 100;
        return r;
      }),
      'bucket',
      'avg',
      'machine_id',
    );
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
    return fillMissingBuckets(
      records.map((r) => {
        r.avg *= 1000;
        return r;
      }),
      'bucket',
      'avg',
      'machine_id',
    );
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
    const { startTime, endTime, services } = filterObj;
    // console.log(serverTimeline(startTime, endTime, service));
    const records = (
      await this.pgClient.query({
        text: serverTimeline(startTime, endTime, services),
      })
    ).rows;
    return fillMissingBuckets(records, 'time', 'status', 'machine_id');
    // return records;
  }
}
