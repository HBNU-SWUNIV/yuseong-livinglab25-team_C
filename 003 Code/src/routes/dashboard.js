const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const { authenticateToken } = require('../middleware/auth');

// 모든 대시보드 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 대시보드 통계 조회
router.get('/stats', DashboardController.getStats);

// 최근 메시지 이력 조회 (messages 라우트와 충돌 방지)
router.get('/recent-messages', DashboardController.getRecentMessages);

// 시스템 상태 조회
router.get('/system-status', DashboardController.getSystemStatus);

module.exports = router;