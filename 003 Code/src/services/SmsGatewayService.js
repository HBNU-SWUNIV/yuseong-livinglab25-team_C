/**
 * SMS 게이트웨이 연동 서비스
 * Naver Cloud Platform SMS API를 사용하여 문자 메시지를 발송합니다.
 */

const axios = require('axios');
const crypto = require('crypto');

class SmsGatewayService {
  constructor() {
    this.accessKey = process.env.NAVER_SMS_ACCESS_KEY;
    this.secretKey = process.env.NAVER_SMS_SECRET_KEY;
    this.serviceId = process.env.NAVER_SMS_SERVICE_ID;
    this.fromNumber = process.env.NAVER_SMS_FROM_NUMBER;
    this.baseUrl = `https://sens.apigw.ntruss.com/sms/v2/services/${this.serviceId}`;
    
    // 재시도 설정
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5초
  }

  /**
   * 인증 헤더 생성
   * @param {string} method HTTP 메서드
   * @param {string} url 요청 URL
   * @param {number} timestamp 타임스탬프
   * @returns {Object} 인증 헤더
   */
  generateAuthHeaders(method, url, timestamp) {
    const space = ' ';
    const newLine = '\n';
    
    const message = method + space + url + newLine + timestamp + newLine + this.accessKey;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('base64');

    return {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-apigw-timestamp': timestamp,
      'x-ncp-iam-access-key': this.accessKey,
      'x-ncp-apigw-signature-v2': signature
    };
  }

  /**
   * 단일 수신자에게 SMS 발송
   * @param {string} to 수신자 전화번호
   * @param {string} content 메시지 내용
   * @param {string} type 메시지 타입 ('SMS' 또는 'LMS')
   * @returns {Promise<Object>} 발송 결과
   */
  async sendSms(to, content, type = 'SMS') {
    const timestamp = Date.now().toString();
    const url = '/messages';
    
    const requestBody = {
      type: type,
      contentType: 'COMM',
      countryCode: '82',
      from: this.fromNumber,
      content: content,
      messages: [
        {
          to: to,
          content: content
        }
      ]
    };

    const headers = this.generateAuthHeaders('POST', url, timestamp);

    try {
      const response = await axios.post(`${this.baseUrl}${url}`, requestBody, { headers });
      
      return {
        success: true,
        messageId: response.data.requestId,
        statusCode: response.data.statusCode,
        statusName: response.data.statusName,
        data: response.data
      };
    } catch (error) {
      console.error('SMS 발송 실패:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message,
        statusCode: error.response?.status,
        data: error.response?.data
      };
    }
  }

  /**
   * 다중 수신자에게 SMS 발송
   * @param {Array} recipients 수신자 목록 [{to: '전화번호', content: '내용'}]
   * @param {string} defaultContent 기본 메시지 내용
   * @param {string} type 메시지 타입
   * @returns {Promise<Object>} 발송 결과
   */
  async sendBulkSms(recipients, defaultContent, type = 'SMS') {
    const timestamp = Date.now().toString();
    const url = '/messages';
    
    const messages = recipients.map(recipient => ({
      to: recipient.to,
      content: recipient.content || defaultContent
    }));

    const requestBody = {
      type: type,
      contentType: 'COMM',
      countryCode: '82',
      from: this.fromNumber,
      content: defaultContent,
      messages: messages
    };

    const headers = this.generateAuthHeaders('POST', url, timestamp);

    try {
      const response = await axios.post(`${this.baseUrl}${url}`, requestBody, { headers });
      
      return {
        success: true,
        messageId: response.data.requestId,
        statusCode: response.data.statusCode,
        statusName: response.data.statusName,
        totalCount: messages.length,
        data: response.data
      };
    } catch (error) {
      console.error('대량 SMS 발송 실패:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message,
        statusCode: error.response?.status,
        totalCount: messages.length,
        data: error.response?.data
      };
    }
  }

  /**
   * 재시도 로직이 포함된 SMS 발송
   * @param {string} to 수신자 전화번호
   * @param {string} content 메시지 내용
   * @param {string} type 메시지 타입
   * @param {number} retryCount 현재 재시도 횟수
   * @returns {Promise<Object>} 발송 결과
   */
  async sendSmsWithRetry(to, content, type = 'SMS', retryCount = 0) {
    try {
      const result = await this.sendSms(to, content, type);
      
      if (result.success) {
        return result;
      }
      
      // 재시도 가능한 오류인지 확인
      if (this.isRetryableError(result) && retryCount < this.maxRetries) {
        console.log(`SMS 발송 재시도 ${retryCount + 1}/${this.maxRetries}: ${to}`);
        
        // 재시도 전 대기
        await this.delay(this.retryDelay);
        
        return await this.sendSmsWithRetry(to, content, type, retryCount + 1);
      }
      
      return result;
    } catch (error) {
      console.error('SMS 발송 중 예외 발생:', error);
      
      return {
        success: false,
        error: error.message,
        retryCount: retryCount
      };
    }
  }

  /**
   * 재시도 가능한 오류인지 확인
   * @param {Object} result 발송 결과
   * @returns {boolean} 재시도 가능 여부
   */
  isRetryableError(result) {
    // 네트워크 오류, 서버 오류 등은 재시도 가능
    const retryableStatusCodes = [500, 502, 503, 504, 408, 429];
    return retryableStatusCodes.includes(result.statusCode);
  }

  /**
   * 지연 함수
   * @param {number} ms 지연 시간 (밀리초)
   * @returns {Promise} 지연 Promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 발송 상태 조회
   * @param {string} requestId 요청 ID
   * @returns {Promise<Object>} 발송 상태
   */
  async getMessageStatus(requestId) {
    const timestamp = Date.now().toString();
    const url = `/status/messages?requestId=${requestId}`;
    
    const headers = this.generateAuthHeaders('GET', url, timestamp);

    try {
      const response = await axios.get(`${this.baseUrl}${url}`, { headers });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('발송 상태 조회 실패:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  /**
   * 서비스 연결 상태 확인
   * @returns {Promise<boolean>} 연결 상태
   */
  async checkConnection() {
    try {
      // 테스트용 빈 요청으로 연결 상태 확인
      const timestamp = Date.now().toString();
      const url = '/messages';
      const headers = this.generateAuthHeaders('POST', url, timestamp);
      
      // 실제로는 발송하지 않고 헤더만 확인
      const testBody = {
        type: 'SMS',
        contentType: 'COMM',
        countryCode: '82',
        from: this.fromNumber,
        content: 'test',
        messages: []
      };
      
      await axios.post(`${this.baseUrl}${url}`, testBody, { headers });
      return true;
    } catch (error) {
      // 인증 오류가 아닌 경우는 연결은 되는 것으로 판단
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('SMS 게이트웨이 인증 실패');
        return false;
      }
      return true;
    }
  }
}

module.exports = SmsGatewayService;