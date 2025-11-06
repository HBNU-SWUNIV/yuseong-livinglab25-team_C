const request = require('supertest');
const app = require('../../src/server');
const { connectDatabase, closeConnection } = require('../../src/config/database');

describe('DashboardController', () => {
  let authToken;

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

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // 데이터베이스 연결 종료
    await closeConnection();
  });

  describe('GET /api/dashboard/stats', () => {
    test('인증된 사용자의 대시보드 통계 조회 성공', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalRecipients).toBeDefined();
      expect(response.body.todayMessages).toBeDefined();
      expect(response.body.successRate).toBeDefined();
      expect(response.body.lastUpdated).toBeDefined();
      expect(typeof response.body.totalRecipients).toBe('number');
      expect(typeof response.body.todayMessages).toBe('number');
      expect(typeof response.body.successRate).toBe('number');
    });

    test('인증 토큰 없이 통계 조회 실패', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/dashboard/recent-messages', () => {
    test('인증된 사용자의 최근 메시지 조회 성공', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent-messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.messages).toBeDefined();
      expect(Array.isArray(response.body.messages)).toBe(true);
    });

    test('limit 파라미터로 메시지 개수 제한', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent-messages?limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.messages).toBeDefined();
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages.length).toBeLessThanOrEqual(3);
    });

    test('인증 토큰 없이 메시지 조회 실패', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent-messages')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/dashboard/system-status', () => {
    test('인증된 사용자의 시스템 상태 조회 성공', async () => {
      const response = await request(app)
        .get('/api/dashboard/system-status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBeDefined();
      expect(response.body.alerts).toBeDefined();
      expect(response.body.lastChecked).toBeDefined();
      expect(Array.isArray(response.body.alerts)).toBe(true);
      expect(['healthy', 'warning', 'error']).toContain(response.body.status);
    });

    test('시스템 알림 구조 검증', async () => {
      const response = await request(app)
        .get('/api/dashboard/system-status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.alerts.length > 0) {
        const alert = response.body.alerts[0];
        expect(alert.level).toBeDefined();
        expect(alert.title).toBeDefined();
        expect(alert.message).toBeDefined();
        expect(alert.timestamp).toBeDefined();
        expect(['info', 'warning', 'error']).toContain(alert.level);
      }
    });

    test('인증 토큰 없이 시스템 상태 조회 실패', async () => {
      const response = await request(app)
        .get('/api/dashboard/system-status')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });
});