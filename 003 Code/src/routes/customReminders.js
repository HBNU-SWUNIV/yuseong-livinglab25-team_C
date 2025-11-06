const express = require('express');
const CustomReminderController = require('../controllers/CustomReminderController');
const { authenticateToken, requireOperator } = require('../middleware/auth');

const router = express.Router();
const customReminderController = new CustomReminderController();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);
router.use(requireOperator);

/**
 * @route GET /api/custom-reminders
 * @desc 맞춤 알림 목록 조회
 * @access Private (Operator+)
 * @query {number} page - 페이지 번호 (기본값: 1)
 * @query {number} limit - 페이지당 항목 수 (기본값: 20)
 * @query {number} recipient_id - 수신자 ID 필터
 * @query {boolean} is_active - 활성 상태 필터
 * @query {string} schedule_type - 반복 유형 필터 (daily, weekly, monthly)
 * @query {string} sort_by - 정렬 필드 (기본값: created_at)
 * @query {string} sort_order - 정렬 순서 (asc/desc, 기본값: desc)
 */
router.get('/', (req, res) => customReminderController.getCustomReminders(req, res));

/**
 * @route GET /api/custom-reminders/statistics
 * @desc 맞춤 알림 통계 조회
 * @access Private (Operator+)
 */
router.get('/statistics', (req, res) => customReminderController.getStatistics(req, res));

/**
 * @route GET /api/custom-reminders/scheduled
 * @desc 발송 예정 맞춤 알림 조회
 * @access Private (Operator+)
 * @query {string} date - 대상 날짜 (YYYY-MM-DD, 기본값: 오늘)
 * @query {string} time - 대상 시간 (HH:MM, 기본값: 현재 시간)
 */
router.get('/scheduled', (req, res) => customReminderController.getScheduledReminders(req, res));

/**
 * @route POST /api/custom-reminders
 * @desc 맞춤 알림 등록
 * @access Private (Operator+)
 * @body {number} recipient_id - 수신자 ID (필수)
 * @body {string} title - 알림 제목 (필수)
 * @body {string} message - 알림 메시지 (필수)
 * @body {string} schedule_type - 반복 유형 (daily, weekly, monthly, 필수)
 * @body {string} schedule_time - 발송 시간 (HH:MM, 필수)
 * @body {number} schedule_day - 발송 요일/일 (weekly: 1-7, monthly: 1-31)
 * @body {string} created_by - 설정자 (선택, 기본값: 로그인 사용자)
 */
router.post('/', (req, res) => customReminderController.createCustomReminder(req, res));

/**
 * @route GET /api/custom-reminders/recipient/:recipient_id
 * @desc 수신자별 맞춤 알림 조회
 * @access Private (Operator+)
 * @param {number} recipient_id - 수신자 ID
 * @query {boolean} is_active - 활성 상태 필터
 */
router.get('/recipient/:recipient_id', (req, res) => customReminderController.getRecipientReminders(req, res));

/**
 * @route GET /api/custom-reminders/:id
 * @desc 맞춤 알림 상세 조회
 * @access Private (Operator+)
 * @param {number} id - 맞춤 알림 ID
 */
router.get('/:id', (req, res) => customReminderController.getCustomReminder(req, res));

/**
 * @route PUT /api/custom-reminders/:id
 * @desc 맞춤 알림 수정
 * @access Private (Operator+)
 * @param {number} id - 맞춤 알림 ID
 * @body {string} title - 알림 제목
 * @body {string} message - 알림 메시지
 * @body {string} schedule_type - 반복 유형 (daily, weekly, monthly)
 * @body {string} schedule_time - 발송 시간 (HH:MM)
 * @body {number} schedule_day - 발송 요일/일
 * @body {boolean} is_active - 활성 상태
 */
router.put('/:id', (req, res) => customReminderController.updateCustomReminder(req, res));

/**
 * @route PATCH /api/custom-reminders/:id/toggle
 * @desc 맞춤 알림 활성화/비활성화
 * @access Private (Operator+)
 * @param {number} id - 맞춤 알림 ID
 * @body {boolean} is_active - 활성화 상태
 */
router.patch('/:id/toggle', (req, res) => customReminderController.toggleCustomReminder(req, res));

/**
 * @route DELETE /api/custom-reminders/:id
 * @desc 맞춤 알림 삭제
 * @access Private (Operator+)
 * @param {number} id - 맞춤 알림 ID
 */
router.delete('/:id', (req, res) => customReminderController.deleteCustomReminder(req, res));

module.exports = router;