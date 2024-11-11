import {
  TAlertRuleQuery,
  TCreateServerStatus,
  TRecipientQuery,
} from './types/record.type';

export const createRequestQuery = (recs, time) => {
  const query = `INSERT INTO request_count (time, service, machine, controller, path, statusCode, value) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${time}', '${rec.service}', '${rec.machine}', '${rec.controller}', '${rec.path}', ${rec.statusCode}, ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createResponseQuery = (recs, time) => {
  const query = `INSERT INTO response_time (time, service, machine, controller, path, statusCode, count, sum, bucket_25, bucket_50, bucket_100, bucket_200, bucket_400, bucket_800, bucket_1600, bucket_3200, bucket_6400, bucket_12800) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${time}', '${rec.service}', '${rec.machine}', '${rec.controller}', '${rec.path}', ${rec.statusCode}, ${rec.count}, ${rec.sum}, ${rec.bucket_25}, ${rec.bucket_50}, ${rec.bucket_100}, ${rec.bucket_200}, ${rec.bucket_400}, ${rec.bucket_800}, ${rec.bucket_1600}, ${rec.bucket_3200}, ${rec.bucket_6400}, ${rec.bucket_12800})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createErrorQuery = (recs, time) => {
  const query = `INSERT INTO error (time, service, machine, controller, path, error_code, error_title, value) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${time}', '${rec.service}', '${rec.machine}', '${rec.controller}', '${rec.path}', '${rec.errorCode}', '${rec.errorTitle}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createCpuQuery = (recs, time) => {
  const query = `INSERT INTO cpu (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) => `('${time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createMemQuery = (recs, time) => {
  const query = `INSERT INTO mem (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) => `('${time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createRxNetworkQuery = (recs, time) => {
  const query = `INSERT INTO rx_network (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) => `('${time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createTxNetworkQuery = (recs, time) => {
  const query = `INSERT INTO tx_network (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) => `('${time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createServerStatus = (recs: TCreateServerStatus[]): string =>
  `INSERT INTO server_status(machine_id, status, service) ` +
  `VALUES ${recs
    .map((v) => `('${v.machineId}', ${v.status}, '${v.service}' )`)
    .join(',')}`;

/* ----------------------------------------------------------------------------------------------- */

export const getTotalRequest = (
  start: string,
  end: string,
  timeBucket: string,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
) =>
  `
WITH request_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        CASE
            WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time) 
            THEN value  
            ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time)
        END AS requests_in_interval
    FROM
        request_count
    WHERE time >= '${start}' AND time <= '${end}'
    ${
      (services ?? []).length > 0
        ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (controllers ?? []).length > 0
        ? `AND controller IN  ( ${controllers.map((s) => `'${s}'`).join(',')})`
        : ''
    }
)
SELECT 
    time_bucket('${timeBucket}', time) AS bucket,
    SUM(requests_in_interval) AS value,
    machine,
    controller,
    service
FROM 
    request_deltas
GROUP BY 
    bucket, machine, service, controller
ORDER BY 
    bucket;
`;

// WITH t AS (
//   SELECT
//     time,
//     path,
//     machine,
//     controller,
//     service,
//     (
//       CASE
//         WHEN value >= LAG(value) OVER w
//           THEN value - LAG(value) OVER w
//         WHEN LAG(value) OVER w IS NULL THEN NULL
//         ELSE value
//       END
//     ) AS "requests_per_interval"
//   FROM request_count
//   WINDOW w AS (PARTITION BY machine, controller, path, statuscode ORDER BY time)
//   ORDER BY time DESC
// )
// SELECT
//   SUM(requests_per_interval),
//   path,
//   service,
//   machine,
//   controller
// FROM t
// GROUP BY path, service, machine, controller;

export const getTotalRequestGapFill = (
  interval: string,
  totalPoint: number,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
) =>
  `
WITH request_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        CASE
            WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time) 
            THEN value  
            ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time)
        END AS requests_in_interval
    FROM
        request_count
    WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
    ${
      (services ?? []).length > 0
        ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (controllers ?? []).length > 0
        ? `AND controller IN  ( ${controllers.map((s) => `'${s}'`).join(',')})`
        : ''
    }
)
SELECT 
    time_bucket_gapfill(INTERVAL '${interval}' / '${totalPoint}', time, now() - INTERVAL '${interval}', now()) AS bucket,
    SUM(requests_in_interval) AS value,
    machine,
    controller,
    service
FROM 
    request_deltas
GROUP BY 
    bucket, machine, service, controller
ORDER BY 
    bucket;
`;

export const getRequestPath = (
  start: string,
  end: string,
  timeBucket: string,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
) =>
  `
WITH request_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        CASE
            WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time) 
            THEN value  
            ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time)
        END AS requests_in_interval
    FROM
        request_count
    WHERE time >= '${start}' AND time <= '${end}'
    ${
      (services ?? []).length > 0
        ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (controllers ?? []).length > 0
        ? `AND controller IN  ( ${controllers.map((s) => `'${s}'`).join(',')})`
        : ''
    }
)
SELECT 
    time_bucket('${timeBucket}', time) AS bucket,
    SUM(requests_in_interval) AS value,
    machine,
    controller,
    service
FROM 
    request_deltas
GROUP BY 
    bucket, machine, service, controller
ORDER BY 
    bucket;
`;

export const errorRate = (
  start: string,
  end: string,
  timeBucket: string,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
) =>
  `
WITH error_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        error_title,
        CASE
            WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time)
            THEN value  
            ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time)
        END AS errors_in_interval
    FROM
        error
    WHERE time >= '${start}' AND time <= '${end}'
    ${
      (services ?? []).length > 0
        ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (controllers ?? []).length > 0
        ? `AND controller IN  ( ${controllers.map((s) => `'${s}'`).join(',')})`
        : ''
    }
)
SELECT 
    time_bucket('${timeBucket}', time) AS bucket,
    SUM(errors_in_interval) AS value,
    machine,
    controller,
    service,
    error_title
FROM 
    error_deltas
GROUP BY 
    bucket, machine, service, controller, error_title
ORDER BY 
    bucket;
  `;

export const getErrorCountGapFill = (
  interval: string,
  totalPoint: number,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
) =>
  `
  WITH error_deltas AS (
      SELECT
          time,
          path,
          service,
          machine,
          controller,
          error_title,
          CASE
              WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time)
              THEN value  
              ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time)
          END AS errors_in_interval
      FROM
          error
      WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
      ${
        (services ?? []).length > 0
          ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
          : ''
      }
      ${
        (machineIds ?? []).length > 0
          ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
          : ''
      }
      ${
        (controllers ?? []).length > 0
          ? `AND controller IN  ( ${controllers
              .map((s) => `'${s}'`)
              .join(',')})`
          : ''
      }
  )
  SELECT 
      time_bucket_gapfill(INTERVAL '${interval}' / '${totalPoint}', time, now() - INTERVAL '${interval}', now()) AS bucket,
      SUM(errors_in_interval) AS value,
      machine,
      controller,
      service,
      error_title
  FROM 
      error_deltas
  GROUP BY 
      bucket, machine, service, controller, error_title
  ORDER BY 
      bucket;
    `;

export const errorRanking = (
  start: string,
  end: string,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
) =>
  `
WITH error_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        error_title,
        CASE
            WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time)
            THEN value  
            ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time)
        END AS errors_in_interval
    FROM
        error
    WHERE time >= '${start}' AND time <= '${end}'
    ${
      (services ?? []).length > 0
        ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (controllers ?? []).length > 0
        ? `AND controller IN  ( ${controllers.map((s) => `'${s}'`).join(',')})`
        : ''
    }
)
SELECT 
    SUM(errors_in_interval) AS value,
    machine,
    controller,
    service,
    error_title
FROM 
    error_deltas
GROUP BY 
    machine, service, controller, reason
ORDER BY 
    value DESC;
  `;

export const getAverageResponseTime = (
  start: string,
  end: string,
  timeBucket: string,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
) => `
SELECT 
    time_bucket('${timeBucket}', time) AS bucket,
    AVG(sum/count) AS value,
    machine,
    controller,
    service
FROM 
    response_time
WHERE time BETWEEN '${start}' AND '${end}'
 ${
   (services ?? []).length > 0
     ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
     : ''
 }
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (controllers ?? []).length > 0
        ? `AND controller IN  ( ${controllers.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine, service, controller
ORDER BY bucket;
`;

export const getAverageResponseTimeGapFill = (
  interval: string,
  totalPoint: number,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
) => `
SELECT 
    time_bucket_gapfill(INTERVAL '${interval}' / '${totalPoint}', time, now() - INTERVAL '${interval}', now()) AS bucket,
    AVG(sum/count) AS value,
    machine,
    controller,
    service
FROM 
    response_time
WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
 ${
   (services ?? []).length > 0
     ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
     : ''
 }
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (controllers ?? []).length > 0
        ? `AND controller IN  ( ${controllers.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine, service, controller
ORDER BY bucket;
`;

export const cpuQuery = (
  start: string,
  end: string,
  timeBucket: string,
  machineIds?: string[],
) => `
SELECT time_bucket('${timeBucket}', time) AS bucket, AVG(value) AS value, machine, service
FROM cpu
WHERE time BETWEEN '${start}' AND '${end}'
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine, service
ORDER BY bucket;
`;

export const cpuGapFillQuery = (
  interval: string,
  totalPoint: number,
  machineIds?: string[],
) => `
SELECT time_bucket_gapfill(interval '${interval}' / ${totalPoint}, time, now() - INTERVAL '${interval}', now()) AS bucket, MAX(value) AS value, machine, service
FROM cpu
WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine, service
ORDER BY bucket;
`;

export const memQuery = (
  start: string,
  end: string,
  timeBucket: string,
  machineIds?: string[],
) => `
SELECT time_bucket('${timeBucket}', time) AS bucket, AVG(value) AS value, machine, service
FROM mem
WHERE time BETWEEN '${start}' AND '${end}'
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine, service
ORDER BY bucket;
`;

export const memGapFillQuery = (
  interval: string,
  totalPoint: number,
  machineIds?: string[],
) => `
SELECT time_bucket_gapfill(INTERVAL '${interval}' / ${totalPoint}, time, now() - INTERVAL '${interval}', now()) AS bucket, MAX(value) AS value, machine, service
FROM mem
WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine, service
ORDER BY bucket;
`;

export const rxNetworkQuery = (
  start: string,
  end: string,
  timeBucket: string,
  machineIds?: string[],
) => `
SELECT time_bucket('${timeBucket}', time) AS bucket, AVG(value) AS value, machine, service
FROM rx_network
WHERE time BETWEEN '${start}' AND '${end}' 
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine, service
ORDER BY bucket;
`;

export const rxNetworkGapFillQuery = (
  interval: string,
  totalPoint: number,
  machineIds?: string[],
) => `
SELECT time_bucket_gapfill(interval '${interval}' / ${totalPoint}, time, now() - INTERVAL '${interval}', now()) AS bucket, AVG(value) AS value, machine, service
FROM rx_network
WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine, service
ORDER BY bucket;
`;

export const txNetworkQuery = (
  start: string,
  end: string,
  timeBucket: string,
  machineIds?: string[],
) => `
SELECT time_bucket('${timeBucket}', time) AS bucket, AVG(value) AS value, machine, service
FROM tx_network
WHERE time BETWEEN '${start}' AND '${end}'
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine, service
ORDER BY bucket;
`;

export const txNetworkGapFillQuery = (
  interval: string,
  totalPoint: number,
  machineIds?: string[],
) => `
SELECT time_bucket_gapfill(interval '${interval}' / ${totalPoint}, time, now() - INTERVAL '${interval}', now()) AS bucket, AVG(value) AS value, machine, service
FROM tx_network
WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine, service
ORDER BY bucket;
`;

export const getCurrentServerStatusQuery = (machineIds?: string[]) =>
  `SELECT DISTINCT ON (machine_id) machine_id, status, time ` +
  `FROM server_status ` +
  ((machineIds ?? []).length > 0
    ? `WHERE machine_id IN (${machineIds.map((m) => `'${m}'`).join(',')}) `
    : ``) +
  `ORDER BY machine_id, time DESC;`;

export const serverTimeline = (
  start: string,
  end: string,
  machinesIds?: string[],
) =>
  `SELECT time, machine_id, status ` +
  `FROM server_status ` +
  `WHERE time BETWEEN '${start}' AND '${end}' ` +
  ((machinesIds ?? []).length > 0
    ? `AND machine_id IN (${machinesIds.map((s) => `'${s}'`).join(',')}) `
    : ``) +
  `GROUP BY time, machine_id, status ` +
  `ORDER BY time, machine_id `;

export const createAlertQuery = (alert: TAlertRuleQuery) =>
  `INSERT INTO alert_rule(name, expression, duration, severity, silence_time, message) ` +
  `VALUES ('${alert.name}', E'${alert.expression.replace(/'/g, "\\'")}', '${
    alert.duration
  }', '${alert.severity}', '${alert.silence_time}', '${alert.message}')`;

export const createRecipientQuery = (recipient: TRecipientQuery) =>
  `INSERT INTO recipient(name, app, token, url, room) ` +
  `VALUES ('${recipient.name}', '${recipient.app}', '${recipient.token}', '${recipient.url}', '${recipient.room}')`;

export const getAlertRecipientsQuery = (ruleId: string) =>
  `SELECT * FROM alert_recipient WHERE rule_id = ${ruleId}`;

export const addRecipientToAlertQuery = (
  ruleId: string,
  recipientIds: string[],
) =>
  `INSERT INTO alert_recipient(rule_id, recipient_id) VALUES ${recipientIds
    .map((r) => `('${ruleId}', '${r}')`)
    .join(',')}`;

export const getAlertQuery = () => `SELECT * FROM alert_rule`;

export const updateAlertQuery = (alert: TAlertRuleQuery) =>
  `UPDATE alert_rule SET name = '${
    alert.name
  }', expression = E'${alert.expression.replace(/'/g, "\\'")}', duration = '${
    alert.duration
  }', severity = '${alert.severity}', silence_time = '${
    alert.silence_time
  }', message = '${alert.message}' WHERE id = ${alert.id}`;

export const totalError = () =>
  `
WITH error_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        error_title,
        CASE
            WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time)
            THEN value  
            ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time)
        END AS errors_in_interval
    FROM
        error
)
SELECT 
    SUM(errors_in_interval) AS value
FROM 
    error_deltas
`;

export const totalRequest = () =>
  `
WITH request_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        CASE
            WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time) 
            THEN value  
            ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time)
        END AS requests_in_interval
    FROM
        request_count
)
SELECT 
    SUM(requests_in_interval) AS value
FROM 
    request_deltas
`;

export const getPathRatio = (
  start: string,
  end: string,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
) =>
  `
WITH request_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        CASE
            WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time) 
            THEN value  
            ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time)
        END AS requests_in_interval
    FROM
        request_count
    WHERE time >= '${start}' AND time <= '${end}'
    ${
      (services ?? []).length > 0
        ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (controllers ?? []).length > 0
        ? `AND controller IN  ( ${controllers.map((s) => `'${s}'`).join(',')})`
        : ''
    }
)
SELECT 
    SUM(requests_in_interval) AS value,
    path
FROM 
    request_deltas
GROUP BY 
    path
`;

export const getRequestErrorRatioGapFill = (
  interval: string,
  services?: string[],
  machines?: string[],
  controllers?: string[],
) => `WITH ht1 AS (
  WITH request_deltas AS (
    SELECT
      time,
      path,
      service,
      machine,
      controller,
      CASE 
        WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time)
        THEN value 
        ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, statuscode ORDER BY time)
      END AS requests_in_interval
    FROM request_count
    WHERE time >= now() - INTERVAL '${interval}' 
     ${
       (services ?? []).length > 0
         ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
         : ''
     }
    ${
      (machines ?? []).length > 0
        ? `AND machine IN  ( ${machines.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (controllers ?? []).length > 0
        ? `AND controller IN  ( ${controllers.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    AND time <= now()
  )
  SELECT
    time_bucket_gapfill(INTERVAL '1 day', time, now() - INTERVAL '${interval}', now()) AS bucket,
    SUM(requests_in_interval) AS value
  FROM request_deltas
  GROUP BY bucket
  ORDER BY bucket
),
ht2 AS (
  WITH error_deltas AS (
    SELECT
      time,
      path,
      service,
      machine,
      controller,
      error_title,
      CASE 
        WHEN value < LAG(value) OVER (PARTITION BY path, service, machine, controller, error_code, error_title ORDER BY time) 
        THEN value 
        ELSE value - LAG(value) OVER (PARTITION BY path, service, machine, controller, error_code, error_title ORDER BY time) 
      END AS errors_in_interval
    FROM error
    WHERE time >= now() - INTERVAL '${interval}' 
     ${
       (services ?? []).length > 0
         ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
         : ''
     }
    ${
      (machines ?? []).length > 0
        ? `AND machine IN  ( ${machines.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (controllers ?? []).length > 0
        ? `AND controller IN  ( ${controllers.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    AND time <= now()
  )
  SELECT
    time_bucket_gapfill(INTERVAL '1 day', time, now() - INTERVAL '${interval}', now()) AS bucket,
    SUM(errors_in_interval) AS value
  FROM error_deltas
  GROUP BY bucket
  ORDER BY bucket
)
SELECT
  ht1.bucket,
  ht1.value as total_request,
  ht2.value as total_error
FROM ht1
INNER JOIN ht2 ON ht1.bucket = ht2.bucket
ORDER BY bucket ASC;`;
