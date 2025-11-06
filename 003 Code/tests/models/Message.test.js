const { Message } = require('../../src/models');
const { connectDatabase, closeConnection } = require('../../src/config/database');
const { initializeDatabase } = require('../../src/config/initDatabase');

describe('Message Model', () => {
  beforeAll(async () => {
    await connectDatabase();
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeConnection();
  });

  beforeEach(async () => {
    // 테스트 전 데이터 정리
    await Message.executeQuery('DELETE FROM messages WHERE title LIKE "테스트%"');
  });

  describe('validateMessageData', () => {
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
  });

  describe('createMessage', () => {
    test('새 메시지를 생성할 수 있어야 함', async () => {
      const messageData = {
        type: 'daily',
        title: '테스트 일일 메시지',
        content: '오늘 날씨는 맑고 기온은 20도입니다.',
        created_by: 'admin'
      };

      const messageId = await Message.createMessage(messageData);
      expect(messageId).toBeDefined();
      expect(typeof messageId).toBe('number');

      // 생성된 메시지 확인
      const created = await Message.findById(messageId);
      expect(created.type).toBe(messageData.type);
      expect(created.title).toBe(messageData.title);
      expect(created.status).toBe('pending');
    });

    test('예약 메시지를 생성할 수 있어야 함', async () => {
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 1);

      const messageData = {
        type: 'welfare',
        title: '테스트 예약 메시지',
        content: '복지 서비스 안내입니다.',
        scheduled_at: futureTime,
        created_by: 'admin'
      };

      const messageId = await Message.createMessage(messageData);
      const created = await Message.findById(messageId);
      
      expect(created.scheduled_at).toBeDefined();
      expect(new Date(created.scheduled_at)).toBeInstanceOf(Date);
    });
  });

  describe('updateMessageStatus', () => {
    test('메시지 상태를 업데이트할 수 있어야 함', async () => {
      const messageData = {
        type: 'daily',
        content: '테스트 메시지',
        created_by: 'admin'
      };

      const messageId = await Message.createMessage(messageData);
      const success = await Message.updateMessageStatus(messageId, 'sent');
      
      expect(success).toBe(true);

      const updated = await Message.findById(messageId);
      expect(updated.status).toBe('sent');
      expect(updated.sent_at).toBeDefined();
    });

    test('잘못된 상태로는 업데이트할 수 없어야 함', async () => {
      const messageData = {
        type: 'daily',
        content: '테스트 메시지',
        created_by: 'admin'
      };

      const messageId = await Message.createMessage(messageData);
      
      await expect(Message.updateMessageStatus(messageId, 'invalid_status'))
        .rejects.toThrow('올바른 메시지 상태가 아닙니다.');
    });
  });

  describe('findPendingMessages', () => {
    test('발송 대기 중인 메시지를 조회할 수 있어야 함', async () => {
      // 즉시 발송 메시지
      await Message.createMessage({
        type: 'daily',
        content: '즉시 발송 메시지',
        created_by: 'admin'
      });

      // 예약 메시지 (미래)
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 1);
      await Message.createMessage({
        type: 'welfare',
        content: '예약 메시지',
        scheduled_at: futureTime,
        created_by: 'admin'
      });

      const pendingMessages = await Message.findPendingMessages();
      expect(pendingMessages.length).toBeGreaterThanOrEqual(1);
      
      // 즉시 발송 메시지만 포함되어야 함
      const immediateMessage = pendingMessages.find(m => m.content === '즉시 발송 메시지');
      expect(immediateMessage).toBeDefined();
    });
  });

  describe('findByType', () => {
    beforeEach(async () => {
      await Message.createMessage({
        type: 'daily',
        content: '일일 메시지 1',
        created_by: 'admin'
      });
      await Message.createMessage({
        type: 'daily',
        content: '일일 메시지 2',
        created_by: 'admin'
      });
      await Message.createMessage({
        type: 'emergency',
        content: '긴급 메시지',
        created_by: 'admin'
      });
    });

    test('메시지 유형별로 조회할 수 있어야 함', async () => {
      const dailyMessages = await Message.findByType('daily');
      expect(dailyMessages.length).toBe(2);
      
      const emergencyMessages = await Message.findByType('emergency');
      expect(emergencyMessages.length).toBe(1);
    });
  });

  describe('updateSendingResults', () => {
    test('발송 결과를 업데이트할 수 있어야 함', async () => {
      const messageData = {
        type: 'daily',
        content: '테스트 메시지',
        created_by: 'admin'
      };

      const messageId = await Message.createMessage(messageData);
      const success = await Message.updateSendingResults(messageId, 10, 2);
      
      expect(success).toBe(true);

      const updated = await Message.findById(messageId);
      expect(updated.success_count).toBe(10);
      expect(updated.failed_count).toBe(2);
      expect(updated.recipient_count).toBe(12);
      expect(updated.status).toBe('sent');
    });
  });
});