const express = require("express");
const RecipientController = require("../controllers/RecipientController");
const { authenticateToken, requireOperator } = require("../middleware/auth");

const router = express.Router();
const recipientController = new RecipientController();

// 인증 미들웨어
router.use(authenticateToken);
router.use(requireOperator);

/**
 * @swagger
 * tags:
 *   name: Recipients
 *   description: 수신자(어르신) 관리 API
 */

/**
 * @swagger
 * /api/recipients:
 *   get:
 *     summary: 수신자 목록 조회
 *     tags: [Recipients]
 *     parameters:
 *     - in: query
 *       name: page
 *       schema:
 *         type: integer
 *       description: 페이지 번호 (기본 1)
 *     - in: query
 *       name: limit
 *       schema:
 *         type: integer
 *       description: 페이지당 항목 수 (기본 20)
 *     - in: query
 *       name: search
 *       schema:
 *         type: string
 *       description: 이름 또는 전화번호 검색
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "홍길동"
 *                       phone_number:
 *                         type: string
 *                         example: "010-1234-5678"
 */
router.get("/", (req, res) => recipientController.getRecipients(req, res));

/**
 * @swagger
 * /api/recipients/search:
 *   get:
 *     summary: 수신자 검색
 *     tags: [Recipients]
 *     parameters:
 *     - in: query
 *       name: q
 *       required: true
 *       schema:
 *         type: string
 *       description: 검색어
 *     responses:
 *       200:
 *         description: 검색 성공
 */
router.get("/search", (req, res) =>
  recipientController.searchRecipients(req, res)
);

/**
 * @swagger
 * /api/recipients/statistics:
 *   get:
 *     summary: 수신자 통계 조회
 *     tags: [Recipients]
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 */
router.get("/statistics", (req, res) =>
  recipientController.getStatistics(req, res)
);

/**
 * @swagger
 * /api/recipients:
 *   post:
 *     summary: 수신자 등록
 *     tags: [Recipients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *             - name
 *             - phone_number
 *             properties:
 *               name:
 *                 type: string
 *                 example: "김철수"
 *               phone_number:
 *                 type: string
 *                 example: "010-5678-1234"
 *               address:
 *                 type: string
 *               birth_date:
 *                 type: string
 *                 format: date
 *                 example: "1950-01-01"
 *     responses:
 *       201:
 *         description: 등록 성공
 */
router.post("/", (req, res) => recipientController.createRecipient(req, res));

/**
 * @swagger
 * /api/recipients/bulk-upload:
 *   post:
 *     summary: CSV 파일 일괄 등록
 *     tags: [Recipients]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 업로드 성공
 */
router.post(
  "/bulk-upload",
  recipientController.upload.single("file"),
  (req, res) => recipientController.bulkUpload(req, res)
);

/**
 * @swagger
 * /api/recipients/{id}:
 *   get:
 *     summary: 수신자 상세 조회
 *     tags: [Recipients]
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *       description: 수신자 ID
 *     responses:
 *       200:
 *         description: 조회 성공
 */
router.get("/:id", (req, res) => recipientController.getRecipient(req, res));

/**
 * @swagger
 * /api/recipients/{id}:
 *   put:
 *     summary: 수신자 정보 수정
 *     tags: [Recipients]
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 */
router.put("/:id", (req, res) => recipientController.updateRecipient(req, res));

/**
 * @swagger
 * /api/recipients/{id}:
 *   delete:
 *     summary: 수신자 삭제 (비활성화)
 *     tags: [Recipients]
 *     parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
router.delete("/:id", (req, res) =>
  recipientController.deleteRecipient(req, res)
);

module.exports = router;
