const cron = require("node-cron");
const PublicDataService = require("./PublicDataService");
const SmsService = require("./SmsService");
const Recipient = require("../models/Recipient");
const CustomReminder = require("../models/CustomReminder");
const Message = require("../models/Message"); // [추가] 메시지 모델 필요
const logger = require("../utils/logger");

/**
 * 스케줄러 서비스
 * 정기 작업 및 자동화된 메시지 발송을 관리합니다.
 */
class SchedulerService {
  constructor() {
    this.publicDataService = new PublicDataService();
    this.smsService = new SmsService();
    this.recipientModel = new Recipient();
    this.customReminderModel = new CustomReminder();
    this.messageModel = new Message(); // [추가] 메시지 모델 초기화

    // 스케줄러 작업 저장소
    this.scheduledTasks = new Map();

    // 긴급 알림 모니터링 상태
    this.emergencyMonitoringActive = false;
    this.lastDisasterCheck = null;

    logger.info("SchedulerService initialized");
  }

  /**
   * 모든 스케줄러 시작
   */
  async startAllSchedulers() {
    try {
      logger.info("Starting all schedulers...");

      // 1. 일일 날씨 발송 스케줄러 (매일 오전 7시)
      this.startDailyWeatherScheduler();

      // 2. 날씨 위험 모니터링 스케줄러 (매일 오전 9시)
      this.startWeatherRiskMonitoring();

      // 3. [NEW] 예약 메시지 체크 스케줄러 (1분마다 실행) ★★★
      this.startScheduledMessageCheck();

      // 4. 공공 데이터 수집 스케줄러들
      this.startWeatherDataScheduler();
      this.startAirQualityDataScheduler();

      // 5. 긴급 알림 모니터링 시작
      await this.startEmergencyMonitoring();

      // 6. 맞춤 알림 스케줄러 시작
      await this.startCustomReminderSchedulers();

      logger.info("All schedulers started successfully");
    } catch (error) {
      logger.error("Failed to start schedulers:", error);
      throw error;
    }
  }

  /**
   * [NEW] 예약된 메시지 확인 및 발송 (1분마다)
   */
  startScheduledMessageCheck() {
    const taskName = "scheduled-message-check";

    if (this.scheduledTasks.has(taskName)) {
      this.scheduledTasks.get(taskName).stop();
    }

    // 매 분(minute) 0초마다 실행 (* * * * *)
    const task = cron.schedule(
      "* * * * *",
      async () => {
        await this.checkAndSendScheduledMessages();
      },
      {
        scheduled: true,
        timezone: "Asia/Seoul",
      }
    );

    this.scheduledTasks.set(taskName, task);
    logger.info("Scheduled message checker started (every minute)");
  }

  /**
   * [NEW] 실제 예약 메시지 조회 및 발송 로직
   */
  async checkAndSendScheduledMessages() {
    try {
      // 1. "대기중(pending)"이고 "현재시간보다 이전(과거)"인 예약 메시지 조회
      const query = `
        SELECT * FROM messages 
        WHERE status = 'pending' 
        AND scheduled_at IS NOT NULL 
        AND scheduled_at <= NOW()
      `;
      const pendingMessages = await this.messageModel.executeQuery(query);

      if (pendingMessages.length === 0) return;

      logger.info(
        `🕒 예약 발송 메시지 ${pendingMessages.length}건 발견! 발송 시작...`
      );

      // 2. 수신자 목록 조회 (현재는 '전체 발송'으로 가정)
      const recipients = await this.recipientModel.findActiveRecipients();

      // 3. 각 메시지 순차 발송
      for (const msg of pendingMessages) {
        // 상태를 먼저 'sending'으로 변경 (중복 발송 방지)
        await this.messageModel.update(msg.id, {
          status: "sending",
          sent_at: new Date(),
        });

        // 발송 수행 (SmsService 활용)
        const results = await this.smsService.sendToMultipleRecipients(
          recipients,
          msg.content,
          msg.id,
          msg.type
        );

        // 결과에 따라 상태 업데이트 (sent / failed)
        await this.smsService.updateMessageStatus(msg.id, results);

        logger.info(
          `✅ 예약 메시지(ID:${msg.id}) 발송 완료: 성공 ${results.successCount}건`
        );
      }
    } catch (error) {
      logger.error("예약 메시지 처리 중 오류:", error);
    }
  }

  /**
   * 일일 날씨 발송 스케줄러 시작 (매일 오전 7시)
   */
  startDailyWeatherScheduler() {
    const taskName = "daily-weather";
    if (this.scheduledTasks.has(taskName))
      this.scheduledTasks.get(taskName).stop();

    const task = cron.schedule(
      "0 7 * * *",
      async () => {
        await this.sendDailyWeatherMessage();
      },
      { scheduled: true, timezone: "Asia/Seoul" }
    );

    this.scheduledTasks.set(taskName, task);
    logger.info("Daily weather scheduler started (7:00 AM daily)");
  }

  /**
   * 날씨 위험 모니터링 (매일 오전 9시)
   */
  startWeatherRiskMonitoring() {
    const taskName = "weather-risk-monitoring";
    if (this.scheduledTasks.has(taskName))
      this.scheduledTasks.get(taskName).stop();

    const task = cron.schedule(
      "0 9 * * *",
      async () => {
        await this.checkWeatherRisk();
      },
      { scheduled: true, timezone: "Asia/Seoul" }
    );

    this.scheduledTasks.set(taskName, task);
    logger.info("Weather risk monitoring scheduler started (9:00 AM daily)");
  }

  /**
   * 날씨 위험 확인 로직
   */
  async checkWeatherRisk() {
    try {
      logger.info("☀️ [스케줄러] 날씨 위험 모니터링 시작...");
      const weatherData = await this.publicDataService.getWeatherData();

      if (!weatherData || weatherData.temperature === undefined) {
        logger.warn("⚠️ 날씨 데이터를 가져올 수 없습니다.");
        return;
      }

      const currentTemp = parseFloat(weatherData.temperature);
      logger.info(`🌡️ 현재 유성구 기온: ${currentTemp}°C`);

      let alertTitle = "";
      let alertMessage = "";

      if (currentTemp >= 33) {
        alertTitle = "[유성구 폭염경보]";
        alertMessage = `현재 기온 ${currentTemp}도. 야외 활동을 자제하고 물을 자주 마셔주세요. - 유성구청`;
      } else if (currentTemp <= -12) {
        alertTitle = "[유성구 한파경보]";
        alertMessage = `현재 기온 ${currentTemp}도. 외출 시 따뜻하게 입으시고 수도 동파에 유의하세요. - 유성구청`;
      } else {
        logger.info("✅ 특이사항 없음 (정상 기온)");
        return;
      }

      logger.info(`🚨 ${alertTitle} 발령! 수신자 조회 중...`);
      const recipients = await this.recipientModel.findActiveRecipients();

      if (recipients.length === 0) return;

      // 실제 발송 로직 (SmsService 사용)
      const results = await this.smsService.sendEmergencyAlert(recipients, {
        type: alertTitle,
        msg: alertMessage,
      });

      logger.info(`날씨 위험 문자 발송 완료: ${results.successCount}건 성공`);
    } catch (error) {
      logger.error("❌ 날씨 위험 모니터링 중 오류:", error);
    }
  }

  startWeatherDataScheduler() {
    const taskName = "weather-data-collection";
    if (this.scheduledTasks.has(taskName))
      this.scheduledTasks.get(taskName).stop();
    const task = cron.schedule(
      "0 * * * *",
      async () => {
        await this.collectWeatherData();
      },
      { scheduled: true, timezone: "Asia/Seoul" }
    );
    this.scheduledTasks.set(taskName, task);
    logger.info("Weather data collection scheduler started (hourly)");
  }

  startAirQualityDataScheduler() {
    const taskName = "air-quality-data-collection";
    if (this.scheduledTasks.has(taskName))
      this.scheduledTasks.get(taskName).stop();
    const task = cron.schedule(
      "0 */2 * * *",
      async () => {
        await this.collectAirQualityData();
      },
      { scheduled: true, timezone: "Asia/Seoul" }
    );
    this.scheduledTasks.set(taskName, task);
    logger.info(
      "Air quality data collection scheduler started (every 2 hours)"
    );
  }

  async sendDailyWeatherMessage() {
    try {
      logger.info("Starting daily weather message broadcast");
      const recipients = await this.recipientModel.findActiveRecipients();
      if (recipients.length === 0) return;

      const [weatherData, airQualityData] = await Promise.all([
        this.publicDataService.getWeatherData(),
        this.publicDataService.getAirQualityData(),
      ]);

      const result = await this.smsService.sendDailyWeatherMessage(
        recipients,
        weatherData,
        airQualityData
      );

      if (result.success)
        logger.info(`Daily weather message sent successfully`);
      else logger.error("Daily weather message failed:", result.error);
    } catch (error) {
      logger.error("Failed to send daily weather message:", error);
    }
  }

  async collectWeatherData() {
    try {
      await this.publicDataService.getWeatherData(true);
      logger.info("Weather data collected successfully");
    } catch (error) {
      logger.error("Failed to collect weather data:", error);
    }
  }

  async collectAirQualityData() {
    try {
      await this.publicDataService.getAirQualityData(true);
      logger.info("Air quality data collected successfully");
    } catch (error) {
      logger.error("Failed to collect air quality data:", error);
    }
  }

  async startEmergencyMonitoring() {
    if (this.emergencyMonitoringActive) return;
    this.emergencyMonitoringActive = true;
    this.lastDisasterCheck = new Date();
    const taskName = "emergency-monitoring";
    const task = cron.schedule(
      "*/5 * * * *",
      async () => {
        await this.checkEmergencyAlerts();
      },
      { scheduled: true, timezone: "Asia/Seoul" }
    );
    this.scheduledTasks.set(taskName, task);
    logger.info("Emergency monitoring started (every 5 minutes)");
  }

  async checkEmergencyAlerts() {
    try {
      const emergencyAlerts = await this.publicDataService.getEmergencyAlerts();
      if (emergencyAlerts.length === 0) return;

      const newAlerts = emergencyAlerts.filter(
        (alert) => new Date(alert.createDate) > this.lastDisasterCheck
      );
      if (newAlerts.length === 0) {
        this.lastDisasterCheck = new Date();
        return;
      }

      const recipients = await this.recipientModel.findActiveRecipients();
      if (recipients.length === 0) return;

      for (const alert of newAlerts) {
        await this.smsService.sendEmergencyAlert(recipients, alert);
        await this.sleep(1000);
      }
      this.lastDisasterCheck = new Date();
    } catch (error) {
      logger.error("Failed to check emergency alerts:", error);
    }
  }

  async startCustomReminderSchedulers() {
    try {
      const activeReminders =
        await this.customReminderModel.findActiveReminders();
      for (const reminder of activeReminders) {
        await this.scheduleCustomReminder(reminder);
      }
      logger.info(
        `Started ${activeReminders.length} custom reminder schedulers`
      );
    } catch (error) {
      logger.error("Failed to start custom reminder schedulers:", error);
    }
  }

  async scheduleCustomReminder(reminder) {
    try {
      const taskName = `custom-reminder-${reminder.id}`;
      if (this.scheduledTasks.has(taskName))
        this.scheduledTasks.get(taskName).stop();

      const cronPattern = this.generateCronPattern(reminder);
      if (!cronPattern) return;

      const task = cron.schedule(
        cronPattern,
        async () => {
          await this.sendCustomReminder(reminder);
        },
        { scheduled: true, timezone: "Asia/Seoul" }
      );

      this.scheduledTasks.set(taskName, task);
    } catch (error) {
      logger.error(`Failed to schedule custom reminder ${reminder.id}:`, error);
    }
  }

  async sendCustomReminder(reminder) {
    try {
      const recipient = await this.recipientModel.findById(
        reminder.recipient_id
      );
      if (!recipient || !recipient.is_active) return;
      await this.smsService.sendCustomReminder(recipient, reminder);
    } catch (error) {
      logger.error(`Failed to send custom reminder ${reminder.id}:`, error);
    }
  }

  generateCronPattern(reminder) {
    const [hour, minute] = reminder.schedule_time.split(":").map(Number);
    switch (reminder.schedule_type) {
      case "daily":
        return `${minute} ${hour} * * *`;
      case "weekly":
        return `${minute} ${hour} * * ${reminder.schedule_day || 1}`;
      case "monthly":
        return `${minute} ${hour} ${reminder.schedule_day || 1} * *`;
      default:
        return null;
    }
  }

  stopAllSchedulers() {
    logger.info("Stopping all schedulers...");
    for (const [taskName, task] of this.scheduledTasks) {
      task.stop();
      logger.info(`Stopped scheduler: ${taskName}`);
    }
    this.scheduledTasks.clear();
    this.emergencyMonitoringActive = false;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = SchedulerService;
