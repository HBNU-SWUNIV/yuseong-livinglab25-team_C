const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

/**
 * 메시지 로그 모델
 * Message log model for tracking SMS delivery status
 */
class MessageLog extends BaseModel {
  constructor() {
    super('message_logs');
  }

  /**
   * 메시지 로그 데이터 유효성 검증
   */
  validateLogData(data) {
    const errors = [];

    // 필수 필드 검증
    if (!data.message_id) {
      errors.push('메시지 ID는 필수 입력 항목입니다.');
    }

    if (!data.phone_number || data.phone_number.trim().length === 0) {
      errors.push('전화번호는 필수 입력 항목입니다.');
    }

    if (!data.status) {
      errors.push('발송 상태는 필수 입력 항목입니다.');
    }

    // 상태 값 검증
    const validStatuses = ['sent', 'failed'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('올바른 발송 상태가 아닙니다.');
    }

    // 전화번호 형식 검증
    if (data.phone_number) {
      const phoneRegex = /^01[0-9][0-9]{7,8}$/;
      if (!phoneRegex.test(data.phone_number.replace(/[^0-9]/g, ''))) {
        errors.push('올바른 전화번호 형식이 아닙니다.');
      }
    }

    return errors;
  }

  /**
   * 발송 로그 생성
   */
  async createLog(data) {
    // 데이터 유효성 검증
    const validationErrors = this.validateLogData(data);
    if (validationErrors.length > 0) {
      throw new Error(`유효성 검증 실패: ${validationErrors.join(', ')}`);
    }

    // 전화번호 정규화
    const normalizedData = {
      ...data,
      phone_number: data.phone_number.replace(/[^0-9]/g, ''),
      sent_at: data.sent_at || new Date()
    };

    try {
      const logId = await this.create(normalizedData);
      return logId;
    } catch (error) {
      logger.error('메시지 로그 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 일괄 로그 생성
   */
  async createBulkLogs(logs) {
    if (!Array.isArray(logs) || logs.length === 0) {
      throw new Error('로그 데이터가 올바르지 않습니다.');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // 트랜잭션으로 일괄 처리
    const queries = [];
    for (const [index, logData] of logs.entries()) {
      try {
        // 데이터 유효성 검증
        const validationErrors = this.validateLogData(logData);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
        }

        // 전화번호 정규화
        const normalizedData = {
          ...logData,
          phone_number: logData.phone_number.replace(/[^0-9]/g, ''),
          sent_at: logData.sent_at || new Date()
        };

        const fields = Object.keys(normalizedData);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        
        queries.push({
          query,
          params: Object.values(normalizedData)
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: index + 1,
          data: logData,
          error: error.message
        });
      }
    }

    // 유효한 로그만 일괄 삽입
    if (queries.length > 0) {
      try {
        await this.executeTransaction(queries);
        logger.info(`일괄 로그 생성 완료: 성공 ${results.success}건, 실패 ${results.failed}건`);
      } catch (error) {
        logger.error('일괄 로그 생성 실패:', error);
        throw error;
      }
    }

    return results;
  }

  /**
   * 메시지별 발송 로그 조회
   */
  async findByMessageId(messageId) {
    const query = `
      SELECT ml.*, r.name as recipient_name 
      FROM message_logs ml
      LEFT JOIN recipients r ON ml.recipient_id = r.id
      WHERE ml.message_id = ?
      ORDER BY ml.sent_at DESC
    `;
    return await this.executeQuery(query, [messageId]);
  }

  /**
   * 수신자별 발송 로그 조회
   */
  async findByRecipientId(recipientId, limit = 50) {
    const query = `
      SELECT ml.*, m.type, m.title, m.content 
      FROM message_logs ml
      LEFT JOIN messages m ON ml.message_id = m.id
      WHERE ml.recipient_id = ?
      ORDER BY ml.sent_at DESC
      LIMIT ?
    `;
    return await this.executeQuery(query, [recipientId, limit]);
  }

  /**
   * 전화번호별 발송 로그 조회
   */
  async findByPhoneNumber(phoneNumber, limit = 50) {
    const normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');
    const query = `
      SELECT ml.*, m.type, m.title, m.content 
      FROM message_logs ml
      LEFT JOIN messages m ON ml.message_id = m.id
      WHERE ml.phone_number = ?
      ORDER BY ml.sent_at DESC
      LIMIT ?
    `;
    return await this.executeQuery(query, [normalizedPhone, limit]);
  }

  /**
   * 발송 실패 로그 조회
   */
  async findFailedLogs(startDate = null, endDate = null, limit = 100) {
    let query = `
      SELECT ml.*, m.type, m.title, r.name as recipient_name
      FROM message_logs ml
      LEFT JOIN messages m ON ml.message_id = m.id
      LEFT JOIN recipients r ON ml.recipient_id = r.id
      WHERE ml.status = 'failed'
    `;
    const params = [];

    if (startDate && endDate) {
      query += ' AND ml.sent_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND ml.sent_at >= ?';
      params.push(startDate);
    }

    query += ' ORDER BY ml.sent_at DESC LIMIT ?';
    params.push(limit);

    return await this.executeQuery(query, params);
  }

  /**
   * 발송 통계 조회
   */
  async getDeliveryStats(startDate = null, endDate = null) {
    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause = 'WHERE sent_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      whereClause = 'WHERE sent_at >= ?';
      params.push(startDate);
    }

    const queries = [
      {
        key: 'total',
        query: `SELECT COUNT(*) as count FROM message_logs ${whereClause}`
      },
      {
        key: 'sent',
        query: `SELECT COUNT(*) as count FROM message_logs ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'sent'`
      },
      {
        key: 'failed',
        query: `SELECT COUNT(*) as count FROM message_logs ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'failed'`
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
   * 일별 발송 통계
   */
  async getDailyDeliveryStats(days = 30) {
    const query = `
      SELECT 
        DATE(sent_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM message_logs 
      WHERE sent_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(sent_at)
      ORDER BY date DESC
    `;
    
    const results = await this.executeQuery(query, [days]);
    
    // 성공률 계산
    return results.map(row => ({
      ...row,
      successRate: row.total > 0 ? 
        ((row.sent / row.total) * 100).toFixed(2) : 0
    }));
  }

  /**
   * 실패 사유별 통계
   */
  async getFailureReasonStats(days = 30) {
    const query = `
      SELECT 
        error_message,
        COUNT(*) as count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM message_logs WHERE status = 'failed' AND sent_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) as percentage
      FROM message_logs 
      WHERE status = 'failed' 
      AND sent_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND error_message IS NOT NULL
      GROUP BY error_message
      ORDER BY count DESC
      LIMIT 10
    `;
    
    return await this.executeQuery(query, [days, days]);
  }

  /**
   * 오래된 로그 정리 (6개월 이상)
   */
  async cleanupOldLogs(retentionDays = 180) {
    const query = `
      DELETE FROM message_logs 
      WHERE sent_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    try {
      const result = await this.executeQuery(query, [retentionDays]);
      logger.info(`오래된 로그 정리 완료: ${result.affectedRows}건 삭제`);
      return result.affectedRows;
    } catch (error) {
      logger.error('로그 정리 실패:', error);
      throw error;
    }
  }

  /**
   * 메시지별 발송 성공률 조회
   */
  async getMessageDeliveryRate(messageId) {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM message_logs 
      WHERE message_id = ?
    `;
    
    const result = await this.executeQuery(query, [messageId]);
    const stats = result[0];
    
    return {
      ...stats,
      successRate: stats.total > 0 ? 
        ((stats.sent / stats.total) * 100).toFixed(2) : 0
    };
  }
}

module.exports = MessageLog;