const jwt = require('jsonwebtoken');
const { 
  generateToken, 
  authenticateToken, 
  requireRole, 
  requireAdmin, 
  requireOperator 
} = require('../../src/middleware/auth');

describe('Auth Middleware', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  describe('generateToken', () => {
    test('유효한 페이로드로 토큰 생성 성공', () => {
      const payload = {
        id: 1,
        username: 'testuser',
        role: 'admin'
      };

      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // 토큰 검증
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.role).toBe(payload.role);
    });
  });

  describe('authenticateToken', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('유효한 토큰으로 인증 성공', () => {
      const payload = { id: 1, username: 'testuser', role: 'admin' };
      const token = generateToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(payload.id);
      expect(req.user.username).toBe(payload.username);
      expect(next).toHaveBeenCalled();
    });

    test('토큰이 없는 경우 인증 실패', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access token required',
        message: '인증 토큰이 필요합니다.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('잘못된 토큰으로 인증 실패', () => {
      req.headers.authorization = 'Bearer invalid-token';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
        message: '유효하지 않거나 만료된 토큰입니다.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('만료된 토큰으로 인증 실패', () => {
      // 만료된 토큰 생성 (과거 시간으로 설정)
      const expiredToken = jwt.sign(
        { id: 1, username: 'testuser', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );
      req.headers.authorization = `Bearer ${expiredToken}`;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
        message: '유효하지 않거나 만료된 토큰입니다.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        user: { id: 1, username: 'testuser', role: 'operator' }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('허용된 역할로 접근 성공', () => {
      const middleware = requireRole(['admin', 'operator']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('허용되지 않은 역할로 접근 실패', () => {
      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: '권한이 부족합니다.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('사용자 정보가 없는 경우 실패', () => {
      req.user = null;
      const middleware = requireRole(['admin']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: '인증이 필요합니다.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('단일 역할 문자열로 접근 성공', () => {
      const middleware = requireRole('operator');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    let req, res, next;

    beforeEach(() => {
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('관리자 역할로 접근 성공', () => {
      req = {
        user: { id: 1, username: 'admin', role: 'admin' }
      };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('운영자 역할로 관리자 권한 접근 실패', () => {
      req = {
        user: { id: 1, username: 'operator', role: 'operator' }
      };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: '권한이 부족합니다.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireOperator', () => {
    let req, res, next;

    beforeEach(() => {
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('관리자 역할로 운영자 권한 접근 성공', () => {
      req = {
        user: { id: 1, username: 'admin', role: 'admin' }
      };

      requireOperator(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('운영자 역할로 운영자 권한 접근 성공', () => {
      req = {
        user: { id: 1, username: 'operator', role: 'operator' }
      };

      requireOperator(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('권한이 없는 역할로 접근 실패', () => {
      req = {
        user: { id: 1, username: 'user', role: 'user' }
      };

      requireOperator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: '권한이 부족합니다.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});