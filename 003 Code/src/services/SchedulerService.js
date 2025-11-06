const cron = require('node-cron');
const PublicDataService = require('./PublicDataService');
const SmsService = require('./SmsService');
const Recipient = require('../models/Recipient');
const CustomReminder = require('../models/CustomReminder');
const logger = require('../utils/logger');

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
    
    // 스케줄러 작업 저장소
    this.scheduledTasks = new Map();
    
    // 긴급 알림 모니터링 상태
    this.emergencyMonitoringActive = false;
    this.lastDisasterCheck = null;
    
    logger.info('SchedulerService initialized');
  }

  /**
   * 모든 스케줄러 시작
   */
  async startAllSchedulers() {
    try {
      logger.info('Starting all schedulers...');
      
      // 일일 날씨 발송 스케줄러 (매일 오전 7시)
      this.startDailyWeatherScheduler();
      
      // 공공 데이터 수집 스케줄러들
      this.startWeatherDataScheduler();
      this.startAirQualityDataScheduler();
      
      // 긴급 알림 모니터링 시작
      await this.startEmergencyMonitoring();
      
      // 맞춤 알림 스케줄러 시작
      await this.startCustomReminderSchedulers();
      
      logger.info('All schedulers started successfully');
      
    } catch (error) {
      logger.error('Failed to start schedulers:', error);
      throw error;
    }
  }

  /**
   * 일일 날씨 발송 스케줄러 시작 (매일 오전 7시)
   * 요구사항: 1.1 - 매일 오전 7시에 등록된 모든 수신자에게 날씨 정보를 발송해야 한다
   */
  startDailyWeatherScheduler() {
    const taskName = 'daily-weather';
    
    // 기존 작업이 있으면 중지
    if (this.scheduledTasks.has(taskName)) {
      this.scheduledTasks.get(taskName).stop();
    }
    
    // 매일 오전 7시에 실행 (0 7 * * *)
    const task = cron.schedule('0 7 * * *', async () => {
      await this.sendDailyWeatherMessage();
    }, {
      scheduled: true,
      timezone: 'Asia/Seoul'
    });
    
    this.scheduledTasks.set(taskName, task);
    logger.info('Daily weather scheduler started (7:00 AM daily)');
  }

  /**
   * 날씨 데이터 수집 스케줄러 시작 (매시간)
   * 요구사항: 6.1 - 매시간 날씨API에서 날씨 데이터를 자동으로 가져와야 한다
   */
  startWeatherDataScheduler() {
    const taskName = 'weather-data-collection';
    
    // 기존 작업이 있으면 중지
    if (this.scheduledTasks.has(taskName)) {
      this.scheduledTasks.get(taskName).stop();
    }
    
    // 매시간 정각에 실행 (0 * * * *)
    const task = cron.schedule('0 * * * *', async () => {
      await this.collectWeatherData();
    }, {
      scheduled: true,
      timezone: 'Asia/Seoul'
    });
    
    this.scheduledTasks.set(taskName, task);
    logger.info('Weather data collection scheduler started (hourly)');
  }

  /**
   * 미세먼지 데이터 수집 스케줄러 시작 (2시간마다)
   * 요구사항: 6.2 - 2시간마다 미세먼지API에서 미세먼지 데이터를 자동으로 가져와야 한다
   */
  startAirQualityDataScheduler() {
    const taskName = 'air-quality-data-collection';
    
    // 기존 작업이 있으면 중지
    if (this.scheduledTasks.has(taskName)) {
      this.scheduledTasks.get(taskName).stop();
    }
    
    // 2시간마다 실행 (0 */2 * * *)
    const task = cron.schedule('0 */2 * * *', async () => {
      await this.collectAirQualityData();
    }, {
      scheduled: true,
      timezone: 'Asia/Seoul'
    });
    
    this.scheduledTasks.set(taskName, task);
    logger.info('Air quality data collection scheduler started (every 2 hours)');
  }

  /**
   * 일일 날씨 메시지 발송 실행
   */
  async sendDailyWeatherMessage() {
    try {
      logger.info('Starting daily weather message broadcast');
      
      // 활성 수신자 목록 조회
      const recipients = await this.recipientModel.findActiveRecipients();
      if (recipients.length === 0) {
        logger.warn('No active recipients found for daily weather message');
        return;
      }
      
      // 날씨 및 미세먼지 데이터 조회
      const [weatherData, airQualityData] = await Promise.all([
        this.publicDataService.getWeatherData(),
        this.publicDataService.getAirQualityData()
      ]);
      
      // 메시지 발송
      const result = await this.smsService.sendDailyWeatherMessage(
        recipients,
        weatherData,
        airQualityData
      );
      
      if (result.success) {
        logger.info(`Daily weather message sent successfully`, {
          totalRecipients: result.totalRecipients,
          successCount: result.successCount,
          failureCount: result.failureCount
        });
      } else {
        logger.error('Daily weather message failed:', result.error);
      }
      
    } catch (error) {
      logger.error('Failed to send daily weather message:', error);
    }
  }

  /**
   * 날씨 데이터 수집 실행
   */
  async collectWeatherData() {
    try {
      logger.info('Collecting weather data');
      
      const weatherData = await this.publicDataService.getWeatherData(true);
      
      logger.info('Weather data collected successfully', {
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        region: weatherData.region
      });
      
    } catch (error) {
      logger.error('Failed to collect weather data:', error);
    }
  }

  /**
   * 미세먼지 데이터 수집 실행
   */
  async collectAirQualityData() {
    try {
      logger.info('Collecting air quality data');
      
      const airQualityData = await this.publicDataService.getAirQualityData(true);
      
      logger.info('Air quality data collected successfully', {
        pm10Grade: airQualityData.pm10Grade,
        pm25Grade: airQualityData.pm25Grade,
        khaiGrade: airQualityData.khaiGrade,
        region: airQualityData.region
      });
      
    } catch (error) {
      logger.error('Failed to collect air quality data:', error);
    }
  }

  /**
   * 긴급 알림 모니터링 시작
   * 요구사항: 6.3 - 재난API를 지속적으로 모니터링하여 긴급 알림을 확인해야 한다
   */
  async startEmergencyMonitoring() {
    if (this.emergencyMonitoringActive) {
      logger.warn('Emergency monitoring is already active');
      return;
    }
    
    this.emergencyMonitoringActive = true;
    this.lastDisasterCheck = new Date();
    
    // 5분마다 긴급 알림 확인
    const taskName = 'emergency-monitoring';
    const task = cron.schedule('*/5 * * * *', async () => {
      await this.checkEmergencyAlerts();
    }, {
      scheduled: true,
      timezone: 'Asia/Seoul'
    });
    
    this.scheduledTasks.set(taskName, task);
    logger.info('Emergency monitoring started (every 5 minutes)');
  }

  /**
   * 긴급 알림 확인 및 발송
   * 요구사항: 2.1, 2.2, 2.3, 2.5 - 재난 상황 감지 시 즉시 알림 발송
   */
  async checkEmergencyAlerts() {
    try {
      logger.info('Checking for emergency alerts');
      
      // 긴급 재난 알림 조회
      const emergencyAlerts = await this.publicDataService.getEmergencyAlerts();
      
      if (emergencyAlerts.length === 0) {
        logger.debug('No emergency alerts found');
        return;
      }
      
      // 새로운 긴급 알림만 필터링 (마지막 확인 시간 이후)
      const newAlerts = emergencyAlerts.filter(alert => {
        const alertTime = new Date(alert.createDate);
        return alertTime > this.lastDisasterCheck;
      });
      
      if (newAlerts.length === 0) {
        logger.debug('No new emergency alerts since last check');
        this.lastDisasterCheck = new Date();
        return;
      }
      
      logger.warn(`Found ${newAlerts.length} new emergency alerts`, {
        alerts: newAlerts.map(alert => ({
          type: alert.disasterType,
          location: alert.locationName,
          time: alert.createDate
        }))
      });
      
      // 활성 수신자 목록 조회
      const recipients = await this.recipientModel.findActiveRecipients();
      if (recipients.length === 0) {
        logger.warn('No active recipients found for emergency alerts');
        this.lastDisasterCheck = new Date();
        return;
      }
      
      // 각 긴급 알림에 대해 메시지 발송
      for (const alert of newAlerts) {
        try {
          const result = await this.smsService.sendEmergencyAlert(recipients, alert);
          
          if (result.success) {
            logger.info(`Emergency alert sent successfully`, {
              alertType: alert.disasterType,
              totalRecipients: result.totalRecipients,
              successCount: result.successCount,
              failureCount: result.failureCount
            });
          } else {
            logger.error('Emergency alert failed:', result.error);
          }
          
          // 긴급 알림 간 짧은 대기 (API 제한 방지)
          await this.sleep(1000);
          
        } catch (error) {
          logger.error(`Failed to send emergency alert for ${alert.disasterType}:`, error);
        }
      }
      
      this.lastDisasterCheck = new Date();
      
    } catch (error) {
      logger.error('Failed to check emergency alerts:', error);
    }
  }

  /**
   * 맞춤 알림 스케줄러들 시작
   */
  async startCustomReminderSchedulers() {
    try {
      logger.info('Starting custom reminder schedulers');
      
      // 활성 맞춤 알림 목록 조회
      const activeReminders = await this.customReminderModel.findActiveReminders();
      
      for (const reminder of activeReminders) {
        await this.scheduleCustomReminder(reminder);
      }
      
      logger.info(`Started ${activeReminders.length} custom reminder schedulers`);
      
    } catch (error) {
      logger.error('Failed to start custom reminder schedulers:', error);
    }
  }

  /**
   * 개별 맞춤 알림 스케줄링
   */
  async scheduleCustomReminder(reminder) {
    try {
      const taskName = `custom-reminder-${reminder.id}`;
      
      // 기존 작업이 있으면 중지
      if (this.scheduledTasks.has(taskName)) {
        this.scheduledTasks.get(taskName).stop();
      }
      
      // 스케줄 패턴 생성
      const cronPattern = this.generateCronPattern(reminder);
      if (!cronPattern) {
        logger.warn(`Invalid schedule for reminder ${reminder.id}`);
        return;
      }
      
      // 스케줄러 등록
      const task = cron.schedule(cronPattern, async () => {
        await this.sendCustomReminder(reminder);
      }, {
        scheduled: true,
        timezone: 'Asia/Seoul'
      });
      
      this.scheduledTasks.set(taskName, task);
      
      logger.info(`Custom reminder scheduled: ${reminder.title} (${cronPattern})`);
      
    } catch (error) {
      logger.error(`Failed to schedule custom reminder ${reminder.id}:`, error);
    }
  }

  /**
   * 맞춤 알림 발송 실행
   */
  async sendCustomReminder(reminder) {
    try {
      logger.info(`Sending custom reminder: ${reminder.title}`);
      
      // 수신자 정보 조회
      const recipient = await this.recipientModel.findById(reminder.recipient_id);
      if (!recipient || !recipient.is_active) {
        logger.warn(`Recipient not found or inactive for reminder ${reminder.id}`);
        return;
      }
      
      // 맞춤 알림 발송
      const result = await this.smsService.sendCustomReminder(recipient, reminder);
      
      if (result.success) {
        logger.info(`Custom reminder sent successfully: ${reminder.title} to ${recipient.name}`);
      } else {
        logger.error(`Custom reminder failed: ${result.error}`);
      }
      
    } catch (error) {
      logger.error(`Failed to send custom reminder ${reminder.id}:`, error);
    }
  }

  /**
   * 맞춤 알림을 위한 cron 패턴 생성
   */
  generateCronPattern(reminder) {
    const [hour, minute] = reminder.schedule_time.split(':').map(Number);
    
    switch (reminder.schedule_type) {
      case 'daily':
        // 매일 지정된 시간
        return `${minute} ${hour} * * *`;
        
      case 'weekly':
        // 매주 지정된 요일의 지정된 시간
        const dayOfWeek = reminder.schedule_day || 1; // 1=월요일, 7=일요일
        return `${minute} ${hour} * * ${dayOfWeek}`;
        
      case 'monthly':
        // 매월 지정된 일의 지정된 시간
        const dayOfMonth = reminder.schedule_day || 1;
        return `${minute} ${hour} ${dayOfMonth} * *`;
        
      default:
        logger.warn(`Unknown schedule type: ${reminder.schedule_type}`);
        return null;
    }
  }

  /**
   * 특정 스케줄러 중지
   */
  stopScheduler(taskName) {
    if (this.scheduledTasks.has(taskName)) {
      this.scheduledTasks.get(taskName).stop();
      this.scheduledTasks.delete(taskName);
      logger.info(`Scheduler stopped: ${taskName}`);
      return true;
    }
    return false;
  }

  /**
   * 모든 스케줄러 중지
   */
  stopAllSchedulers() {
    logger.info('Stopping all schedulers...');
    
    for (const [taskName, task] of this.scheduledTasks) {
      task.stop();
      logger.info(`Stopped scheduler: ${taskName}`);
    }
    
    this.scheduledTasks.clear();
    this.emergencyMonitoringActive = false;
    
    logger.info('All schedulers stopped');
  }

  /**
   * 스케줄러 상태 조회
   */
  getSchedulerStatus() {
    const activeSchedulers = Array.from(this.scheduledTasks.keys());
    
    return {
      totalSchedulers: activeSchedulers.length,
      activeSchedulers,
      emergencyMonitoringActive: this.emergencyMonitoringActive,
      lastDisasterCheck: this.lastDisasterCheck
    };
  }

  /**
   * 맞춤 알림 스케줄러 재시작 (새로운 알림 추가 시 사용)
   */
  async restartCustomReminderSchedulers() {
    logger.info('Restarting custom reminder schedulers');
    
    // 기존 맞춤 알림 스케줄러들 중지
    const customReminderTasks = Array.from(this.scheduledTasks.keys())
      .filter(taskName => taskName.startsWith('custom-reminder-'));
    
    for (const taskName of customReminderTasks) {
      this.stopScheduler(taskName);
    }
    
    // 맞춤 알림 스케줄러들 재시작
    await this.startCustomReminderSchedulers();
  }

  /**
   * 수동 데이터 수집 실행
   */
  async manualDataCollection() {
    try {
      logger.info('Starting manual data collection');
      
      const results = await this.publicDataService.updateAllData();
      
      logger.info('Manual data collection completed', { results });
      return results;
      
    } catch (error) {
      logger.error('Manual data collection failed:', error);
      throw error;
    }
  }

  /**
   * 수동 긴급 알림 확인
   */
  async manualEmergencyCheck() {
    try {
      logger.info('Starting manual emergency check');
      
      await this.checkEmergencyAlerts();
      
      logger.info('Manual emergency check completed');
      
    } catch (error) {
      logger.error('Manual emergency check failed:', error);
      throw error;
    }
  }

  /**
   * 지연 함수
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SchedulerService;