const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const authController = new AuthController();

/**
 * @route POST /api/auth/login
 * @desc 관리자 로그인
 * @access Public
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * @route POST /api/auth/logout
 * @desc 관리자 로그아웃
 * @access Private
 */
router.post('/logout', authenticateToken, (req, res) => authController.logout(req, res));

/**
 * @route GET /api/auth/verify
 * @desc 토큰 검증
 * @access Private
 */
router.get('/verify', authenticateToken, (req, res) => authController.verifyToken(req, res));

/**
 * @route GET /api/auth/profile
 * @desc 현재 로그인한 관리자 정보 조회
 * @access Private
 */
router.get('/profile', authenticateToken, (req, res) => authController.getProfile(req, res));

/**
 * @route PUT /api/auth/change-password
 * @desc 비밀번호 변경
 * @access Private
 */
router.put('/change-password', authenticateToken, (req, res) => authController.changePassword(req, res));

module.exports = router;