import { pgClient } from 'src/app.service';
import { delegateTerm, METRIC_QUERY } from '../util-functions';

export class AlertEvaluator {
  private validTerm =
    /(AVG|SUM|COUNT|MIN|MAX)\((cpu|mem|request|response|error|error_rate|rx_net|tx_net)(\{[^}]*\})*(,.*'(\d+ (minute|hour|day|week|month|year)s*)')*\)/gi;
  private ruleTermRegex = {
    aggregation: /AVG|SUM|COUNT|MIN|MAX/i,
    metrics: /cpu|mem|request|response|error|error_rate|rx_net|tx_net/i,
    paramRegex: /{.*}/,
    service: /services=\[([\w,\-]+)\]/i,
    machine: /machines=\[([\w,\-]+)\]/i,
    time: /['"](\d+ (minute|hour|day|week|month|year)s*)["']/,
  };
  private METRIC_QUERY = METRIC_QUERY;

  async evaluateRule(rule: any) {
    const delegatedRule = await delegateTerm(rule);
    const result = eval(delegatedRule);
    return {
      isTriggered: result,
    };
  }

  private async delegate(term: string, duration = '1 days') {
    const param = term.match(this.ruleTermRegex.paramRegex)?.[0];

    const alert = {
      aggregation: term.match(this.ruleTermRegex.aggregation)[0],
      metric: term.match(this.ruleTermRegex.metrics)[0],
      service: param?.match(this.ruleTermRegex.service)?.[1]?.split(','),
      machine: param?.match(this.ruleTermRegex.machine)?.[1]?.split(','),
      duration: term.match(this.ruleTermRegex.time)?.[1] ?? duration,
    };
    return await this.getDataFromRule(
      alert.aggregation,
      alert.metric,
      alert.service,
      alert.machine,
      alert.duration,
    );
  }

  delegateTerm = async (rule: any) => {
    const matchString = rule.expression.match(this.validTerm);
    let delegatedExpression = rule.expression;
    for (const expression of matchString) {
      const delegatedTerm = await this.delegate(expression, rule.duration);
      // console.log(delegatedExp);
      delegatedExpression = delegatedExpression.replace(
        expression,
        delegatedTerm,
      );
    }
    return delegatedExpression;
  };

  getDataFromRule = async (
    aggregation: string,
    metric: string,
    service: string[],
    machine: string[],
    duration: string,
  ) => {
    const result = await pgClient.query({
      text: this.METRIC_QUERY[metric.toLowerCase()]({
        aggregation,
        service,
        machine,
        duration,
      }),
    });
    return result.rows[0].value;
  };
}
