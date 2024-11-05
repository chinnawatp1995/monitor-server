SELECT add_retention_policy('server_status', INTERVAL '7 days')

SELECT add_retention_policy('request', INTERVAL '3 months')

SELECT add_retention_policy('cpu_usage', INTERVAL '3 months')

SELECT add_retention_policy('mem_usage', INTERVAL '3 months')

SELECT add_retention_policy('network_usage', INTERVAL '3 months')



-- ==========================================
--  new for new schema

SELECT add_retention_policy('request_count', INTERVAL '30 days')

SELECT add_retention_policy('response_time', INTERVAL '30 days')

SELECT add_retention_policy('error', INTERVAL '30 days')

SELECT add_retention_policy('cpu', INTERVAL '30 days')

SELECT add_retention_policy('mem', INTERVAL '30 days')

SELECT add_retention_policy('rx_network', INTERVAL '30 days')

SELECT add_retention_policy('tx_network', INTERVAL '30 days')