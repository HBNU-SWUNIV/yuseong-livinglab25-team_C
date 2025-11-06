const request = require('supertest');
const app = require('../../src/server');
const { connectDatabase, closeConnection } = require('../../src/config/database');

describe('AuthController', () => {
  let server;

  beforeAll(async () => {
    // 테스트용 데이터베이스 연결
    await connectDatabase();
  });

  afterAll(async () => {
    // 데이터베이스 연결 종료
    await closeConnection();
  });

  describe('POST /api/auth/login', () => {
    test('유효한 자격 증명으로 로그인 성공', async () => {
      const loginData = {
        username: 'admin',
        password: 'admin123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('admin');
      expect(response.body.user.role).toBe('admin');
    });

    test('잘못된 사용자명으로 로그인 실패', async () => {
      const loginData = {
        username: 'wronguser',
        password: 'admin123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBeUndefined();
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('잘못된 비밀번호로 로그인 실패', async () => {
      const loginData = {
        username: 'admin',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBeUndefined();
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('필수 필드 누락 시 오류', async () => {
      const loginData = {
        username: 'admin'
        // password 누락
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBe('Missing credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;

    beforeAll(async () => {
      // 로그인하여 토큰 획득
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      authToken = loginResponse.body.token;
    });

    test('인증된 사용자의 프로필 조회 성공', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('admin');
      expect(response.body.data.role).toBe('admin');
      expect(response.body.data.password).toBeUndefined(); // 비밀번호는 반환되지 않아야 함
    });

    test('인증 토큰 없이 프로필 조회 실패', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('잘못된 토큰으로 프로필 조회 실패', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let authToken;

    beforeAll(async () => {
      // 로그인하여 토큰 획득
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      authToken = loginResponse.body.token;
    });

    test('유효한 데이터로 비밀번호 변경 성공', async () => {
      const changePasswordData = {
        currentPassword: 'admin123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('성공적으로 변경');

      // 비밀번호를 다시 원래대로 변경
      await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'newpassword123',
          newPassword: 'admin123',
          confirmPassword: 'admin123'
        });
    });

    test('현재 비밀번호가 틀린 경우 실패', async () => {
      const changePasswordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordData)
        .expect(401);

      expect(response.body.error).toBe('Invalid current password');
    });

    test('새 비밀번호 확인이 일치하지 않는 경우 실패', async () => {
      const changePasswordData = {
        currentPassword: 'admin123',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordData)
        .expect(400);

      expect(response.body.error).toBe('Password mismatch');
    });

    test('새 비밀번호가 너무 짧은 경우 실패', async () => {
      const changePasswordData = {
        currentPassword: 'admin123',
        newPassword: '123',
        confirmPassword: '123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordData)
        .expect(400);

      expect(response.body.error).toBe('Password too short');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeAll(async () => {
      // 로그인하여 토큰 획득
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      authToken = loginResponse.body.token;
    });

    test('인증된 사용자의 로그아웃 성공', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('로그아웃');
    });

    test('인증 토큰 없이 로그아웃 실패', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });
});