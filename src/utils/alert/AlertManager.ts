import { pgClient } from 'src/app.service';
import { AlertEvaluator } from './AlertEvaluator';
import { sendTelegram } from '../util-functions';
import { init } from 'expressionparser';

export const EXISTING_ALERT_RULE = [];

export class AlertManager {
  private evaluator = new AlertEvaluator();

  async checkRules() {
    const rules: any = await this.getEnabledRules();
    for (const rule of rules) {
      try {
        const { isTriggered, metric_value } = await this.evaluator.evaluateRule(
          rule,
        );

        if (isTriggered) {
          await this.createAlert(rule, metric_value);
        }
      } catch (error) {
        console.error(`Error processing rule ${rule.name}:`, error);
      }
    }
  }

  async getEnabledRules() {
    const result = await pgClient.query(
      `SELECT * FROM alert_rule WHERE enabled = true`,
    );
    return result.rows;
  }

  private async createAlert(rule: AlertRule, metric_value: string) {
    // Check if there's already an active alert for this rule
    const existingAlert: any = EXISTING_ALERT_RULE.find(
      (id) => id === (rule as any).id,
    );
    if (existingAlert) {
      EXISTING_ALERT_RULE.push((rule as any).id);
      return;
    }

    // Create new alert in alert_history
    const alert: any = {
      rule_id: (rule as any).id,
      service: rule.service,
      machine_id: rule.machine_id,
      metric_type: rule.metric_type,
      metric_value,
      status: 'triggered',
    };

    const alerts = await this.getAlertHistory(alert, rule.silence_time);

    if (alerts.length > 0) {
      // Early return when already alert within defined time window
      return;
    }

    await this.saveAlert(alert);

    // await this.notifier.notify({
    //   severity: rule.severity,
    //   message: `Alert: ${rule.name} - ${rule.service}`,
    //   details: {
    //     rule,
    //     currentValue: metrics[metrics.length - 1].value,
    //     threshold: rule.threshold,
    //   },
    // });
    sendTelegram(
      process.env.TELEGRAM_URL ?? 'https://api.telegram.org/bot',
      process.env.TELEGRAM_TOKEN ??
        '7731705891:AAEg9pvLFjTAlnUvzhhN2QpmgImIm14FUpM',
      process.env.TELEGRAM_CHAT_ID ?? '-4565250427',
      `Alert: ${rule.name} - ${rule.service}`,
    );
  }

  async saveAlert(alert: any) {
    console.log(
      `INSERT INTO alert_history(rule_id, metric_value) VALUES ('${alert.rule_id}', ${alert.metric_value})`,
    );
    await pgClient.query({
      text: `INSERT INTO alert_history(rule_id, metric_value) VALUES ('${alert.rule_id}', ${alert.metric_value})`,
    });
  }

  async getAlertHistory(alert: any, duration: string) {
    const alerts = await pgClient.query({
      text: `SELECT * FROM alert_history WHERE rule_id = '${alert.rule_id}' AND time >= now() - interval '${duration}'`,
    });
    return alerts.rows;
  }

  getActiveAlert(id: any) {
    throw new Error('Method not implemented.');
  }
}
