const WeatherApiClient = require('../../src/services/WeatherApiClient');

describe('WeatherApiClient', () => {
  let weatherClient;

  beforeEach(() => {
    weatherClient = new WeatherApiClient();
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(weatherClient.baseURL).toBeDefined();
      expect(weatherClient.timeout).toBe(30000);
      expect(weatherClient.nx).toBe(67);
      expect(weatherClient.ny).toBe(100);
    });

    test('should use environment variables when available', () => {
      const originalApiKey = process.env.WEATHER_API_KEY;
      const originalApiUrl = process.env.WEATHER_API_URL;
      
      process.env.WEATHER_API_KEY = 'test-key';
      process.env.WEATHER_API_URL = 'http://test-url.com';
      
      const client = new WeatherApiClient();
      expect(client.apiKey).toBe('test-key');
      expect(client.baseURL).toBe('http://test-url.com');
      
      // 환경 변수 복원
      process.env.WEATHER_API_KEY = originalApiKey;
      process.env.WEATHER_API_URL = originalApiUrl;
    });
  });

  describe('formatDate', () => {
    test('should format date correctly', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      const formatted = weatherClient.formatDate(testDate);
      expect(formatted).toBe('20240115');
    });

    test('should handle single digit months and days', () => {
      const testDate = new Date('2024-03-05T10:30:00');
      const formatted = weatherClient.formatDate(testDate);
      expect(formatted).toBe('20240305');
    });
  });

  describe('getBaseTime', () => {
    test('should return correct base time for different hours', () => {
      // 오전 9시 -> 0800
      const morning = new Date('2024-01-15T09:00:00');
      expect(weatherClient.getBaseTime(morning)).toBe('0800');

      // 오후 3시 -> 1400
      const afternoon = new Date('2024-01-15T15:00:00');
      expect(weatherClient.getBaseTime(afternoon)).toBe('1400');

      // 밤 11시 -> 2300
      const night = new Date('2024-01-15T23:00:00');
      expect(weatherClient.getBaseTime(night)).toBe('2300');
    });

    test('should return previous day 2300 for early morning hours', () => {
      const earlyMorning = new Date('2024-01-15T01:00:00');
      expect(weatherClient.getBaseTime(earlyMorning)).toBe('2300');
    });
  });

  describe('getSkyCondition', () => {
    test('should return correct sky conditions', () => {
      expect(weatherClient.getSkyCondition('1')).toBe('맑음');
      expect(weatherClient.getSkyCondition('3')).toBe('구름많음');
      expect(weatherClient.getSkyCondition('4')).toBe('흐림');
      expect(weatherClient.getSkyCondition('9')).toBe('알 수 없음');
    });
  });

  describe('parseWeatherData', () => {
    test('should parse weather data correctly', () => {
      const mockItems = [
        { category: 'TMP', fcstTime: '1400', fcstValue: '25' },
        { category: 'TMN', fcstTime: '1400', fcstValue: '18' },
        { category: 'TMX', fcstTime: '1400', fcstValue: '30' },
        { category: 'SKY', fcstTime: '1400', fcstValue: '1' },
        { category: 'POP', fcstTime: '1400', fcstValue: '20' },
        { category: 'REH', fcstTime: '1400', fcstValue: '65' },
        { category: 'WSD', fcstTime: '1400', fcstValue: '2.5' }
      ];

      // Date.prototype.getHours를 모킹
      const originalGetHours = Date.prototype.getHours;
      Date.prototype.getHours = jest.fn(() => 14);

      const result = weatherClient.parseWeatherData(mockItems);

      expect(result.temperature).toBe(25);
      expect(result.minTemperature).toBe(18);
      expect(result.maxTemperature).toBe(30);
      expect(result.condition).toBe('맑음');
      expect(result.precipitationProbability).toBe(20);
      expect(result.humidity).toBe(65);
      expect(result.windSpeed).toBe(2.5);

      // Date 복원
      Date.prototype.getHours = originalGetHours;
    });

    test('should handle empty or invalid data', () => {
      const result = weatherClient.parseWeatherData([]);
      
      expect(result.temperature).toBeNull();
      expect(result.condition).toBeNull();
      expect(result.precipitationProbability).toBeNull();
    });
  });

  describe('getCurrentWeather', () => {
    test('should throw error when API key is not configured', async () => {
      const clientWithoutKey = new WeatherApiClient();
      clientWithoutKey.apiKey = null;

      await expect(clientWithoutKey.getCurrentWeather()).rejects.toThrow();
    });

    // 실제 API 호출 테스트는 환경에 따라 스킵할 수 있음
    test.skip('should fetch weather data from API', async () => {
      // 이 테스트는 실제 API 키가 있을 때만 실행
      if (!process.env.WEATHER_API_KEY) {
        return;
      }

      const result = await weatherClient.getCurrentWeather();
      
      expect(result).toBeDefined();
      expect(result.fetchedAt).toBeInstanceOf(Date);
      expect(typeof result.temperature).toBe('number');
    });
  });

  describe('checkConnection', () => {
    test('should return false when connection fails', async () => {
      const clientWithoutKey = new WeatherApiClient();
      clientWithoutKey.apiKey = null;

      const result = await clientWithoutKey.checkConnection();
      expect(result).toBe(false);
    });
  });
});