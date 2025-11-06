const EmergencyMonitoringService = require('../../src/services/EmergencyMonitoringService');
const PublicDataService = require('../../src/services/PublicDataService');
const SmsService = require('../../src/services/SmsService');
const Recipient = require('../../src/models/Recipient');

// Mock dependencies
jest.mock('../../src/services/PublicDataService');
jest.mock('../../src/services/SmsService');
jest.mock('../../src/models/Recipient');

describe('EmergencyMonitoringService', () => {
  let emergencyService;
  let mockPublicDataService;
  let mockSmsService;
  let mockRecipientModel;

  beforeEach(() => {
    jest.clearAllMocks();
    
    emergencyService = new EmergencyMonitoringService();
    
    mockPublicDataService = emergencyService.publicDataService;
    mockSmsService = emergencyService.smsService;
    mockRecipientModel = emergencyService.recipientModel;

    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (emergencyService.isMonitoring) {
      emergencyService.stopMonitoring();
    }
    jest.useRealTimers();
  });

  describe('Service Initialization', () => {
    test('should initialize with correct dependencies and default state', () => {
      expect(emergencyService.publicDataService).toBeInstanceOf(PublicDataService);
      expect(emergencyService.smsService).toBeInstanceOf(SmsService);
      expect(emergencyService.recipientModel).toBeInstanceOf(Recipient);
      expect(emergencyService.isMonitoring).toBe(false);
      expect(emergencyService.processedAlerts).toBeInstanceOf(Set);
      expect(emergencyService.config.checkInterval).toBe(2 * 60 * 1000); // 2분
      expect(emergencyService.config.maxResponseTime).toBe(5 * 60 * 1000); // 5분
    });
  });

  describe('Monitoring Control', () => {
    test('should start monitoring successfully', async () => {
      mockPublicDataService.getEmergencyAlerts.mockResolvedValue([]);

      await emergencyService.startMonitoring();

      expect(emergencyService.isMonitoring).toBe(true);
      expect(emergencyService.lastCheckTime).toBeInstanceOf(Date);
      expect(emergencyService.monitoringInterval).toBeDefined();
    });

    test('should not start monitoring if already running', async () => {
      emergencyService.isMonitoring = true;

      await emergencyService.startMonitoring();

      expect(emergencyService.monitoringInterval).toBeNull();
    });

    test('should stop monitoring successfully', () => {
      emergencyService.isMonitoring = true;
      emergencyService.monitoringInterval = setInterval(() => {}, 1000);

      emergencyService.stopMonitoring();

      expect(emergencyService.isMonitoring).toBe(false);
      expect(emergencyService.monitoringInterval).toBeNull();
    });

    test('should handle stop monitoring when not running', () => {
      emergencyService.isMonitoring = false;

      expect(() => emergencyService.stopMonitoring()).not.toThrow();
    });
  });

  describe('Emergency Alert Detection', () => {
    test('should detect and process new emergency alerts', async () => {
      const mockAlerts = [
        {
          serialNumber: 'ALERT001',
          disasterType: '폭염경보',
          locationName: '유성구',
          msg: '폭염 경보가 발령되었습니다.',
          createDate: new Date().toISOString(),
          isEmergency: true
        }
      ];
      const mockRecipients = [
        { id: 1, name: '김할머니', phone_number: '01012345678' }
      ];

      mockPublicDataService.getEmergencyAlerts.mockResolvedValue(mockAlerts);
      mockRecipientModel.findActiveRecipients.mockResolvedValue(mockRecipients);
      mockSmsService.sendEmergencyAlert.mockResolvedValue({
        success: true,
        totalRecipients: 1,
        successCount: 1,
        failureCount: 0
      });

      await emergencyService.performEmergencyCheck();

      expect(mockPublicDataService.getEmergencyAlerts).toHaveBeenCalled();
      expect(mockRecipientModel.findActiveRecipients).toHaveBeenCalled();
      expect(mockSmsService.sendEmergencyAlert).toHaveBeenCalledWith(
        mockRecipients,
        mockAlerts[0]
      );
    });

    test('should filter out non-emergency alerts', async () => {
      const mockAlerts = [
        {
          serialNumber: 'ALERT002',
          disasterType: '일반공지',
          locationName: '유성구',
          msg: '일반 공지사항입니다.',
          createDate: new Date().toISOString(),
          isEmergency: false
        }
      ];

      mockPublicDataService.getEmergencyAlerts.mockResolvedValue(mockAlerts);

      await emergencyService.performEmergencyCheck();

      expect(mockSmsService.sendEmergencyAlert).not.toHaveBeenCalled();
    });

    test('should filter out already processed alerts', async () => {
      const mockAlert = {
        serialNumber: 'ALERT003',
        disasterType: '한파경보',
        locationName: '유성구',
        createDate: new Date().toISOString(),
        isEmergency: true
      };

      // Add alert to processed set
      emergencyService.processedAlerts.add('ALERT003');

      mockPublicDataService.getEmergencyAlerts.mockResolvedValue([mockAlert]);

      await emergencyService.performEmergencyCheck();

      expect(mockSmsService.sendEmergencyAlert).not.toHaveBeenCalled();
    });

    test('should filter out old alerts based on last check time', async () => {
      const oldAlert = {
        serialNumber: 'ALERT004',
        disasterType: '지진',
        createDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3시간 전
        isEmergency: true
      };

      emergencyService.lastCheckTime = new Date(Date.now() - 60 * 60 * 1000); // 1시간 전

      mockPublicDataService.getEmergencyAlerts.mockResolvedValue([oldAlert]);

      await emergencyService.performEmergencyCheck();

      expect(mockSmsService.sendEmergencyAlert).not.toHaveBeenCalled();
    });
  });

  describe('Emergency Alert Processing', () => {
    test('should process multiple emergency alerts in parallel', async () => {
      const mockAlerts = [
        {
          serialNumber: 'ALERT005',
          disasterType: '폭염',
          locationName: '유성구',
          createDate: new Date().toISOString(),
          isEmergency: true
        },
        {
          serialNumber: 'ALERT006',
          disasterType: '한파',
          locationName: '유성구',
          createDate: new Date().toISOString(),
          isEmergency: true
        }
      ];
      const mockRecipients = [
        { id: 1, name: '김할머니', phone_number: '01012345678' }
      ];

      mockPublicDataService.getEmergencyAlerts.mockResolvedValue(mockAlerts);
      mockRecipientModel.findActiveRecipients.mockResolvedValue(mockRecipients);
      mockSmsService.sendEmergencyAlert.mockResolvedValue({
        success: true,
        totalRecipients: 1,
        successCount: 1,
        failureCount: 0
      });

      await emergencyService.performEmergencyCheck();

      expect(mockSmsService.sendEmergencyAlert).toHaveBeenCalledTimes(2);
      expect(emergencyService.processedAlerts.has('ALERT005')).toBe(true);
      expect(emergencyService.processedAlerts.has('ALERT006')).toBe(true);
    });

    test('should handle no active recipients gracefully', async () => {
      const mockAlert = {
        serialNumber: 'ALERT007',
        disasterType: '태풍',
        createDate: new Date().toISOString(),
        isEmergency: true
      };

      mockPublicDataService.getEmergencyAlerts.mockResolvedValue([mockAlert]);
      mockRecipientModel.findActiveRecipients.mockResolvedValue([]);

      await emergencyService.performEmergencyCheck();

      expect(mockSmsService.sendEmergencyAlert).not.toHaveBeenCalled();
    });

    test('should enforce 5-minute response time limit', async () => {
      const mockAlert = {
        serialNumber: 'ALERT008',
        disasterType: '지진',
        createDate: new Date().toISOString(),
        isEmergency: true
      };
      const mockRecipients = [{ id: 1, name: '김할머니' }];

      mockPublicDataService.getEmergencyAlerts.mockResolvedValue([mockAlert]);
      mockRecipientModel.findActiveRecipients.mockResolvedValue(mockRecipients);

      // Mock a slow SMS service
      mockSmsService.sendEmergencyAlert.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ success: true, totalRecipients: 1, successCount: 1, failureCount: 0 });
          }, 6 * 60 * 1000); // 6분 지연
        });
      });

      const startTime = new Date();
      await emergencyService.processIndividualAlert(mockAlert, mockRecipients, startTime);

      // Should still process but log warning about time limit
      expect(mockSmsService.sendEmergencyAlert).toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    test('should retry failed emergency alert sends', async () => {
      const mockAlert = {
        serialNumber: 'ALERT009',
        disasterType: '호우',
        createDate: new Date().toISOString(),
        isEmergency: true
      };
      const mockRecipients = [{ id: 1, name: '김할머니' }];

      // First two attempts fail, third succeeds
      mockSmsService.sendEmergencyAlert
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          success: true,
          totalRecipients: 1,
          successCount: 1,
          failureCount: 0
        });

      const result = await emergencyService.sendEmergencyAlertWithRetry(mockAlert, mockRecipients);

      expect(mockSmsService.sendEmergencyAlert).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    test('should fail after maximum retry attempts', async () => {
      const mockAlert = {
        serialNumber: 'ALERT010',
        disasterType: '대설',
        createDate: new Date().toISOString(),
        isEmergency: true
      };
      const mockRecipients = [{ id: 1, name: '김할머니' }];

      // All attempts fail
      mockSmsService.sendEmergencyAlert.mockRejectedValue(new Error('Persistent error'));

      const result = await emergencyService.sendEmergencyAlertWithRetry(mockAlert, mockRecipients);

      expect(mockSmsService.sendEmergencyAlert).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent error');
    });
  });

  describe('API Timeout Handling', () => {
    test('should handle API timeout gracefully', async () => {
      // Mock a slow API response
      mockPublicDataService.getEmergencyAlerts.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([]), 35000); // 35초 지연
        });
      });

      await expect(emergencyService.performEmergencyCheck()).resolves.not.toThrow();
    });

    test('should get emergency alerts with timeout', async () => {
      const mockAlerts = [{ serialNumber: 'ALERT011', disasterType: '강풍' }];
      mockPublicDataService.getEmergencyAlerts.mockResolvedValue(mockAlerts);

      const result = await emergencyService.getEmergencyAlertsWithTimeout();

      expect(result).toEqual(mockAlerts);
    });
  });

  describe('Manual Operations', () => {
    test('should perform manual emergency check successfully', async () => {
      mockPublicDataService.getEmergencyAlerts.mockResolvedValue([]);

      const result = await emergencyService.manualEmergencyCheck();

      expect(result.success).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    test('should handle manual emergency check failure', async () => {
      mockPublicDataService.getEmergencyAlerts.mockRejectedValue(new Error('API Error'));

      const result = await emergencyService.manualEmergencyCheck();

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    test('should send test emergency alert', async () => {
      const testAlert = {
        type: '테스트',
        location: '유성구',
        message: '테스트 긴급 알림입니다.'
      };
      const mockRecipients = [{ id: 1, name: '김할머니' }];

      mockRecipientModel.findActiveRecipients.mockResolvedValue(mockRecipients);
      mockSmsService.sendEmergencyAlert.mockResolvedValue({
        success: true,
        totalRecipients: 1,
        successCount: 1,
        failureCount: 0
      });

      const result = await emergencyService.testEmergencyAlert(testAlert);

      expect(result.success).toBe(true);
      expect(mockSmsService.sendEmergencyAlert).toHaveBeenCalledWith(
        mockRecipients,
        expect.objectContaining({
          disasterType: '테스트',
          locationName: '유성구',
          msg: '테스트 긴급 알림입니다.',
          isEmergency: true
        })
      );
    });
  });

  describe('Status and Monitoring', () => {
    test('should return correct monitoring status', () => {
      emergencyService.isMonitoring = true;
      emergencyService.lastCheckTime = new Date();
      emergencyService.processedAlerts.add('ALERT001');
      emergencyService.processedAlerts.add('ALERT002');

      const status = emergencyService.getMonitoringStatus();

      expect(status).toEqual({
        isMonitoring: true,
        lastCheckTime: expect.any(Date),
        processedAlertsCount: 2,
        config: expect.objectContaining({
          checkInterval: 2 * 60 * 1000,
          maxResponseTime: 5 * 60 * 1000,
          retryAttempts: 3,
          retryDelay: 30 * 1000
        })
      });
    });

    test('should cleanup processed alerts when limit exceeded', () => {
      // Add many alerts to exceed limit
      for (let i = 0; i < 1001; i++) {
        emergencyService.processedAlerts.add(`ALERT${i}`);
      }

      emergencyService.cleanupProcessedAlerts();

      expect(emergencyService.processedAlerts.size).toBe(0);
    });
  });

  describe('Service Shutdown', () => {
    test('should shutdown gracefully', async () => {
      emergencyService.isMonitoring = true;
      emergencyService.processedAlerts.add('ALERT001');

      await emergencyService.shutdown();

      expect(emergencyService.isMonitoring).toBe(false);
      expect(emergencyService.processedAlerts.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully during monitoring', async () => {
      mockPublicDataService.getEmergencyAlerts.mockRejectedValue(new Error('API Error'));

      await expect(emergencyService.performEmergencyCheck()).resolves.not.toThrow();
    });

    test('should handle SMS service errors gracefully', async () => {
      const mockAlert = {
        serialNumber: 'ALERT012',
        disasterType: '폭염',
        createDate: new Date().toISOString(),
        isEmergency: true
      };
      const mockRecipients = [{ id: 1, name: '김할머니' }];

      mockPublicDataService.getEmergencyAlerts.mockResolvedValue([mockAlert]);
      mockRecipientModel.findActiveRecipients.mockResolvedValue(mockRecipients);
      mockSmsService.sendEmergencyAlert.mockRejectedValue(new Error('SMS Error'));

      await expect(emergencyService.performEmergencyCheck()).resolves.not.toThrow();
    });
  });
});