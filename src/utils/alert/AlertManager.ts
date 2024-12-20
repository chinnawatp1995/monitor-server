import { pgClient } from 'src/app.service';
import { AlertEvaluator } from './AlertEvaluator';
import { sendTelegram } from '../util-functions';

export const EXISTING_ALERT_RULE = [];

export class AlertManager {
  private evaluator = new AlertEvaluator();

  async checkRules() {
    const rules: any = await this.getEnabledRules();
    for (const rule of rules) {
      try {
        const { isTriggered } = await this.evaluator.evaluateRule(rule);

        if (isTriggered) {
          await this.createAlert(rule);
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

  private async createAlert(rule: any) {
    const existingAlert: any = EXISTING_ALERT_RULE.find(
      (id) => id === (rule as any).id,
    );
    if (existingAlert) {
      EXISTING_ALERT_RULE.push((rule as any).id);
      return;
    }

    const alerts = await this.getAlertHistory(rule.id, rule.silence_time);

    if (alerts.length > 0) {
      // Early return when already alert within defined time window
      return;
    }

    await this.saveAlert(rule.id);

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
      rule.message,
    );
  }

  async saveAlert(ruleId: string | number) {
    await pgClient.query({
      text: `INSERT INTO alert_history(rule_id) VALUES ('${ruleId}')`,
    });
  }

  async getAlertHistory(ruleId: string | number, duration: string) {
    const alerts = await pgClient.query({
      text: `SELECT * FROM alert_history WHERE rule_id = '${ruleId}' AND time >= now() - interval '${duration}'`,
    });
    return alerts.rows;
  }
}
