const { Recipient } = require('../../src/models');
const { connectDatabase, closeConnection } = require('../../src/config/database');
const { initializeDatabase } = require('../../src/config/initDatabase');

describe('Recipient Model', () => {
  beforeAll(async () => {
    await connectDatabase();
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeConnection();
  });

  beforeEach(async () => {
    // 테스트 전 데이터 정리
    await Recipient.executeQuery('DELETE FROM recipients WHERE phone_number LIKE "010%"');
  });

  describe('validateRecipientData', () => {
    test('유효한 데이터는 검증을 통과해야 함', () => {
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
  });

  describe('createRecipient', () => {
    test('새 수신자를 생성할 수 있어야 함', async () => {
      const recipientData = {
        name: '테스트 사용자',
        phone_number: '01012345678',
        address: '대전시 유성구 테스트동',
        birth_date: '1950-01-01'
      };

      const recipientId = await Recipient.createRecipient(recipientData);
      expect(recipientId).toBeDefined();
      expect(typeof recipientId).toBe('number');

      // 생성된 수신자 확인
      const created = await Recipient.findById(recipientId);
      expect(created.name).toBe(recipientData.name);
      expect(created.phone_number).toBe('01012345678');
    });

    test('중복된 전화번호로는 생성할 수 없어야 함', async () => {
      const recipientData = {
        name: '첫 번째 사용자',
        phone_number: '01012345678'
      };

      await Recipient.createRecipient(recipientData);

      const duplicateData = {
        name: '두 번째 사용자',
        phone_number: '01012345678'
      };

      await expect(Recipient.createRecipient(duplicateData))
        .rejects.toThrow('이미 등록된 전화번호입니다.');
    });
  });

  describe('findByPhoneNumber', () => {
    test('전화번호로 수신자를 찾을 수 있어야 함', async () => {
      const recipientData = {
        name: '테스트 사용자',
        phone_number: '01012345678'
      };

      await Recipient.createRecipient(recipientData);
      const found = await Recipient.findByPhoneNumber('01012345678');
      
      expect(found).toBeDefined();
      expect(found.name).toBe(recipientData.name);
    });

    test('존재하지 않는 전화번호는 null을 반환해야 함', async () => {
      const found = await Recipient.findByPhoneNumber('01099999999');
      expect(found).toBeNull();
    });
  });

  describe('updateRecipient', () => {
    test('수신자 정보를 수정할 수 있어야 함', async () => {
      const recipientData = {
        name: '원래 이름',
        phone_number: '01012345678'
      };

      const recipientId = await Recipient.createRecipient(recipientData);
      
      const updateData = {
        name: '수정된 이름',
        address: '새 주소'
      };

      const success = await Recipient.updateRecipient(recipientId, updateData);
      expect(success).toBe(true);

      const updated = await Recipient.findById(recipientId);
      expect(updated.name).toBe('수정된 이름');
      expect(updated.address).toBe('새 주소');
    });
  });

  describe('deactivateRecipient', () => {
    test('수신자를 비활성화할 수 있어야 함', async () => {
      const recipientData = {
        name: '테스트 사용자',
        phone_number: '01012345678'
      };

      const recipientId = await Recipient.createRecipient(recipientData);
      const success = await Recipient.deactivateRecipient(recipientId);
      
      expect(success).toBe(true);

      const deactivated = await Recipient.findById(recipientId);
      expect(deactivated.is_active).toBe(0); // MySQL boolean은 0/1로 저장
    });
  });

  describe('searchRecipients', () => {
    beforeEach(async () => {
      await Recipient.createRecipient({
        name: '홍길동',
        phone_number: '01012345678'
      });
      await Recipient.createRecipient({
        name: '김철수',
        phone_number: '01087654321'
      });
    });

    test('이름으로 검색할 수 있어야 함', async () => {
      const results = await Recipient.searchRecipients('홍길동');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('홍길동');
    });

    test('전화번호로 검색할 수 있어야 함', async () => {
      const results = await Recipient.searchRecipients('01087654321');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('김철수');
    });
  });
});