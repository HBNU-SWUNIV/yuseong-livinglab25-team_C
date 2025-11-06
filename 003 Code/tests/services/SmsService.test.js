const SmsService = require('../../src/services/SmsService');
const SmsGatewayService = require('../../src/services/SmsGatewayService');
const MessageTemplateService = require('../../src/services/MessageTemplateService');
const Message = require('../../src/models/Message');
const MessageLog = require('../../src/models/MessageLog');

// 의존성 모킹
jest.mock('../../src/services/SmsGatewayService');
jest.mock('../../src/services/MessageTemplateService');
jest.mock('../../src/models/Message');
jest.mock('../../src/models/MessageLog');

describe('SmsService', () => {
  let smsService;
  let mockGateway;
  let mockTemplate;

  beforeEach(() => {
    // 모킹된 인스턴스 생성
    mockGateway = {
      sendSms: jest.fn(),
      sendSmsWithRetry: jest.fn(),
      checkConnection: jest.fn()
    };
    
    mockTemplate = {
      generateDailyWeatherMessage: jest.fn(),
      generateEmergencyMessage: jest.fn(),
      generateCustomReminderMessage: jest.fn(),
      generateWelfareMessage: jest.fn(),
      validateMessage: jest.fn(),
      generatePreview: jest.fn()
    };

    SmsGatewayService.mockImplementation(() => mockGateway);
    MessageTemplateService.mockImplementation(() => mockTemplate);

    smsService = new SmsService();

    // 모델 모킹
    Message.create = jest.fn();
    Message.update = jest.fn();
    MessageLog.create = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize gateway and template services', () => {
      expect(SmsGatewayService).toHaveBeenCalled();
      expect(MessageTemplateService).toHaveBeenCalled();
      expect(smsService.gateway).toBe(mockGateway);
      expect(smsService.template).toBe(mockTemplate);
    });
  });  
describe('sendDailyWeatherMessage', () => {
    test('should send daily weather message successfully', async () => {
      const recipients = [
        { id: 1, name: '김할머니', phone_number: '01011111111' },
        { id: 2, name: '이할아버지', phone_number: '01022222222' }
      ];
      
      const weatherData = { temperature: 20, condition: '맑음' };
      const airQualityData = { pm10Grade: '좋음' };
      
      // 모킹 설정
      mockTemplate.generateDailyWeatherMessage.mockReturnValue('오늘 날씨는 맑습니다.');
      mockTemplate.validateMessage.mockReturnValue({ isValid: true, errors: [] });
      Message.create.mockResolvedValue({ id: 1 });
      mockGateway.sendSms.mockResolvedValue({ success: true });
      
      const result = await smsService.sendDailyWeatherMessage(recipients, weatherData, airQualityData);
      
      expect(result.success).toBe(true);
      expect(result.totalRecipients).toBe(2);
      expect(mockTemplate.generateDailyWeatherMessage).toHaveBeenCalledWith(weatherData, airQualityData);
      expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'daily',
        title: '일일 날씨 알림'
      }));
    });

    test('should handle message validation failure', async () => {
      const recipients = [{ id: 1, name: '김할머니', phone_number: '01011111111' }];
      
      mockTemplate.generateDailyWeatherMessage.mockReturnValue('잘못된 메시지');
      mockTemplate.validateMessage.mockReturnValue({ 
        isValid: false, 
        errors: ['메시지가 너무 깁니다'] 
      });
      
      const result = await smsService.sendDailyWeatherMessage(recipients, {}, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('메시지 유효성 검증 실패');
    });
  });

  describe('sendEmergencyAlert', () => {
    test('should send emergency alert with retry logic', async () => {
      const recipients = [
        { id: 1, name: '김할머니', phone_number: '01011111111' }
      ];
      
      const disasterData = { type: '폭염', severity: '경보' };
      
      // 모킹 설정
      mockTemplate.generateEmergencyMessage.mockReturnValue('[폭염경보] 긴급상황입니다.');
      mockTemplate.validateMessage.mockReturnValue({ isValid: true, errors: [] });
      Message.create.mockResolvedValue({ id: 2 });
      mockGateway.sendSmsWithRetry.mockResolvedValue({ success: true });
      
      const result = await smsService.sendEmergencyAlert(recipients, disasterData);
      
      expect(result.success).toBe(true);
      expect(mockTemplate.generateEmergencyMessage).toHaveBeenCalledWith(disasterData);
      expect(mockGateway.sendSmsWithRetry).toHaveBeenCalled();
      expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'emergency',
        title: '긴급알림: 폭염'
      }));
    });
  });

  describe('sendCustomReminder', () => {
    test('should send custom reminder to single recipient', async () => {
      const recipient = { id: 1, name: '김할머니', phone_number: '01011111111' };
      const reminderData = { title: '복용약', message: '혈압약 복용 시간입니다' };
      
      // 모킹 설정
      mockTemplate.generateCustomReminderMessage.mockReturnValue('김할머니님, 복용약 알림입니다.');
      mockTemplate.validateMessage.mockReturnValue({ isValid: true, errors: [] });
      Message.create.mockResolvedValue({ id: 3 });
      mockGateway.sendSmsWithRetry.mockResolvedValue({ success: true });
      
      const result = await smsService.sendCustomReminder(recipient, reminderData);
      
      expect(result.success).toBe(true);
      expect(result.recipient).toBe('김할머니');
      expect(mockTemplate.generateCustomReminderMessage).toHaveBeenCalledWith({
        ...reminderData,
        recipientName: '김할머니'
      });
      expect(MessageLog.create).toHaveBeenCalledWith(expect.objectContaining({
        recipient_id: 1,
        phone_number: '01011111111',
        status: 'sent'
      }));
    });

    test('should handle custom reminder sending failure', async () => {
      const recipient = { id: 1, name: '김할머니', phone_number: '01011111111' };
      const reminderData = { title: '복용약', message: '혈압약 복용 시간입니다' };
      
      mockTemplate.generateCustomReminderMessage.mockReturnValue('알림 메시지');
      mockTemplate.validateMessage.mockReturnValue({ isValid: true, errors: [] });
      Message.create.mockResolvedValue({ id: 3 });
      mockGateway.sendSmsWithRetry.mockResolvedValue({ 
        success: false, 
        error: '발송 실패' 
      });
      
      const result = await smsService.sendCustomReminder(recipient, reminderData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('발송 실패');
      expect(MessageLog.create).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed',
        error_message: '발송 실패'
      }));
    });
  });  
describe('generateMessagePreview', () => {
    test('should generate preview for daily weather message', () => {
      const mockPreview = {
        message: '오늘 날씨는 맑습니다.',
        length: 12,
        isValid: true,
        messageType: 'SMS'
      };
      
      mockTemplate.generateDailyWeatherMessage.mockReturnValue('오늘 날씨는 맑습니다.');
      mockTemplate.generatePreview.mockReturnValue(mockPreview);
      
      const result = smsService.generateMessagePreview('daily', {
        weather: { condition: '맑음' },
        airQuality: { pm10Grade: '좋음' }
      });
      
      expect(result).toEqual(mockPreview);
      expect(mockTemplate.generateDailyWeatherMessage).toHaveBeenCalled();
      expect(mockTemplate.generatePreview).toHaveBeenCalledWith('오늘 날씨는 맑습니다.');
    });

    test('should generate preview for emergency message', () => {
      mockTemplate.generateEmergencyMessage.mockReturnValue('[폭염경보] 긴급상황입니다.');
      mockTemplate.generatePreview.mockReturnValue({
        message: '[폭염경보] 긴급상황입니다.',
        length: 15,
        isValid: true,
        messageType: 'SMS'
      });
      
      const result = smsService.generateMessagePreview('emergency', {
        disaster: { type: '폭염' }
      });
      
      expect(mockTemplate.generateEmergencyMessage).toHaveBeenCalledWith({ type: '폭염' });
    });

    test('should throw error for unsupported message type', () => {
      expect(() => {
        smsService.generateMessagePreview('unknown', {});
      }).toThrow('지원하지 않는 메시지 타입입니다.');
    });
  });

  describe('checkGatewayConnection', () => {
    test('should check gateway connection', async () => {
      mockGateway.checkConnection.mockResolvedValue(true);
      
      const result = await smsService.checkGatewayConnection();
      
      expect(result).toBe(true);
      expect(mockGateway.checkConnection).toHaveBeenCalled();
    });
  });

  describe('sendToMultipleRecipients', () => {
    test('should handle batch processing correctly', async () => {
      const recipients = Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        name: `사용자${i + 1}`,
        phone_number: `0101111${String(i + 1).padStart(4, '0')}`
      }));
      
      mockGateway.sendSms.mockResolvedValue({ success: true });
      
      // sendToMultipleRecipients는 private 메서드이므로 직접 테스트하기 어려움
      // 대신 public 메서드를 통해 간접적으로 테스트
      mockTemplate.generateDailyWeatherMessage.mockReturnValue('테스트 메시지');
      mockTemplate.validateMessage.mockReturnValue({ isValid: true, errors: [] });
      Message.create.mockResolvedValue({ id: 1 });
      
      const result = await smsService.sendDailyWeatherMessage(recipients, {}, {});
      
      expect(result.success).toBe(true);
      expect(result.totalRecipients).toBe(150);
      // 배치 처리로 인해 여러 번 호출되어야 함
      expect(mockGateway.sendSms).toHaveBeenCalledTimes(150);
    });
  });
});