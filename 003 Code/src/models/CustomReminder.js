const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

/**
 * 맞춤 알림 모델
 * Custom reminder model for personalized notifications
 */
class CustomReminder extends BaseModel {
  constructor() {
    super('custom_reminders');
  }

  /**
   * 맞춤 알림 데이터 유효성 검증
   */
  validateReminderData(data) {
    const errors = [];

    // 필수 필드 검증
    if (!data.recipient_id) {
      errors.push('수신자 ID는 필수 입력 항목입니다.');
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.push('알림 제목은 필수 입력 항목입니다.');
    }

    if (!data.message || data.message.trim().length === 0) {
      errors.push('알림 메시지는 필수 입력 항목입니다.');
    }

    if (!data.schedule_type) {
      errors.push('반복 유형은 필수 입력 항목입니다.');
    }

    if (!data.schedule_time) {
      errors.push('발송 시간은 필수 입력 항목입니다.');
    }

    // 제목 길이 검증
    if (data.title && data.title.length > 100) {
      errors.push('제목은 100자를 초과할 수 없습니다.');
    }

    // 메시지 길이 검증 (SMS 90자 제한)
    if (data.message && data.message.length > 90) {
      errors.push('메시지는 90자를 초과할 수 없습니다.');
    }

    // 반복 유형 검증
    const validScheduleTypes = ['daily', 'weekly', 'monthly'];
    if (data.schedule_type && !validScheduleTypes.includes(data.schedule_type)) {
      errors.push('올바른 반복 유형이 아닙니다.');
    }

    // 시간 형식 검증
    if (data.schedule_time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(data.schedule_time)) {
        errors.push('시간은 HH:MM 형식이어야 합니다.');
      }
    }

    // 요일/일 검증
    if (data.schedule_type === 'weekly' && data.schedule_day) {
      if (data.schedule_day < 1 || data.schedule_day > 7) {
        errors.push('주간 반복의 경우 요일은 1-7 사이여야 합니다.');
      }
    }

    if (data.schedule_type === 'monthly' && data.schedule_day) {
      if (data.schedule_day < 1 || data.schedule_day > 31) {
        errors.push('월간 반복의 경우 일은 1-31 사이여야 합니다.');
      }
    }

    return errors;
  }

  /**
   * 맞춤 알림 생성
   */
  async createReminder(data) {
    // 데이터 유효성 검증
    const validationErrors = this.validateReminderData(data);
    if (validationErrors.length > 0) {
      throw new Error(`유효성 검증 실패: ${validationErrors.join(', ')}`);
    }

    // 수신자당 최대 알림 수 확인
    const existingCount = await this.countByRecipient(data.recipient_id);
    const maxReminders = parseInt(process.env.MAX_CUSTOM_REMINDERS_PER_RECIPIENT) || 5;
    
    if (existingCount >= maxReminders) {
      throw new Error(`수신자당 최대 ${maxReminders}개의 맞춤 알림만 등록할 수 있습니다.`);
    }

    try {
      const reminderId = await this.create(data);
      logger.info(`새 맞춤 알림 생성: ID ${reminderId}, 수신자 ${data.recipient_id}`);
      return reminderId;
    } catch (error) {
      logger.error('맞춤 알림 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 수신자별 알림 수 조회
   */
  async countByRecipient(recipientId) {
    const query = 'SELECT COUNT(*) as count FROM custom_reminders WHERE recipient_id = ? AND is_active = true';
    const result = await this.executeQuery(query, [recipientId]);
    return result[0].count;
  }

  /**
   * 수신자별 맞춤 알림 조회
   */
  async findByRecipientId(recipientId, activeOnly = true) {
    const conditions = { recipient_id: recipientId };
    if (activeOnly) {
      conditions.is_active = true;
    }
    return await this.findAll(conditions, 'schedule_time ASC');
  }

  /**
   * 활성 맞춤 알림 조회
   */
  async findActiveReminders() {
    return await this.findAll({ is_active: true }, 'schedule_time ASC');
  }

  /**
   * 발송 대상 알림 조회 (현재 시간 기준)
   */
  async findDueReminders() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM 형식
    const currentDay = now.getDay() || 7; // 일요일을 7로 변환
    const currentDate = now.getDate();

    const query = `
      SELECT cr.*, r.name as recipient_name, r.phone_number
      FROM custom_reminders cr
      JOIN recipients r ON cr.recipient_id = r.id
      WHERE cr.is_active = true 
      AND r.is_active = true
      AND cr.schedule_time = ?
      AND (
        (cr.schedule_type = 'daily') OR
        (cr.schedule_type = 'weekly' AND cr.schedule_day = ?) OR
        (cr.schedule_type = 'monthly' AND cr.schedule_day = ?)
      )
      AND (
        cr.last_sent_at IS NULL OR 
        DATE(cr.last_sent_at) < CURDATE()
      )
    `;

    return await this.executeQuery(query, [currentTime, currentDay, currentDate]);
  }

  /**
   * 마지막 발송 시간 업데이트
   */
  async updateLastSentTime(id, sentTime = null) {
    const updateData = {
      last_sent_at: sentTime || new Date()
    };

    try {
      const success = await this.update(id, updateData);
      if (success) {
        logger.info(`맞춤 알림 발송 시간 업데이트: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('발송 시간 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 맞춤 알림 수정
   */
  async updateReminder(id, data) {
    // 데이터 유효성 검증
    const validationErrors = this.validateReminderData(data);
    if (validationErrors.length > 0) {
      throw new Error(`유효성 검증 실패: ${validationErrors.join(', ')}`);
    }

    try {
      const success = await this.update(id, data);
      if (success) {
        logger.info(`맞춤 알림 수정: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('맞춤 알림 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 맞춤 알림 비활성화
   */
  async deactivateReminder(id) {
    try {
      const success = await this.update(id, { is_active: false });
      if (success) {
        logger.info(`맞춤 알림 비활성화: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('맞춤 알림 비활성화 실패:', error);
      throw error;
    }
  }

  /**
   * 맞춤 알림 활성화
   */
  async activateReminder(id) {
    try {
      const success = await this.update(id, { is_active: true });
      if (success) {
        logger.info(`맞춤 알림 활성화: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('맞춤 알림 활성화 실패:', error);
      throw error;
    }
  }

  /**
   * 수신자별 알림 통계
   */
  async getReminderStatsByRecipient(recipientId) {
    const queries = [
      {
        key: 'total',
        query: 'SELECT COUNT(*) as count FROM custom_reminders WHERE recipient_id = ?'
      },
      {
        key: 'active',
        query: 'SELECT COUNT(*) as count FROM custom_reminders WHERE recipient_id = ? AND is_active = true'
      },
      {
        key: 'daily',
        query: 'SELECT COUNT(*) as count FROM custom_reminders WHERE recipient_id = ? AND schedule_type = "daily" AND is_active = true'
      },
      {
        key: 'weekly',
        query: 'SELECT COUNT(*) as count FROM custom_reminders WHERE recipient_id = ? AND schedule_type = "weekly" AND is_active = true'
      },
      {
        key: 'monthly',
        query: 'SELECT COUNT(*) as count FROM custom_reminders WHERE recipient_id = ? AND schedule_type = "monthly" AND is_active = true'
      }
    ];

    const stats = {};
    for (const { key, query } of queries) {
      const result = await this.executeQuery(query, [recipientId]);
      stats[key] = result[0].count;
    }

    return stats;
  }

  /**
   * 전체 맞춤 알림 통계
   */
  async getReminderStats() {
    const queries = [
      {
        key: 'total',
        query: 'SELECT COUNT(*) as count FROM custom_reminders'
      },
      {
        key: 'active',
        query: 'SELECT COUNT(*) as count FROM custom_reminders WHERE is_active = true'
      },
      {
        key: 'daily',
        query: 'SELECT COUNT(*) as count FROM custom_reminders WHERE schedule_type = "daily" AND is_active = true'
      },
      {
        key: 'weekly',
        query: 'SELECT COUNT(*) as count FROM custom_reminders WHERE schedule_type = "weekly" AND is_active = true'
      },
      {
        key: 'monthly',
        query: 'SELECT COUNT(*) as count FROM custom_reminders WHERE schedule_type = "monthly" AND is_active = true'
      }
    ];

    const stats = {};
    for (const { key, query } of queries) {
      const result = await this.executeQuery(query);
      stats[key] = result[0].count;
    }

    return stats;
  }

  /**
   * 최근 발송된 맞춤 알림 조회
   */
  async findRecentSentReminders(days = 7, limit = 50) {
    const query = `
      SELECT cr.*, r.name as recipient_name, r.phone_number
      FROM custom_reminders cr
      JOIN recipients r ON cr.recipient_id = r.id
      WHERE cr.last_sent_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY cr.last_sent_at DESC
      LIMIT ?
    `;

    return await this.executeQuery(query, [days, limit]);
  }

  /**
   * 관계 확인 (가족 구성원 등)
   */
  async validateRelationship(recipientId, createdBy) {
    // 실제 구현에서는 별도의 관계 테이블이나 인증 시스템과 연동
    // 현재는 기본적인 검증만 수행
    if (!createdBy || createdBy.trim().length === 0) {
      throw new Error('설정자 정보는 필수입니다.');
    }

    // 수신자 존재 확인
    const recipient = await this.executeQuery(
      'SELECT id FROM recipients WHERE id = ? AND is_active = true',
      [recipientId]
    );

    if (recipient.length === 0) {
      throw new Error('존재하지 않거나 비활성화된 수신자입니다.');
    }

    return true;
  }

  /**
   * 페이지네이션과 필터를 지원하는 맞춤 알림 목록 조회
   */
  async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      recipientId,
      isActive,
      scheduleType,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 수신자 필터
    if (recipientId) {
      whereClause += ' AND cr.recipient_id = ?';
      params.push(recipientId);
    }

    // 활성 상태 필터
    if (isActive !== undefined) {
      whereClause += ' AND cr.is_active = ?';
      params.push(isActive);
    }

    // 반복 유형 필터
    if (scheduleType) {
      whereClause += ' AND cr.schedule_type = ?';
      params.push(scheduleType);
    }

    // 정렬 조건
    const allowedSortFields = ['created_at', 'schedule_time', 'title', 'schedule_type'];
    const sortField = allowedSortFields.includes(sortBy) ? `cr.${sortBy}` : 'cr.created_at';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const query = `
      SELECT cr.*, r.name as recipient_name, r.phone_number
      FROM custom_reminders cr
      LEFT JOIN recipients r ON cr.recipient_id = r.id
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const results = await this.executeQuery(query, params);

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM custom_reminders cr
      LEFT JOIN recipients r ON cr.recipient_id = r.id
      ${whereClause}
    `;
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
   * 수신자별 맞춤 알림 조회 (옵션 포함)
   */
  async findByRecipientId(recipientId, options = {}) {
    const { isActive } = options;
    
    let whereClause = 'WHERE cr.recipient_id = ?';
    const params = [recipientId];

    if (isActive !== undefined) {
      whereClause += ' AND cr.is_active = ?';
      params.push(isActive);
    }

    const query = `
      SELECT cr.*, r.name as recipient_name, r.phone_number
      FROM custom_reminders cr
      LEFT JOIN recipients r ON cr.recipient_id = r.id
      ${whereClause}
      ORDER BY cr.schedule_time ASC
    `;

    return await this.executeQuery(query, params);
  }

  /**
   * 발송 예정 맞춤 알림 조회
   */
  async findScheduledReminders(date = null, time = null) {
    const targetDate = date ? new Date(date) : new Date();
    const targetTime = time || targetDate.toTimeString().slice(0, 5);
    const dayOfWeek = targetDate.getDay() || 7; // 일요일을 7로 변환
    const dayOfMonth = targetDate.getDate();

    const query = `
      SELECT cr.*, r.name as recipient_name, r.phone_number
      FROM custom_reminders cr
      JOIN recipients r ON cr.recipient_id = r.id
      WHERE cr.is_active = true 
      AND r.is_active = true
      AND cr.schedule_time = ?
      AND (
        (cr.schedule_type = 'daily') OR
        (cr.schedule_type = 'weekly' AND cr.schedule_day = ?) OR
        (cr.schedule_type = 'monthly' AND cr.schedule_day = ?)
      )
    `;

    return await this.executeQuery(query, [targetTime, dayOfWeek, dayOfMonth]);
  }

  /**
   * 통계 정보 조회
   */
  async getStatistics() {
    // 기본 통계
    const basicStatsQuery = `
      SELECT 
        COUNT(*) as total_reminders,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_reminders,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_reminders
      FROM custom_reminders
    `;

    const basicStats = await this.executeQuery(basicStatsQuery);
    const stats = basicStats[0];

    // 유형별 통계
    const typeStatsQuery = `
      SELECT 
        schedule_type,
        COUNT(*) as count
      FROM custom_reminders 
      WHERE is_active = true
      GROUP BY schedule_type
    `;

    const typeStats = await this.executeQuery(typeStatsQuery);
    stats.by_type = typeStats.reduce((acc, row) => {
      acc[row.schedule_type] = row.count;
      return acc;
    }, {});

    // 수신자별 통계
    const recipientStatsQuery = `
      SELECT 
        COUNT(DISTINCT recipient_id) as recipients_with_reminders,
        AVG(reminder_count) as avg_reminders_per_recipient
      FROM (
        SELECT recipient_id, COUNT(*) as reminder_count
        FROM custom_reminders 
        WHERE is_active = true
        GROUP BY recipient_id
      ) as recipient_counts
    `;

    const recipientStats = await this.executeQuery(recipientStatsQuery);
    stats.recipients_with_reminders = recipientStats[0].recipients_with_reminders || 0;
    stats.avg_reminders_per_recipient = parseFloat(recipientStats[0].avg_reminders_per_recipient || 0).toFixed(2);

    return stats;
  }
}

module.exports = CustomReminder;