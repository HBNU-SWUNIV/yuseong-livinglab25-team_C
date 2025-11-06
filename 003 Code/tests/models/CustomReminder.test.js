const { CustomReminder, Recipient } = require('../../src/models');
const { connectDatabase, closeConnection } = require('../../src/config/database');
const { initializeDatabase } = require('../../src/config/initDatabase');

describe('CustomReminder Model', () => {
  let testRecipientId;

  beforeAll(async () => {
    await connectDatabase();
    await initializeDatabase();
    
    // 테스트용 수신자 생성
    testRecipientId = await Recipient.createRecipient({
      name: '테스트 수신자',
      phone_number: '01012345678'
    });
  });

  afterAll(async () => {
    await closeConnection();
  });

  beforeEach(async () => {
    // 테스트 전 데이터 정리
    await CustomReminder.executeQuery('DELETE FROM custom_reminders WHERE title LIKE "테스트%"');
  });

  describe('validateReminderData', () => {
    test('유효한 알림 데이터는 검증을 통과해야 함', () => {
      const validData = {
        recipient_id: testRecipientId,
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
        recipient_id: testRecipientId,
        title: '테스트 알림',
        message: '테스트 메시지',
        schedule_type: 'daily',
        schedule_time: '25:00'
      };
      
      const errors = CustomReminder.validateReminderData(invalidData);
      expect(errors).toContain('시간은 HH:MM 형식이어야 합니다.');
    });
  });

  describe('createReminder', () => {
    test('새 맞춤 알림을 생성할 수 있어야 함', async () => {
      const reminderData = {
        recipient_id: testRecipientId,
        title: '테스트 약 복용 알림',
        message: '혈압약 복용 시간입니다.',
        schedule_type: 'daily',
        schedule_time: '08:00',
        created_by: 'family'
      };

      const reminderId = await CustomReminder.createReminder(reminderData);
      expect(reminderId).toBeDefined();
      expect(typeof reminderId).toBe('number');

      // 생성된 알림 확인
      const created = await CustomReminder.findById(reminderId);
      expect(created.title).toBe(reminderData.title);
      expect(created.schedule_type).toBe(reminderData.schedule_type);
      expect(created.is_active).toBe(1);
    });

    test('주간 반복 알림을 생성할 수 있어야 함', async () => {
      const reminderData = {
        recipient_id: testRecipientId,
        title: '테스트 주간 알림',
        message: '병원 방문일입니다.',
        schedule_type: 'weekly',
        schedule_time: '09:00',
        schedule_day: 1, // 월요일
        created_by: 'family'
      };

      const reminderId = await CustomReminder.createReminder(reminderData);
      const created = await CustomReminder.findById(reminderId);
      
      expect(created.schedule_day).toBe(1);
      expect(created.schedule_type).toBe('weekly');
    });
  });

  describe('findByRecipientId', () => {
    beforeEach(async () => {
      await CustomReminder.createReminder({
        recipient_id: testRecipientId,
        title: '테스트 알림 1',
        message: '첫 번째 알림',
        schedule_type: 'daily',
        schedule_time: '08:00',
        created_by: 'family'
      });
      
      await CustomReminder.createReminder({
        recipient_id: testRecipientId,
        title: '테스트 알림 2',
        message: '두 번째 알림',
        schedule_type: 'weekly',
        schedule_time: '09:00',
        schedule_day: 1,
        created_by: 'family'
      });
    });

    test('수신자별 알림을 조회할 수 있어야 함', async () => {
      const reminders = await CustomReminder.findByRecipientId(testRecipientId);
      expect(reminders.length).toBe(2);
      
      const titles = reminders.map(r => r.title);
      expect(titles).toContain('테스트 알림 1');
      expect(titles).toContain('테스트 알림 2');
    });
  });

  describe('findDueReminders', () => {
    test('현재 시간에 발송할 알림을 조회할 수 있어야 함', async () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      
      await CustomReminder.createReminder({
        recipient_id: testRecipientId,
        title: '테스트 현재 시간 알림',
        message: '지금 발송할 알림',
        schedule_type: 'daily',
        schedule_time: currentTime,
        created_by: 'family'
      });

      const dueReminders = await CustomReminder.findDueReminders();
      const currentReminder = dueReminders.find(r => r.title === '테스트 현재 시간 알림');
      
      expect(currentReminder).toBeDefined();
      expect(currentReminder.recipient_name).toBe('테스트 수신자');
    });
  });

  describe('updateLastSentTime', () => {
    test('마지막 발송 시간을 업데이트할 수 있어야 함', async () => {
      const reminderData = {
        recipient_id: testRecipientId,
        title: '테스트 발송 시간 업데이트',
        message: '테스트 메시지',
        schedule_type: 'daily',
        schedule_time: '08:00',
        created_by: 'family'
      };

      const reminderId = await CustomReminder.createReminder(reminderData);
      const success = await CustomReminder.updateLastSentTime(reminderId);
      
      expect(success).toBe(true);

      const updated = await CustomReminder.findById(reminderId);
      expect(updated.last_sent_at).toBeDefined();
    });
  });

  describe('deactivateReminder', () => {
    test('알림을 비활성화할 수 있어야 함', async () => {
      const reminderData = {
        recipient_id: testRecipientId,
        title: '테스트 비활성화 알림',
        message: '테스트 메시지',
        schedule_type: 'daily',
        schedule_time: '08:00',
        created_by: 'family'
      };

      const reminderId = await CustomReminder.createReminder(reminderData);
      const success = await CustomReminder.deactivateReminder(reminderId);
      
      expect(success).toBe(true);

      const deactivated = await CustomReminder.findById(reminderId);
      expect(deactivated.is_active).toBe(0);
    });
  });

  describe('countByRecipient', () => {
    test('수신자별 활성 알림 수를 조회할 수 있어야 함', async () => {
      // 3개의 알림 생성
      for (let i = 1; i <= 3; i++) {
        await CustomReminder.createReminder({
          recipient_id: testRecipientId,
          title: `테스트 알림 ${i}`,
          message: `테스트 메시지 ${i}`,
          schedule_type: 'daily',
          schedule_time: '08:00',
          created_by: 'family'
        });
      }

      const count = await CustomReminder.countByRecipient(testRecipientId);
      expect(count).toBe(3);
    });
  });
});