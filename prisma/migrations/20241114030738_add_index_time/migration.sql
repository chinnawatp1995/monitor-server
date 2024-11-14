-- CreateIndex
CREATE INDEX "error_time_idx" ON "error"("time");

-- CreateIndex
CREATE INDEX "mem_time_idx" ON "mem"("time");

-- CreateIndex
CREATE INDEX "request_count_time_idx" ON "request_count"("time");

-- CreateIndex
CREATE INDEX "response_time_time_idx" ON "response_time"("time");

-- CreateIndex
CREATE INDEX "rx_network_time_idx" ON "rx_network"("time");

-- CreateIndex
CREATE INDEX "server_status_time_idx" ON "server_status"("time");

-- CreateIndex
CREATE INDEX "tx_network_time_idx" ON "tx_network"("time");
