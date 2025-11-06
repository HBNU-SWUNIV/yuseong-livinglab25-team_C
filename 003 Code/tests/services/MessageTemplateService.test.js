const MessageTemplateService = require('../../src/services/MessageTemplateService');

describe('MessageTemplateService', () => {
  let templateService;

  beforeEach(() => {
    templateService = new MessageTemplateService();
  });

  describe('Constructor', () => {
    test('should initialize with correct SMS max length', () => {
      expect(templateService.SMS_MAX_LENGTH).toBe(90);
    });

    test('should have weather and air quality emojis defined', () => {
      expect(templateService.weatherEmojis).toBeDefined();
      expect(templateService.airQualityEmojis).toBeDefined();
      expect(templateService.weatherEmojis['맑음']).toBe('☀');
      expect(templateService.airQualityEmojis['좋음']).toBe('😊');
    });
  });

  describe('generateDailyWeatherMessage', () => {
    test('should generate daily weather message with complete data', () => {
      const weatherData = {
        location: '유성구',
        currentTemp: 15,
        minTemp: 8,
        maxTemp: 22,
        condition: '맑음',
        rainProbability: 10
      };

      const airQualityData = {
        pm10Grade: '좋음',
        pm25Grade: '보통'
      };

      const message = templateService.generateDailyWeatherMessage(weatherData, airQualityData);
      
      expect(message).toContain('안녕하세요!');
      expect(message).toContain('유성구');
      expect(message).toContain('맑음');
      expect(message).toContain('8~22도');
      expect(message).toContain('☀');
      expect(message).toContain('미세먼지 \'좋음\'');
      expect(message).toContain('유성구청 드림');
      expect(message.length).toBeLessThanOrEqual(90);
    });

    test('should handle missing weather data gracefully', () => {
      const message = templateService.generateDailyWeatherMessage(null, null);
      
      expect(message).toContain('안녕하세요!');
      expect(message).toContain('유성구청 드림');
      expect(message.length).toBeLessThanOrEqual(90);
    });
  });

  describe('generateEmergencyMessage', () => {
    test('should generate emergency message for heatwave', () => {
      const disasterData = {
        type: '폭염',
        severity: '주의보',
        maxTemp: 35,
        location: '유성구'
      };

      const message = templateService.generateEmergencyMessage(disasterData);
      
      expect(message).toContain('[폭염주의보]');
      expect(message).toContain('35도');
      expect(message).toContain('야외활동 자제');
      expect(message).toContain('💧');
      expect(message).toContain('유성구 안전재난과');
      expect(message.length).toBeLessThanOrEqual(90);
    });

    test('should generate emergency message for earthquake', () => {
      const disasterData = {
        type: '지진',
        magnitude: '4.2',
        location: '유성구'
      };

      const message = templateService.generateEmergencyMessage(disasterData);
      
      expect(message).toContain('[지진]');
      expect(message).toContain('진도 4.2');
      expect(message).toContain('안전한 곳으로 대피');
      expect(message).toContain('🚨');
      expect(message.length).toBeLessThanOrEqual(90);
    });

    test('should handle unknown disaster type', () => {
      const disasterData = {
        type: '알수없음',
        content: '긴급상황 발생'
      };

      const message = templateService.generateEmergencyMessage(disasterData);
      
      expect(message).toContain('[알수없음]');
      expect(message).toContain('긴급상황 발생');
      expect(message).toContain('유성구 안전재난과');
      expect(message.length).toBeLessThanOrEqual(90);
    });
  });

  describe('generateCustomReminderMessage', () => {
    test('should generate custom reminder with recipient name', () => {
      const reminderData = {
        recipientName: '김할머니',
        title: '복용약',
        message: '혈압약 복용 시간입니다',
        time: '오후 2시'
      };

      const message = templateService.generateCustomReminderMessage(reminderData);
      
      expect(message).toContain('김할머니님');
      expect(message).toContain('복용약 알림입니다');
      expect(message).toContain('혈압약 복용 시간입니다');
      expect(message).toContain('시간: 오후 2시');
      expect(message).toContain('유성구청 드림');
      expect(message.length).toBeLessThanOrEqual(90);
    });

    test('should generate reminder without recipient name', () => {
      const reminderData = {
        title: '병원방문',
        message: '내일 오전 10시 병원 예약'
      };

      const message = templateService.generateCustomReminderMessage(reminderData);
      
      expect(message).toContain('병원방문 알림입니다');
      expect(message).toContain('내일 오전 10시 병원 예약');
      expect(message).toContain('유성구청 드림');
      expect(message.length).toBeLessThanOrEqual(90);
    });
  });

  describe('validateMessage', () => {
    test('should validate message within length limit', () => {
      const message = '안녕하세요! 오늘 날씨는 맑습니다.';
      const result = templateService.validateMessage(message);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.length).toBe(message.length);
    });

    test('should warn about message exceeding length limit', () => {
      const longMessage = 'a'.repeat(100);
      const result = templateService.validateMessage(longMessage);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(expect.stringContaining('90자를 초과'));
      expect(result.length).toBe(100);
    });

    test('should invalidate empty message', () => {
      const result = templateService.validateMessage('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('메시지가 비어있습니다.');
    });

    test('should warn about problematic characters', () => {
      const messageWithSpecialChars = '안녕하세요! 🎉🎊✨';
      const result = templateService.validateMessage(messageWithSpecialChars);
      
      expect(result.warnings).toContain(expect.stringContaining('특수문자가 피처폰에서'));
    });
  });

  describe('truncateMessage', () => {
    test('should not truncate message within limit', () => {
      const message = '짧은 메시지입니다.';
      const result = templateService.truncateMessage(message, 90);
      
      expect(result).toBe(message);
    });

    test('should truncate long message and add ellipsis', () => {
      const longMessage = 'a'.repeat(100);
      const result = templateService.truncateMessage(longMessage, 90);
      
      expect(result.length).toBeLessThanOrEqual(90);
      expect(result).toContain('...');
    });

    test('should handle multiline messages correctly', () => {
      const multilineMessage = '첫 번째 줄입니다.\n두 번째 줄입니다.\n세 번째 줄입니다.\n네 번째 줄입니다.';
      const result = templateService.truncateMessage(multilineMessage, 50);
      
      expect(result.length).toBeLessThanOrEqual(50);
      expect(result.split('\n').length).toBeLessThan(multilineMessage.split('\n').length);
    });
  });

  describe('ensureFeaturePhoneCompatibility', () => {
    test('should replace complex emojis with simple ones', () => {
      const message = '날씨가 좋습니다 🌧️❄️⚠️';
      const result = templateService.ensureFeaturePhoneCompatibility(message);
      
      expect(result).toContain('🌧');
      expect(result).toContain('❄');
      expect(result).toContain('⚠');
      expect(result).not.toContain('🌧️');
      expect(result).not.toContain('❄️');
      expect(result).not.toContain('⚠️');
    });

    test('should replace problematic quotes and dashes', () => {
      const message = '안녕하세요 "좋은" 날씨입니다 – 맑음';
      const result = templateService.ensureFeaturePhoneCompatibility(message);
      
      expect(result).toContain('"좋은"');
      expect(result).toContain('- 맑음');
    });
  });

  describe('generatePreview', () => {
    test('should generate complete preview information', () => {
      const message = '안녕하세요! 오늘 날씨는 맑습니다.';
      const preview = templateService.generatePreview(message);
      
      expect(preview.message).toBe(message);
      expect(preview.length).toBe(message.length);
      expect(preview.maxLength).toBe(90);
      expect(preview.isValid).toBe(true);
      expect(preview.estimatedCost).toBeDefined();
      expect(preview.messageType).toBe('SMS');
    });

    test('should identify LMS type for long messages', () => {
      const longMessage = 'a'.repeat(85);
      const preview = templateService.generatePreview(longMessage);
      
      expect(preview.messageType).toBe('LMS');
      expect(preview.estimatedCost).toBe(30);
    });
  });
});