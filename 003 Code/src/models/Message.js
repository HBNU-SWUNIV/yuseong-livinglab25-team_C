const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

/**
 * 메시지 모델
 * Message model for managing SMS messages
 */
class Message extends BaseModel {
  constructor() {
    super('messages');
  }

  /**
   * 메시지 데이터 유효성 검증
   */
  validateMessageData(data) {
    const errors = [];

    // 필수 필드 검증
    if (!data.type) {
      errors.push('메시지 유형은 필수 입력 항목입니다.');
    }

    if (!data.content || data.content.trim().length === 0) {
      errors.push('메시지 내용은 필수 입력 항목입니다.');
    }

    // 메시지 유형 검증
    const validTypes = ['daily', 'emergency', 'welfare', 'custom'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push('올바른 메시지 유형이 아닙니다.');
    }

    // 제목 길이 검증
    if (data.title && data.title.length > 100) {
      errors.push('제목은 100자를 초과할 수 없습니다.');
    }

    // 메시지 내용 길이 검증 (SMS 90자 제한)
    if (data.content && data.content.length > 90) {
      errors.push('메시지 내용은 90자를 초과할 수 없습니다.');
    }

    // 예약 시간 검증
    if (data.scheduled_at) {
      const scheduledTime = new Date(data.scheduled_at);
      const now = new Date();
      if (scheduledTime <= now) {
        errors.push('예약 시간은 현재 시간보다 이후여야 합니다.');
      }
    }

    return errors;
  }

  /**
   * 메시지 생성
   */
  async createMessage(data) {
    // 데이터 유효성 검증
    const validationErrors = this.validateMessageData(data);
    if (validationErrors.length > 0) {
      throw new Error(`유효성 검증 실패: ${validationErrors.join(', ')}`);
    }

    try {
      const messageId = await this.create(data);
      logger.info(`새 메시지 생성: ID ${messageId}, 유형 ${data.type}`);
      return messageId;
    } catch (error) {
      logger.error('메시지 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 메시지 상태 업데이트
   */
  async updateMessageStatus(id, status, additionalData = {}) {
    const validStatuses = ['pending', 'sending', 'sent', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('올바른 메시지 상태가 아닙니다.');
    }

    const updateData = { status, ...additionalData };
    
    // 발송 완료 시 발송 시간 기록
    if (status === 'sent' && !updateData.sent_at) {
      updateData.sent_at = new Date();
    }

    try {
      const success = await this.update(id, updateData);
      if (success) {
        logger.info(`메시지 상태 업데이트: ID ${id}, 상태 ${status}`);
      }
      return success;
    } catch (error) {
      logger.error('메시지 상태 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 발송 대기 중인 메시지 조회
   */
  async findPendingMessages() {
    const query = `
      SELECT * FROM messages 
      WHERE status = 'pending' 
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      ORDER BY created_at ASC
    `;
    return await this.executeQuery(query);
  }

  /**
   * 예약된 메시지 조회
   */
  async findScheduledMessages() {
    const query = `
      SELECT * FROM messages 
      WHERE status = 'pending' 
      AND scheduled_at > NOW()
      ORDER BY scheduled_at ASC
    `;
    return await this.executeQuery(query);
  }

  /**
   * 메시지 유형별 조회
   */
  async findByType(type, limit = null) {
    const conditions = { type };
    return await this.findAll(conditions, 'created_at DESC', limit);
  }

  /**
   * 최근 메시지 조회
   */
  async findRecentMessages(days = 7, limit = 50) {
    const query = `
      SELECT * FROM messages 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return await this.executeQuery(query, [days, limit]);
  }

  /**
   * 메시지 발송 통계 조회
   */
  async getMessageStats(startDate = null, endDate = null) {
    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause = 'WHERE created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      whereClause = 'WHERE created_at >= ?';
      params.push(startDate);
    }

    const queries = [
      {
        key: 'total',
        query: `SELECT COUNT(*) as count FROM messages ${whereClause}`
      },
      {
        key: 'sent',
        query: `SELECT COUNT(*) as count FROM messages ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'sent'`
      },
      {
        key: 'failed',
        query: `SELECT COUNT(*) as count FROM messages ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'failed'`
      },
      {
        key: 'pending',
        query: `SELECT COUNT(*) as count FROM messages ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'pending'`
      }
    ];

    const stats = {};
    for (const { key, query } of queries) {
      const queryParams = whereClause ? [...params] : [];
      if (key !== 'total') {
        queryParams.push(...params);
      }
      const result = await this.executeQuery(query, queryParams);
      stats[key] = result[0].count;
    }

    // 성공률 계산
    stats.successRate = stats.total > 0 ? 
      ((stats.sent / stats.total) * 100).toFixed(2) : 0;

    return stats;
  }

  /**
   * 메시지 유형별 통계
   */
  async getMessageStatsByType() {
    const query = `
      SELECT 
        type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(success_count) as total_recipients,
        SUM(failed_count) as failed_recipients
      FROM messages 
      GROUP BY type
    `;
    
    const results = await this.executeQuery(query);
    
    // 성공률 계산
    return results.map(row => ({
      ...row,
      successRate: row.total > 0 ? 
        ((row.sent / row.total) * 100).toFixed(2) : 0,
      recipientSuccessRate: row.total_recipients > 0 ? 
        (((row.total_recipients - row.failed_recipients) / row.total_recipients) * 100).toFixed(2) : 0
    }));
  }

  /**
   * 일일 발송 통계 (최근 30일)
   */
  async getDailyStats(days = 30) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as message_count,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
        SUM(success_count) as recipient_count,
        SUM(failed_count) as failed_count
      FROM messages 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    return await this.executeQuery(query, [days]);
  }

  /**
   * 메시지 예약 취소
   */
  async cancelScheduledMessage(id) {
    const message = await this.findById(id);
    if (!message) {
      throw new Error('메시지를 찾을 수 없습니다.');
    }

    if (message.status !== 'pending') {
      throw new Error('대기 중인 메시지만 취소할 수 있습니다.');
    }

    try {
      const success = await this.updateMessageStatus(id, 'cancelled');
      if (success) {
        logger.info(`예약 메시지 취소: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('메시지 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 메시지 발송 결과 업데이트
   */
  async updateSendingResults(id, successCount, failedCount) {
    const updateData = {
      success_count: successCount,
      failed_count: failedCount,
      recipient_count: successCount + failedCount,
      status: failedCount === 0 ? 'sent' : (successCount === 0 ? 'failed' : 'sent'),
      sent_at: new Date()
    };

    try {
      const success = await this.update(id, updateData);
      if (success) {
        logger.info(`메시지 발송 결과 업데이트: ID ${id}, 성공 ${successCount}, 실패 ${failedCount}`);
      }
      return success;
    } catch (error) {
      logger.error('발송 결과 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 페이지네이션과 필터를 지원하는 메시지 목록 조회
   */
  async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      type,
      status,
      dateFrom,
      dateTo,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 메시지 유형 필터
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    // 상태 필터
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // 날짜 범위 필터
    if (dateFrom) {
      whereClause += ' AND created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND created_at <= ?';
      params.push(dateTo);
    }

    // 정렬 조건
    const allowedSortFields = ['created_at', 'sent_at', 'type', 'status', 'recipient_count'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const query = `
      SELECT * FROM messages 
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const results = await this.executeQuery(query, params);

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM messages ${whereClause}`;
    const countParams = params.slice(0, -2); // limit, offset 제외
    const countResult = await this.executeQuery(countQuery, countParams);
    const total = countResult[0].total;

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 통계 정보 조회
   */
  async getStatistics(options = {}) {
    const { dateFrom, dateTo, type } = options;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (dateFrom) {
      whereClause += ' AND created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND created_at <= ?';
      params.push(dateTo);
    }

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    // 기본 통계
    const basicStatsQuery = `
      SELECT 
        COUNT(*) as total_messages,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_messages,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_messages,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_messages,
        SUM(recipient_count) as total_recipients,
        SUM(success_count) as successful_sends,
        SUM(failed_count) as failed_sends
      FROM messages ${whereClause}
    `;

    const basicStats = await this.executeQuery(basicStatsQuery, params);
    const stats = basicStats[0];

    // 성공률 계산
    stats.message_success_rate = stats.total_messages > 0 ? 
      ((stats.sent_messages / stats.total_messages) * 100).toFixed(2) : 0;
    
    stats.recipient_success_rate = stats.total_recipients > 0 ? 
      ((stats.successful_sends / stats.total_recipients) * 100).toFixed(2) : 0;

    // 유형별 통계
    const typeStatsQuery = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(recipient_count) as recipients
      FROM messages ${whereClause}
      GROUP BY type
    `;

    const typeStats = await this.executeQuery(typeStatsQuery, params);
    stats.by_type = typeStats;

    return stats;
  }
}

module.exports = Message;