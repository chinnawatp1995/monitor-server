export const createRequestQuery = (recs: any): string =>
  `INSERT INTO request(time, service, machine_id, method, path, status_code, response_time, error_message) ` +
  `VALUES ${recs.values
    .map(
      (rec) =>
        `('${rec.time}','${recs.tags[0]}', '${recs.tags[1]}', '${rec.method}', '${rec.path}', ${rec.statusCode}, ${rec.responseTime}, '${rec.errorMessage}')`,
    )
    .join(',')}`;

export const createCpuQuery = (recs: any): string =>
  `INSERT INTO cpu_usage(time, service, machine_id, value) ` +
  `VALUES ${recs.values
    .map(
      (rec) =>
        `('${rec.time}','${recs.tags[0]}', '${recs.tags[1]}', ${rec.usage})`,
    )
    .join(',')}`;

export const createMemQuery = (recs: any): string =>
  `INSERT INTO mem_usage(time, service, machine_id, value) ` +
  `VALUES ${recs.values
    .map(
      (rec) =>
        `('${rec.time}','${recs.tags[0]}','${recs.tags[1]}', ${rec.usage})`,
    )
    .join(',')}`;

export const createServerStatus = (recs: any): string =>
  `INSERT INTO server_status(machine_id, status) ` +
  `VALUES ${recs.map((v) => `('${v.machineId}', ${v.status})`).join(',')}`;

export const getRequestQuery = (
  start: string,
  end: string,
  timeBucket: string,
  services?: string[],
  machineIds?: string[],
) =>
  `SELECT time_bucket('${timeBucket}', time) AS bucket, COUNT(*) AS total_requests, machine_id, service ` +
  `FROM request ` +
  `WHERE time BETWEEN '${start}' AND '${end}' ` +
  ((services ?? []).length > 0
    ? `AND service IN (${services.map((s) => `'${s}'`).join(',')}) `
    : ``) +
  (machineIds
    ? `AND machine_id IN (${machineIds.map((m) => `'${m}'`).join(',')}) `
    : ``) +
  `GROUP BY bucket, machine_id, service ` +
  `ORDER BY bucket;`;

export const getResponseAvgQuery = (
  start: string,
  end: string,
  timeBucket: string,
  services?: string[],
  machineIds?: string[],
) =>
  `SELECT time_bucket('${timeBucket}', time) AS bucket, AVG(response_time) AS avg_response, machine_id, service ` +
  `FROM request ` +
  `WHERE time BETWEEN '${start}' AND '${end}' ` +
  ((services ?? []).length > 0
    ? `AND service IN (${services.map((s) => `'${s}'`).join(',')}) `
    : ``) +
  ((machineIds ?? []).length > 0
    ? `AND machine_id IN (${machineIds.map((m) => `'${m}'`).join(',')}) `
    : ``) +
  `GROUP BY bucket, machine_id, service ` +
  `ORDER BY bucket;`;

export const getResponseDistQuery = (
  start: string,
  end: string,
  resolution: string,
  services?: string[],
) =>
  `SELECT time_bucket('${resolution}', time) AS bucket, machine_id, ` +
  `percentile_cont(0.1) WITHIN GROUP (ORDER BY response_time) AS p10, ` +
  `percentile_cont(0.2) WITHIN GROUP (ORDER BY response_time) AS p20, ` +
  `percentile_cont(0.3) WITHIN GROUP (ORDER BY response_time) AS p30, ` +
  `percentile_cont(0.4) WITHIN GROUP (ORDER BY response_time) AS p40, ` +
  `percentile_cont(0.5) WITHIN GROUP (ORDER BY response_time) AS p50, ` +
  `percentile_cont(0.6) WITHIN GROUP (ORDER BY response_time) AS p60, ` +
  `percentile_cont(0.7) WITHIN GROUP (ORDER BY response_time) AS p70, ` +
  `percentile_cont(0.8) WITHIN GROUP (ORDER BY response_time) AS p80, ` +
  `percentile_cont(0.9) WITHIN GROUP (ORDER BY response_time) AS p90 ` +
  `FROM request ` +
  `WHERE time BETWEEN '${start}' AND '${end}' ` +
  ((services ?? []).length > 0
    ? `AND service IN (${services.map((s) => `'${s}'`).join(',')}) `
    : ``) +
  `GROUP BY bucket, machine_id ` +
  `ORDER BY bucket, machine_id;`;

export const getCpuQuery = (
  start: string,
  end: string,
  timeBucket: string,
  machineIds?: string[],
) =>
  `SELECT time_bucket('${timeBucket}', time) AS bucket, AVG(value) AS avg, machine_id ` +
  `FROM cpu_usage ` +
  `WHERE time BETWEEN '${start}' AND '${end}' ` +
  (machineIds ?? [].length > 0
    ? ` AND machine_id IN  (${machineIds.map((m) => `'${m}'`).join(',')})`
    : ``) +
  `GROUP BY bucket, machine_id ` +
  `ORDER BY bucket, machine_id;
`;

export const getMemQuery = (
  start: string,
  end: string,
  timeBucket: string,
  machineIds?: string[],
) =>
  `SELECT time_bucket('${timeBucket}', time) AS bucket, AVG(value) AS avg , machine_id ` +
  `FROM mem_usage ` +
  `WHERE time BETWEEN '${start}' AND '${end}' ` +
  ((machineIds ?? []).length
    ? ` AND machine_id IN  (${machineIds.map((m) => `'${m}'`).join(',')})`
    : ``) +
  `GROUP BY bucket, machine_id ` +
  `ORDER BY bucket, machine_id;
`;

export const getCurrentServerStatusQuery = (machineIds?: string[]) =>
  `SELECT DISTINCT ON (machine_id) machine_id, status, time ` +
  `FROM server_status ` +
  ((machineIds ?? []).length > 0
    ? `WHERE machine_id IN (${machineIds.map((m) => `'${m}'`).join(',')}) `
    : ``) +
  `ORDER BY machine_id, time DESC;`;

export const getResponseTimePercentile = (
  start: string,
  end: string,
  resolution: string,
  services?: string[],
) =>
  `
WITH percentile_data AS (
    SELECT 
        time_bucket('${resolution}', time) AS bucket, machine_id,
        percentile_cont(0.0) WITHIN GROUP (ORDER BY response_time) AS p00,
        percentile_cont(0.1) WITHIN GROUP (ORDER BY response_time) AS p10,
        percentile_cont(0.2) WITHIN GROUP (ORDER BY response_time) AS p20,
		    percentile_cont(0.3) WITHIN GROUP (ORDER BY response_time) AS p30,
        percentile_cont(0.4) WITHIN GROUP (ORDER BY response_time) AS p40,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY response_time) AS p50,
		    percentile_cont(0.6) WITHIN GROUP (ORDER BY response_time) AS p60,
        percentile_cont(0.7) WITHIN GROUP (ORDER BY response_time) AS p70,
        percentile_cont(0.8) WITHIN GROUP (ORDER BY response_time) AS p80,
        percentile_cont(0.9) WITHIN GROUP (ORDER BY response_time) AS p90
    FROM request
    WHERE time BETWEEN '${start}' AND '${end}' ${
    (services ?? []).length > 0
      ? `AND service IN (${services.map((s) => `'${s}'`).join(',')}) `
      : ``
  }
    GROUP BY bucket, machine_id
    ORDER BY bucket, machine_id
)
SELECT 
    pd.bucket, pd.machine_id,
    pd.p00,
    pd.p10,
    pd.p20,
    pd.p30,
    pd.p40,
    pd.p50,
    pd.p60,
    pd.p70,
    pd.p80,
    pd.p90,
    MIN(r.response_time) FILTER (WHERE r.response_time >= pd.p00 AND r.response_time < pd.p10) AS time_p00,
    MIN(r.response_time) FILTER (WHERE r.response_time >= pd.p10 AND r.response_time < pd.p20) AS time_p10,
    MIN(r.response_time) FILTER (WHERE r.response_time >= pd.p20 AND r.response_time < pd.p30) AS time_p20,
    MIN(r.response_time) FILTER (WHERE r.response_time >= pd.p30 AND r.response_time < pd.p40) AS time_p30,
    MIN(r.response_time) FILTER (WHERE r.response_time >= pd.p40 AND r.response_time < pd.p50) AS time_p40,
    MIN(r.response_time) FILTER (WHERE r.response_time >= pd.p50 AND r.response_time < pd.p60) AS time_p50,
    MIN(r.response_time) FILTER (WHERE r.response_time >= pd.p60 AND r.response_time < pd.p70) AS time_p60,
    MIN(r.response_time) FILTER (WHERE r.response_time >= pd.p70 AND r.response_time < pd.p80) AS time_p70,
    MIN(r.response_time) FILTER (WHERE r.response_time >= pd.p80 AND r.response_time < pd.p90) AS time_p80,
    MIN(r.response_time) FILTER (WHERE r.response_time >= pd.p90) AS time_p90
FROM percentile_data pd
LEFT JOIN request r ON time_bucket('1 second', r.time) = pd.bucket
GROUP BY pd.bucket, pd.machine_id,
	pd.p00,
    pd.p10,
    pd.p20,
    pd.p30,
    pd.p40,
    pd.p50,
    pd.p60,
    pd.p70,
    pd.p80,
    pd.p90
ORDER BY pd.bucket, pd.machine_id;
`;

export const serverTimeline = (
  start: string,
  end: string,
  services?: string[],
) =>
  `SELECT time, machine_id, status ` +
  `FROM server_status ` +
  ((services ?? []).length > 0
    ? `AND service IN (${services.map((s) => `'${s}'`).join(',')}) `
    : ``) +
  `GROUP BY time, machine_id, status ` +
  `ORDER BY time, machine_id `;
