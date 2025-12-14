const express = require("express");
const router = express.Router();
const RecipientController = require("../controllers/RecipientController"); // 모델이 아니라 컨트롤러를 가져옵니다.

// 컨트롤러 인스턴스 생성
const controller = new RecipientController();

// 1. 목록 조회 (GET /api/recipients)
// 'this' 컨텍스트 유지를 위해 화살표 함수나 bind를 사용해야 합니다.
router.get("/", (req, res) => controller.getRecipients(req, res));

// 2. 검색 (GET /api/recipients/search) - 순서 중요: :id보다 위에 있어야 함
router.get("/search", (req, res) => controller.searchRecipients(req, res));

// 3. 통계 (GET /api/recipients/stats)
router.get("/stats", (req, res) => controller.getStatistics(req, res));

// 4. 상세 조회 (GET /api/recipients/:id)
router.get("/:id", (req, res) => controller.getRecipient(req, res));

// 5. 등록 (POST /api/recipients)
router.post("/", (req, res) => controller.createRecipient(req, res));

// 6. 수정 (PUT /api/recipients/:id)
router.put("/:id", (req, res) => controller.updateRecipient(req, res));

// 7. 삭제 (DELETE /api/recipients/:id)
router.delete("/:id", (req, res) => controller.deleteRecipient(req, res));

// 8. 일괄 등록 (POST /api/recipients/bulk)
// 컨트롤러에 정의된 upload 미들웨어를 사용합니다.
router.post("/bulk", controller.upload.single("file"), (req, res) =>
  controller.bulkUpload(req, res)
);

module.exports = router;
