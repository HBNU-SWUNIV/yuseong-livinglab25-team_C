const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

class AuthController {
  constructor() {
    this.adminModel = new Admin();
  }

  /**
   * 관리자 로그인
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // 입력 검증
      if (!username || !password) {
        return res.status(400).json({
          error: 'Missing credentials',
          message: '사용자명과 비밀번호를 입력해주세요.'
        });
      }

      // 관리자 조회
      const admin = await this.adminModel.findByUsername(username);
      if (!admin) {
        logger.warn('Login attempt with invalid username:', { username });
        return res.status(401).json({
          error: 'Invalid credentials',
          message: '사용자명 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // 비밀번호 검증
      const isValidPassword = await this.adminModel.verifyPassword(password, admin.password);
      if (!isValidPassword) {
        logger.warn('Login attempt with invalid password:', { username, adminId: admin.id });
        return res.status(401).json({
          error: 'Invalid credentials',
          message: '사용자명 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // 계정 활성화 상태 확인
      if (!admin.is_active) {
        logger.warn('Login attempt with inactive account:', { username, adminId: admin.id });
        return res.status(401).json({
          error: 'Account inactive',
          message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
        });
      }

      // JWT 토큰 생성
      const tokenPayload = {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      };

      const token = generateToken(tokenPayload);

      // 마지막 로그인 시간 업데이트
      await this.adminModel.updateLastLogin(admin.id);

      logger.info('Admin login successful:', { 
        adminId: admin.id, 
        username: admin.username,
        role: admin.role 
      });

      res.json({
        success: true,
        message: '로그인 성공',
        token,
        user: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
          email: admin.email
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '로그인 처리 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 관리자 로그아웃 (클라이언트에서 토큰 삭제)
   */
  async logout(req, res) {
    try {
      logger.info('Admin logout:', { 
        adminId: req.user?.id, 
        username: req.user?.username 
      });

      res.json({
        success: true,
        message: '로그아웃 되었습니다.'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '로그아웃 처리 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 토큰 검증
   */
  async verifyToken(req, res) {
    try {
      // 미들웨어에서 이미 토큰 검증이 완료된 상태
      const admin = await this.adminModel.findById(req.user.id);
      
      if (!admin || !admin.is_active) {
        return res.status(401).json({
          error: 'Invalid token',
          message: '유효하지 않은 토큰입니다.'
        });
      }

      res.json({
        success: true,
        user: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
          email: admin.email
        }
      });

    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(401).json({
        error: 'Token verification failed',
        message: '토큰 검증에 실패했습니다.'
      });
    }
  }

  /**
   * 현재 로그인한 관리자 정보 조회
   */
  async getProfile(req, res) {
    try {
      const admin = await this.adminModel.findById(req.user.id);
      
      if (!admin) {
        return res.status(404).json({
          error: 'Admin not found',
          message: '관리자 정보를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
          email: admin.email,
          phone: admin.phone,
          last_login_at: admin.last_login_at,
          created_at: admin.created_at
        }
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '프로필 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // 입력 검증
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          error: 'Missing fields',
          message: '모든 필드를 입력해주세요.'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          error: 'Password mismatch',
          message: '새 비밀번호가 일치하지 않습니다.'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'Password too short',
          message: '비밀번호는 최소 8자 이상이어야 합니다.'
        });
      }

      // 현재 관리자 정보 조회
      const admin = await this.adminModel.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({
          error: 'Admin not found',
          message: '관리자 정보를 찾을 수 없습니다.'
        });
      }

      // 현재 비밀번호 검증
      const isValidCurrentPassword = await this.adminModel.verifyPassword(currentPassword, admin.password);
      if (!isValidCurrentPassword) {
        return res.status(401).json({
          error: 'Invalid current password',
          message: '현재 비밀번호가 올바르지 않습니다.'
        });
      }

      // 비밀번호 변경
      await this.adminModel.changePassword(admin.id, newPassword);

      logger.info('Password changed successfully:', { 
        adminId: admin.id, 
        username: admin.username 
      });

      res.json({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '비밀번호 변경 중 오류가 발생했습니다.'
      });
    }
  }
}

module.exports = AuthController;