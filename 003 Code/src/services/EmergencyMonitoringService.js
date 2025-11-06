const PublicDataService = require('./PublicDataService');
const SmsService = require('./SmsService');
const Recipient = require('../models/Recipient');
const logger = require('../utils/logger');

/**
 * 긴급 알림 모니터링 서비스
 * 재난 API를 실시간으로 모니터링하고 긴급 상황 감지 시 즉시 알림을 발송합니다.
 * 요구사항: 2.1, 2.2, 2.3, 2.5 - 5분 이내 발송 보장
 */
class EmergencyMonitoringService {
  constructor() {
    this.publicDataService = new PublicDataService();
    this.smsService = new SmsService();
    this.recipientModel = new Recipient();
    
    // 모니터링 상태
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.lastCheckTime = null;
    this.processedAlerts = new Set(); // 중복 처리 방지
    
    // 설정
    this.config = {
      checkInterval: 2 * 60 * 1000, // 2분마다 확인 (5분 이내 발송 보장을 위해)
      maxResponseTime: 5 * 60 * 1000, // 5분 최대 응답 시간
      retryAttempts: 3,
      retryDelay: 30 * 1000 // 30초 재시도 간격
    };
    
    logger.info('EmergencyMonitoringService initialized');
  }

  /**
   * 긴급 알림 모니터링 시작
   * 요구사항: 6.3 - 재난API를 지속적으로 모니터링하여 긴급 알림을 확인해야 한다
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      logger.warn('Emergency monitoring is already running');
      return;
    }

    try {
      this.isMonitoring = true;
      this.lastCheckTime = new Date();
      
      logger.info('Starting emergency monitoring system', {
        checkInterval: this.config.checkInterval / 1000 + ' seconds',
        maxResponseTime: this.config.maxResponseTime / 1000 + ' seconds'
      });

      // 즉시 첫 번째 확인 실행
      await this.performEmergencyCheck();

      // 정기적인 모니터링 시작
      this.monitoringInterval = setInterval(async () => {
        await this.performEmergencyCheck();
      }, this.config.checkInterval);

      logger.info('Emergency monitoring started successfully');

    } catch (error) {
      logger.error('Failed to start emergency monitoring:', error);
      this.isMonitoring = false;
      throw error;
    }
  }

  /**
   * 긴급 알림 모니터링 중지
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      logger.warn('Emergency monitoring is not running');
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    logger.info('Emergency monitoring stopped');
  }

  /**
   * 긴급 상황 확인 실행
   * 요구사항: 2.5 - 재난API에서 재난 정보를 받은 후 5분 이내에 긴급 알림을 발송해야 한다
   */
  async performEmergencyCheck() {
    const checkStartTime = new Date();
    
    try {
      logger.debug('Performing emergency check');

      // 긴급 재난 알림 조회
      const emergencyAlerts = await this.getEmergencyAlertsWithTimeout();

      if (!emergencyAlerts || emergencyAlerts.length === 0) {
        logger.debug('No emergency alerts found');
        this.lastCheckTime = checkStartTime;
        return;
      }

      // 새로운 알림만 필터링
      const newAlerts = this.filterNewAlerts(emergencyAlerts);

      if (newAlerts.length === 0) {
        logger.debug('No new emergency alerts since last check');
        this.lastCheckTime = checkStartTime;
        return;
      }

      logger.warn(`Detected ${newAlerts.length} new emergency alerts`, {
        alerts: newAlerts.map(alert => ({
          id: alert.serialNumber,
          type: alert.disasterType,
          location: alert.locationName,
          time: alert.createDate,
          emergency: alert.isEmergency
        }))
      });

      // 긴급 알림 처리
      await this.processEmergencyAlerts(newAlerts, checkStartTime);

      this.lastCheckTime = checkStartTime;

    } catch (error) {
      logger.error('Emergency check failed:', error);
      
      // 모니터링 실패 시에도 계속 진행
      this.lastCheckTime = checkStartTime;
    }
  }

  /**
   * 타임아웃이 적용된 긴급 알림 조회
   */
  async getEmergencyAlertsWithTimeout() {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Emergency alert API timeout'));
      }, 30000); // 30초 타임아웃

      try {
        const alerts = await this.publicDataService.getEmergencyAlerts();
        clearTimeout(timeout);
        resolve(alerts);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * 새로운 알림 필터링
   */
  filterNewAlerts(alerts) {
    return alerts.filter(alert => {
      // 이미 처리된 알림 제외
      if (this.processedAlerts.has(alert.serialNumber)) {
        return false;
      }

      // 마지막 확인 시간 이후의 알림만 포함
      if (this.lastCheckTime) {
        const alertTime = new Date(alert.createDate);
        if (alertTime <= this.lastCheckTime) {
          return false;
        }
      }

      // 긴급 알림만 처리 (폭염, 한파, 지진 등)
      const emergencyTypes = ['폭염', '한파', '지진', '태풍', '호우', '대설', '강풍'];
      return emergencyTypes.some(type => 
        alert.disasterType.includes(type) || alert.isEmergency
      );
    });
  }

  /**
   * 긴급 알림 처리 및 발송
   * 요구사항: 2.1, 2.2, 2.3 - 폭염, 한파, 지진 등 재난 상황 시 즉시 알림 발송
   */
  async processEmergencyAlerts(alerts, startTime) {
    try {
      // 활성 수신자 목록 조회
      const recipients = await this.recipientModel.findActiveRecipients();
      
      if (recipients.length === 0) {
        logger.warn('No active recipients found for emergency alerts');
        return;
      }

      logger.info(`Processing ${alerts.length} emergency alerts for ${recipients.length} recipients`);

      // 각 긴급 알림에 대해 병렬 처리
      const alertPromises = alerts.map(async (alert) => {
        return await this.processIndividualAlert(alert, recipients, startTime);
      });

      const results = await Promise.allSettled(alertPromises);

      // 결과 로깅
      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
          // 처리된 알림 기록
          this.processedAlerts.add(alerts[index].serialNumber);
        } else {
          failureCount++;
          logger.error(`Failed to process alert ${alerts[index].serialNumber}:`, result.reason);
        }
      });

      logger.info(`Emergency alert processing completed`, {
        totalAlerts: alerts.length,
        successCount,
        failureCount,
        processingTime: new Date() - startTime + 'ms'
      });

    } catch (error) {
      logger.error('Failed to process emergency alerts:', error);
      throw error;
    }
  }

  /**
   * 개별 긴급 알림 처리
   */
  async processIndividualAlert(alert, recipients, startTime) {
    const alertStartTime = new Date();
    
    try {
      logger.info(`Processing emergency alert: ${alert.disasterType} in ${alert.locationName}`);

      // 5분 이내 발송 보장을 위한 시간 체크
      const elapsedTime = alertStartTime - startTime;
      if (elapsedTime > this.config.maxResponseTime) {
        throw new Error(`Alert processing timeout: ${elapsedTime}ms elapsed`);
      }

      // 재시도 로직이 포함된 긴급 메시지 발송
      const result = await this.sendEmergencyAlertWithRetry(alert, recipients);

      const processingTime = new Date() - alertStartTime;
      
      if (result.success) {
        logger.info(`Emergency alert sent successfully`, {
          alertType: alert.disasterType,
          alertId: alert.serialNumber,
          totalRecipients: result.totalRecipients,
          successCount: result.successCount,
          failureCount: result.failureCount,
          processingTime: processingTime + 'ms'
        });

        // 5분 이내 발송 확인
        if (processingTime > this.config.maxResponseTime) {
          logger.warn(`Emergency alert exceeded 5-minute limit: ${processingTime}ms`);
        }

      } else {
        throw new Error(`Emergency alert failed: ${result.error}`);
      }

      return result;

    } catch (error) {
      logger.error(`Failed to process individual alert ${alert.serialNumber}:`, error);
      throw error;
    }
  }

  /**
   * 재시도 로직이 포함된 긴급 메시지 발송
   */
  async sendEmergencyAlertWithRetry(alert, recipients) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        logger.info(`Sending emergency alert (attempt ${attempt}/${this.config.retryAttempts})`);

        const result = await this.smsService.sendEmergencyAlert(recipients, alert);
        
        if (result.success) {
          if (attempt > 1) {
            logger.info(`Emergency alert succeeded on retry attempt ${attempt}`);
          }
          return result;
        } else {
          throw new Error(result.error);
        }

      } catch (error) {
        lastError = error;
        logger.warn(`Emergency alert attempt ${attempt} failed:`, error.message);

        // 마지막 시도가 아니면 재시도 대기
        if (attempt < this.config.retryAttempts) {
          logger.info(`Retrying emergency alert in ${this.config.retryDelay / 1000} seconds`);
          await this.sleep(this.config.retryDelay);
        }
      }
    }

    // 모든 재시도 실패
    logger.error(`All retry attempts failed for emergency alert ${alert.serialNumber}`, {
      error: lastError.message,
      attempts: this.config.retryAttempts
    });
    
    return {
      success: false,
      error: lastError.message,
      totalRecipients: recipients.length,
      successCount: 0,
      failureCount: recipients.length
    };
  }

  /**
   * 모니터링 상태 조회
   */
  getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      lastCheckTime: this.lastCheckTime,
      processedAlertsCount: this.processedAlerts.size,
      config: {
        checkInterval: this.config.checkInterval,
        maxResponseTime: this.config.maxResponseTime,
        retryAttempts: this.config.retryAttempts,
        retryDelay: this.config.retryDelay
      }
    };
  }

  /**
   * 수동 긴급 상황 확인
   */
  async manualEmergencyCheck() {
    try {
      logger.info('Starting manual emergency check');
      
      const checkStartTime = new Date();
      await this.performEmergencyCheck();
      
      const processingTime = new Date() - checkStartTime;
      logger.info(`Manual emergency check completed in ${processingTime}ms`);
      
      return {
        success: true,
        processingTime,
        timestamp: checkStartTime
      };

    } catch (error) {
      logger.error('Manual emergency check failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * 처리된 알림 기록 정리 (메모리 관리)
   */
  cleanupProcessedAlerts() {
    const maxAge = 24 * 60 * 60 * 1000; // 24시간
    const cutoffTime = new Date(Date.now() - maxAge);
    
    // 실제 구현에서는 알림 시간을 기록하여 정리해야 함
    // 현재는 단순히 크기 제한으로 관리
    if (this.processedAlerts.size > 1000) {
      this.processedAlerts.clear();
      logger.info('Processed alerts cache cleared due to size limit');
    }
  }

  /**
   * 긴급 알림 테스트 발송
   */
  async testEmergencyAlert(testAlert, testRecipients = null) {
    try {
      logger.info('Sending test emergency alert');

      const recipients = testRecipients || await this.recipientModel.findActiveRecipients();
      
      if (recipients.length === 0) {
        throw new Error('No recipients available for test');
      }

      // 테스트 알림 데이터 구성
      const testAlertData = {
        serialNumber: 'TEST-' + Date.now(),
        locationName: testAlert.location || '유성구',
        disasterType: testAlert.type || '테스트',
        msg: testAlert.message || '이것은 테스트 긴급 알림입니다.',
        createDate: new Date().toISOString(),
        emergencyLevel: '테스트',
        isEmergency: true,
        ...testAlert
      };

      const result = await this.smsService.sendEmergencyAlert(recipients, testAlertData);

      logger.info('Test emergency alert completed', {
        success: result.success,
        totalRecipients: result.totalRecipients,
        successCount: result.successCount,
        failureCount: result.failureCount
      });

      return result;

    } catch (error) {
      logger.error('Test emergency alert failed:', error);
      throw error;
    }
  }

  /**
   * 지연 함수
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 서비스 종료 시 정리
   */
  async shutdown() {
    logger.info('Shutting down emergency monitoring service');
    
    this.stopMonitoring();
    this.processedAlerts.clear();
    
    logger.info('Emergency monitoring service shutdown completed');
  }
}

module.exports = EmergencyMonitoringService;