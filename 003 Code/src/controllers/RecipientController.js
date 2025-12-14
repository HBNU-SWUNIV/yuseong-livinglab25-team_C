const Recipient = require("../models/Recipient");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const logger = require("../utils/logger");

class RecipientController {
  constructor() {
    this.recipientModel = new Recipient();

    this.upload = multer({
      dest: "uploads/",
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === "text/csv" ||
          file.originalname.endsWith(".csv")
        ) {
          cb(null, true);
        } else {
          cb(new Error("CSV 파일만 업로드 가능합니다."), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    });
  }

  async getRecipients(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        is_active,
        sort_by = "created_at",
        sort_order = "desc",
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        is_active: is_active !== undefined ? is_active === "true" : undefined,
        sortBy: sort_by,
        sortOrder: sort_order,
      };

      const result = await this.recipientModel.findAll(options);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error("Get recipients error:", error);
      res
        .status(500)
        .json({ error: "Internal server error", message: "목록 조회 실패" });
    }
  }

  async createRecipient(req, res) {
    try {
      // ★★★ [수정됨] 컨트롤러에서 직접 검증하지 않고 모델에 위임 ★★★
      // name, phone_number 유무나 정규식 체크 로직 제거 -> Model의 validateRecipientData가 처리함

      const recipient = await this.recipientModel.createRecipient(req.body);

      logger.info("Recipient created:", {
        recipientId: recipient,
        createdBy: req.user ? req.user.username : "unknown",
      });

      res.status(201).json({
        success: true,
        message: "수신자가 성공적으로 등록되었습니다.",
        data: { id: recipient },
      });
    } catch (error) {
      // 모델에서 던진 에러(유효성 검증 실패, 중복 등)를 잡아서 처리
      logger.error("Create recipient error:", error.message);

      if (error.message.includes("유효성") || error.message.includes("필수")) {
        return res
          .status(400)
          .json({ error: "Validation Error", message: error.message });
      }
      if (error.message.includes("이미 등록된")) {
        return res
          .status(409)
          .json({ error: "Conflict", message: error.message });
      }

      res.status(500).json({
        error: "Internal server error",
        message: "수신자 등록 중 오류가 발생했습니다.",
      });
    }
  }

  async bulkUpload(req, res) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "No file", message: "CSV 파일을 업로드해주세요." });
      }

      const csvData = [];

      // 스트림으로 파일 읽기
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on("data", (row) => csvData.push(row))
          .on("end", resolve)
          .on("error", reject);
      });

      // ★★★ [수정됨] 모델의 bulkCreateFromCSV(최적화된 버전) 호출 ★★★
      // 컨트롤러에서 for문 돌며 createRecipient 호출하던 로직 제거
      const results = await this.recipientModel.bulkCreateFromCSV(csvData);

      // 임시 파일 삭제
      fs.unlinkSync(req.file.path);

      logger.info("Bulk upload completed:", {
        total: csvData.length,
        success: results.success,
        failed: results.failed,
      });

      res.json({
        success: true,
        message: `총 ${csvData.length}개 중 ${results.success}개가 성공적으로 등록되었습니다.`,
        data: results,
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);

      logger.error("Bulk upload error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "CSV 업로드 처리 중 오류가 발생했습니다.",
      });
    }
  }

  // ... (나머지 getRecipient, update, delete 등은 기존과 동일)
}

module.exports = RecipientController;
