const multer = require("multer");
const Recipient = require("../models/Recipient");
const logger = require("../utils/logger");

class RecipientController {
  constructor() {
    this.recipientModel = new Recipient();
    const storage = multer.memoryStorage();
    this.upload = multer({ storage: storage });
  }

  /**
   * 수신자 등록 (단건)
   */
  async createRecipient(req, res) {
    try {
      // ★★★ [디버깅용] 프론트에서 정확히 뭘 보내는지 눈으로 확인하기 ★★★
      console.log("🔥 [DEBUG] 프론트엔드 요청 데이터:", req.body);

      // 변수명을 다양하게 받아봅니다 (birthDate, birthday, birth_date, birthdate...)
      const {
        name,
        phone_number,
        address,
        emergency_contact,
        // 생년월일 관련 변수 다 꺼내기
        birth_date,
        birthdate,
        birthDate,
        birthday,
      } = req.body;

      if (!name || !phone_number) {
        return res.status(400).json({
          success: false,
          message: "이름과 전화번호는 필수입니다.",
        });
      }

      // ★★★ 가장 먼저 발견되는 값을 생년월일로 사용 ★★★
      const finalBirthDate =
        birth_date || birthdate || birthDate || birthday || null;

      console.log(`🔥 [DEBUG] 결정된 생년월일 값: ${finalBirthDate}`);

      const recipientData = {
        name,
        phone_number,
        address,
        birth_date: finalBirthDate, // 최종 결정된 값 넣기
        emergency_contact,
      };

      const insertId = await this.recipientModel.createRecipient(recipientData);

      res.status(201).json({
        success: true,
        message: "수신자가 등록되었습니다.",
        data: { id: insertId },
      });
    } catch (error) {
      if (error.message.includes("이미 등록된")) {
        return res.status(409).json({ success: false, message: error.message });
      }
      logger.error("수신자 등록 실패:", error);
      res
        .status(500)
        .json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  }

  // ... (나머지 bulkRegister, updateRecipient, getRecipients, deleteRecipient 등은 그대로 두셔도 됩니다) ...

  async bulkRegister(req, res) {
    // (기존 코드 유지)
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "파일이 없습니다." });
      const fileContent = req.file.buffer.toString("utf-8");
      const rows = fileContent.split("\n");
      const csvData = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        const cols = row.split(",");
        if (cols.length >= 2) {
          csvData.push({
            name: cols[0]?.trim(),
            phone_number: cols[1]?.trim(),
            address: cols[2]?.trim() || null,
            birth_date: cols[3]?.trim() || null,
          });
        }
      }
      if (csvData.length === 0)
        return res
          .status(400)
          .json({ success: false, message: "유효한 데이터 없음" });
      const result = await this.recipientModel.bulkCreateFromCSV(csvData);
      res.json({ success: true, message: "완료", data: result });
    } catch (error) {
      logger.error("일괄 등록 실패:", error);
      res.status(500).json({ success: false, message: "오류 발생" });
    }
  }

  async updateRecipient(req, res) {
    try {
      const { id } = req.params;
      // 수정할 때도 똑같이 여러 이름으로 받기
      const {
        name,
        phone_number,
        address,
        emergency_contact,
        is_active,
        birth_date,
        birthdate,
        birthDate,
        birthday,
      } = req.body;

      const finalBirthDate = birth_date || birthdate || birthDate || birthday;

      const updateData = {
        name,
        phone_number,
        address,
        birth_date: finalBirthDate,
        emergency_contact,
        is_active,
      };

      await this.recipientModel.updateRecipient(id, updateData);
      res.json({ success: true, message: "수정 완료" });
    } catch (error) {
      // (기존 에러 처리 유지)
      res.status(500).json({ success: false, message: "오류 발생" });
    }
  }

  async getRecipients(req, res) {
    // (기존 코드 유지)
    try {
      const { page, limit, search, is_active } = req.query;
      let activeFilter;
      if (is_active === "true") activeFilter = true;
      if (is_active === "false") activeFilter = false;
      const result = await this.recipientModel.findAll({
        page,
        limit,
        search,
        is_active: activeFilter,
      });
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  }

  async deleteRecipient(req, res) {
    // (기존 코드 유지)
    try {
      await this.recipientModel.deactivateRecipient(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  }
}

module.exports = RecipientController;
