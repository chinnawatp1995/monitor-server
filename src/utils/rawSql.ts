import { group } from 'console';
import {
  TCreateError,
  TCreateRequest,
  TCreateResource,
  TCreateResponseTime,
  TCreateServerStatus,
} from './types/record.type';

export const createRequestQuery = (recs: TCreateRequest[], time: string) => {
  const query = `INSERT INTO request_count (time, service, machine, controller, path, status_code, value) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${time}', '${rec.service}', '${rec.machine}', '${rec.controller}', '${rec.path}', ${rec.statusCode}, ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createResponseQuery = (
  recs: TCreateResponseTime[],
  time: string,
) => {
  const query = `INSERT INTO response_time (time, service, machine, controller, path, status_code, count, sum, bucket_25, bucket_50, bucket_100, bucket_200, bucket_400, bucket_800, bucket_1600, bucket_3200, bucket_6400, bucket_12800) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${time}', '${rec.service}', '${rec.machine}', '${rec.controller}', '${rec.path}', ${rec.statusCode}, ${rec.count}, ${rec.sum}, ${rec.bucket_25}, ${rec.bucket_50}, ${rec.bucket_100}, ${rec.bucket_200}, ${rec.bucket_400}, ${rec.bucket_800}, ${rec.bucket_1600}, ${rec.bucket_3200}, ${rec.bucket_6400}, ${rec.bucket_12800})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createErrorQuery = (recs: TCreateError[], time: string) => {
  const query = `INSERT INTO error (time, service, machine, controller, path, error_code, error_title, value) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${time}', '${rec.service}', '${rec.machine}', '${rec.controller}', '${rec.path}', '${rec.errorCode}', '${rec.errorTitle}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createCpuQuery = (recs: TCreateResource[], time: string) => {
  const query = `INSERT INTO cpu (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) => `('${time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createMemQuery = (recs: TCreateResource[], time: string) => {
  const query = `INSERT INTO mem (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) => `('${time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createRxNetworkQuery = (recs: TCreateResource[], time: string) => {
  const query = `INSERT INTO rx_network (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) => `('${time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createTxNetworkQuery = (recs: TCreateResource[], time: string) => {
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
): string =>
  `
WITH request_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        CASE
            WHEN value < COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time), 0) 
            THEN value  
            ELSE value - COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time), 0)
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
  interval: string, // '1 day', '2 weeks' etc.
  totalPoint: number,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
  groupField = 'machine',
): string =>
  `
WITH request_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        CASE
            WHEN value < COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time), 0)
            THEN value  
            ELSE value - COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time), 0)
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
    time_bucket_gapfill(INTERVAL '${interval}' / ${totalPoint}, time, now() - INTERVAL '${interval}', now()) AS bucket,
    SUM(requests_in_interval) AS value,
    ${groupField}
FROM 
    request_deltas
GROUP BY 
    bucket, ${groupField}
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
  groupField = 'machine',
): string =>
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
            WHEN value < COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time), 0)
            THEN value  
            ELSE value - COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time), 0)
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
    ${groupField}
FROM 
    error_deltas
GROUP BY 
    bucket, ${groupField}
ORDER BY 
    bucket;
  `;

export const getErrorCountGapFill = (
  interval: string,
  totalPoint: number,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
  groupField = 'machine',
): string =>
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
              WHEN value < COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time), 0)
              THEN value  
              ELSE value - COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, error_code, error_title ORDER BY time), 0)
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
      ${groupField}
  FROM 
      error_deltas
  GROUP BY 
      bucket, ${groupField}
  ORDER BY 
      bucket;
    `;

export const errorRanking = (service: string, interval = '1  month') =>
  `
WITH error_deltas AS (
    SELECT
      time,
      path,
      service,
      machine,
      controller,
      error_title,
      error_code,
      CASE 
        WHEN value < COALESCE(LAG(value) OVER (PARTITION BY path, service, machine, controller, error_code, error_title ORDER BY time), 0) 
        THEN value 
        ELSE value - COALESCE(LAG(value) OVER (PARTITION BY path, service, machine, controller, error_code, error_title ORDER BY time), 0) 
      END AS errors_in_interval
    FROM error
    WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
     ${service ? `AND service = '${service}'` : ''}
  )
  SELECT
    error_code,
    error_title,
    SUM(errors_in_interval) AS value
  FROM error_deltas
  GROUP BY error_code, error_title
  ORDER BY value
  `;

export const getAverageResponseTime = (
  start: string,
  end: string,
  timeBucket: string,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
  groupField = 'machine',
): string => `
SELECT 
    time_bucket('${timeBucket}', time) AS bucket,
    SUM(sum) / SUM(count) AS value,
    ${groupField}
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
GROUP BY bucket, ${groupField}
ORDER BY bucket;
`;

export const getAverageResponseTimeGapFill = (
  interval: string,
  totalPoint: number,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
  groupField = 'machine',
): string => `
SELECT 
    time_bucket_gapfill(INTERVAL '${interval}' / '${totalPoint}', time, now() - INTERVAL '${interval}', now()) AS bucket,
    SUM(sum) / SUM(count) AS value,
    ${groupField}
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
GROUP BY bucket, ${groupField}
ORDER BY bucket;
`;

export const cpuQuery = (
  start: string,
  end: string,
  timeBucket: string,
  machineIds?: string[],
): string => `
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
  services?: string[],
): string => `
SELECT time_bucket_gapfill(interval '${interval}' / ${totalPoint}, time, now() - INTERVAL '${interval}', now()) AS bucket, AVG(value) AS value, machine
FROM cpu
WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
     ${
       (services ?? []).length > 0
         ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
         : ''
     }
GROUP BY bucket, machine
ORDER BY bucket;
`;

export const memQuery = (
  start: string,
  end: string,
  timeBucket: string,
  machineIds?: string[],
) => `
SELECT time_bucket('${timeBucket}', time) AS bucket, AVG(value) AS value, machine
FROM mem
WHERE time BETWEEN '${start}' AND '${end}'
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine
ORDER BY bucket;
`;

export const memGapFillQuery = (
  interval: string,
  totalPoint: number,
  machineIds?: string[],
  services?: string[],
) => `
SELECT time_bucket_gapfill(INTERVAL '${interval}' / ${totalPoint}, time, now() - INTERVAL '${interval}', now()) AS bucket, AVG(value) AS value, machine
FROM mem
WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (services ?? []).length > 0
        ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine
ORDER BY bucket;
`;

export const rxNetworkQuery = (
  start: string,
  end: string,
  timeBucket: string,
  machineIds?: string[],
) => `
SELECT time_bucket('${timeBucket}', time) AS bucket, AVG(value)/1000000 AS value, machine
FROM rx_network
WHERE time BETWEEN '${start}' AND '${end}' 
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine
ORDER BY bucket;
`;

export const rxNetworkGapFillQuery = (
  interval: string,
  totalPoint: number,
  machineIds?: string[],
  services?: string[],
) => `
SELECT time_bucket_gapfill(interval '${interval}' / ${totalPoint}, time, now() - INTERVAL '${interval}', now()) AS bucket, AVG(value)/1000000 AS value, machine
FROM rx_network
WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (services ?? []).length > 0
        ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine
ORDER BY bucket;
`;

export const txNetworkQuery = (
  start: string,
  end: string,
  timeBucket: string,
  machineIds?: string[],
) => `
SELECT time_bucket('${timeBucket}', time) AS bucket, AVG(value)/1000000 AS value, machine
FROM tx_network
WHERE time BETWEEN '${start}' AND '${end}'
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine
ORDER BY bucket;
`;

export const txNetworkGapFillQuery = (
  interval: string,
  totalPoint: number,
  machineIds?: string[],
  services?: string[],
) => `
SELECT time_bucket_gapfill(interval '${interval}' / ${totalPoint}, time, now() - INTERVAL '${interval}', now()) AS bucket, AVG(value)/1000000 AS value, machine
FROM tx_network
WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
    ${
      (machineIds ?? []).length > 0
        ? `AND machine IN  ( ${machineIds.map((s) => `'${s}'`).join(',')})`
        : ''
    }
    ${
      (services ?? []).length > 0
        ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
        : ''
    }
GROUP BY bucket, machine
ORDER BY bucket;
`;

export const getCurrentServerStatusQuery = (
  machineIds?: string[],
  service?: string,
) =>
  `SELECT DISTINCT ON (machine_id) machine_id, status, time ` +
  `FROM server_status ` +
  ((machineIds ?? []).length > 0
    ? `WHERE machine_id IN (${machineIds.map((m) => `'${m}'`).join(',')}) `
    : ``) +
  (service
    ? (machineIds ?? []).length > 0
      ? `AND service = ${service}`
      : `WHERE service = ${service}`
    : '') +
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

// export const createAlertQuery = (alert: TAlertRuleQuery) =>
//   `INSERT INTO alert_rule(name, expression, duration, severity, silence_time, message) ` +
//   `VALUES ('${alert.name}', E'${alert.expression.replace(/'/g, "\\'")}', '${
//     alert.duration
//   }', '${alert.severity}', '${alert.silence_time}', '${alert.message}')`;

// export const createRecipientQuery = (recipient: TRecipientQuery) =>
//   `INSERT INTO recipient(name, app, token, url, room) ` +
//   `VALUES ('${recipient.name}', '${recipient.app}', '${recipient.token}', '${recipient.url}', '${recipient.room}')`;

// export const getAlertRecipientsQuery = (ruleId: string) =>
//   `SELECT * FROM alert_recipient WHERE rule_id = ${ruleId}`;

// export const addRecipientToAlertQuery = (
//   ruleId: string,
//   recipientIds: string[],
// ) =>
//   `INSERT INTO alert_recipient(rule_id, recipient_id) VALUES ${recipientIds
//     .map((r) => `('${ruleId}', '${r}')`)
//     .join(',')}`;

// export const getAlertQuery = () => `SELECT * FROM alert_rule`;

// export const updateAlertQuery = (alert: TAlertRuleQuery) =>
//   `UPDATE alert_rule SET name = '${
//     alert.name
//   }', expression = E'${alert.expression.replace(/'/g, "\\'")}', duration = '${
//     alert.duration
//   }', severity = '${alert.severity}', silence_time = '${
//     alert.silence_time
//   }', message = '${alert.message}' WHERE id = ${alert.id}`;

export const getPathRatio = (
  start: string,
  end: string,
  services?: string[],
  machineIds?: string[],
  controllers?: string[],
): string =>
  `
WITH request_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        CASE
            WHEN value < COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time), 0) 
            THEN value  
            ELSE value - COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time), 0)
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
): string => `WITH ht1 AS (
  WITH request_deltas AS (
    SELECT
      time,
      path,
      service,
      machine,
      controller,
      CASE 
        WHEN value < COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time), 0)
        THEN value 
        ELSE value - COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time), 0)
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
        WHEN value < COALESCE(LAG(value) OVER (PARTITION BY path, service, machine, controller, error_code, error_title ORDER BY time), 0) 
        THEN value 
        ELSE value - COALESCE(LAG(value) OVER (PARTITION BY path, service, machine, controller, error_code, error_title ORDER BY time), 0) 
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

export const getRequestPath = (services: string, interval = '1 week'): string =>
  `WITH request_deltas AS (
    SELECT
        time,
        path,
        service,
        machine,
        controller,
        CASE
            WHEN value < COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time), 0) 
            THEN value  
            ELSE value - COALESCE(LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time), 0)
        END AS requests_in_interval
    FROM
        request_count
    WHERE time >= now() - INTERVAL '${interval}' AND time <= now()
    ${services ? `AND service =  '${services}'` : ''}
  )
  SELECT 
    path, 
    SUM(requests_in_interval)  as value
  FROM 
    request_deltas
  GROUP BY 
    path
`;

export const getAvgResourceInterval = (
  table: string,
  services: string[],
  interval: string,
) => `
  SELECT AVG(value) as value , machine
  FROM ${table}
  WHERE time >= now() - INTERVAL '${interval}'
   ${
     (services ?? []).length > 0
       ? `AND service in (${services.map((m) => `'${m}'`)})`
       : ''
   }
  GROUP BY machine
`;

export const serverDown = (interval: string, services: string[]) =>
  `
  SELECT status, machine_id as machine FROM server_status
  WHERE time >= now() - INTERVAL '${interval}'
  ${
    (services ?? []).length > 0
      ? `AND service in (${services.map((m) => `'${m}'`)})`
      : ''
  }
`;

export const createAlertQuery = (rule: any) =>
  `INSERT INTO alert_rule (name, type, threshold, service, enable, duration, silence_time, message ) 
   VALUES ('${rule.name}', '${rule.type}', ${rule.threshold}, '{${rule.services
    .map((service) => service)
    .join(',')}}', true, '${rule.duration}', '${rule.silence_time}', '${
    rule.message
  }');`;

export const createAlertNoThresholdQuery = (rule: any) =>
  `INSERT INTO alert_rule (name, type, enable, duration, silence_time, message, service ) 
     VALUES ('${rule.name}', '${rule.type}', true, '${rule.duration}', '${
    rule.silence_time
  }', '${rule.message}', ${
    rule.service
      ? `'{${rule.services.map((service) => service).join(',')}}'
  }'`
      : `'{}'`
  });`;

export const createRecipientQuery = (recipient: any) =>
  `INSERT INTO recipient (name, config) VALUES ('${recipient.name}', '${recipient.detail}') `;

export const createGroupQuery = (group: any) =>
  `INSERT INTO recipient_group (name, recipients) VALUES ('${
    group.name
  }', '{${group.recipients.map((g) => g).join(',')}}')`;

export const createRuleGroupQuery = (ruleId: number, groupId: number) =>
  `INSERT INTO rule_group (rule_id, group_id) VALUES (${ruleId}, ${groupId})`;

export const addGroupToRuleQuery = (ruleId: number, groupIds: number[]) => {
  const query = `INSERT INTO rule_group (rule_id, group_id ) VALUES `;
  const values = `${groupIds.map((g) => `(${ruleId}, ${g})`).join(',')}`;
  return `${query}${values}`;
};

export const deleteRuleGroupQuery = (ruleId: number, groupId: number) =>
  `DELETE FROM rule_group WHERE rule_id = ${ruleId} AND group_id = ${groupId}`;

export const updateRecipientToGroupQuery = (
  recipients: number[],
  groupId: number,
) =>
  `UPDATE  recipient_group
   SET recipients = '{${recipients.map((r) => r).join(',')}}'
   WHERE id = ${groupId}
`;

export const getRecipientsFromGroup = (groupId: number) =>
  `SELECT recipients
   FROM recipient_group
   WHERE id = ${groupId}
`;

export const updateRuleStatusQuery = (ruleId: number, isEnabled: boolean) =>
  `UPDATE alert_rule
   SET enable = ${isEnabled}
   WHERE id = ${ruleId}
`;

export const deleteRuleQuery = (ruleId: number) =>
  `DELETE FROM alert_rule WHERE id = ${ruleId}`;

export const deleteRecipientQuery = (recipientId: number) =>
  `DELETE FROM recipient WHERE id = ${recipientId}`;

export const deleteGroupQuery = (groupId: number) =>
  `DELETE FROM recipient_group WHERE id = ${groupId}`;

export const deleteRuleGroupByRule = (ruleId: number) =>
  `DELETE FROM rule_group WHERE rule_id = ${ruleId}`;

export const deleteRuleGroupByGroup = (groupId: number) =>
  `DELETE FROM rule_group WHERE group_id = ${groupId}`;

export const removeGroupFromRule = (ruleId: number, groupIds: number[]) =>
  `
  DELETE FROM rule_group WHERE 
  rule_id = ${ruleId} AND group_id in (${groupIds.join(',')})
`;

export const removeRecipientFromGroupQuery = (recipient: number) =>
  `
  SELECT ARRAY_REMOVE(recipients, ${recipient})
  FROM recipient_group
  WHERE ${recipient} = ANY(recipients)
`;

export const getNotifyHistoryQuery = (ruleId: number, duration: string) =>
  `SELECT * FROM notify_history WHERE rule_id = '${ruleId}' AND time >= now() - interval '${duration}'`;

export const createNotifyHistoryQuery = (ruleId: number) =>
  `INSERT INTO notify_history(rule_id) VALUES (${ruleId})`;

export const getEnabledRulesQuery = () =>
  `SELECT * FROM alert_rule WHERE enable = true`;

export const getErrorRateInterval = (interval: string, services: string[]) =>
  `
WITH ht1 AS (
  WITH request_deltas AS (
    SELECT
      service,
      machine,
      CASE 
        WHEN value < LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time)
        THEN value 
        ELSE value - LAG(value) OVER (PARTITION BY service, machine, controller, path, status_code ORDER BY time)
      END AS requests_in_interval
    FROM request_count
    WHERE time >= now() - INTERVAL '${interval}' 
     ${
       (services ?? []).length > 0
         ? `AND service IN  ( ${services.map((s) => `'${s}'`).join(',')})`
         : ''
     }
  )
  SELECT
    SUM(requests_in_interval) AS value,
    machine
  FROM request_deltas
  GROUP BY machine
),
ht2 AS (
  WITH error_deltas AS (
    SELECT
      service,
      machine,
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
  )
  SELECT
    SUM(errors_in_interval) AS value,
    machine
  FROM error_deltas
  GROUP BY machine
)
SELECT
  ht1.machine,
  (ht2.value/ht1.value) * 100 as value
FROM ht1
INNER JOIN ht2 ON ht1.machine = ht2.machine;`;

export const getRecipientFromRule = (ruleId: number) =>
  `
  WITH rule_recipients AS (
    SELECT g.recipients AS r_id
    FROM recipient_group AS g INNER JOIN rule_group AS r ON g.id = r.group_id
    WHERE r.rule_id = ${ruleId}
  )
  SELECT * FROM rule_recipients
`;

export const getRecipientsQuery = (recipients: number[]) =>
  `
  SELECT * FROM recipient
  WHERE id in (${recipients.join(',')})
`;

export const getRulesQuery = () => 'SELECT * FROM alert_rule';

export const getGroupFromRuleQuery = (ruleId: number) =>
  `
  SELECT g.id as id , g.name as name ,  g.recipients as recipients
  FROM rule_group as rg INNER JOIN recipient_group as g ON rg.group_id = g.id
  WHERE rg.rule_id = ${ruleId}
`;

export const getGroupQuery = () => `SELECT * FROM recipient_group`;

export const updateRuleQuery = (rule: any) =>
  `
  UPDATE alert_rule 
  SET
    name = '${rule.name}',
    threshold = ${rule.threshold},
    message = E'${rule.message.replace(/'/g, "\\'")}',
    duration = '${rule.duration}',
    silence_time = '${rule.silence_time}'
  WHERE
    id = ${rule.id}
`;

export const updateAlertServiceQuery = (ruleId: number, services: string[]) =>
  `
  UPDATE alert_rule
  SET service = '{${services.map((s) => `"${s}"`).join(',')}}'
  WHERE id = ${ruleId}
`;

export const getRuleByIdQuery = (ruleId: number) =>
  `
  SELECT * FROM alert_rule WHERE id = ${ruleId}
`;

export const deleteNotifyHistory = (ruleId: number) =>
  `
  DELETE FROM notify_history WHERE rule_id = ${ruleId};
`;
