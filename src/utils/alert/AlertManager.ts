import { pgClient } from 'src/app.service';
// import { AlertEvaluator } from './AlertEvaluator';
import { groups, sendTelegram } from '../util-functions';
import {
  createNotifyHistoryQuery,
  getAvgResourceInterval,
  getEnabledRulesQuery,
  getErrorRateInterval,
  getNotifyHistoryQuery,
  getRecipientFromRule,
  getRecipientsQuery,
  serverDown,
} from '../rawSql';
import { POSSIBLE_RULES } from './rule';

export class AlertManager {
  // private evaluator = new AlertEvaluator();

  async checkRules() {
    const rules: any = await this.getEnabledRules();

    for (const rule of rules) {
      let isPassThreshold = false;
      const machines = [];
      if (rule.type === POSSIBLE_RULES.SERVER_DOWN) {
        const rows = await this.getData(rule);
        const groupByMachine = groups(rows, ({ machine }) => machine);
        for (const [k, v] of Object.entries(groupByMachine)) {
          const up = v.find((e) => e.status === true);
          if (up === undefined) {
            machines.push(k);
            isPassThreshold = true;
          }
        }
      } else {
        const rows = await this.getData(rule);
        if (!rows) return;
        for (const row of rows) {
          if (Number(row.value) >= rule.threshold) {
            // console.log('pass threshold');
            machines.push(row.machine);
            isPassThreshold = true;
          }
        }
      }
      if (isPassThreshold) {
        await this.createAlert(rule, machines);
      }
    }
  }

  async getEnabledRules() {
    const result = await pgClient.query({
      text: getEnabledRulesQuery(),
    });
    return result.rows;
  }

  private async createAlert(rule: any, param: string[]) {
    const notifies = await this.getNotifyHistory(rule.id, rule.silence_time);

    if (notifies.length > 0) {
      // Early return when already alert within defined time window
      return;
    }

    const notifyMessage = rule.message.replace(
      /\$\{machine\}/gi,
      param.join(','),
    );

    // sendTelegram(
    //   process.env.TELEGRAM_URL ?? 'https://api.telegram.org/bot',
    //   process.env.TELEGRAM_TOKEN ??
    //     '7731705891:AAEg9pvLFjTAlnUvzhhN2QpmgImIm14FUpM',
    //   process.env.TELEGRAM_CHAT_ID ?? '-4565250427',
    //   notifyMessage,
    // );

    await this.notifyRecipients(rule.id, notifyMessage);

    await this.saveAlert(rule.id);
  }

  async saveAlert(ruleId: number) {
    await pgClient.query({
      text: createNotifyHistoryQuery(ruleId),
    });
  }

  async getNotifyHistory(ruleId: number | number, duration: string) {
    const alerts = await pgClient.query({
      text: getNotifyHistoryQuery(ruleId, duration),
    });
    return alerts.rows;
  }

  async getData(rule: any) {
    switch (rule.type.toLowerCase()) {
      case POSSIBLE_RULES.HIGH_CPU:
        return (
          await pgClient.query({
            text: getAvgResourceInterval('cpu', rule.service, rule.duration),
          })
        ).rows;
      case POSSIBLE_RULES.HIGH_MEM:
        return (
          await pgClient.query({
            text: getAvgResourceInterval('mem', rule.service, rule.duration),
          })
        ).rows;
      case POSSIBLE_RULES.SERVER_DOWN:
        return (
          await pgClient.query({
            text: serverDown(rule.duration, rule.service),
          })
        ).rows;
      case POSSIBLE_RULES.ERROR_RATE:
        // console.log(getErrorRateInterval(rule.duration, rule.service));
        return (
          await pgClient.query({
            text: getErrorRateInterval(rule.duration, rule.service),
          })
        ).rows;
    }
  }

  async getRuleRecipient(ruleId: number) {
    const recipients = (
      await pgClient.query({
        text: getRecipientFromRule(ruleId),
      })
    ).rows.map((r) => r.r_id);

    const recipientSet = new Set(recipients.flat());

    if ([...recipientSet].length === 0) {
      return [];
    }
    const recipientDetail = await pgClient.query({
      text: getRecipientsQuery([...recipientSet]),
    });

    return recipientDetail.rows;
  }

  async notifyRecipients(ruleId: number, message: string, param?: string) {
    const recipients = await this.getRuleRecipient(ruleId);
    for (const recipient of recipients) {
      const { id, name, config } = recipient;
      const { app, url, room, token } = config;

      await sendTelegram(url, token, room, message);
    }
  }
}
