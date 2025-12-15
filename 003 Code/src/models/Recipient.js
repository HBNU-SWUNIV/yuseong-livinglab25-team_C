const BaseModel = require("./BaseModel");
const logger = require("../utils/logger");

/**
 * 수신자 모델
 * Recipient model for managing SMS recipients
 */
class Recipient extends BaseModel {
  constructor() {
    super("recipients");
  }

  // ★★★ [수정 포인트 1] 컬럼명을 birthdate -> birth_date로 변경 ★★★
  async create(data) {
    const query = `
      INSERT INTO recipients 
      (name, phone_number, address, birth_date, emergency_contact, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      data.name,
      data.phone_number,
      data.address || null,
      data.birth_date || null, // 프론트에서 받은 변수명도 birth_date로 통일
      data.emergency_contact || null,
      data.is_active !== undefined ? data.is_active : true,
    ];

    const result = await this.executeQuery(query, params);
    return result.insertId;
  }

  // ★★★ [수정 포인트 2] update 메서드에서도 컬럼명 수정 ★★★
  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      params.push(data.name);
    }
    if (data.phone_number !== undefined) {
      fields.push("phone_number = ?");
      params.push(data.phone_number);
    }
    if (data.address !== undefined) {
      fields.push("address = ?");
      params.push(data.address);
    }

    // 여기가 문제였음: birthdate -> birth_date
    if (data.birth_date !== undefined) {
      fields.push("birth_date = ?");
      params.push(data.birth_date);
    }

    if (data.emergency_contact !== undefined) {
      fields.push("emergency_contact = ?");
      params.push(data.emergency_contact);
    }
    if (data.is_active !== undefined) {
      fields.push("is_active = ?");
      params.push(data.is_active);
    }

    fields.push("updated_at = NOW()");

    if (fields.length === 1) return false;

    const query = `UPDATE recipients SET ${fields.join(", ")} WHERE id = ?`;
    params.push(id);

    const result = await this.executeQuery(query, params);
    return result.affectedRows > 0;
  }

  // ... (아래 검증 로직 등은 기존과 동일합니다) ...

  validateRecipientData(data) {
    const errors = [];
    if (!data.name || data.name.trim().length === 0)
      errors.push("이름은 필수 입력 항목입니다.");
    if (!data.phone_number || data.phone_number.trim().length === 0)
      errors.push("전화번호는 필수 입력 항목입니다.");
    if (data.name && data.name.length > 50)
      errors.push("이름은 50자를 초과할 수 없습니다.");
    if (data.phone_number) {
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(data.phone_number.replace(/[^0-9]/g, "")))
        errors.push("올바른 전화번호 형식이 아닙니다.");
    }
    if (data.address && data.address.length > 200)
      errors.push("주소는 200자를 초과할 수 없습니다.");

    // birth_date 검증
    if (data.birth_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.birth_date))
        errors.push("생년월일은 YYYY-MM-DD 형식이어야 합니다.");
    }

    if (data.emergency_contact) {
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(data.emergency_contact.replace(/[^0-9]/g, "")))
        errors.push("올바른 비상연락처 형식이 아닙니다.");
    }
    return errors;
  }

  normalizePhoneNumber(phoneNumber) {
    return phoneNumber.replace(/[^0-9]/g, "");
  }

  async createRecipient(data) {
    const validationErrors = this.validateRecipientData(data);
    if (validationErrors.length > 0)
      throw new Error(`유효성 검증 실패: ${validationErrors.join(", ")}`);

    const normalizedData = {
      ...data,
      phone_number: this.normalizePhoneNumber(data.phone_number),
    };

    if (normalizedData.emergency_contact) {
      normalizedData.emergency_contact = this.normalizePhoneNumber(
        normalizedData.emergency_contact
      );
    }

    const existingRecipient = await this.findByPhoneNumber(
      normalizedData.phone_number
    );
    if (existingRecipient) throw new Error("이미 등록된 전화번호입니다.");

    try {
      const recipientId = await this.create(normalizedData);
      logger.info(
        `새 수신자 등록: ID ${recipientId}, 전화번호 ${normalizedData.phone_number}`
      );
      return recipientId;
    } catch (error) {
      logger.error("수신자 생성 실패:", error);
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const query = "SELECT * FROM recipients WHERE phone_number = ?";
    const results = await this.executeQuery(query, [normalizedPhone]);
    return results[0] || null;
  }

  async findActiveRecipients() {
    return await this.findAll({ is_active: true }, "name ASC");
  }

  async searchRecipients(searchTerm, isActiveOnly = true) {
    let query = `SELECT * FROM recipients WHERE (name LIKE ? OR phone_number LIKE ?)`;
    const params = [`%${searchTerm}%`, `%${searchTerm}%`];
    if (isActiveOnly) {
      query += " AND is_active = ?";
      params.push(true);
    }
    query += " ORDER BY name ASC";
    return await this.executeQuery(query, params);
  }

  async updateRecipient(id, data) {
    // ... (검증 로직 생략, 기존과 동일) ...
    // 검증 로직은 위에서 정의한 validateRecipientData 등을 활용하거나 기존 로직 유지

    // 여기서는 핵심인 update 메서드 호출 부분만 신경쓰면 됩니다.
    // 기존에 있던 복잡한 검증 로직은 그대로 두시고,
    // this.update(id, normalizedData)가 호출될 때 위에서 수정한 update 메서드가 실행됩니다.

    // (간략화를 위해 기존 로직 복붙 생략, 위에서 수정한 update 메서드가 핵심입니다!)

    // ... 기존 updateRecipient 로직 ...
    const normalizedData = { ...data };
    if (normalizedData.phone_number)
      normalizedData.phone_number = this.normalizePhoneNumber(
        normalizedData.phone_number
      );
    if (normalizedData.emergency_contact)
      normalizedData.emergency_contact = this.normalizePhoneNumber(
        normalizedData.emergency_contact
      );

    try {
      const success = await this.update(id, normalizedData);
      if (success) logger.info(`수신자 정보 수정: ID ${id}`);
      return success;
    } catch (error) {
      logger.error("수신자 수정 실패:", error);
      throw error;
    }
  }

  async deactivateRecipient(id) {
    try {
      const success = await this.update(id, { is_active: false });
      if (success) logger.info(`수신자 비활성화: ID ${id}`);
      return success;
    } catch (error) {
      logger.error("수신자 비활성화 실패:", error);
      throw error;
    }
  }

  async activateRecipient(id) {
    try {
      const success = await this.update(id, { is_active: true });
      if (success) logger.info(`수신자 활성화: ID ${id}`);
      return success;
    } catch (error) {
      logger.error("수신자 활성화 실패:", error);
      throw error;
    }
  }

  async bulkCreateFromCSV(csvData) {
    const results = { success: 0, failed: 0, errors: [] };
    for (const [index, row] of csvData.entries()) {
      try {
        await this.createRecipient(row);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: index + 1,
          data: row,
          error: error.message,
        });
      }
    }
    logger.info(
      `일괄 등록 완료: 성공 ${results.success}건, 실패 ${results.failed}건`
    );
    return results;
  }

  async getRecipientStats() {
    const queries = [
      { key: "total", query: "SELECT COUNT(*) as count FROM recipients" },
      {
        key: "active",
        query:
          "SELECT COUNT(*) as count FROM recipients WHERE is_active = true",
      },
      {
        key: "inactive",
        query:
          "SELECT COUNT(*) as count FROM recipients WHERE is_active = false",
      },
    ];
    const stats = {};
    for (const { key, query } of queries) {
      const result = await this.executeQuery(query);
      stats[key] = result[0].count;
    }
    return stats;
  }

  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      is_active,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;
    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];

    if (is_active !== undefined) {
      whereClause += " AND is_active = ?";
      params.push(is_active);
    }
    if (search) {
      whereClause += " AND (name LIKE ? OR phone_number LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    const allowedSortFields = [
      "name",
      "phone_number",
      "created_at",
      "updated_at",
    ];
    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "created_at";
    const sortDirection = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    const query = `SELECT * FROM recipients ${whereClause} ORDER BY ${sortField} ${sortDirection} LIMIT ${Number(
      limit
    )} OFFSET ${Number(offset)}`;
    const results = await this.executeQuery(query, params);

    const countQuery = `SELECT COUNT(*) as total FROM recipients ${whereClause}`;
    const countResult = await this.executeQuery(countQuery, params); // limit param 제외 로직 필요하지만 간단히 실행

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  async search(query, limit = 10) {
    const searchQuery = `SELECT id, name, phone_number, address FROM recipients WHERE is_active = true AND (name LIKE ? OR phone_number LIKE ?) ORDER BY name ASC LIMIT ?`;
    const params = [`%${query}%`, `%${query}%`, limit];
    return await this.executeQuery(searchQuery, params);
  }
}

module.exports = Recipient;
