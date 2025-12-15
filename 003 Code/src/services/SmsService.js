/**
 * SMS 발송 통합 서비스
 * SMS 게이트웨이와 메시지 템플릿을 통합하여 메시지 발송을 관리합니다.
 */

const SmsGatewayService = require("./SmsGatewayService");
const MessageTemplateService = require("./MessageTemplateService");
const MessageLog = require("../models/MessageLog");
const Message = require("../models/Message");

class SmsService {
  constructor() {
    this.gateway = new SmsGatewayService();
    this.template = new MessageTemplateService();
    this.messageLogModel = new MessageLog();
    this.messageModel = new Message();
  }

  /**
   * 일일 날씨 메시지 발송
   */
  async sendDailyWeatherMessage(recipients, weatherData, airQualityData) {
    try {
      // 메시지 생성
      const messageContent = this.template.generateDailyWeatherMessage(
        weatherData,
        airQualityData
      );

      // 메시지 유효성 검증
      const validation = this.template.validateMessage(messageContent);
      if (!validation.isValid) {
        throw new Error(
          `메시지 유효성 검증 실패: ${validation.errors.join(", ")}`
        );
      }

      // 메시지 레코드 생성
      const messageId = await this.messageModel.create({
        type: "daily",
        title: "일일 날씨 알림",
        content: messageContent,
        scheduled_at: new Date(),
        recipient_count: recipients.length,
        status: "pending",
      });

      console.log(`일일 날씨 메시지 발송 시작: ${recipients.length}명`);

      // 수신자별 발송
      const results = await this.sendToMultipleRecipients(
        recipients,
        messageContent,
        messageId,
        "daily"
      );

      // 메시지 상태 업데이트
      await this.updateMessageStatus(messageId, results);

      return {
        success: true,
        messageId: messageId,
        totalRecipients: recipients.length,
        successCount: results.successCount,
        failureCount: results.failureCount,
        results: results.details,
      };
    } catch (error) {
      console.error("일일 날씨 메시지 발송 실패:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 긴급 알림 발송
   */
  async sendEmergencyAlert(recipients, disasterData) {
    try {
      // 긴급 메시지 생성
      const messageContent =
        this.template.generateEmergencyMessage(disasterData);

      // 메시지 유효성 검증
      const validation = this.template.validateMessage(messageContent);
      if (!validation.isValid) {
        throw new Error(
          `메시지 유효성 검증 실패: ${validation.errors.join(", ")}`
        );
      }

      // 메시지 레코드 생성
      const messageId = await this.messageModel.create({
        type: "emergency",
        title: `긴급알림: ${disasterData.type || "재난상황"}`,
        content: messageContent,
        scheduled_at: new Date(),
        recipient_count: recipients.length,
        status: "pending",
      });

      console.log(`긴급 알림 발송 시작: ${recipients.length}명`);

      // 긴급 메시지는 재시도 로직 적용
      const results = await this.sendToMultipleRecipientsWithRetry(
        recipients,
        messageContent,
        messageId,
        "emergency"
      );

      // 메시지 상태 업데이트
      await this.updateMessageStatus(messageId, results);

      return {
        success: true,
        messageId: messageId,
        totalRecipients: recipients.length,
        successCount: results.successCount,
        failureCount: results.failureCount,
        results: results.details,
      };
    } catch (error) {
      console.error("긴급 알림 발송 실패:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 맞춤 알림 발송
   */
  async sendCustomReminder(recipient, reminderData) {
    try {
      // 맞춤 메시지 생성
      const messageContent = this.template.generateCustomReminderMessage({
        ...reminderData,
        recipientName: recipient.name,
      });

      // 메시지 유효성 검증
      const validation = this.template.validateMessage(messageContent);
      if (!validation.isValid) {
        throw new Error(
          `메시지 유효성 검증 실패: ${validation.errors.join(", ")}`
        );
      }

      // 메시지 레코드 생성
      const messageId = await this.messageModel.create({
        type: "custom",
        title: `맞춤알림: ${reminderData.title}`,
        content: messageContent,
        scheduled_at: new Date(),
        recipient_count: 1,
        status: "pending",
      });

      console.log(
        `맞춤 알림 발송: ${recipient.name} (${recipient.phone_number})`
      );

      // 단일 수신자 발송
      const result = await this.gateway.sendSmsWithRetry(
        recipient.phone_number,
        messageContent
      );

      // 발송 로그 기록
      await this.messageLogModel.create({
        message_id: messageId,
        recipient_id: recipient.id,
        phone_number: recipient.phone_number,
        status: result.success ? "sent" : "failed",
        error_message: result.success ? null : result.error,
      });

      // 메시지 상태 업데이트
      await this.messageModel.update(messageId, {
        status: result.success ? "sent" : "failed",
        sent_at: new Date(),
        success_count: result.success ? 1 : 0,
      });

      return {
        success: result.success,
        messageId: messageId,
        recipient: recipient.name,
        error: result.error,
      };
    } catch (error) {
      console.error("맞춤 알림 발송 실패:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 보건/복지 알림 발송
   */
  async sendWelfareNotification(recipients, notificationData) {
    try {
      const messageContent =
        this.template.generateWelfareMessage(notificationData);

      const validation = this.template.validateMessage(messageContent);
      if (!validation.isValid) {
        throw new Error(
          `메시지 유효성 검증 실패: ${validation.errors.join(", ")}`
        );
      }

      const messageId = await this.messageModel.create({
        type: "welfare",
        title: notificationData.title || "보건복지 알림",
        content: messageContent,
        scheduled_at: notificationData.scheduledAt || new Date(),
        recipient_count: recipients.length,
        status: "pending",
      });

      console.log(`보건복지 알림 발송 시작: ${recipients.length}명`);

      const results = await this.sendToMultipleRecipients(
        recipients,
        messageContent,
        messageId,
        "welfare"
      );

      await this.updateMessageStatus(messageId, results);

      return {
        success: true,
        messageId: messageId,
        totalRecipients: recipients.length,
        successCount: results.successCount,
        failureCount: results.failureCount,
        results: results.details,
      };
    } catch (error) {
      console.error("보건복지 알림 발송 실패:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 다중 수신자에게 메시지 발송
   */
  async sendToMultipleRecipients(
    recipients,
    messageContent,
    messageId,
    messageType
  ) {
    const results = {
      successCount: 0,
      failureCount: 0,
      details: [],
    };

    const batchSize = 100;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchPromises = batch.map(async (recipient) => {
        try {
          const result = await this.gateway.sendSms(
            recipient.phone_number,
            messageContent
          );

          await this.messageLogModel.create({
            message_id: messageId,
            recipient_id: recipient.id,
            phone_number: recipient.phone_number,
            status: result.success ? "sent" : "failed",
            error_message: result.success ? null : result.error,
          });

          if (result.success) {
            results.successCount++;
          } else {
            results.failureCount++;
          }

          results.details.push({
            recipient: recipient.name,
            phone: recipient.phone_number,
            success: result.success,
            error: result.error,
          });
        } catch (error) {
          console.error(`발송 실패 - ${recipient.name}: ${error.message}`);

          await this.messageLogModel.create({
            message_id: messageId,
            recipient_id: recipient.id,
            phone_number: recipient.phone_number,
            status: "failed",
            error_message: error.message,
          });

          results.failureCount++;
          results.details.push({
            recipient: recipient.name,
            phone: recipient.phone_number,
            success: false,
            error: error.message,
          });
        }
      });

      await Promise.all(batchPromises);

      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * 재시도 로직이 포함된 다중 수신자 발송
   */
  async sendToMultipleRecipientsWithRetry(
    recipients,
    messageContent,
    messageId,
    messageType
  ) {
    const results = {
      successCount: 0,
      failureCount: 0,
      details: [],
    };

    const batchSize = 50;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchPromises = batch.map(async (recipient) => {
        try {
          const result = await this.gateway.sendSmsWithRetry(
            recipient.phone_number,
            messageContent
          );

          await this.messageLogModel.create({
            message_id: messageId,
            recipient_id: recipient.id,
            phone_number: recipient.phone_number,
            status: result.success ? "sent" : "failed",
            error_message: result.success ? null : result.error,
          });

          if (result.success) {
            results.successCount++;
          } else {
            results.failureCount++;
          }

          results.details.push({
            recipient: recipient.name,
            phone: recipient.phone_number,
            success: result.success,
            error: result.error,
            retryCount: result.retryCount || 0,
          });
        } catch (error) {
          console.error(`긴급 발송 실패 - ${recipient.name}: ${error.message}`);

          await this.messageLogModel.create({
            message_id: messageId,
            recipient_id: recipient.id,
            phone_number: recipient.phone_number,
            status: "failed",
            error_message: error.message,
          });

          results.failureCount++;
          results.details.push({
            recipient: recipient.name,
            phone: recipient.phone_number,
            success: false,
            error: error.message,
          });
        }
      });

      await Promise.all(batchPromises);

      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * 메시지 상태 업데이트
   */
  async updateMessageStatus(messageId, results) {
    try {
      const status =
        results.failureCount === 0
          ? "sent"
          : results.successCount === 0
          ? "failed"
          : "sent";

      await this.messageModel.update(messageId, {
        status: status,
        sent_at: new Date(),
        success_count: results.successCount,
      });
    } catch (error) {
      console.error("메시지 상태 업데이트 실패:", error);
    }
  }

  generateMessagePreview(type, data) {
    let message = "";

    switch (type) {
      case "daily":
        message = this.template.generateDailyWeatherMessage(
          data.weather,
          data.airQuality
        );
        break;
      case "emergency":
        message = this.template.generateEmergencyMessage(data.disaster);
        break;
      case "custom":
        message = this.template.generateCustomReminderMessage(data.reminder);
        break;
      case "welfare":
        message = this.template.generateWelfareMessage(data.notification);
        break;
      default:
        throw new Error("지원하지 않는 메시지 타입입니다.");
    }

    return this.template.generatePreview(message);
  }

  async checkGatewayConnection() {
    return await this.gateway.checkConnection();
  }
}

module.exports = SmsService;
