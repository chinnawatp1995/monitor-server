export interface AlertRule {
  id: string | number;
  name: string;
  expression: string;
  duration: string;
  severity: 1 | 2 | 3 | 4 | 5;
  enabled?: boolean; // Optional since it has a default value
  silence_time: string;
  message: string;
}

export interface Expression {
  aggregation: 'AVG' | 'SUM' | 'COUNT' | 'MIN' | 'MAX' | 'LAST' | 'FIRST';
  services?: string[];
  machines?: string[];
  controllers?: string[];
  duration?: string;
  value?: number[];
}

export interface MetricData {
  service: string;
  machine_id?: string;
  metric_type: string;
  value: number;
  timestamp: Date;
}

export interface AlertNotifier {
  notify(alert: {
    severity: string;
    message: string;
    details: any;
  }): Promise<void>;
}
// const newAlertRule: AlertRule = {
//     name: "High CPU Usage Alert",
//     service: "web-server",
//     machine_id: "web-01",
//     metric_type: "cpu",
//     aggregation: "avg",
//     condition: ">",
//     threshold: 90,
//     duration: "5 minutes",
//     severity: "critical",
//     enabled: true
//   };
