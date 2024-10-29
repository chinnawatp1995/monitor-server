interface AlertRule {
  name: string;
  service: string;
  machine_id?: string; // Optional since it can be null in the schema
  metric_type:
    | 'cpu'
    | 'memory'
    | 'request_rate'
    | 'error_rate'
    | 'response_time';
  aggregation: 'avg' | 'count' | 'sum' | 'min' | 'max' | 'none';
  condition: '>' | '<' | '>=' | '<=';
  threshold: number;
  duration: string; // e.g., '5 minutes', '1 hour'
  severity: 'critical' | 'warning' | 'info';
  enabled?: boolean; // Optional since it has a default value
  silence_time: string;
}

interface MetricData {
  service: string;
  machine_id?: string;
  metric_type: string;
  value: number;
  timestamp: Date;
}

interface AlertNotifier {
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
