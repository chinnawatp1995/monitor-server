import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { TFilterReq, TMetricsReq } from './utils/types/request.type';

@Controller('monitor-server')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('ping')
  ping(): string {
    return 'pong';
  }

  @Post('collect-metrics')
  async collectMetrics(@Body() body: TMetricsReq) {
    await this.appService.collectMetrics(body);
  }

  @Get('services')
  async getService() {
    return await this.appService.getService();
  }

  @Get('machines/')
  async getMachinesByService(@Query('service') service: string) {
    return await this.appService.getMachineByService(service);
  }

  @Post('server-status')
  async getServerStatus(@Body() body: { machineIds: string[] }) {
    return await this.appService.getCurrentServerStatus(body?.machineIds);
  }

  @Get('path')
  async getPathByService(@Query('service') service: string) {
    return await this.appService.getTotalRequestPath(service);
  }

  @Post('request')
  async getRequestData(@Body() filter: TFilterReq) {
    return await this.appService.getRequestData(filter);
  }

  @Post('cpu-usage')
  async getCpuUsage(@Body() filter: TFilterReq) {
    return await this.appService.getCpuData(filter);
  }

  @Post('mem-usage')
  async getMemUsage(@Body() filter: TFilterReq) {
    console.log(filter);
    return await this.appService.getMemData(filter);
  }

  @Post('rx-network-usage')
  async getReceivedNetwork(@Body() filter: TFilterReq) {
    return await this.appService.getReceivedNetworkData(filter);
  }

  @Post('tx-network-usage')
  async getTransferedNetwork(@Body() filter: TFilterReq) {
    return await this.appService.getTransferedNetworkData(filter);
  }

  @Get('error-req')
  async getErrorReqRatio(@Query('service') service: string) {
    return await this.appService.getErrorToReqRatio(service);
  }

  @Get('error-ranking')
  async getErrorRanking(@Query('service') service: string) {
    return await this.appService.getErrorReason(service);
  }

  @Post('avg-response')
  async getAvgResponse(@Body() filter: TFilterReq) {
    return await this.appService.getResponseAvgData(filter);
  }

  @Post('dist-response')
  async getDistResponse(@Body() filter: TFilterReq) {
    return await this.appService.getResponseDistData(filter);
  }

  @Post('server-timeline')
  async getServerTimeline(@Body() filter: TFilterReq) {
    return await this.appService.serverTimeline(filter);
  }

  @Get('alert-rules')
  async getAlert() {
    return await this.appService.getAlert();
  }

  @Post('create-alert')
  async createAlert(@Body() alert: any) {
    console.log(alert);
    return await this.appService.createAlert(alert);
  }

  @Post('create-recipient')
  async createRecipient(@Body() recipient: any) {
    return await this.appService.createRecipient(recipient);
  }

  @Post('add-recipient')
  async addRecipientToAlert(@Body() body: any) {
    return await this.appService.addRecipientToAlert(body);
  }

  @Post('get-alert-history')
  async getAlertHistory(@Body() body: any) {
    debugger;
  }

  @Post('update-alert')
  async updateAlert(@Body() body: any) {
    return await this.appService.updateAlert(body);
  }

  @Get('recipients')
  async getRecipients(@Query('ruleId') ruleId: string) {
    return await this.appService.getRecipients(ruleId);
  }

  @Get('enable-rule')
  async enableRule(@Query('ruleId') ruleId: string) {
    return await this.appService.enableRule(ruleId);
  }

  @Get('disable-rule')
  async disableRule(@Query('ruleId') ruleId: string) {
    return await this.appService.disableRule(ruleId);
  }

  @Get('delete-rule')
  async deleteRule(@Query('ruleId') ruleId: string) {
    return await this.appService.deleteRule(ruleId);
  }

  @Get('remove-recipient-from-rule')
  async removeRecipientFromRule(
    @Query('ruleId') ruleId: string,
    @Query('recipientId') recipientId: string,
  ) {
    return await this.appService.removeRecipientFromRule(ruleId, recipientId);
  }

  @Get('delete-recipient')
  async deleteRecipient(@Query('recipientId') recipientId: string) {
    return await this.appService.removeRecipient(recipientId);
  }
}
