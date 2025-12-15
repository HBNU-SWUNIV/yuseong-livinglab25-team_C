const express = require("express");
const MessageController = require("../controllers/MessageController");
const { authenticateToken, requireOperator } = require("../middleware/auth");

const router = express.Router();
const messageController = new MessageController();

// 모든 라우트에 인증 미들웨어 적용
// (테스트를 위해 잠시 주석 처리 상태 유지)
// router.use(authenticateToken);
// router.use(requireOperator);

/**
 * @route GET /api/messages
 * @desc 메시지 목록 조회
 */
router.get("/", (req, res) => messageController.getMessages(req, res));

/**
 * @route GET /api/messages/statistics
 * @desc 메시지 발송 통계 조회 (상세 통계용)
 */
router.get("/statistics", (req, res) =>
  messageController.getStatistics(req, res)
);

/**
 * ★★★ [NEW] @route GET /api/messages/stats/dashboard
 * @desc 대시보드용 요약 통계 조회 (총 수신자, 오늘 발송량, 성공률)
 * @notice 반드시 /:id 라우트보다 위에 있어야 함!
 */
router.get("/stats/dashboard", (req, res) =>
  messageController.getDashboardStats(req, res)
);

/**
 * @route POST /api/messages/preview
 * @desc 메시지 미리보기
 */
router.post("/preview", (req, res) =>
  messageController.previewMessage(req, res)
);

/**
 * @route POST /api/messages/schedule
 * @desc 메시지 예약 발송
 */
router.post("/schedule", (req, res) =>
  messageController.scheduleMessage(req, res)
);

/**
 * @route POST /api/messages/send
 * @desc 메시지 즉시 발송
 */
router.post("/send", (req, res) => messageController.sendMessage(req, res));

/**
 * @route GET /api/messages/:id
 * @desc 메시지 상세 조회
 */
router.get("/:id", (req, res) => messageController.getMessage(req, res));

/**
 * @route PUT /api/messages/:id/cancel
 * @desc 예약된 메시지 취소
 */
router.put("/:id/cancel", (req, res) =>
  messageController.cancelMessage(req, res)
);

module.exports = router;
