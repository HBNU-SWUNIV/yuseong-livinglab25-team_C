const axios = require("axios");
const logger = require("../utils/logger");

/**
 * SMS 게이트웨이 서비스 (Mock 지원)
 * 실제 API 키가 없으면 콘솔에 로그만 찍고 성공으로 처리합니다.
 */
class SmsGatewayService {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.apiSecret = process.env.SMS_API_SECRET;
    this.senderNumber = process.env.SMS_SENDER_NUMBER || "042-000-0000";
  }

  /**
   * SMS 발송 (단건)
   */
  async sendSms(to, content) {
    try {
      // 1. API 키가 없거나 개발 환경이면 "가짜 발송(Mock)" 수행
      if (!this.apiKey || process.env.NODE_ENV !== "production") {
        logger.info(
          `[MOCK SMS] To: ${to} | Content: "${content}" (발송 성공 처리됨)`
        );

        // 0.1초 딜레이 (리얼함을 위해)
        await new Promise((resolve) => setTimeout(resolve, 100));

        return {
          success: true,
          messageId: `mock_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          status: "delivered",
        };
      }

      // 2. 실제 발송 로직 (나중에 API 키 넣으면 작동)
      // const response = await axios.post(...)
      // return { success: true ... }
    } catch (error) {
      logger.error(`SMS 발송 실패 (To: ${to}):`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 재시도 로직 포함 발송
   */
  async sendSmsWithRetry(to, content, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      const result = await this.sendSms(to, content);
      if (result.success) return result;

      logger.warn(`SMS 발송 재시도 (${i + 1}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return { success: false, error: "Max retries exceeded" };
  }

  async checkConnection() {
    return true; // 무조건 연결 성공으로 간주
  }
}

module.exports = SmsGatewayService;
