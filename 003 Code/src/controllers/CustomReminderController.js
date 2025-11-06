const CustomReminder = require('../models/CustomReminder');
const Recipient = require('../models/Recipient');
const logger = require('../utils/logger');

class CustomReminderController {
  constructor() {
    this.customReminderModel = new CustomReminder();
    this.recipientModel = new Recipient();
  }

  /**
   * 맞춤 알림 목록 조회
   */
  async getCustomReminders(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        recipient_id,
        is_active,
        schedule_type,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        recipientId: recipient_id,
        isActive: is_active !== undefined ? is_active === 'true' : undefined,
        scheduleType: schedule_type,
        sortBy: sort_by,
        sortOrder: sort_order
      };

      const result = await this.customReminderModel.findAll(options);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('맞춤 알림 목록 조회 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '맞춤 알림 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 맞춤 알림 상세 조회
   */
  async getCustomReminder(req, res) {
    try {
      const { id } = req.params;
      const reminder = await this.customReminderModel.findById(id);

      if (!reminder) {
        return res.status(404).json({
          error: 'Custom reminder not found',
          message: '맞춤 알림을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: reminder
      });

    } catch (error) {
      logger.error('맞춤 알림 상세 조회 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '맞춤 알림 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 수신자별 맞춤 알림 조회
   */
  async getRecipientReminders(req, res) {
    try {
      const { recipient_id } = req.params;
      const { is_active } = req.query;

      // 수신자 존재 확인
      const recipient = await this.recipientModel.findById(recipient_id);
      if (!recipient) {
        return res.status(404).json({
          error: 'Recipient not found',
          message: '수신자를 찾을 수 없습니다.'
        });
      }

      const options = {
        recipientId: recipient_id,
        isActive: is_active !== undefined ? is_active === 'true' : undefined
      };

      const reminders = await this.customReminderModel.findByRecipientId(recipient_id, options);

      res.json({
        success: true,
        data: {
          recipient,
          reminders
        }
      });

    } catch (error) {
      logger.error('수신자별 맞춤 알림 조회 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '수신자별 맞춤 알림 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 맞춤 알림 등록
   */
  async createCustomReminder(req, res) {
    try {
      const { 
        recipient_id, 
        title, 
        message, 
        schedule_type, 
        schedule_time, 
        schedule_day,
        created_by 
      } = req.body;

      // 필수 필드 검증
      if (!recipient_id || !title || !message || !schedule_type || !schedule_time) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: '수신자 ID, 제목, 메시지, 반복 유형, 시간은 필수 입력 항목입니다.'
        });
      }

      // 수신자 존재 확인
      const recipient = await this.recipientModel.findById(recipient_id);
      if (!recipient) {
        return res.status(404).json({
          error: 'Recipient not found',
          message: '수신자를 찾을 수 없습니다.'
        });
      }

      if (!recipient.is_active) {
        return res.status(400).json({
          error: 'Recipient inactive',
          message: '비활성화된 수신자입니다.'
        });
      }

      // 수신자당 최대 알림 수 확인 (5개 제한)
      const existingReminders = await this.customReminderModel.findByRecipientId(recipient_id, { isActive: true });
      if (existingReminders.length >= 5) {
        return res.status(400).json({
          error: 'Maximum reminders exceeded',
          message: '수신자당 최대 5개의 맞춤 알림만 등록할 수 있습니다.'
        });
      }

      // 반복 유형별 schedule_day 검증
      if (schedule_type === 'weekly' && (!schedule_day || schedule_day < 1 || schedule_day > 7)) {
        return res.status(400).json({
          error: 'Invalid schedule day for weekly',
          message: '주간 반복의 경우 요일(1-7)을 입력해주세요.'
        });
      }

      if (schedule_type === 'monthly' && (!schedule_day || schedule_day < 1 || schedule_day > 31)) {
        return res.status(400).json({
          error: 'Invalid schedule day for monthly',
          message: '월간 반복의 경우 일(1-31)을 입력해주세요.'
        });
      }

      // 가족 관계 확인 로직 (간단한 구현)
      const relationshipVerified = await this.verifyFamilyRelationship(recipient_id, created_by || req.user.username);
      if (!relationshipVerified) {
        logger.warn('가족 관계 확인 실패:', { 
          recipientId: recipient_id, 
          createdBy: created_by || req.user.username 
        });
        // 경고만 로그에 남기고 계속 진행 (실제 구현에서는 더 엄격한 검증 필요)
      }

      const reminderData = {
        recipient_id,
        title,
        message,
        schedule_type,
        schedule_time,
        schedule_day: schedule_type === 'daily' ? null : schedule_day,
        created_by: created_by || req.user.username
      };

      const reminder = await this.customReminderModel.create(reminderData);

      logger.info('맞춤 알림 등록:', { 
        reminderId: reminder.id, 
        recipientId: recipient_id,
        title,
        createdBy: req.user.username 
      });

      res.status(201).json({
        success: true,
        message: '맞춤 알림이 성공적으로 등록되었습니다.',
        data: reminder
      });

    } catch (error) {
      logger.error('맞춤 알림 등록 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '맞춤 알림 등록 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 맞춤 알림 수정
   */
  async updateCustomReminder(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 맞춤 알림 존재 확인
      const existingReminder = await this.customReminderModel.findById(id);
      if (!existingReminder) {
        return res.status(404).json({
          error: 'Custom reminder not found',
          message: '맞춤 알림을 찾을 수 없습니다.'
        });
      }

      // 반복 유형별 schedule_day 검증
      if (updateData.schedule_type === 'weekly' && updateData.schedule_day && 
          (updateData.schedule_day < 1 || updateData.schedule_day > 7)) {
        return res.status(400).json({
          error: 'Invalid schedule day for weekly',
          message: '주간 반복의 경우 요일(1-7)을 입력해주세요.'
        });
      }

      if (updateData.schedule_type === 'monthly' && updateData.schedule_day && 
          (updateData.schedule_day < 1 || updateData.schedule_day > 31)) {
        return res.status(400).json({
          error: 'Invalid schedule day for monthly',
          message: '월간 반복의 경우 일(1-31)을 입력해주세요.'
        });
      }

      // daily 타입인 경우 schedule_day를 null로 설정
      if (updateData.schedule_type === 'daily') {
        updateData.schedule_day = null;
      }

      const updatedReminder = await this.customReminderModel.update(id, updateData);

      logger.info('맞춤 알림 수정:', { 
        reminderId: id, 
        updatedBy: req.user.username 
      });

      res.json({
        success: true,
        message: '맞춤 알림이 성공적으로 수정되었습니다.',
        data: updatedReminder
      });

    } catch (error) {
      logger.error('맞춤 알림 수정 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '맞춤 알림 수정 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 맞춤 알림 삭제
   */
  async deleteCustomReminder(req, res) {
    try {
      const { id } = req.params;

      // 맞춤 알림 존재 확인
      const existingReminder = await this.customReminderModel.findById(id);
      if (!existingReminder) {
        return res.status(404).json({
          error: 'Custom reminder not found',
          message: '맞춤 알림을 찾을 수 없습니다.'
        });
      }

      await this.customReminderModel.delete(id);

      logger.info('맞춤 알림 삭제:', { 
        reminderId: id, 
        deletedBy: req.user.username 
      });

      res.json({
        success: true,
        message: '맞춤 알림이 성공적으로 삭제되었습니다.'
      });

    } catch (error) {
      logger.error('맞춤 알림 삭제 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '맞춤 알림 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 맞춤 알림 활성화/비활성화
   */
  async toggleCustomReminder(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (is_active === undefined) {
        return res.status(400).json({
          error: 'Missing is_active field',
          message: '활성화 상태를 입력해주세요.'
        });
      }

      // 맞춤 알림 존재 확인
      const existingReminder = await this.customReminderModel.findById(id);
      if (!existingReminder) {
        return res.status(404).json({
          error: 'Custom reminder not found',
          message: '맞춤 알림을 찾을 수 없습니다.'
        });
      }

      await this.customReminderModel.update(id, { is_active });

      logger.info('맞춤 알림 상태 변경:', { 
        reminderId: id, 
        isActive: is_active,
        changedBy: req.user.username 
      });

      res.json({
        success: true,
        message: `맞춤 알림이 ${is_active ? '활성화' : '비활성화'}되었습니다.`
      });

    } catch (error) {
      logger.error('맞춤 알림 상태 변경 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '맞춤 알림 상태 변경 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 발송 예정 맞춤 알림 조회
   */
  async getScheduledReminders(req, res) {
    try {
      const { date, time } = req.query;
      
      const scheduledReminders = await this.customReminderModel.findScheduledReminders(date, time);

      res.json({
        success: true,
        data: scheduledReminders
      });

    } catch (error) {
      logger.error('발송 예정 맞춤 알림 조회 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '발송 예정 맞춤 알림 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 맞춤 알림 통계 조회
   */
  async getStatistics(req, res) {
    try {
      const stats = await this.customReminderModel.getStatistics();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('맞춤 알림 통계 조회 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '통계 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 가족 관계 확인 (간단한 구현)
   * 실제 구현에서는 더 복잡한 검증 로직이 필요
   */
  async verifyFamilyRelationship(recipientId, createdBy) {
    try {
      // 현재는 간단히 true 반환
      // 실제 구현에서는 가족 관계 데이터베이스나 외부 API 연동 필요
      return true;
    } catch (error) {
      logger.error('가족 관계 확인 오류:', error);
      return false;
    }
  }
}

module.exports = CustomReminderController;