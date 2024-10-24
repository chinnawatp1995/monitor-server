SELECT add_retention_policy('server_status', INTERVAL '7 days')

SELECT add_retention_policy('request', INTERVAL '3 months')

SELECT add_retention_policy('cpu_usage', INTERVAL '3 months')

SELECT add_retention_policy('mem_usage', INTERVAL '3 months')

SELECT add_retention_policy('network_usage', INTERVAL '3 months')