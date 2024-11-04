export const createRequestQuery = (recs) => {
  const query = `INSERT INTO request_count (time, service, machine, controller, path, statusCode, value) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${rec.time}', '${rec.service}', '${rec.machine}', '${rec.controller}', '${rec.path}', ${rec.statusCode}, ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createResponseQuery = (recs) => {
  const query = `INSERT INTO response_time (time, service, machine, controller, path, statusCode, count, sum, min, max, bucket_25, bucket_50, bucket_100, bucket_200, bucket_400, bucket_800, bucket_1600, bucket_3200, bucket_6400, bucket_12800) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${rec.time}', '${rec.service}', '${rec.machine}', '${rec.controller}', '${rec.path}', ${rec.statusCode}, ${rec.count}, ${rec.sum}, ${rec.min}, ${rec.max}, ${rec.bucket_25}, ${rec.bucket_50}, ${rec.bucket_100}, ${rec.bucket_200}, ${rec.bucket_400}, ${rec.bucket_800}, ${rec.bucket_1600}, ${rec.bucket_3200}, ${rec.bucket_6400}, ${rec.bucket_12800})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createErrorQuery = (recs) => {
  const query = `INSERT INTO error (time, service, machine, controller, path, statusCode, reason, value) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${rec.time}', '${rec.service}', '${rec.machine}', '${rec.controller}', '${rec.path}', ${rec.statusCode}, '${rec.reason}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createCpuQuery = (recs) => {
  const query = `INSERT INTO cpu (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${rec.time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createMemQuery = (recs) => {
  const query = `INSERT INTO mem (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${rec.time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createRxNetworkQuery = (recs) => {
  const query = `INSERT INTO rx_network (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${rec.time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};

export const createTxNetworkQuery = (recs) => {
  const query = `INSERT INTO tx_network (time, service, machine, value) VALUES `;
  const values = recs
    .map(
      (rec) =>
        `('${rec.time}', '${rec.service}', '${rec.machine}', ${rec.value})`,
    )
    .join(',');
  return `${query}${values};`;
};
