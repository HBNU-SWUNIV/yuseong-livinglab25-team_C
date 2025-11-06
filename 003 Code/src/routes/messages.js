const express = require('express');
const MessageController = require('../controllers/MessageController');
const { authenticateToken, requireOperator } = require('../middleware/auth');

const router = express.Router();
const messageController = new MessageController();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);
router.use(requireOperator);

/**
 * @route GET /api/messages
 * @desc 메시지 목록 조회
 * @access Private (Operator+)
 * @query {number} page - 페이지 번호 (기본값: 1)
 * @query {number} limit - 페이지당 항목 수 (기본값: 20)
 * @query {string} type - 메시지 유형 필터 (daily, emergency, welfare, custom)
 * @query {string} status - 상태 필터 (pending, sending, sent, failed, cancelled)
 * @query {string} date_from - 시작 날짜 (YYYY-MM-DD)
 * @query {string} date_to - 종료 날짜 (YYYY-MM-DD)
 * @query {string} sort_by - 정렬 필드 (기본값: created_at)
 * @query {string} sort_order - 정렬 순서 (asc/desc, 기본값: desc)
 */
router.get('/', (req, res) => messageController.getMessages(req, res));

/**
 * @route GET /api/messages/statistics
 * @desc 메시지 발송 통계 조회
 * @access Private (Operator+)
 * @query {string} date_from - 시작 날짜 (YYYY-MM-DD)
 * @query {string} date_to - 종료 날짜 (YYYY-MM-DD)
 * @query {string} type - 메시지 유형 필터
 */
router.get('/statistics', (req, res) => messageController.getStatistics(req, res));

/**
 * @route POST /api/messages/preview
 * @desc 메시지 미리보기
 * @access Private (Operator+)
 * @body {string} type - 메시지 유형
 * @body {string} content - 메시지 내용
 * @body {object} template_data - 템플릿 데이터 (선택)
 */
router.post('/preview', (req, res) => messageController.previewMessage(req, res));

/**
 * @route POST /api/messages/schedule
 * @desc 메시지 예약 발송
 * @access Private (Operator+)
 * @body {string} type - 메시지 유형 (필수)
 * @body {string} title - 메시지 제목 (선택)
 * @body {string} content - 메시지 내용 (필수)
 * @body {string} scheduled_at - 예약 시간 (ISO 8601 형식)
 * @body {array} recipient_ids - 수신자 ID 배열 (선택, 없으면 전체 발송)
 */
router.post('/schedule', (req, res) => messageController.scheduleMessage(req, res));

/**
 * @route POST /api/messages/send
 * @desc 메시지 즉시 발송
 * @access Private (Operator+)
 * @body {string} type - 메시지 유형 (필수)
 * @body {string} title - 메시지 제목 (선택)
 * @body {string} content - 메시지 내용 (필수)
 * @body {array} recipient_ids - 수신자 ID 배열 (선택, 없으면 전체 발송)
 */
router.post('/send', (req, res) => messageController.sendMessage(req, res));

/**
 * @route GET /api/messages/:id
 * @desc 메시지 상세 조회
 * @access Private (Operator+)
 * @param {number} id - 메시지 ID
 */
router.get('/:id', (req, res) => messageController.getMessage(req, res));

/**
 * @route PUT /api/messages/:id/cancel
 * @desc 예약된 메시지 취소
 * @access Private (Operator+)
 * @param {number} id - 메시지 ID
 */
router.put('/:id/cancel', (req, res) => messageController.cancelMessage(req, res));

module.exports = router;