const request = require('supertest');
const app = require('../../src/server');
const { connectDatabase, closeConnection } = require('../../src/config/database');

describe('RecipientController', () => {
  let authToken;
  let testRecipientId;

  beforeAll(async () => {
    // 테스트용 데이터베이스 연결
    await connectDatabase();

    // 로그인하여 토큰 획득
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testRecipientId) {
      await request(app)
        .delete(`/api/recipients/${testRecipientId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }

    // 데이터베이스 연결 종료
    await closeConnection();
  });

  describe('POST /api/recipients', () => {
    test('유효한 데이터로 수신자 등록 성공', async () => {
      const recipientData = {
        name: '테스트 수신자',
        phone_number: '01012345678',
        address: '서울시 강남구',
        birth_date: '1950-01-01',
        emergency_contact: '01087654321'
      };

      const response = await request(app)
        .post('/api/recipients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recipientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(recipientData.name);
      expect(response.body.data.phone_number).toBe(recipientData.phone_number);

      testRecipientId = response.body.data.id;
    });

    test('필수 필드 누락 시 오류', async () => {
      const recipientData = {
        name: '테스트 수신자'
        // phone_number 누락
      };

      const response = await request(app)
        .post('/api/recipients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recipientData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    test('잘못된 전화번호 형식으로 등록 실패', async () => {
      const recipientData = {
        name: '테스트 수신자',
        phone_number: '123456789' // 잘못된 형식
      };

      const response = await request(app)
        .post('/api/recipients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recipientData)
        .expect(400);

      expect(response.body.error).toBe('Invalid phone number');
    });

    test('인증 없이 수신자 등록 실패', async () => {
      const recipientData = {
        name: '테스트 수신자',
        phone_number: '01012345679'
      };

      const response = await request(app)
        .post('/api/recipients')
        .send(recipientData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/recipients', () => {
    test('수신자 목록 조회 성공', async () => {
      const response = await request(app)
        .get('/api/recipients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    test('페이지네이션 파라미터로 조회', async () => {
      const response = await request(app)
        .get('/api/recipients?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    test('검색 파라미터로 조회', async () => {
      const response = await request(app)
        .get('/api/recipients?search=테스트')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/recipients/:id', () => {
    test('유효한 ID로 수신자 상세 조회 성공', async () => {
      const response = await request(app)
        .get(`/api/recipients/${testRecipientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testRecipientId);
      expect(response.body.data.name).toBe('테스트 수신자');
    });

    test('존재하지 않는 ID로 조회 실패', async () => {
      const response = await request(app)
        .get('/api/recipients/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Recipient not found');
    });
  });

  describe('PUT /api/recipients/:id', () => {
    test('유효한 데이터로 수신자 정보 수정 성공', async () => {
      const updateData = {
        name: '수정된 테스트 수신자',
        address: '부산시 해운대구'
      };

      const response = await request(app)
        .put(`/api/recipients/${testRecipientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.address).toBe(updateData.address);
    });

    test('존재하지 않는 ID로 수정 실패', async () => {
      const updateData = {
        name: '수정된 이름'
      };

      const response = await request(app)
        .put('/api/recipients/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Recipient not found');
    });
  });

  describe('GET /api/recipients/search', () => {
    test('유효한 검색어로 검색 성공', async () => {
      const response = await request(app)
        .get('/api/recipients/search?q=테스트')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('검색어가 너무 짧은 경우 실패', async () => {
      const response = await request(app)
        .get('/api/recipients/search?q=a')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid search query');
    });
  });

  describe('GET /api/recipients/statistics', () => {
    test('수신자 통계 조회 성공', async () => {
      const response = await request(app)
        .get('/api/recipients/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.active).toBeDefined();
      expect(response.body.data.inactive).toBeDefined();
    });
  });

  describe('DELETE /api/recipients/:id', () => {
    test('유효한 ID로 수신자 삭제(비활성화) 성공', async () => {
      const response = await request(app)
        .delete(`/api/recipients/${testRecipientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('비활성화');

      // 삭제 후 조회하여 is_active가 false인지 확인
      const getResponse = await request(app)
        .get(`/api/recipients/${testRecipientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.is_active).toBe(false);
    });

    test('존재하지 않는 ID로 삭제 실패', async () => {
      const response = await request(app)
        .delete('/api/recipients/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Recipient not found');
    });
  });
});