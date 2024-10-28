export class AlertEvaluator {
  async evaluateRule(rule: AlertRule, metrics: MetricData[]): Promise<boolean> {
    // 1. Filter metrics by duration window
    const windowStart = new Date(
      Date.now() - (this.parseDuration(rule.duration) as any),
    );
    const relevantMetrics = metrics.filter(
      (m) =>
        m.timestamp >= windowStart &&
        m.service === rule.service &&
        m.metric_type === rule.metric_type &&
        (!rule.machine_id || m.machine_id === rule.machine_id),
    );

    // 2. Apply aggregation
    const aggregatedValue = this.aggregate(relevantMetrics, rule.aggregation);

    // 3. Compare with threshold
    return this.compareValue(aggregatedValue, rule.condition, rule.threshold);
  }

  parseDuration(duration: string) {
    throw new Error('Method not implemented.');
  }

  private aggregate(metrics: MetricData[], aggregation: string): number {
    const values = metrics.map((m) => m.value);
    switch (aggregation) {
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'count':
        return values.length;
      case 'none':
        return values[values.length - 1] || 0;
      default:
        throw new Error(`Unknown aggregation: ${aggregation}`);
    }
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
}
