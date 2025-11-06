const SchedulerService = require('../../src/services/SchedulerService');
const PublicDataService = require('../../src/services/PublicDataService');
const SmsService = require('../../src/services/SmsService');
const Recipient = require('../../src/models/Recipient');
const CustomReminder = require('../../src/models/CustomReminder');

// Mock dependencies
jest.mock('../../src/services/PublicDataService');
jest.mock('../../src/services/SmsService');
jest.mock('../../src/models/Recipient');
jest.mock('../../src/models/CustomReminder');
jest.mock('node-cron');

const cron = require('node-cron');

describe('SchedulerService', () => {
  let schedulerService;
  let mockPublicDataService;
  let mockSmsService;
  let mockRecipientModel;
  let mockCustomReminderModel;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock cron.schedule to return a mock task
    const mockTask = {
      start: jest.fn(),
      stop: jest.fn(),
      destroy: jest.fn()
    };
    cron.schedule.mockReturnValue(mockTask);

    // Create service instance
    schedulerService = new SchedulerService();
    
    // Get mock instances
    mockPublicDataService = schedulerService.publicDataService;
    mockSmsService = schedulerService.smsService;
    mockRecipientModel = schedulerService.recipientModel;
    mockCustomReminderModel = schedulerService.customReminderModel;
  });

  afterEach(() => {
    // Clean up schedulers
    if (schedulerService) {
      schedulerService.stopAllSchedulers();
    }
  });

  describe('Scheduler Initialization', () => {
    test('should initialize with correct dependencies', () => {
      expect(schedulerService.publicDataService).toBeInstanceOf(PublicDataService);
      expect(schedulerService.smsService).toBeInstanceOf(SmsService);
      expect(schedulerService.recipientModel).toBeInstanceOf(Recipient);
      expect(schedulerService.customReminderModel).toBeInstanceOf(CustomReminder);
      expect(schedulerService.scheduledTasks).toBeInstanceOf(Map);
      expect(schedulerService.emergencyMonitoringActive).toBe(false);
    });
  });

  describe('Daily Weather Scheduler', () => {
    test('should start daily weather scheduler with correct cron pattern', () => {
      schedulerService.startDailyWeatherScheduler();

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 7 * * *', // 매일 오전 7시
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'Asia/Seoul'
        })
      );

      expect(schedulerService.scheduledTasks.has('daily-weather')).toBe(true);
    });

    test('should send daily weather message successfully', async () => {
      // Mock data
      const mockRecipients = [
        { id: 1, name: '김할머니', phone_number: '01012345678', is_active: true },
        { id: 2, name: '박할아버지', phone_number: '01087654321', is_active: true }
      ];
      const mockWeatherData = {
        temperature: 15,
        condition: '맑음',
        precipitationProbability: 10
      };
      const mockAirQualityData = {
        pm10Grade: '보통',
        pm25Grade: '좋음'
      };

      // Setup mocks
      mockRecipientModel.findActiveRecipients.mockResolvedValue(mockRecipients);
      mockPublicDataService.getWeatherData.mockResolvedValue(mockWeatherData);
      mockPublicDataService.getAirQualityData.mockResolvedValue(mockAirQualityData);
      mockSmsService.sendDailyWeatherMessage.mockResolvedValue({
        success: true,
        totalRecipients: 2,
        successCount: 2,
        failureCount: 0
      });

      // Execute
      await schedulerService.sendDailyWeatherMessage();

      // Verify
      expect(mockRecipientModel.findActiveRecipients).toHaveBeenCalled();
      expect(mockPublicDataService.getWeatherData).toHaveBeenCalled();
      expect(mockPublicDataService.getAirQualityData).toHaveBeenCalled();
      expect(mockSmsService.sendDailyWeatherMessage).toHaveBeenCalledWith(
        mockRecipients,
        mockWeatherData,
        mockAirQualityData
      );
    });

    test('should handle no active recipients gracefully', async () => {
      mockRecipientModel.findActiveRecipients.mockResolvedValue([]);

      await schedulerService.sendDailyWeatherMessage();

      expect(mockRecipientModel.findActiveRecipients).toHaveBeenCalled();
      expect(mockPublicDataService.getWeatherData).not.toHaveBeenCalled();
      expect(mockSmsService.sendDailyWeatherMessage).not.toHaveBeenCalled();
    });
  });

  describe('Data Collection Schedulers', () => {
    test('should start weather data collection scheduler', () => {
      schedulerService.startWeatherDataScheduler();

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 * * * *', // 매시간
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'Asia/Seoul'
        })
      );

      expect(schedulerService.scheduledTasks.has('weather-data-collection')).toBe(true);
    });

    test('should start air quality data collection scheduler', () => {
      schedulerService.startAirQualityDataScheduler();

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 */2 * * *', // 2시간마다
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'Asia/Seoul'
        })
      );

      expect(schedulerService.scheduledTasks.has('air-quality-data-collection')).toBe(true);
    });

    test('should collect weather data successfully', async () => {
      const mockWeatherData = { temperature: 20, condition: '흐림' };
      mockPublicDataService.getWeatherData.mockResolvedValue(mockWeatherData);

      await schedulerService.collectWeatherData();

      expect(mockPublicDataService.getWeatherData).toHaveBeenCalledWith(true);
    });

    test('should collect air quality data successfully', async () => {
      const mockAirQualityData = { pm10Grade: '좋음', pm25Grade: '보통' };
      mockPublicDataService.getAirQualityData.mockResolvedValue(mockAirQualityData);

      await schedulerService.collectAirQualityData();

      expect(mockPublicDataService.getAirQualityData).toHaveBeenCalledWith(true);
    });
  });

  describe('Emergency Monitoring', () => {
    test('should start emergency monitoring', async () => {
      await schedulerService.startEmergencyMonitoring();

      expect(cron.schedule).toHaveBeenCalledWith(
        '*/5 * * * *', // 5분마다
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'Asia/Seoul'
        })
      );

      expect(schedulerService.emergencyMonitoringActive).toBe(true);
      expect(schedulerService.scheduledTasks.has('emergency-monitoring')).toBe(true);
    });

    test('should check emergency alerts and send notifications', async () => {
      const mockRecipients = [
        { id: 1, name: '김할머니', phone_number: '01012345678' }
      ];
      const mockEmergencyAlerts = [
        {
          serialNumber: 'ALERT001',
          disasterType: '폭염',
          locationName: '유성구',
          msg: '폭염 경보가 발령되었습니다.',
          createDate: new Date().toISOString(),
          isEmergency: true
        }
      ];

      // Setup mocks
      mockPublicDataService.getEmergencyAlerts.mockResolvedValue(mockEmergencyAlerts);
      mockRecipientModel.findActiveRecipients.mockResolvedValue(mockRecipients);
      mockSmsService.sendEmergencyAlert.mockResolvedValue({
        success: true,
        totalRecipients: 1,
        successCount: 1,
        failureCount: 0
      });

      // Set last check time to past
      schedulerService.lastDisasterCheck = new Date(Date.now() - 10 * 60 * 1000);

      await schedulerService.checkEmergencyAlerts();

      expect(mockPublicDataService.getEmergencyAlerts).toHaveBeenCalled();
      expect(mockRecipientModel.findActiveRecipients).toHaveBeenCalled();
      expect(mockSmsService.sendEmergencyAlert).toHaveBeenCalledWith(
        mockRecipients,
        mockEmergencyAlerts[0]
      );
    });

    test('should not send alerts for old emergency notifications', async () => {
      const oldAlert = {
        serialNumber: 'ALERT002',
        disasterType: '한파',
        createDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2시간 전
      };

      mockPublicDataService.getEmergencyAlerts.mockResolvedValue([oldAlert]);
      schedulerService.lastDisasterCheck = new Date(Date.now() - 60 * 60 * 1000); // 1시간 전

      await schedulerService.checkEmergencyAlerts();

      expect(mockSmsService.sendEmergencyAlert).not.toHaveBeenCalled();
    });
  });

  describe('Custom Reminder Schedulers', () => {
    test('should start custom reminder schedulers', async () => {
      const mockReminders = [
        {
          id: 1,
          title: '약 복용',
          schedule_type: 'daily',
          schedule_time: '08:00',
          recipient_id: 1
        },
        {
          id: 2,
          title: '병원 방문',
          schedule_type: 'weekly',
          schedule_time: '14:00',
          schedule_day: 1,
          recipient_id: 2
        }
      ];

      mockCustomReminderModel.findActiveReminders.mockResolvedValue(mockReminders);

      await schedulerService.startCustomReminderSchedulers();

      expect(mockCustomReminderModel.findActiveReminders).toHaveBeenCalled();
      expect(cron.schedule).toHaveBeenCalledTimes(2);
    });

    test('should generate correct cron patterns for different schedule types', () => {
      // Daily reminder
      const dailyReminder = {
        schedule_type: 'daily',
        schedule_time: '08:30'
      };
      expect(schedulerService.generateCronPattern(dailyReminder)).toBe('30 8 * * *');

      // Weekly reminder
      const weeklyReminder = {
        schedule_type: 'weekly',
        schedule_time: '14:15',
        schedule_day: 3
      };
      expect(schedulerService.generateCronPattern(weeklyReminder)).toBe('15 14 * * 3');

      // Monthly reminder
      const monthlyReminder = {
        schedule_type: 'monthly',
        schedule_time: '09:00',
        schedule_day: 15
      };
      expect(schedulerService.generateCronPattern(monthlyReminder)).toBe('0 9 15 * *');
    });

    test('should send custom reminder successfully', async () => {
      const mockReminder = {
        id: 1,
        title: '약 복용 알림',
        message: '혈압약 복용 시간입니다.',
        recipient_id: 1
      };
      const mockRecipient = {
        id: 1,
        name: '김할머니',
        phone_number: '01012345678',
        is_active: true
      };

      mockRecipientModel.findById.mockResolvedValue(mockRecipient);
      mockSmsService.sendCustomReminder.mockResolvedValue({
        success: true,
        messageId: 123,
        recipient: '김할머니'
      });

      await schedulerService.sendCustomReminder(mockReminder);

      expect(mockRecipientModel.findById).toHaveBeenCalledWith(1);
      expect(mockSmsService.sendCustomReminder).toHaveBeenCalledWith(
        mockRecipient,
        mockReminder
      );
    });
  });

  describe('Scheduler Management', () => {
    test('should start all schedulers', async () => {
      mockCustomReminderModel.findActiveReminders.mockResolvedValue([]);

      await schedulerService.startAllSchedulers();

      expect(cron.schedule).toHaveBeenCalledTimes(4); // daily weather, weather data, air quality data, emergency monitoring
      expect(schedulerService.emergencyMonitoringActive).toBe(true);
    });

    test('should stop specific scheduler', () => {
      const mockTask = { stop: jest.fn() };
      schedulerService.scheduledTasks.set('test-task', mockTask);

      const result = schedulerService.stopScheduler('test-task');

      expect(result).toBe(true);
      expect(mockTask.stop).toHaveBeenCalled();
      expect(schedulerService.scheduledTasks.has('test-task')).toBe(false);
    });

    test('should stop all schedulers', () => {
      const mockTask1 = { stop: jest.fn() };
      const mockTask2 = { stop: jest.fn() };
      
      schedulerService.scheduledTasks.set('task1', mockTask1);
      schedulerService.scheduledTasks.set('task2', mockTask2);
      schedulerService.emergencyMonitoringActive = true;

      schedulerService.stopAllSchedulers();

      expect(mockTask1.stop).toHaveBeenCalled();
      expect(mockTask2.stop).toHaveBeenCalled();
      expect(schedulerService.scheduledTasks.size).toBe(0);
      expect(schedulerService.emergencyMonitoringActive).toBe(false);
    });

    test('should get scheduler status', () => {
      const mockTask1 = { stop: jest.fn() };
      const mockTask2 = { stop: jest.fn() };
      
      schedulerService.scheduledTasks.set('task1', mockTask1);
      schedulerService.scheduledTasks.set('task2', mockTask2);
      schedulerService.emergencyMonitoringActive = true;
      schedulerService.lastDisasterCheck = new Date();

      const status = schedulerService.getSchedulerStatus();

      expect(status).toEqual({
        totalSchedulers: 2,
        activeSchedulers: ['task1', 'task2'],
        emergencyMonitoringActive: true,
        lastDisasterCheck: expect.any(Date)
      });
    });
  });

  describe('Manual Operations', () => {
    test('should perform manual data collection', async () => {
      const mockResults = {
        weather: { success: true, error: null },
        airQuality: { success: true, error: null },
        disaster: { success: false, error: 'API timeout' }
      };

      mockPublicDataService.updateAllData.mockResolvedValue(mockResults);

      const result = await schedulerService.manualDataCollection();

      expect(mockPublicDataService.updateAllData).toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });

    test('should perform manual emergency check', async () => {
      mockPublicDataService.getEmergencyAlerts.mockResolvedValue([]);

      await schedulerService.manualEmergencyCheck();

      expect(mockPublicDataService.getEmergencyAlerts).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle weather data collection errors gracefully', async () => {
      mockPublicDataService.getWeatherData.mockRejectedValue(new Error('API Error'));

      await expect(schedulerService.collectWeatherData()).resolves.not.toThrow();
    });

    test('should handle emergency alert errors gracefully', async () => {
      mockPublicDataService.getEmergencyAlerts.mockRejectedValue(new Error('Network Error'));

      await expect(schedulerService.checkEmergencyAlerts()).resolves.not.toThrow();
    });

    test('should handle custom reminder errors gracefully', async () => {
      const mockReminder = { id: 1, recipient_id: 1 };
      mockRecipientModel.findById.mockRejectedValue(new Error('Database Error'));

      await expect(schedulerService.sendCustomReminder(mockReminder)).resolves.not.toThrow();
    });
  });
});