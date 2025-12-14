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

  /**
   * 수신자 데이터 유효성 검증
   */
  validateRecipientData(data) {
    const errors = [];

    // 필수 필드 검증
    if (!data.name || data.name.trim().length === 0) {
      errors.push("이름은 필수 입력 항목입니다.");
    }

    if (!data.phone_number || data.phone_number.trim().length === 0) {
      errors.push("전화번호는 필수 입력 항목입니다.");
    }

    // 이름 길이 검증
    if (data.name && data.name.length > 50) {
      errors.push("이름은 50자를 초과할 수 없습니다.");
    }

    // 전화번호 형식 검증
    if (data.phone_number) {
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(data.phone_number.replace(/[^0-9]/g, ""))) {
        errors.push("올바른 전화번호 형식이 아닙니다.");
      }
    }

    // 주소 길이 검증
    if (data.address && data.address.length > 200) {
      errors.push("주소는 200자를 초과할 수 없습니다.");
    }

    // 생년월일 형식 검증
    if (data.birth_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.birth_date)) {
        errors.push("생년월일은 YYYY-MM-DD 형식이어야 합니다.");
      }
    }

    // 비상연락처 형식 검증
    if (data.emergency_contact) {
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(data.emergency_contact.replace(/[^0-9]/g, ""))) {
        errors.push("올바른 비상연락처 형식이 아닙니다.");
      }
    }

    return errors;
  }

  /**
   * 전화번호 정규화 (하이픈 제거)
   */
  normalizePhoneNumber(phoneNumber) {
    return phoneNumber.replace(/[^0-9]/g, "");
  }

  /**
   * 수신자 생성
   */
  async createRecipient(data) {
    // 데이터 유효성 검증
    const validationErrors = this.validateRecipientData(data);
    if (validationErrors.length > 0) {
      throw new Error(`유효성 검증 실패: ${validationErrors.join(", ")}`);
    }

    // 전화번호 정규화
    const normalizedData = {
      ...data,
      phone_number: this.normalizePhoneNumber(data.phone_number),
    };

    if (normalizedData.emergency_contact) {
      normalizedData.emergency_contact = this.normalizePhoneNumber(
        normalizedData.emergency_contact
      );
    }

    // 중복 전화번호 확인
    const existingRecipient = await this.findByPhoneNumber(
      normalizedData.phone_number
    );
    if (existingRecipient) {
      throw new Error("이미 등록된 전화번호입니다.");
    }

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

  /**
   * 전화번호로 수신자 조회
   */
  async findByPhoneNumber(phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const query = "SELECT * FROM recipients WHERE phone_number = ?";
    const results = await this.executeQuery(query, [normalizedPhone]);
    return results[0] || null;
  }

  /**
   * 활성 수신자 목록 조회
   */
  async findActiveRecipients() {
    return await this.findAll({ is_active: true }, "name ASC");
  }

  /**
   * 수신자 검색 (이름 또는 전화번호)
   */
  async searchRecipients(searchTerm, isActiveOnly = true) {
    let query = `
      SELECT * FROM recipients 
      WHERE (name LIKE ? OR phone_number LIKE ?)
    `;
    const params = [`%${searchTerm}%`, `%${searchTerm}%`];

    if (isActiveOnly) {
      query += " AND is_active = ?";
      params.push(true);
    }

    query += " ORDER BY name ASC";

    return await this.executeQuery(query, params);
  }

  /**
   * 수신자 정보 수정
   */
  async updateRecipient(id, data) {
    // 업데이트용 유효성 검증 (필수 필드 검증 완화)
    const validationErrors = [];

    // 이름 길이 검증
    if (data.name && data.name.length > 50) {
      validationErrors.push("이름은 50자를 초과할 수 없습니다.");
    }

    // 전화번호 형식 검증 (있는 경우에만)
    if (data.phone_number) {
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(data.phone_number.replace(/[^0-9]/g, ""))) {
        validationErrors.push("올바른 전화번호 형식이 아닙니다.");
      }
    }

    // 주소 길이 검증
    if (data.address && data.address.length > 200) {
      validationErrors.push("주소는 200자를 초과할 수 없습니다.");
    }

    // 생년월일 형식 검증
    if (data.birth_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.birth_date)) {
        validationErrors.push("생년월일은 YYYY-MM-DD 형식이어야 합니다.");
      }
    }

    // 비상연락처 형식 검증
    if (data.emergency_contact) {
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(data.emergency_contact.replace(/[^0-9]/g, ""))) {
        validationErrors.push("올바른 비상연락처 형식이 아닙니다.");
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(`유효성 검증 실패: ${validationErrors.join(", ")}`);
    }

    // 전화번호 정규화
    const normalizedData = { ...data };
    if (normalizedData.phone_number) {
      normalizedData.phone_number = this.normalizePhoneNumber(
        normalizedData.phone_number
      );

      // 다른 수신자와 전화번호 중복 확인
      const existingRecipient = await this.findByPhoneNumber(
        normalizedData.phone_number
      );
      if (existingRecipient && existingRecipient.id !== parseInt(id)) {
        throw new Error("이미 등록된 전화번호입니다.");
      }
    }

    if (normalizedData.emergency_contact) {
      normalizedData.emergency_contact = this.normalizePhoneNumber(
        normalizedData.emergency_contact
      );
    }

    try {
      const success = await this.update(id, normalizedData);
      if (success) {
        logger.info(`수신자 정보 수정: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error("수신자 수정 실패:", error);
      throw error;
    }
  }

  /**
   * 수신자 비활성화 (소프트 삭제)
   */
  async deactivateRecipient(id) {
    try {
      const success = await this.update(id, { is_active: false });
      if (success) {
        logger.info(`수신자 비활성화: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error("수신자 비활성화 실패:", error);
      throw error;
    }
  }

  /**
   * 수신자 활성화
   */
  async activateRecipient(id) {
    try {
      const success = await this.update(id, { is_active: true });
      if (success) {
        logger.info(`수신자 활성화: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error("수신자 활성화 실패:", error);
      throw error;
    }
  }

  /**
   * CSV 데이터로 일괄 등록
   */
  async bulkCreateFromCSV(csvData) {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

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

  /**
   * 수신자 통계 조회
   */
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

  /**
   * 페이지네이션과 검색을 지원하는 수신자 목록 조회
   */
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

    // 활성 상태 필터
    if (is_active !== undefined) {
      whereClause += " AND is_active = ?";
      params.push(is_active);
    }

    // 검색 조건
    if (search) {
      whereClause += " AND (name LIKE ? OR phone_number LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // 정렬 조건
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

    const query = `
      SELECT * FROM recipients 
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    // params.push(limit, offset);
    const results = await this.executeQuery(query, params);

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM recipients ${whereClause}`;
    const countParams = params; // limit, offset 제외
    const countResult = await this.executeQuery(countQuery, countParams);
    const total = countResult[0].total;

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 수신자 검색 (제한된 결과)
   */
  async search(query, limit = 10) {
    const searchQuery = `
      SELECT id, name, phone_number, address 
      FROM recipients 
      WHERE is_active = true 
        AND (name LIKE ? OR phone_number LIKE ?)
      ORDER BY name ASC
      LIMIT ?
    `;

    const params = [`%${query}%`, `%${query}%`, limit];
    return await this.executeQuery(searchQuery, params);
  }

  /**
   * 통계 정보 조회
   */
  async getStatistics() {
    const totalQuery = "SELECT COUNT(*) as total FROM recipients";
    const activeQuery =
      "SELECT COUNT(*) as active FROM recipients WHERE is_active = true";
    const inactiveQuery =
      "SELECT COUNT(*) as inactive FROM recipients WHERE is_active = false";
    const recentQuery = `
      SELECT COUNT(*) as recent 
      FROM recipients 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;

    const [totalResult, activeResult, inactiveResult, recentResult] =
      await Promise.all([
        this.executeQuery(totalQuery),
        this.executeQuery(activeQuery),
        this.executeQuery(inactiveQuery),
        this.executeQuery(recentQuery),
      ]);

    return {
      total: totalResult[0].total,
      active: activeResult[0].active,
      inactive: inactiveResult[0].inactive,
      recent: recentResult[0].recent,
    };
  }
}

module.exports = Recipient;
