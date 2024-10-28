import axios from 'axios';

export class AlertNotificationService implements AlertNotifier {
  async notify(alert: { severity: string; message: string; details: any }) {
    switch (alert.severity) {
      case 'critical':
        await Promise.all([this.sendEmail(alert), this.sendTelegram(alert)]);
        break;
      case 'warning':
        await Promise.all([this.sendEmail(alert), this.sendTelegram(alert)]);
        break;
      case 'info':
        await this.sendTelegram(alert);
        break;
    }
  }

  sendEmail(alert: { severity: string; message: string; details: any }): any {
    throw new Error('Method not implemented.');
  }

  async sendTelegram(url: string, token: string, chatId: string, msg: string) {
    await axios({
      method: 'post',
      url: url + token + '/sendMessage',
      data: {
        chat_id: chatId,
        text: msg,
      },
    }).catch(function (error) {
      console.log(error);
    });
  }
}
