const BaseModel = require("./BaseModel");
const logger = require("../utils/logger");

class Message extends BaseModel {
  constructor() {
    super("messages");
  }

  // 메시지 생성 (기존 create 메서드 오버라이드 가능)
  async create(data) {
    return await super.create(data);
  }

  /**
   * 메시지 목록 조회 (페이지네이션, 검색, 필터링)
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      dateFrom,
      dateTo,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];

    // 타입 필터
    if (type && type !== "all") {
      whereClause += " AND type = ?";
      params.push(type);
    }

    // 상태 필터
    if (status && status !== "all") {
      whereClause += " AND status = ?";
      params.push(status);
    }

    // 날짜 범위 필터 (created_at 기준)
    if (dateFrom) {
      whereClause += " AND created_at >= ?";
      params.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
      whereClause += " AND created_at <= ?";
      params.push(`${dateTo} 23:59:59`);
    }

    // 정렬 조건
    const allowedSortFields = [
      "created_at",
      "sent_at",
      "scheduled_at",
      "recipient_count",
    ];
    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "created_at";
    const sortDirection = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // ★★★ [수정 포인트] LIMIT/OFFSET은 ? 대신 직접 넣기 (에러 해결) ★★★
    const query = `
      SELECT * FROM messages 
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    // params.push(limit, offset); <-- 이 줄을 제거했습니다!

    const results = await this.executeQuery(query, params);

    // 전체 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM messages ${whereClause}`;
    const countResult = await this.executeQuery(countQuery, params);
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
   * 통계 조회
   */
  async getStatistics(options = {}) {
    const { dateFrom, dateTo, type } = options;
    let whereClause = "WHERE 1=1";
    const params = [];

    if (dateFrom) {
      whereClause += " AND created_at >= ?";
      params.push(`${dateFrom} 00:00:00`);
    }
    if (dateTo) {
      whereClause += " AND created_at <= ?";
      params.push(`${dateTo} 23:59:59`);
    }
    if (type && type !== "all") {
      whereClause += " AND type = ?";
      params.push(type);
    }

    const query = `
      SELECT 
        COUNT(*) as total_sent,
        SUM(case when status = 'sent' then 1 else 0 end) as success_count,
        SUM(case when status = 'failed' then 1 else 0 end) as failed_count,
        COUNT(DISTINCT DATE(created_at)) as days_count
      FROM messages
      ${whereClause}
    `;

    const results = await this.executeQuery(query, params);
    return results[0];
  }
}

module.exports = Message;
