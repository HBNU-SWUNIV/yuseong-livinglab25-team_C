/**
 * 메시지 템플릿 서비스
 * SMS 메시지 포맷팅 및 템플릿 관리를 담당합니다.
 */

class MessageTemplateService {
  constructor() {
    // SMS 최대 길이 (피처폰 호환성을 위해 90자로 제한)
    this.SMS_MAX_LENGTH = 90;
    
    // 이모지 및 특수문자 매핑
    this.weatherEmojis = {
      '맑음': '☀',
      '구름많음': '⛅',
      '흐림': '☁',
      '비': '🌧',
      '눈': '❄',
      '소나기': '🌦'
    };
    
    this.airQualityEmojis = {
      '좋음': '😊',
      '보통': '😐',
      '나쁨': '😷',
      '매우나쁨': '🚨'
    };
  }

  /**
   * 일일 날씨 메시지 생성
   * @param {Object} weatherData 날씨 데이터
   * @param {Object} airQualityData 미세먼지 데이터
   * @returns {string} 포맷된 메시지
   */
  generateDailyWeatherMessage(weatherData, airQualityData) {
    try {
      const weather = weatherData || {};
      const airQuality = airQualityData || {};
      
      // 기본 날씨 정보
      const location = weather.location || '유성구';
      const currentTemp = weather.currentTemp || '정보없음';
      const minTemp = weather.minTemp || '';
      const maxTemp = weather.maxTemp || '';
      const condition = weather.condition || '정보없음';
      const rainProbability = weather.rainProbability || '';
      
      // 미세먼지 정보
      const pm10Grade = airQuality.pm10Grade || '정보없음';
      const pm25Grade = airQuality.pm25Grade || '';
      
      // 온도 범위 문자열 생성
      let tempRange = '';
      if (minTemp && maxTemp) {
        tempRange = `${minTemp}~${maxTemp}도`;
      } else if (currentTemp !== '정보없음') {
        tempRange = `${currentTemp}도`;
      }
      
      // 날씨 이모지
      const weatherEmoji = this.weatherEmojis[condition] || '';
      
      // 미세먼지 이모지 (PM10 기준)
      const airEmoji = this.airQualityEmojis[pm10Grade] || '';
      
      // 강수확률 문자열
      let rainInfo = '';
      if (rainProbability && rainProbability > 0) {
        rainInfo = `, 강수${rainProbability}%`;
      }
      
      // 메시지 조합
      let message = `안녕하세요! 오늘 ${location} 날씨는 ${condition}`;
      
      if (tempRange) {
        message += ` ${tempRange}`;
      }
      
      if (weatherEmoji) {
        message += weatherEmoji;
      }
      
      if (rainInfo) {
        message += rainInfo;
      }
      
      // 미세먼지 정보 추가
      if (pm10Grade !== '정보없음') {
        message += `\n미세먼지 '${pm10Grade}'`;
        
        if (pm25Grade && pm25Grade !== pm10Grade) {
          message += `, 초미세먼지 '${pm25Grade}'`;
        }
        
        if (airEmoji) {
          message += airEmoji;
        }
        
        // 미세먼지 주의사항
        if (pm10Grade === '나쁨' || pm10Grade === '매우나쁨') {
          message += ', 외출시 마스크 착용하세요';
        }
      }
      
      message += '\n유성구청 드림';
      
      // 90자 제한 확인 및 조정
      return this.truncateMessage(message, this.SMS_MAX_LENGTH);
      
    } catch (error) {
      console.error('일일 날씨 메시지 생성 실패:', error);
      return this.generateErrorMessage('날씨 정보를 가져올 수 없습니다.');
    }
  }

  /**
   * 긴급 알림 메시지 생성
   * @param {Object} disasterData 재난 데이터
   * @returns {string} 포맷된 긴급 메시지
   */
  generateEmergencyMessage(disasterData) {
    try {
      const disaster = disasterData || {};
      const type = disaster.type || '긴급상황';
      const content = disaster.content || '';
      const location = disaster.location || '유성구';
      const severity = disaster.severity || '';
      
      let message = `[${type}`;
      
      if (severity) {
        message += `${severity}`;
      }
      
      message += `] `;
      
      // 재난 유형별 맞춤 메시지
      switch (type) {
        case '폭염':
          message += `오늘 낮 최고 ${disaster.maxTemp || '35'}도 예상!\n`;
          message += '야외활동 자제, 물 자주 마시세요💧';
          break;
          
        case '한파':
          message += `오늘 최저 ${disaster.minTemp || '-10'}도 예상!\n`;
          message += '외출시 보온에 주의하세요🧥';
          break;
          
        case '지진':
          message += `${location}에서 진도 ${disaster.magnitude || ''}의 지진 발생!\n`;
          message += '안전한 곳으로 대피하세요🚨';
          break;
          
        case '호우':
          message += `${location}에 호우경보 발령!\n`;
          message += '저지대, 하천 접근 금지⚠️';
          break;
          
        case '대설':
          message += `${location}에 대설경보 발령!\n`;
          message += '외출 자제, 교통 주의❄️';
          break;
          
        default:
          if (content) {
            message += content;
          } else {
            message += '긴급상황이 발생했습니다. 안전에 주의하세요!';
          }
      }
      
      message += `\n유성구 안전재난과`;
      
      // 90자 제한 확인 및 조정
      return this.truncateMessage(message, this.SMS_MAX_LENGTH);
      
    } catch (error) {
      console.error('긴급 알림 메시지 생성 실패:', error);
      return this.generateErrorMessage('긴급 상황이 발생했습니다.');
    }
  }

  /**
   * 맞춤 알림 메시지 생성
   * @param {Object} reminderData 알림 데이터
   * @returns {string} 포맷된 알림 메시지
   */
  generateCustomReminderMessage(reminderData) {
    try {
      const reminder = reminderData || {};
      const recipientName = reminder.recipientName || '';
      const title = reminder.title || '알림';
      const content = reminder.message || '';
      const time = reminder.time || '';
      
      let message = '';
      
      if (recipientName) {
        message += `${recipientName}님, `;
      }
      
      message += `${title} 알림입니다.\n`;
      
      if (content) {
        message += content;
      }
      
      if (time) {
        message += `\n시간: ${time}`;
      }
      
      message += '\n유성구청 드림';
      
      // 90자 제한 확인 및 조정
      return this.truncateMessage(message, this.SMS_MAX_LENGTH);
      
    } catch (error) {
      console.error('맞춤 알림 메시지 생성 실패:', error);
      return this.generateErrorMessage('알림을 확인해주세요.');
    }
  }

  /**
   * 보건/복지 알림 메시지 생성
   * @param {Object} notificationData 알림 데이터
   * @returns {string} 포맷된 메시지
   */
  generateWelfareMessage(notificationData) {
    try {
      const notification = notificationData || {};
      const title = notification.title || '공지사항';
      const content = notification.content || '';
      const deadline = notification.deadline || '';
      const contact = notification.contact || '';
      
      let message = `[${title}]\n`;
      
      if (content) {
        message += content;
      }
      
      if (deadline) {
        message += `\n마감: ${deadline}`;
      }
      
      if (contact) {
        message += `\n문의: ${contact}`;
      } else {
        message += '\n유성구 보건소';
      }
      
      // 90자 제한 확인 및 조정
      return this.truncateMessage(message, this.SMS_MAX_LENGTH);
      
    } catch (error) {
      console.error('보건/복지 메시지 생성 실패:', error);
      return this.generateErrorMessage('공지사항을 확인해주세요.');
    }
  }

  /**
   * 오류 메시지 생성
   * @param {string} errorText 오류 내용
   * @returns {string} 오류 메시지
   */
  generateErrorMessage(errorText) {
    const message = `${errorText}\n서비스 일시 중단 중입니다.\n유성구청 드림`;
    return this.truncateMessage(message, this.SMS_MAX_LENGTH);
  }

  /**
   * 메시지 길이 제한 및 자르기
   * @param {string} message 원본 메시지
   * @param {number} maxLength 최대 길이
   * @returns {string} 잘린 메시지
   */
  truncateMessage(message, maxLength) {
    if (!message) return '';
    
    // 피처폰 호환성을 위해 특수문자 확인
    const cleanMessage = this.ensureFeaturePhoneCompatibility(message);
    
    if (cleanMessage.length <= maxLength) {
      return cleanMessage;
    }
    
    // 90자를 초과하는 경우 줄바꿈 기준으로 자르기
    const lines = cleanMessage.split('\n');
    let result = '';
    
    for (const line of lines) {
      if ((result + line + '\n').length <= maxLength - 3) { // '...' 여유분
        result += line + '\n';
      } else {
        break;
      }
    }
    
    // 마지막 줄바꿈 제거 후 '...' 추가
    result = result.trim();
    if (result.length < cleanMessage.length) {
      result += '...';
    }
    
    return result;
  }

  /**
   * 피처폰 호환성 확인 및 조정
   * @param {string} message 메시지
   * @returns {string} 호환성 조정된 메시지
   */
  ensureFeaturePhoneCompatibility(message) {
    if (!message) return '';
    
    // 피처폰에서 지원하지 않는 이모지나 특수문자를 대체
    let compatibleMessage = message
      // 복잡한 이모지를 간단한 문자로 대체
      .replace(/🌧️/g, '🌧')
      .replace(/❄️/g, '❄')
      .replace(/⚠️/g, '⚠')
      .replace(/💧/g, '💧')
      .replace(/🧥/g, '')
      .replace(/🚨/g, '!')
      // 일부 피처폰에서 문제가 될 수 있는 문자 처리
      .replace(/'/g, "'")
      .replace(/"/g, '"')
      .replace(/–/g, '-')
      .replace(/—/g, '-');
    
    return compatibleMessage;
  }

  /**
   * 메시지 유효성 검증
   * @param {string} message 메시지
   * @returns {Object} 검증 결과
   */
  validateMessage(message) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      length: 0
    };
    
    if (!message) {
      result.isValid = false;
      result.errors.push('메시지가 비어있습니다.');
      return result;
    }
    
    result.length = message.length;
    
    // 길이 검증
    if (message.length > this.SMS_MAX_LENGTH) {
      result.warnings.push(`메시지가 ${this.SMS_MAX_LENGTH}자를 초과합니다. (현재: ${message.length}자)`);
    }
    
    // 특수문자 검증
    const problematicChars = message.match(/[^\x00-\x7F\uAC00-\uD7AF\u3131-\u318E\u1100-\u11FF]/g);
    if (problematicChars) {
      result.warnings.push('일부 특수문자가 피처폰에서 제대로 표시되지 않을 수 있습니다.');
    }
    
    return result;
  }

  /**
   * 메시지 미리보기 생성
   * @param {string} message 메시지
   * @returns {Object} 미리보기 정보
   */
  generatePreview(message) {
    const validation = this.validateMessage(message);
    
    return {
      message: message,
      length: validation.length,
      maxLength: this.SMS_MAX_LENGTH,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      estimatedCost: this.calculateEstimatedCost(message),
      messageType: message.length > 80 ? 'LMS' : 'SMS'
    };
  }

  /**
   * 예상 발송 비용 계산 (참고용)
   * @param {string} message 메시지
   * @returns {number} 예상 비용 (원)
   */
  calculateEstimatedCost(message) {
    // SMS: 20원, LMS: 30원 (예시 요금)
    const smsRate = 20;
    const lmsRate = 30;
    
    return message.length > 80 ? lmsRate : smsRate;
  }
}

module.exports = MessageTemplateService;