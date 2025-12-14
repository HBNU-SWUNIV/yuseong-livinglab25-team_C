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

  // ★★★ [수정된 부분] createRecipient 함수 전체 교체 ★★★
  async createRecipient(req, res) {
    try {
      // 1. DB에 저장 (여기까진 성공함)
      const recipient = await this.recipientModel.createRecipient(req.body);

      // 2. 로그 남기기 (여기서 에러날 가능성 차단)
      try {
        const username =
          req.user && req.user.username ? req.user.username : "unknown";
        logger.info("Recipient created:", {
          recipientId: recipient,
          createdBy: username,
        });
      } catch (logError) {
        // 로그 실패해도 흐린 눈 하고 넘어감 (서비스는 멈추면 안 되니까!)
        console.error("로그 작성 중 경미한 오류:", logError);
      }

      // 3. 성공 응답 보내기
      res.status(201).json({
        success: true,
        message: "수신자가 성공적으로 등록되었습니다.",
        data: { id: recipient },
      });
    } catch (error) {
      // 에러 메시지가 없는 경우를 대비해 안전하게 처리
      const safeErrorMessage = error.message || "알 수 없는 오류";
      logger.error("Create recipient error object:", error); // 전체 에러 객체 로깅

      if (
        safeErrorMessage.includes("유효성") ||
        safeErrorMessage.includes("필수")
      ) {
        return res
          .status(400)
          .json({ error: "Validation Error", message: safeErrorMessage });
      }
      if (safeErrorMessage.includes("이미 등록된")) {
        return res
          .status(409)
          .json({ error: "Conflict", message: safeErrorMessage });
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

      const results = await this.recipientModel.bulkCreateFromCSV(csvData);

      // 임시 파일 삭제
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

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

  // ... (updateRecipient, deleteRecipient 등 나머지 코드는 기존과 동일하게 유지하거나 필요시 복붙하세요)
  // 편의를 위해 나머지 부분도 아래에 적어드립니다. (기존 코드가 있다면 createRecipient만 바꾸셔도 됩니다)

  async updateRecipient(req, res) {
    try {
      const { id } = req.params;
      const success = await this.recipientModel.updateRecipient(id, req.body);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "수신자를 찾을 수 없습니다.",
        });
      }

      res.json({
        success: true,
        message: "수신자 정보가 수정되었습니다.",
      });
    } catch (error) {
      logger.error("Update recipient error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "수신자 수정 중 오류가 발생했습니다.",
      });
    }
  }

  async deleteRecipient(req, res) {
    try {
      const { id } = req.params;
      const success = await this.recipientModel.deactivateRecipient(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "수신자를 찾을 수 없습니다.",
        });
      }

      res.json({
        success: true,
        message: "수신자가 삭제(비활성화)되었습니다.",
      });
    } catch (error) {
      logger.error("Delete recipient error:", error);
      res.status(500).json({
        success: false,
        message: "수신자 삭제 중 오류가 발생했습니다.",
      });
    }
  }

  async getRecipient(req, res) {
    try {
      const { id } = req.params;
      const recipient = await this.recipientModel.findById(id);

      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: "수신자를 찾을 수 없습니다.",
        });
      }

      res.json({
        success: true,
        data: recipient,
      });
    } catch (error) {
      logger.error("Get recipient error:", error);
      res.status(500).json({
        success: false,
        message: "수신자 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async searchRecipients(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          success: false,
          message: "검색어를 입력해주세요.",
        });
      }

      const results = await this.recipientModel.search(q);
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error("Search recipients error:", error);
      res.status(500).json({
        success: false,
        message: "수신자 검색 중 오류가 발생했습니다.",
      });
    }
  }

  async getStatistics(req, res) {
    try {
      const stats = await this.recipientModel.getStatistics();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Get statistics error:", error);
      res.status(500).json({
        success: false,
        message: "통계 조회 중 오류가 발생했습니다.",
      });
    }
  }
}

module.exports = RecipientController;
