const Message = require("../models/Message");
const MessageLog = require("../models/MessageLog");
const Recipient = require("../models/Recipient");
const SmsService = require("../services/SmsService");
const MessageTemplateService = require("../services/MessageTemplateService");
const logger = require("../utils/logger");

class MessageController {
  constructor() {
    this.messageModel = new Message();
    this.messageLogModel = new MessageLog();
    this.recipientModel = new Recipient();
    this.smsService = new SmsService();
    this.templateService = new MessageTemplateService();
  }

  /**
   * 대시보드 통계 조회 (모든 데이터 통합)
   */
  async getDashboardStats(req, res) {
    try {
      // 1. 기본 통계 (수신자, 오늘발송, 성공률)
      const recipientQuery =
        "SELECT COUNT(*) as total FROM recipients WHERE is_active = 1";
      const recipientResult = await this.recipientModel.executeQuery(
        recipientQuery
      );
      const totalRecipients = recipientResult[0].total;

      const statsQuery = `
        SELECT 
          COUNT(*) as today_total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as today_success
        FROM messages
        WHERE created_at >= CURDATE()
      `;
      const statsResult = await this.messageModel.executeQuery(statsQuery);
      const { today_total, today_success } = statsResult[0];

      const successRate =
        today_total > 0 ? Math.round((today_success / today_total) * 100) : 0;

      // 2. 차트 데이터 (최근 7일)
      const trendQuery = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM messages
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
      `;
      const trendResult = await this.messageModel.executeQuery(trendQuery);

      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;
        const found = trendResult.find((row) => row.date === dateStr);

        chartData.push({
          name: monthDay,
          전체: found ? Number(found.total) : 0,
          성공: found ? Number(found.success) : 0,
          실패: found ? Number(found.failed) : 0,
        });
      }

      // ★★★ 3. [추가] 최근 메시지 목록 (5건) 조회 ★★★
      const recentQuery = `
        SELECT * FROM messages 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      const recentMessages = await this.messageModel.executeQuery(recentQuery);

      // 3-1. 최근 발송 이력 테이블용 데이터 가공
      const recentSends = recentMessages.map((msg, index) => {
        const date = new Date(msg.created_at);
        // DB 값을 한글로 예쁘게 변환
        const typeMap = {
          emergency: "긴급 알림",
          daily: "날씨 알림",
          welfare: "복지 알림",
          custom: "일반 메시지",
        };
        const statusMap = {
          sent: "성공",
          failed: "실패",
          pending: "대기중",
          sending: "발송중",
        };

        return {
          id: msg.id,
          no: index + 1,
          sendDate: `${date.getFullYear()}.${String(
            date.getMonth() + 1
          ).padStart(2, "0")}.${String(date.getDate()).padStart(
            2,
            "0"
          )} ${String(date.getHours()).padStart(2, "0")}:${String(
            date.getMinutes()
          ).padStart(2, "0")}`,
          messageType: typeMap[msg.type] || "기타",
          title: msg.title,
          recipientCount: msg.recipient_count || 0,
          sendMethod: msg.scheduled_at ? "예약 발송" : "즉시 발송",
          status: statusMap[msg.status] || msg.status,
          sender: "관리자", // 나중에 로그인 정보 연동 시 변경
        };
      });

      // 3-2. 시스템 알림 테이블용 데이터 가공 (메시지 상태를 기반으로 생성)
      // 별도의 시스템 로그 테이블이 없으므로, 메시지 이력을 기반으로 알림을 생성합니다.
      const systemAlerts = recentMessages.map((msg, index) => {
        const date = new Date(msg.created_at);
        let alertType = "알림";
        let severity = "info";
        let titleText = "";

        if (msg.status === "sent") {
          alertType = "발송 성공";
          severity = "정보"; // 초록/파랑 느낌
          titleText = `"${msg.title}" 메시지가 성공적으로 발송되었습니다.`;
        } else if (msg.status === "failed") {
          alertType = "발송 실패";
          severity = "경고"; // 빨강/주황 느낌
          titleText = `"${msg.title}" 메시지 발송 중 오류가 발생했습니다.`;
        } else if (msg.status === "pending") {
          alertType = "예약 등록";
          severity = "공지";
          titleText = `"${msg.title}" 메시지가 발송 대기열에 등록되었습니다.`;
        } else {
          alertType = "시스템 처리";
          severity = "정보";
          titleText = `"${msg.title}" 메시지를 처리하고 있습니다.`;
        }

        return {
          id: msg.id,
          no: index + 1,
          occurredDate: `${date.getFullYear()}.${String(
            date.getMonth() + 1
          ).padStart(2, "0")}.${String(date.getDate()).padStart(
            2,
            "0"
          )} ${String(date.getHours()).padStart(2, "0")}:${String(
            date.getMinutes()
          ).padStart(2, "0")}`,
          alertType: alertType,
          title: titleText,
          severity: severity,
        };
      });

      res.json({
        success: true,
        data: {
          totalRecipients,
          todayEmails: today_total,
          successRate,
          chartData,
          recentSends, // [추가] 최근 발송 이력
          systemAlerts, // [추가] 시스템 알림
        },
      });
    } catch (error) {
      logger.error("대시보드 통계 조회 실패:", error);
      res.status(500).json({ success: false, message: "통계 로드 실패" });
    }
  }

  // ... (나머지 getMessages, scheduleMessage, processSendMessage 등 기존 함수 유지) ...
  async getMessages(req, res) {
    try {
      const { page = 1, limit = 20, type, status } = req.query;
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        status,
      };
      const result = await this.messageModel.findAll(options);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error("메시지 목록 조회 오류:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getMessage(req, res) {
    try {
      const { id } = req.params;
      const message = await this.messageModel.findById(id);
      if (!message) return res.status(404).json({ error: "Message not found" });
      const logs = await this.messageLogModel.findByMessageId(id);
      res.json({ success: true, data: { ...message, logs } });
    } catch (error) {
      logger.error("메시지 상세 조회 오류:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async scheduleMessage(req, res) {
    try {
      const { type, title, content, scheduled_at, recipient_ids } = req.body;
      if (!type || !content)
        return res.status(400).json({ message: "필수 항목 누락" });

      let recipients = [];
      if (recipient_ids && recipient_ids.length > 0) {
        for (const recipientId of recipient_ids) {
          const recipient = await this.recipientModel.findById(recipientId);
          if (recipient && recipient.is_active) recipients.push(recipient);
        }
      } else {
        const allRecipients = await this.recipientModel.findAll({
          is_active: true,
        });
        recipients = allRecipients.data;
      }

      if (recipients.length === 0)
        return res.status(400).json({ message: "발송할 수신자가 없습니다." });

      const messageData = {
        type,
        title,
        content,
        scheduled_at: scheduled_at || null,
        status: scheduled_at ? "pending" : "sending",
        recipient_count: recipients.length,
        created_by: req.user ? req.user.username : "unknown",
      };

      const messageId = await this.messageModel.create(messageData);

      if (!scheduled_at) {
        this.processSendMessage(messageId, recipients);
        res
          .status(201)
          .json({ success: true, message: "메시지 발송이 시작되었습니다." });
      } else {
        res
          .status(201)
          .json({ success: true, message: "메시지가 예약되었습니다." });
      }
    } catch (error) {
      logger.error("메시지 예약 오류:", error);
      res.status(500).json({ message: "오류가 발생했습니다." });
    }
  }

  async sendMessage(req, res) {
    return this.scheduleMessage(req, res);
  }

  async processSendMessage(messageId, recipients) {
    try {
      const message = await this.messageModel.findById(messageId);
      if (!message) return;

      await this.messageModel.update(messageId, {
        status: "sending",
        sent_at: new Date(),
      });

      const results = await this.smsService.sendToMultipleRecipients(
        recipients,
        message.content,
        messageId,
        message.type
      );

      const finalStatus =
        results.failureCount === 0
          ? "sent"
          : results.successCount === 0
          ? "failed"
          : "sent";

      await this.messageModel.update(messageId, {
        status: finalStatus,
        success_count: results.successCount,
        failed_count: results.failureCount,
      });

      logger.info("메시지 발송 프로세스 완료:", {
        messageId,
        success: results.successCount,
        fail: results.failureCount,
      });
    } catch (error) {
      logger.error("메시지 발송 처리 중 치명적 오류:", error);
      await this.messageModel.update(messageId, { status: "failed" });
    }
  }
}

module.exports = MessageController;
