import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import {
  TFilterIntervalReq,
  TFilterReq,
  TMetricsReq,
} from './utils/types/request.type';
import { AlertRule } from './utils/types/alert.type';
import { TAlertRuleQuery, TRecipientQuery } from './utils/types/record.type';

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

  @Get('heartbeat')
  async heartbeat(
    @Query('machineId') machineId: string,
    @Query('service') service: string,
  ) {
    this.appService.heartbeat(machineId, service);
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

  @Post('path-ratio')
  async getPathRatio(@Body() filter: TFilterReq) {
    return await this.appService.getPathRatio(filter);
  }

  @Post('request')
  async getRequestData(@Body() filter: TFilterIntervalReq) {
    // return await this.appService.getRequestData(filter);
    return await this.appService.getRequestDataGapFill(filter);
  }

  @Post('cpu-usage')
  async getCpuUsage(@Body() filter: TFilterIntervalReq) {
    return await this.appService.getCpuGapFillData(filter);
  }

  @Post('mem-usage')
  async getMemUsage(@Body() filter: TFilterIntervalReq) {
    // return await this.appService.getMemData(filter);
    return await this.appService.getMemGapFillData(filter);
  }

  @Post('rx-network-usage')
  async getReceivedNetwork(@Body() filter: TFilterIntervalReq) {
    // return await this.appService.getReceivedNetworkData(filter);
    return await this.appService.getRxNetowrkGapFillData(filter);
  }

  @Post('tx-network-usage')
  async getTransferedNetwork(@Body() filter: TFilterIntervalReq) {
    // return await this.appService.getTransferedNetworkData(filter);
    return await this.appService.getTxNetowrkGapFillData(filter);
  }

  @Post('error-rate')
  async getErrorRate(@Body() filter: TFilterReq) {
    return await this.appService.getErrorRate(filter);
  }

  @Get('error-ranking')
  async getErrorRanking(@Query('service') service: string) {
    return await this.appService.getErrorRanking(service);
  }

  @Post('avg-response')
  async getAvgResponse(@Body() filter: TFilterIntervalReq) {
    // return await this.appService.getResponseAvgData(filter);
    return await this.appService.getResponseAvgDataGapFill(filter);
  }

  // @Post('dist-response')
  // async getDistResponse(@Body() filter: TFilterReq) {
  //   return await this.appService.getResponseDistData(filter);
  // }

  @Post('server-timeline')
  async getServerTimeline(@Body() filter: TFilterReq) {
    return await this.appService.serverTimeline(filter);
  }

  // @Get('alert-rules')
  // async getAlert() {
  //   return await this.appService.getAlert();
  // }

  @Post('create-alert')
  async createAlert(@Body() alert: TAlertRuleQuery) {
    return await this.appService.createAlert(alert);
  }

  @Post('create-recipient')
  async createRecipient(@Body() recipient: TRecipientQuery) {
    return await this.appService.createRecipient(recipient);
  }

  @Post('add-recipient-to-group')
  async addRecipientToGroup(
    @Body() body: { groupId: number; recipients: number[] },
  ) {
    return await this.appService.addRecipientToGroup(body);
  }

  @Post('remove-recipient-from-group')
  async removeRecipientFromGroup(
    @Body() body: { groupId: number; recipients: number[] },
  ) {
    return await this.appService.removeRecipientFromGroup(body);
  }

  @Get('alert-rules')
  async getRules() {
    return await this.appService.getRules();
  }

  @Post('get-alert-history')
  async getAlertHistory(@Body() body: any) {
    debugger;
  }

  @Get('get-recipient-from-group')
  async getRecipientFromGroup(@Query('groupId') groupId: number) {
    return this.appService.getRecipientFromGroup(groupId);
  }

  // @Post('update-alert')
  // async updateAlert(@Body() body: TAlertRuleQuery) {
  //   return await this.appService.updateAlert(body);
  // }

  // @Get('recipients')
  // async getRecipients(@Query('ruleId') ruleId: string) {
  //   return await this.appService.getRecipients(ruleId);
  // }

  @Get('enable-rule')
  async enableRule(@Query('ruleId') ruleId: number) {
    return await this.appService.enableRule(ruleId);
  }

  @Get('disable-rule')
  async disableRule(@Query('ruleId') ruleId: number) {
    return await this.appService.disableRule(ruleId);
  }

  // @Get('delete-rule')
  // async deleteRule(@Query('ruleId') ruleId: string) {
  //   return await this.appService.deleteRule(ruleId);
  // }

  // @Get('remove-recipient-from-rule')
  // async removeRecipientFromRule(
  //   @Query('ruleId') ruleId: string,
  //   @Query('recipientId') recipientId: string,
  // ) {
  //   return await this.appService.removeRecipientFromRule(ruleId, recipientId);
  // }

  // @Get('delete-recipient')
  // async deleteRecipient(@Query('recipientId') recipientId: string) {
  //   return await this.appService.removeRecipient(recipientId);
  // }

  // @Post('request-error-ratio')
  // async getReqErrRatio(@Body() filter: TFilterIntervalReq) {
  //   return await this.appService.getRequestErrorRatioGapFill(filter);
  // }
  @Post('create-group')
  async createGroup(@Body() body: { groupId: number; recipients: number[] }) {
    return this.appService.createGroup(body);
  }

  @Post('add-group-to-rule')
  async addGroupToRule(@Body() body: any) {
    return this.appService.addGroupToRule(body);
  }

  @Get('alert-type')
  async getAlertType() {
    return this.appService.getAlertType();
  }

  @Get('groups')
  async getGroups() {
    return await this.appService.getGroup();
  }

  @Post('remove-group-from-rule')
  async removeGroupFromRule(@Body() body: any) {
    return await this.appService.removeGroupFromRule(body);
  }

  @Post('update-group-of-rule')
  async updateGroupOfRule(@Body() body: any) {
    return await this.appService.updateGroupOfRule(body);
  }
}
