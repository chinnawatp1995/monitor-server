import { pgClient } from 'src/app.service';

const AGGREGATION_MAP = {
  avg: 'AVG',
  max: 'MAX',
  min: 'MIN',
  sum: 'SUM',
  count: 'COUNT',
};

export class AlertEvaluator {
  async evaluateRule(rule: AlertRule) {
    const value = await this.getMetrics(rule);
    // const threshold = await this.getMetrics(rule);
    // TODO : handle threshold when it is not single value (in case of threshold is expression)
    return {
      isTriggered: this.compareValue(
        value[0].value,
        rule.condition,
        rule.threshold,
      ),
      metric_value: value,
    };
  }

  private compareValue(
    value: number,
    condition: string,
    threshold: number,
  ): boolean {
    switch (condition) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      default:
        throw new Error(`Unknown condition: ${condition}`);
    }
  }

  async getMetrics(rule: any) {
    let metricData;
    switch (rule.metric_type) {
      case 'cpu':
        metricData = await this.getCpuMetrics(rule);
        break;
      case 'memory':
        metricData = await this.getMemoryMetrics(rule);
        break;
      case 'request':
        metricData = await this.getRequestMetrics(rule);
        break;
      case 'error':
        metricData = await this.getErrorMetrics(rule);
        break;
      case 'response':
        metricData = await this.getResponseMetrics(rule);
        break;
    }
    return metricData;
  }
  async getErrorMetrics(rule: any): Promise<any> {
    const result = await pgClient.query(
      `SELECT ${
        AGGREGATION_MAP[rule.aggregation]
      }(*) as value FROM request WHERE status_code >= 400 AND time >= now() - interval '${
        rule.duration
      }' AND service = '${rule.service}' ${
        (rule.machine_id ?? []).length > 0
          ? `AND machine_id IN (${rule.machine_id
              .map((id) => `'${id}'`)
              .join(',')})`
          : ''
      }`,
    );
    return result.rows;
  }
  async getResponseMetrics(rule: any): Promise<any> {
    const result = await pgClient.query(
      `SELECT ${
        AGGREGATION_MAP[rule.aggregation]
      }(response_time) as value FROM request WHERE status_code < 400 AND time >= now() - interval '${
        rule.duration
      }' AND service = '${rule.service}' ${
        (rule.machine_id ?? []).length > 0
          ? `AND machine_id IN (${rule.machine_id
              .map((id) => `'${id}'`)
              .join(',')})`
          : ''
      }`,
    );
    return result.rows;
  }
  async getRequestMetrics(rule: any): Promise<any> {
    const result = await pgClient.query(
      `SELECT ${
        AGGREGATION_MAP[rule.aggregation]
      }(*) as value FROM request WHERE time >= now() - interval '${
        rule.duration
      }' AND service = '${rule.service}' ${
        (rule.machine_id ?? []).length > 0
          ? `AND machine_id IN (${rule.machine_id
              .map((id) => `'${id}'`)
              .join(',')})`
          : ''
      }`,
    );
    return result.rows;
  }
  async getMemoryMetrics(rule: any): Promise<any> {
    const result = await pgClient.query(
      `SELECT ${
        AGGREGATION_MAP[rule.aggregation]
      }(value) as value FROM mem_usage WHERE time >= now() - interval '${
        rule.duration
      }' AND service = '${rule.service}' ${
        (rule.machine_id ?? []).length > 0
          ? `AND machine_id IN (${rule.machine_id
              .map((id) => `'${id}'`)
              .join(',')})`
          : ''
      }`,
    );
    return result.rows;
  }
  async getCpuMetrics(rule: any): Promise<any> {
    const result = await pgClient.query(
      `SELECT ${
        AGGREGATION_MAP[rule.aggregation]
      }(value) as value FROM cpu_usage WHERE time >= now() - interval '${
        rule.duration
      }' AND service = '${rule.service}' ${
        ((rule.machine_id === 'undefined' ? undefined : rule.machine_id) ?? [])
          .length > 0
          ? `AND machine_id IN (${(
              (rule.machine_id === 'undefined' ? undefined : rule.machine_id) ??
              []
            )
              .map((id) => `'${id}'`)
              .join(',')})`
          : ''
      }`,
    );
    return result.rows;
  }
}
