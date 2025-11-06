/**
 * 데이터베이스 연결 없이 모델 유효성 검증 로직만 테스트
 * Model validation logic tests without database connection
 */

const { Recipient, Message, CustomReminder, PublicDataCache } = require('../../src/models');

describe('모델 유효성 검증 테스트 (데이터베이스 연결 없음)', () => {
  
  describe('Recipient 유효성 검증', () => {
    test('유효한 수신자 데이터는 검증을 통과해야 함', () => {
      const validData = {
        name: '홍길동',
        phone_number: '01012345678',
        address: '대전시 유성구',
        birth_date: '1950-01-01'
      };

      const errors = Recipient.validateRecipientData(validData);
      expect(errors).toHaveLength(0);
    });

    test('필수 필드가 없으면 검증 실패', () => {
      const invalidData = {};
      const errors = Recipient.validateRecipientData(invalidData);
      
      expect(errors).toContain('이름은 필수 입력 항목입니다.');
      expect(errors).toContain('전화번호는 필수 입력 항목입니다.');
    });

    test('잘못된 전화번호 형식은 검증 실패', () => {
      const invalidData = {
        name: '홍길동',
        phone_number: '123456789'
      };
      
      const errors = Recipient.validateRecipientData(invalidData);
      expect(errors).toContain('올바른 전화번호 형식이 아닙니다.');
    });

    test('전화번호 정규화가 올바르게 작동해야 함', () => {
      const phoneWithHyphens = '010-1234-5678';
      const normalized = Recipient.normalizePhoneNumber(phoneWithHyphens);
      expect(normalized).toBe('01012345678');
    });
  });

  describe('Message 유효성 검증', () => {
    test('유효한 메시지 데이터는 검증을 통과해야 함', () => {
      const validData = {
        type: 'daily',
        title: '테스트 메시지',
        content: '오늘 날씨는 맑습니다.',
        created_by: 'admin'
      };

      const errors = Message.validateMessageData(validData);
      expect(errors).toHaveLength(0);
    });

    test('필수 필드가 없으면 검증 실패', () => {
      const invalidData = {};
      const errors = Message.validateMessageData(invalidData);
      
      expect(errors).toContain('메시지 유형은 필수 입력 항목입니다.');
      expect(errors).toContain('메시지 내용은 필수 입력 항목입니다.');
    });

    test('90자를 초과하는 메시지는 검증 실패', () => {
      const longContent = 'a'.repeat(91);
      const invalidData = {
        type: 'daily',
        content: longContent
      };
      
      const errors = Message.validateMessageData(invalidData);
      expect(errors).toContain('메시지 내용은 90자를 초과할 수 없습니다.');
    });

    test('잘못된 메시지 유형은 검증 실패', () => {
      const invalidData = {
        type: 'invalid_type',
        content: '테스트 메시지'
      };
      
      const errors = Message.validateMessageData(invalidData);
      expect(errors).toContain('올바른 메시지 유형이 아닙니다.');
    });

    test('과거 시간으로 예약하면 검증 실패', () => {
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);

      const invalidData = {
        type: 'daily',
        content: '테스트 메시지',
        scheduled_at: pastTime
      };
      
      const errors = Message.validateMessageData(invalidData);
      expect(errors).toContain('예약 시간은 현재 시간보다 이후여야 합니다.');
    });
  });

  describe('CustomReminder 유효성 검증', () => {
    test('유효한 맞춤 알림 데이터는 검증을 통과해야 함', () => {
      const validData = {
        recipient_id: 1,
        title: '테스트 알림',
        message: '약 복용 시간입니다.',
        schedule_type: 'daily',
        schedule_time: '08:00',
        created_by: 'family'
      };

      const errors = CustomReminder.validateReminderData(validData);
      expect(errors).toHaveLength(0);
    });

    test('필수 필드가 없으면 검증 실패', () => {
      const invalidData = {};
      const errors = CustomReminder.validateReminderData(invalidData);
      
      expect(errors).toContain('수신자 ID는 필수 입력 항목입니다.');
      expect(errors).toContain('알림 제목은 필수 입력 항목입니다.');
      expect(errors).toContain('알림 메시지는 필수 입력 항목입니다.');
    });

    test('잘못된 시간 형식은 검증 실패', () => {
      const invalidData = {
        recipient_id: 1,
        title: '테스트 알림',
        message: '테스트 메시지',
        schedule_type: 'daily',
        schedule_time: '25:00'
      };
      
      const errors = CustomReminder.validateReminderData(invalidData);
      expect(errors).toContain('시간은 HH:MM 형식이어야 합니다.');
    });

    test('주간 반복에서 잘못된 요일은 검증 실패', () => {
      const invalidData = {
        recipient_id: 1,
        title: '테스트 알림',
        message: '테스트 메시지',
        schedule_type: 'weekly',
        schedule_time: '08:00',
        schedule_day: 8 // 잘못된 요일
      };
      
      const errors = CustomReminder.validateReminderData(invalidData);
      expect(errors).toContain('주간 반복의 경우 요일은 1-7 사이여야 합니다.');
    });
  });

  describe('PublicDataCache 유효성 검증', () => {
    test('유효한 캐시 데이터는 검증을 통과해야 함', () => {
      const futureTime = new Date();
      futureTime.setMinutes(futureTime.getMinutes() + 60);

      const validData = {
        data_type: 'weather',
        region: '유성구',
        data: JSON.stringify({ temperature: 20, humidity: 60 }),
        expires_at: futureTime
      };

      const errors = PublicDataCache.validateCacheData(validData);
      expect(errors).toHaveLength(0);
    });

    test('필수 필드가 없으면 검증 실패', () => {
      const invalidData = {};
      const errors = PublicDataCache.validateCacheData(invalidData);
      
      expect(errors).toContain('데이터 유형은 필수 입력 항목입니다.');
      expect(errors).toContain('캐시 데이터는 필수 입력 항목입니다.');
      expect(errors).toContain('만료 시간은 필수 입력 항목입니다.');
    });

    test('잘못된 데이터 유형은 검증 실패', () => {
      const futureTime = new Date();
      futureTime.setMinutes(futureTime.getMinutes() + 60);

      const invalidData = {
        data_type: 'invalid_type',
        data: JSON.stringify({}),
        expires_at: futureTime
      };
      
      const errors = PublicDataCache.validateCacheData(invalidData);
      expect(errors).toContain('올바른 데이터 유형이 아닙니다.');
    });

    test('과거 시간으로 만료 시간을 설정하면 검증 실패', () => {
      const pastTime = new Date();
      pastTime.setMinutes(pastTime.getMinutes() - 10);

      const invalidData = {
        data_type: 'weather',
        data: JSON.stringify({}),
        expires_at: pastTime
      };
      
      const errors = PublicDataCache.validateCacheData(invalidData);
      expect(errors).toContain('만료 시간은 현재 시간보다 이후여야 합니다.');
    });
  });
});