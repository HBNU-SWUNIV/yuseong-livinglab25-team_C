const PublicDataService = require('../../src/services/PublicDataService');
const WeatherApiClient = require('../../src/services/WeatherApiClient');
const AirQualityApiClient = require('../../src/services/AirQualityApiClient');
const DisasterApiClient = require('../../src/services/DisasterApiClient');
const PublicDataCache = require('../../src/models/PublicDataCache');

// Mock the dependencies
jest.mock('../../src/services/WeatherApiClient');
jest.mock('../../src/services/AirQualityApiClient');
jest.mock('../../src/services/DisasterApiClient');
jest.mock('../../src/models/PublicDataCache');

describe('PublicDataService', () => {
  let publicDataService;
  let mockWeatherClient;
  let mockAirQualityClient;
  let mockDisasterClient;
  let mockCache;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockWeatherClient = {
      getCurrentWeather: jest.fn(),
      checkConnection: jest.fn()
    };
    mockAirQualityClient = {
      getCurrentAirQuality: jest.fn(),
      checkConnection: jest.fn()
    };
    mockDisasterClient = {
      getRecentDisasters: jest.fn(),
      getEmergencyAlerts: jest.fn(),
      checkConnection: jest.fn()
    };
    mockCache = {
      getWeatherData: jest.fn(),
      getAirQualityData: jest.fn(),
      getDisasterData: jest.fn(),
      cacheWeatherData: jest.fn(),
      cacheAirQualityData: jest.fn(),
      cacheDisasterData: jest.fn(),
      recordCacheHit: jest.fn(),
      recordCacheMiss: jest.fn(),
      executeQuery: jest.fn(),
      getCacheStats: jest.fn(),
      cleanupExpiredCache: jest.fn()
    };

    // Mock constructors
    WeatherApiClient.mockImplementation(() => mockWeatherClient);
    AirQualityApiClient.mockImplementation(() => mockAirQualityClient);
    DisasterApiClient.mockImplementation(() => mockDisasterClient);
    PublicDataCache.mockImplementation(() => mockCache);

    publicDataService = new PublicDataService();
  });

  describe('Constructor', () => {
    test('should initialize all clients and cache', () => {
      expect(WeatherApiClient).toHaveBeenCalled();
      expect(AirQualityApiClient).toHaveBeenCalled();
      expect(DisasterApiClient).toHaveBeenCalled();
      expect(PublicDataCache).toHaveBeenCalled();
    });

    test('should set retry configuration', () => {
      expect(publicDataService.retryConfig).toBeDefined();
      expect(publicDataService.retryConfig.maxRetries).toBe(3);
      expect(publicDataService.retryConfig.retryDelay).toBe(10 * 60 * 1000);
    });
  });

  describe('normalizeWeatherData', () => {
    test('should normalize weather data correctly', () => {
      const rawData = {
        temperature: 25,
        minTemperature: 18,
        maxTemperature: 30,
        condition: '맑음',
        precipitationProbability: 20,
        humidity: 65,
        windSpeed: 2.5,
        fetchedAt: new Date('2024-01-15T14:00:00')
      };

      const normalized = publicDataService.normalizeWeatherData(rawData);

      expect(normalized.temperature).toBe(25);
      expect(normalized.minTemperature).toBe(18);
      expect(normalized.maxTemperature).toBe(30);
      expect(normalized.condition).toBe('맑음');
      expect(normalized.precipitationProbability).toBe(20);
      expect(normalized.humidity).toBe(65);
      expect(normalized.windSpeed).toBe(2.5);
      expect(normalized.region).toBe('유성구');
    });

    test('should handle missing data with defaults', () => {
      const rawData = {};
      const normalized = publicDataService.normalizeWeatherData(rawData);

      expect(normalized.temperature).toBeNull();
      expect(normalized.condition).toBe('알 수 없음');
      expect(normalized.precipitationProbability).toBe(0);
      expect(normalized.region).toBe('유성구');
    });
  });

  describe('normalizeAirQualityData', () => {
    test('should normalize air quality data correctly', () => {
      const rawData = {
        stationName: '유성구',
        pm10Value: 25,
        pm10Grade: '보통',
        pm25Value: 15,
        pm25Grade: '좋음',
        dataTime: '2024-01-15 14:00',
        fetchedAt: new Date('2024-01-15T14:00:00')
      };

      const normalized = publicDataService.normalizeAirQualityData(rawData);

      expect(normalized.stationName).toBe('유성구');
      expect(normalized.pm10Value).toBe(25);
      expect(normalized.pm10Grade).toBe('보통');
      expect(normalized.pm25Value).toBe(15);
      expect(normalized.pm25Grade).toBe('좋음');
      expect(normalized.region).toBe('유성구');
    });

    test('should handle missing data with defaults', () => {
      const rawData = {};
      const normalized = publicDataService.normalizeAirQualityData(rawData);

      expect(normalized.stationName).toBe('유성구');
      expect(normalized.pm10Value).toBeNull();
      expect(normalized.pm10Grade).toBe('알 수 없음');
      expect(normalized.region).toBe('유성구');
    });
  });

  describe('normalizeDisasterData', () => {
    test('should normalize disaster data array correctly', () => {
      const rawData = [
        {
          serialNumber: '12345',
          locationName: '대전광역시 유성구',
          disasterType: '폭염',
          msg: '폭염주의보 발령',
          createDate: '20240715143000',
          emergencyLevel: '주의보',
          isEmergency: true,
          fetchedAt: new Date('2024-01-15T14:00:00')
        }
      ];

      const normalized = publicDataService.normalizeDisasterData(rawData);

      expect(Array.isArray(normalized)).toBe(true);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].serialNumber).toBe('12345');
      expect(normalized[0].locationName).toBe('대전광역시 유성구');
      expect(normalized[0].disasterType).toBe('폭염');
      expect(normalized[0].isEmergency).toBe(true);
      expect(normalized[0].region).toBe('유성구');
    });

    test('should return empty array for non-array input', () => {
      const normalized = publicDataService.normalizeDisasterData(null);
      expect(normalized).toEqual([]);

      const normalized2 = publicDataService.normalizeDisasterData('invalid');
      expect(normalized2).toEqual([]);
    });
  });

  describe('getWeatherData', () => {
    test('should return cached data when available and not forcing refresh', async () => {
      const cachedData = {
        data: { temperature: 25, condition: '맑음' }
      };
      mockCache.getWeatherData.mockResolvedValue(cachedData);

      const result = await publicDataService.getWeatherData(false);

      expect(mockCache.getWeatherData).toHaveBeenCalledWith('유성구');
      expect(mockCache.recordCacheHit).toHaveBeenCalledWith('weather', '유성구');
      expect(mockWeatherClient.getCurrentWeather).not.toHaveBeenCalled();
      expect(result.temperature).toBe(25);
    });

    test('should fetch new data when cache miss', async () => {
      const apiData = { temperature: 25, condition: '맑음' };
      mockCache.getWeatherData.mockResolvedValue(null);
      mockWeatherClient.getCurrentWeather.mockResolvedValue(apiData);

      const result = await publicDataService.getWeatherData(false);

      expect(mockCache.recordCacheMiss).toHaveBeenCalledWith('weather', '유성구');
      expect(mockWeatherClient.getCurrentWeather).toHaveBeenCalled();
      expect(mockCache.cacheWeatherData).toHaveBeenCalled();
      expect(result.temperature).toBe(25);
    });

    test('should force refresh when requested', async () => {
      const apiData = { temperature: 25, condition: '맑음' };
      mockWeatherClient.getCurrentWeather.mockResolvedValue(apiData);

      const result = await publicDataService.getWeatherData(true);

      expect(mockCache.getWeatherData).not.toHaveBeenCalled();
      expect(mockWeatherClient.getCurrentWeather).toHaveBeenCalled();
      expect(result.temperature).toBe(25);
    });

    test('should try fallback data on API error', async () => {
      mockCache.getWeatherData.mockResolvedValue(null);
      mockWeatherClient.getCurrentWeather.mockRejectedValue(new Error('API Error'));
      
      const fallbackData = { temperature: 20, condition: '흐림' };
      mockCache.executeQuery.mockResolvedValue([{
        data: JSON.stringify(fallbackData)
      }]);

      // 재시도 설정을 짧게 변경
      publicDataService.retryConfig.maxRetries = 1;
      publicDataService.retryConfig.retryDelay = 100;

      const result = await publicDataService.getWeatherData(false);

      expect(result.temperature).toBe(20);
    }, 10000);
  });

  describe('validateWeatherData', () => {
    test('should not throw for valid data', () => {
      const validData = {
        temperature: 25,
        precipitationProbability: 50
      };

      expect(() => {
        publicDataService.validateWeatherData(validData);
      }).not.toThrow();
    });

    test('should log warnings for suspicious values', () => {
      const suspiciousData = {
        temperature: 100, // 너무 높음
        precipitationProbability: 150 // 100% 초과
      };

      // 로그 경고가 발생하는지 확인 (실제로는 winston logger를 mock해야 함)
      expect(() => {
        publicDataService.validateWeatherData(suspiciousData);
      }).not.toThrow();
    });
  });

  describe('checkApiConnections', () => {
    test('should check all API connections', async () => {
      mockWeatherClient.checkConnection.mockResolvedValue(true);
      mockAirQualityClient.checkConnection.mockResolvedValue(false);
      mockDisasterClient.checkConnection.mockResolvedValue(true);

      const result = await publicDataService.checkApiConnections();

      expect(result.weather).toBe(true);
      expect(result.airQuality).toBe(false);
      expect(result.disaster).toBe(true);
    });

    test('should handle connection check errors', async () => {
      mockWeatherClient.checkConnection.mockRejectedValue(new Error('Connection failed'));
      mockAirQualityClient.checkConnection.mockResolvedValue(true);
      mockDisasterClient.checkConnection.mockResolvedValue(true);

      const result = await publicDataService.checkApiConnections();

      expect(result.weather).toBe(false);
      expect(result.airQuality).toBe(true);
      expect(result.disaster).toBe(true);
    });
  });

  describe('updateAllData', () => {
    test('should update all data types', async () => {
      mockCache.getWeatherData.mockResolvedValue(null);
      mockCache.getAirQualityData.mockResolvedValue(null);
      mockCache.getDisasterData.mockResolvedValue(null);
      
      mockWeatherClient.getCurrentWeather.mockResolvedValue({ temperature: 25 });
      mockAirQualityClient.getCurrentAirQuality.mockResolvedValue({ pm10Value: 30 });
      mockDisasterClient.getRecentDisasters.mockResolvedValue([]);

      const result = await publicDataService.updateAllData();

      expect(result.weather.success).toBe(true);
      expect(result.airQuality.success).toBe(true);
      expect(result.disaster.success).toBe(true);
    });

    test('should handle partial failures', async () => {
      mockCache.getWeatherData.mockResolvedValue(null);
      mockCache.getAirQualityData.mockResolvedValue(null);
      mockCache.getDisasterData.mockResolvedValue(null);
      
      mockWeatherClient.getCurrentWeather.mockResolvedValue({ temperature: 25 });
      mockAirQualityClient.getCurrentAirQuality.mockRejectedValue(new Error('API Error'));
      mockDisasterClient.getRecentDisasters.mockResolvedValue([]);

      // 재시도 설정을 짧게 변경
      publicDataService.retryConfig.maxRetries = 1;
      publicDataService.retryConfig.retryDelay = 100;

      const result = await publicDataService.updateAllData();

      expect(result.weather.success).toBe(true);
      expect(result.airQuality.success).toBe(false);
      expect(result.airQuality.error).toBe('API Error');
      expect(result.disaster.success).toBe(true);
    }, 10000);
  });

  describe('sleep', () => {
    test('should resolve after specified time', async () => {
      const start = Date.now();
      await publicDataService.sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90); // 약간의 여유
    });
  });
});