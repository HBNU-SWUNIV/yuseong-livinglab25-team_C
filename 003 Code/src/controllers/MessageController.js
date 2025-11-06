const Message = require('../models/Message');
const MessageLog = require('../models/MessageLog');
const Recipient = require('../models/Recipient');
const SmsService = require('../services/SmsService');
const MessageTemplateService = require('../services/MessageTemplateService');
const logger = require('../utils/logger');

class MessageController {
  constructor() {
    this.messageModel = new Message();
    this.messageLogModel = new MessageLog();
    this.recipientModel = new Recipient();
    this.smsService = new SmsService();
    this.templateService = new MessageTemplateService();
  }

  /**
   * 메시지 목록 조회
   */
  async getMessages(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type,
        status,
        date_from,
        date_to,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        status,
        dateFrom: date_from,
        dateTo: date_to,
        sortBy: sort_by,
        sortOrder: sort_order
      };

      const result = await this.messageModel.findAll(options);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('메시지 목록 조회 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '메시지 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 메시지 상세 조회
   */
  async getMessage(req, res) {
    try {
      const { id } = req.params;
      const message = await this.messageModel.findById(id);

      if (!message) {
        return res.status(404).json({
          error: 'Message not found',
          message: '메시지를 찾을 수 없습니다.'
        });
      }

      // 발송 로그도 함께 조회
      const logs = await this.messageLogModel.findByMessageId(id);

      res.json({
        success: true,
        data: {
          ...message,
          logs
        }
      });

    } catch (error) {
      logger.error('메시지 상세 조회 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '메시지 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 메시지 예약 발송
   */
  async scheduleMessage(req, res) {
    try {
      const { 
        type, 
        title, 
        content, 
        scheduled_at, 
        recipient_ids 
      } = req.body;

      // 필수 필드 검증
      if (!type || !content) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: '메시지 유형과 내용은 필수 입력 항목입니다.'
        });
      }

      // 메시지 길이 검증 (90자 제한)
      if (content.length > 90) {
        return res.status(400).json({
          error: 'Content too long',
          message: '메시지 내용은 90자를 초과할 수 없습니다.'
        });
      }

      // 예약 시간 검증
      if (scheduled_at) {
        const scheduledDate = new Date(scheduled_at);
        const now = new Date();
        
        if (scheduledDate <= now) {
          return res.status(400).json({
            error: 'Invalid schedule time',
            message: '예약 시간은 현재 시간보다 이후여야 합니다.'
          });
        }
      }

      // 수신자 확인
      let recipients = [];
      if (recipient_ids && recipient_ids.length > 0) {
        // 특정 수신자들에게 발송
        for (const recipientId of recipient_ids) {
          const recipient = await this.recipientModel.findById(recipientId);
          if (recipient && recipient.is_active) {
            recipients.push(recipient);
          }
        }
      } else {
        // 모든 활성 수신자에게 발송
        const allRecipients = await this.recipientModel.findAll({ is_active: true });
        recipients = allRecipients.data;
      }

      if (recipients.length === 0) {
        return res.status(400).json({
          error: 'No recipients found',
          message: '발송할 수신자가 없습니다.'
        });
      }

      // 메시지 생성
      const messageData = {
        type,
        title,
        content,
        scheduled_at: scheduled_at || null,
        status: scheduled_at ? 'pending' : 'sending',
        recipient_count: recipients.length,
        created_by: req.user.username
      };

      const message = await this.messageModel.create(messageData);

      // 즉시 발송인 경우
      if (!scheduled_at) {
        // 백그라운드에서 발송 처리
        this.processSendMessage(message.id, recipients);
        
        res.status(201).json({
          success: true,
          message: '메시지 발송이 시작되었습니다.',
          data: message
        });
      } else {
        // 예약 발송
        res.status(201).json({
          success: true,
          message: '메시지가 예약되었습니다.',
          data: message
        });
      }

      logger.info('메시지 예약/발송:', { 
        messageId: message.id, 
        type, 
        recipientCount: recipients.length,
        scheduledAt: scheduled_at,
        createdBy: req.user.username 
      });

    } catch (error) {
      logger.error('메시지 예약 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '메시지 예약 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 메시지 즉시 발송
   */
  async sendMessage(req, res) {
    try {
      const { type, title, content, recipient_ids } = req.body;

      // 필수 필드 검증
      if (!type || !content) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: '메시지 유형과 내용은 필수 입력 항목입니다.'
        });
      }

      // 메시지 길이 검증
      if (content.length > 90) {
        return res.status(400).json({
          error: 'Content too long',
          message: '메시지 내용은 90자를 초과할 수 없습니다.'
        });
      }

      // 수신자 확인
      let recipients = [];
      if (recipient_ids && recipient_ids.length > 0) {
        for (const recipientId of recipient_ids) {
          const recipient = await this.recipientModel.findById(recipientId);
          if (recipient && recipient.is_active) {
            recipients.push(recipient);
          }
        }
      } else {
        const allRecipients = await this.recipientModel.findAll({ is_active: true });
        recipients = allRecipients.data;
      }

      if (recipients.length === 0) {
        return res.status(400).json({
          error: 'No recipients found',
          message: '발송할 수신자가 없습니다.'
        });
      }

      // 메시지 생성
      const messageData = {
        type,
        title,
        content,
        status: 'sending',
        recipient_count: recipients.length,
        created_by: req.user.username
      };

      const message = await this.messageModel.create(messageData);

      // 백그라운드에서 발송 처리
      this.processSendMessage(message.id, recipients);

      res.status(201).json({
        success: true,
        message: '메시지 발송이 시작되었습니다.',
        data: message
      });

      logger.info('메시지 즉시 발송:', { 
        messageId: message.id, 
        type, 
        recipientCount: recipients.length,
        createdBy: req.user.username 
      });

    } catch (error) {
      logger.error('메시지 발송 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '메시지 발송 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 메시지 미리보기
   */
  async previewMessage(req, res) {
    try {
      const { type, content, template_data } = req.body;

      if (!content) {
        return res.status(400).json({
          error: 'Missing content',
          message: '메시지 내용이 필요합니다.'
        });
      }

      // 템플릿 처리 (필요한 경우)
      let processedContent = content;
      if (template_data) {
        processedContent = this.templateService.processTemplate(content, template_data);
      }

      // 메시지 길이 검증
      const isValidLength = processedContent.length <= 90;

      res.json({
        success: true,
        data: {
          original_content: content,
          processed_content: processedContent,
          character_count: processedContent.length,
          is_valid_length: isValidLength,
          max_length: 90
        }
      });

    } catch (error) {
      logger.error('메시지 미리보기 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '메시지 미리보기 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 발송 통계 조회
   */
  async getStatistics(req, res) {
    try {
      const { 
        date_from, 
        date_to, 
        type 
      } = req.query;

      const options = {
        dateFrom: date_from,
        dateTo: date_to,
        type
      };

      const stats = await this.messageModel.getStatistics(options);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('발송 통계 조회 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '통계 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 메시지 취소 (예약된 메시지만)
   */
  async cancelMessage(req, res) {
    try {
      const { id } = req.params;
      const message = await this.messageModel.findById(id);

      if (!message) {
        return res.status(404).json({
          error: 'Message not found',
          message: '메시지를 찾을 수 없습니다.'
        });
      }

      if (message.status !== 'pending') {
        return res.status(400).json({
          error: 'Cannot cancel message',
          message: '예약 대기 중인 메시지만 취소할 수 있습니다.'
        });
      }

      await this.messageModel.update(id, { 
        status: 'cancelled',
        updated_at: new Date()
      });

      logger.info('메시지 취소:', { 
        messageId: id, 
        cancelledBy: req.user.username 
      });

      res.json({
        success: true,
        message: '메시지가 취소되었습니다.'
      });

    } catch (error) {
      logger.error('메시지 취소 오류:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '메시지 취소 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 메시지 발송 처리 (백그라운드)
   */
  async processSendMessage(messageId, recipients) {
    try {
      const message = await this.messageModel.findById(messageId);
      if (!message) {
        logger.error('메시지를 찾을 수 없음:', messageId);
        return;
      }

      let successCount = 0;
      let failedCount = 0;

      // 메시지 상태를 발송 중으로 업데이트
      await this.messageModel.update(messageId, { 
        status: 'sending',
        sent_at: new Date()
      });

      // 각 수신자에게 발송
      for (const recipient of recipients) {
        try {
          const result = await this.smsService.sendSMS(
            recipient.phone_number,
            message.content
          );

          // 발송 로그 기록
          await this.messageLogModel.create({
            message_id: messageId,
            recipient_id: recipient.id,
            phone_number: recipient.phone_number,
            status: result.success ? 'sent' : 'failed',
            error_message: result.success ? null : result.error,
            gateway_response: result.response
          });

          if (result.success) {
            successCount++;
          } else {
            failedCount++;
          }

        } catch (error) {
          logger.error('개별 발송 실패:', { 
            recipientId: recipient.id, 
            error: error.message 
          });

          // 실패 로그 기록
          await this.messageLogModel.create({
            message_id: messageId,
            recipient_id: recipient.id,
            phone_number: recipient.phone_number,
            status: 'failed',
            error_message: error.message
          });

          failedCount++;
        }
      }

      // 메시지 상태 업데이트
      const finalStatus = failedCount === 0 ? 'sent' : 
                         successCount === 0 ? 'failed' : 'sent';

      await this.messageModel.update(messageId, {
        status: finalStatus,
        success_count: successCount,
        failed_count: failedCount
      });

      logger.info('메시지 발송 완료:', { 
        messageId, 
        successCount, 
        failedCount,
        totalRecipients: recipients.length
      });

    } catch (error) {
      logger.error('메시지 발송 처리 오류:', error);
      
      // 오류 발생 시 메시지 상태를 실패로 업데이트
      await this.messageModel.update(messageId, { 
        status: 'failed' 
      });
    }
  }
}

module.exports = MessageController;