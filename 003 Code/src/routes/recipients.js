const express = require('express');
const RecipientController = require('../controllers/RecipientController');
const { authenticateToken, requireOperator } = require('../middleware/auth');

const router = express.Router();
const recipientController = new RecipientController();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);
router.use(requireOperator);

/**
 * @route GET /api/recipients
 * @desc 수신자 목록 조회
 * @access Private (Operator+)
 * @query {number} page - 페이지 번호 (기본값: 1)
 * @query {number} limit - 페이지당 항목 수 (기본값: 20)
 * @query {string} search - 검색어 (이름 또는 전화번호)
 * @query {boolean} is_active - 활성 상태 필터
 * @query {string} sort_by - 정렬 필드 (기본값: created_at)
 * @query {string} sort_order - 정렬 순서 (asc/desc, 기본값: desc)
 */
router.get('/', (req, res) => recipientController.getRecipients(req, res));

/**
 * @route GET /api/recipients/search
 * @desc 수신자 검색
 * @access Private (Operator+)
 * @query {string} q - 검색어
 * @query {number} limit - 결과 제한 (기본값: 10)
 */
router.get('/search', (req, res) => recipientController.searchRecipients(req, res));

/**
 * @route GET /api/recipients/statistics
 * @desc 수신자 통계 조회
 * @access Private (Operator+)
 */
router.get('/statistics', (req, res) => recipientController.getStatistics(req, res));

/**
 * @route POST /api/recipients
 * @desc 수신자 등록
 * @access Private (Operator+)
 * @body {string} name - 수신자 이름 (필수)
 * @body {string} phone_number - 전화번호 (필수)
 * @body {string} address - 주소 (선택)
 * @body {string} birth_date - 생년월일 (YYYY-MM-DD, 선택)
 * @body {string} emergency_contact - 비상연락처 (선택)
 */
router.post('/', (req, res) => recipientController.createRecipient(req, res));

/**
 * @route POST /api/recipients/bulk-upload
 * @desc CSV 파일을 통한 수신자 일괄 등록
 * @access Private (Operator+)
 * @body {file} file - CSV 파일
 */
router.post('/bulk-upload', 
  recipientController.upload.single('file'),
  (req, res) => recipientController.bulkUpload(req, res)
);

/**
 * @route GET /api/recipients/:id
 * @desc 수신자 상세 조회
 * @access Private (Operator+)
 * @param {number} id - 수신자 ID
 */
router.get('/:id', (req, res) => recipientController.getRecipient(req, res));

/**
 * @route PUT /api/recipients/:id
 * @desc 수신자 정보 수정
 * @access Private (Operator+)
 * @param {number} id - 수신자 ID
 * @body {string} name - 수신자 이름
 * @body {string} phone_number - 전화번호
 * @body {string} address - 주소
 * @body {string} birth_date - 생년월일 (YYYY-MM-DD)
 * @body {string} emergency_contact - 비상연락처
 * @body {boolean} is_active - 활성 상태
 */
router.put('/:id', (req, res) => recipientController.updateRecipient(req, res));

/**
 * @route DELETE /api/recipients/:id
 * @desc 수신자 삭제 (비활성화)
 * @access Private (Operator+)
 * @param {number} id - 수신자 ID
 */
router.delete('/:id', (req, res) => recipientController.deleteRecipient(req, res));

module.exports = router;