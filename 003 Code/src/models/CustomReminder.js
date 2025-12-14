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

      if (!data.recipient_id) errors.push('수신자 ID는 필수입니다.');
      if (!data.title?.trim()) errors.push('제목은 필수입니다.');
      if (!data.message?.trim()) errors.push('메시지는 필수입니다.');
      if (!data.schedule_type) errors.push('반복 유형은 필수입니다.');
      if (!data.schedule_time) errors.push('발송 시간은 필수입니다.');

      if (data.title && data.title.length > 100)
        errors.push('제목은 100자를 초과할 수 없습니다.');

      if (data.message && data.message.length > 90)
        errors.push('메시지는 90자를 초과할 수 없습니다.');

      const validTypes = ['daily', 'weekly', 'monthly'];
      if (data.schedule_type && !validTypes.includes(data.schedule_type))
        errors.push('반복 유형이 올바르지 않습니다.');

    return errors;
  }

    // ===========================
    //  생성
    // ===========================
    async createReminder(data) {
      const errors = this.validateReminderData(data);
      if (errors.length) {
        throw new Error(errors.join(', '));
      }

      const count = await this.countByRecipient(data.recipient_id);
      const max = parseInt(process.env.MAX_CUSTOM_REMINDERS_PER_RECIPIENT) || 5;
      if (count >= max) {
        throw new Error(`수신자당 최대 ${max}개의 알림만 저장할 수 있습니다.`);
      }

      const id = await this.create(data);
      logger.info(`맞춤 알림 생성 완료: ${id}`);
      return id;
    }

    async countByRecipient(recipientId) {
      const r = await this.executeQuery(
        'SELECT COUNT(*) as count FROM custom_reminders WHERE recipient_id = ? AND is_active = true',
        [recipientId]
      );
      return r[0].count;
    }

    // ===========================
    //  Scheduler와 목록 조회가 사용하는 함수
    // ===========================
    async findAllWithOptions(options = {}) {
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
      const params = [];
      let where = 'WHERE 1=1';

      if (recipientId) {
        where += ' AND cr.recipient_id = ?';
        params.push(recipientId);
      }

      if (isActive !== undefined) {
        where += ' AND cr.is_active = ?';
        params.push(isActive);
      }

      if (scheduleType) {
        where += ' AND cr.schedule_type = ?';
        params.push(scheduleType);
      }

      const allowed = ['created_at', 'title', 'schedule_time', 'schedule_type'];
      const sortField = allowed.includes(sortBy) ? `cr.${sortBy}` : 'cr.created_at';
      const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';

      const query = `
        SELECT cr.*, r.name AS recipient_name, r.phone_number
        FROM custom_reminders cr
        LEFT JOIN recipients r ON r.id = cr.recipient_id
        ${where}
        ORDER BY ${sortField} ${direction}
        LIMIT ?, ?
      `;

      params.push(limit, offset);
      const rows = await this.executeQuery(query, params);

      // 총 개수
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM custom_reminders cr
        LEFT JOIN recipients r ON r.id = cr.recipient_id
        ${where}
      `;
      const count = await this.executeQuery(countQuery, params.slice(0, -2));

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total: count[0].total,
          totalPages: Math.ceil(count[0].total / limit)
        }
      };
    }
      // ===========================
    //  활성된 알림 전체 조회 (Scheduler 사용)
    // ===========================
    async findActiveReminders() {
      return await this.executeQuery(
        `
        SELECT cr.*, r.name AS recipient_name, r.phone_number
        FROM custom_reminders cr
        LEFT JOIN recipients r ON r.id = cr.recipient_id
        WHERE cr.is_active = true
        ORDER BY cr.schedule_time ASC
        `
      );
    }

    // ===========================
    //  기존 findAll() 완전히 제거됨!!!
    // ===========================

    // ===========================
    //  스케줄 실행용 due reminders
    // ===========================
    async findDueReminders() {
      const now = new Date();
      const time = now.toTimeString().slice(0, 5);
      const day = now.getDay() || 7;
      const date = now.getDate();

      const query = `
        SELECT cr.*, r.name, r.phone_number
        FROM custom_reminders cr
        JOIN recipients r ON r.id = cr.recipient_id
        WHERE cr.is_active = true
        AND r.is_active = true
        AND cr.schedule_time = ?
        AND (
          (cr.schedule_type = 'daily')
          OR (cr.schedule_type = 'weekly' AND cr.schedule_day = ?)
          OR (cr.schedule_type = 'monthly' AND cr.schedule_day = ?)
        )
      `;
      return this.executeQuery(query, [time, day, date]);
    }
  }

  module.exports = CustomReminder;