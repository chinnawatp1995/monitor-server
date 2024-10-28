import { pgClient } from 'src/app.service';
import { AlertEvaluator } from './AlertEvaluator';
import { AlertNotificationService } from './AlertNotifier';

export class AlertManager {
  private evaluator = new AlertEvaluator();
  private notifier: AlertNotificationService;

  async checkRules() {
    const rules: any = await this.getEnabledRules();

    for (const rule of rules) {
      try {
        const metrics: any = await this.getMetrics(rule);

        const isTriggered = await this.evaluator.evaluateRule(rule, metrics);

        if (isTriggered) {
          await this.createAlert(rule, metrics);
        }
      } catch (error) {
        console.error(`Error processing rule ${rule.name}:`, error);
      }
    }
  }

  async getMetrics(rule: any) {
    let metricData;
    switch (rule.metricType) {
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
  getErrorMetrics(rule: any): any {
    throw new Error('Method not implemented.');
  }
  getResponseMetrics(rule: any): any {
    throw new Error('Method not implemented.');
  }
  getRequestMetrics(rule: any): any {
    throw new Error('Method not implemented.');
  }
  getMemoryMetrics(rule: any): any {
    throw new Error('Method not implemented.');
  }
  getCpuMetrics(rule: any): any {
    throw new Error('Method not implemented.');
  }

  getEnabledRules() {
    const result = pgClient.query(
      `SELECT * FROM alert_rule WHERE enabled = true`,
    );
    return result.rows;
  }

  private async createAlert(rule: AlertRule, metrics: MetricData[]) {
    // Check if there's already an active alert for this rule
    const existingAlert: any = await this.getActiveAlert((rule as any).id);
    if (existingAlert) {
      return;
    }

    // Create new alert in alert_history
    const alert: any = {
      rule_id: (rule as any).id,
      service: rule.service,
      machine_id: rule.machine_id,
      metric_type: rule.metric_type,
      metric_value: metrics[metrics.length - 1].value,
      status: 'triggered',
    };

    await this.saveAlert(alert);

    await this.notifier.notify({
      severity: rule.severity,
      message: `Alert: ${rule.name} - ${rule.service}`,
      details: {
        rule,
        currentValue: metrics[metrics.length - 1].value,
        threshold: rule.threshold,
      },
    });
  }

  saveAlert(alert: any) {
    throw new Error('Method not implemented.');
  }

  getActiveAlert(id: any) {
    throw new Error('Method not implemented.');
  }
}

// // Example usage:
// const alertManager = new AlertManager();

// // Run check every minute
// setInterval(() => {
//   alertManager.checkRules();
// }, 60000);
