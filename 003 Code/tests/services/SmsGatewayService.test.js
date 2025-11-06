const SmsGatewayService = require('../../src/services/SmsGatewayService');
const axios = require('axios');

// axios 모킹
jest.mock('axios');
const mockedAxios = axios;

describe('SmsGatewayService', () => {
  let smsGateway;
  
  beforeEach(() => {
    // 환경변수 모킹
    process.env.NAVER_SMS_ACCESS_KEY = 'test-access-key';
    process.env.NAVER_SMS_SECRET_KEY = 'test-secret-key';
    process.env.NAVER_SMS_SERVICE_ID = 'test-service-id';
    process.env.NAVER_SMS_FROM_NUMBER = '01012345678';
    
    smsGateway = new SmsGatewayService();
    
    // axios 모킹 초기화
    mockedAxios.post.mockClear();
    mockedAxios.get.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with environment variables', () => {
      expect(smsGateway.accessKey).toBe('test-access-key');
      expect(smsGateway.secretKey).toBe('test-secret-key');
      expect(smsGateway.serviceId).toBe('test-service-id');
      expect(smsGateway.fromNumber).toBe('01012345678');
      expect(smsGateway.maxRetries).toBe(3);
      expect(smsGateway.retryDelay).toBe(5000);
    });

    test('should set correct base URL', () => {
      expect(smsGateway.baseUrl).toBe('https://sens.apigw.ntruss.com/sms/v2/services/test-service-id');
    });
  });

  describe('generateAuthHeaders', () => {
    test('should generate correct authentication headers', () => {
      const method = 'POST';
      const url = '/messages';
      const timestamp = '1640995200000';
      
      const headers = smsGateway.generateAuthHeaders(method, url, timestamp);
      
      expect(headers['Content-Type']).toBe('application/json; charset=utf-8');
      expect(headers['x-ncp-apigw-timestamp']).toBe(timestamp);
      expect(headers['x-ncp-iam-access-key']).toBe('test-access-key');
      expect(headers['x-ncp-apigw-signature-v2']).toBeDefined();
    });
  });  des
cribe('sendSms', () => {
    test('should send SMS successfully', async () => {
      const mockResponse = {
        data: {
          requestId: 'test-request-id',
          statusCode: '202',
          statusName: 'success'
        }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);
      
      const result = await smsGateway.sendSms('01087654321', '테스트 메시지');
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-request-id');
      expect(result.statusCode).toBe('202');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          type: 'SMS',
          from: '01012345678',
          content: '테스트 메시지',
          messages: [{ to: '01087654321', content: '테스트 메시지' }]
        }),
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });

    test('should handle SMS sending failure', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            errorMessage: '잘못된 요청'
          }
        }
      };
      
      mockedAxios.post.mockRejectedValue(mockError);
      
      const result = await smsGateway.sendSms('01087654321', '테스트 메시지');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('잘못된 요청');
      expect(result.statusCode).toBe(400);
    });

    test('should send LMS when type is specified', async () => {
      const mockResponse = {
        data: {
          requestId: 'test-request-id',
          statusCode: '202',
          statusName: 'success'
        }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);
      
      await smsGateway.sendSms('01087654321', '긴 메시지 내용', 'LMS');
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type: 'LMS' }),
        expect.anything()
      );
    });
  });

  describe('sendBulkSms', () => {
    test('should send bulk SMS successfully', async () => {
      const recipients = [
        { to: '01011111111', content: '개별 메시지 1' },
        { to: '01022222222', content: '개별 메시지 2' }
      ];
      
      const mockResponse = {
        data: {
          requestId: 'bulk-request-id',
          statusCode: '202',
          statusName: 'success'
        }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);
      
      const result = await smsGateway.sendBulkSms(recipients, '기본 메시지');
      
      expect(result.success).toBe(true);
      expect(result.totalCount).toBe(2);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          messages: recipients
        }),
        expect.anything()
      );
    });
  });  d
escribe('sendSmsWithRetry', () => {
    test('should succeed on first attempt', async () => {
      const mockResponse = {
        data: {
          requestId: 'test-request-id',
          statusCode: '202',
          statusName: 'success'
        }
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);
      
      const result = await smsGateway.sendSmsWithRetry('01087654321', '테스트 메시지');
      
      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    test('should retry on retryable error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { errorMessage: '서버 오류' }
        }
      };
      
      const mockSuccess = {
        data: {
          requestId: 'retry-success-id',
          statusCode: '202',
          statusName: 'success'
        }
      };
      
      mockedAxios.post
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccess);
      
      // delay 함수 모킹
      jest.spyOn(smsGateway, 'delay').mockResolvedValue();
      
      const result = await smsGateway.sendSmsWithRetry('01087654321', '테스트 메시지');
      
      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(smsGateway.delay).toHaveBeenCalledWith(5000);
    });

    test('should not retry on non-retryable error', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { errorMessage: '잘못된 요청' }
        }
      };
      
      mockedAxios.post.mockRejectedValue(mockError);
      
      const result = await smsGateway.sendSmsWithRetry('01087654321', '테스트 메시지');
      
      expect(result.success).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRetryableError', () => {
    test('should identify retryable status codes', () => {
      expect(smsGateway.isRetryableError({ statusCode: 500 })).toBe(true);
      expect(smsGateway.isRetryableError({ statusCode: 502 })).toBe(true);
      expect(smsGateway.isRetryableError({ statusCode: 503 })).toBe(true);
      expect(smsGateway.isRetryableError({ statusCode: 429 })).toBe(true);
    });

    test('should identify non-retryable status codes', () => {
      expect(smsGateway.isRetryableError({ statusCode: 400 })).toBe(false);
      expect(smsGateway.isRetryableError({ statusCode: 401 })).toBe(false);
      expect(smsGateway.isRetryableError({ statusCode: 404 })).toBe(false);
    });
  });

  describe('getMessageStatus', () => {
    test('should get message status successfully', async () => {
      const mockResponse = {
        data: {
          requestId: 'test-request-id',
          messages: [
            { messageId: 'msg-1', status: 'COMPLETED' }
          ]
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);
      
      const result = await smsGateway.getMessageStatus('test-request-id');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('status/messages?requestId=test-request-id'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });
  });

  describe('delay', () => {
    test('should delay for specified time', async () => {
      const start = Date.now();
      await smsGateway.delay(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });
});