const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * JWT 토큰 생성
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * JWT 토큰 검증 미들웨어
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: '인증 토큰이 필요합니다.' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Token verification failed:', { error: err.message, token: token.substring(0, 20) + '...' });
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        message: '유효하지 않거나 만료된 토큰입니다.' 
      });
    }

    req.user = user;
    next();
  });
}

/**
 * 권한별 접근 제어 미들웨어
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: '인증이 필요합니다.' 
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn('Access denied for user:', { 
        userId: req.user.id, 
        userRole, 
        requiredRoles: allowedRoles 
      });
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: '권한이 부족합니다.' 
      });
    }

    next();
  };
}

/**
 * 관리자 권한 확인 미들웨어
 */
const requireAdmin = requireRole(['admin']);

/**
 * 운영자 이상 권한 확인 미들웨어
 */
const requireOperator = requireRole(['admin', 'operator']);

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  requireAdmin,
  requireOperator
};