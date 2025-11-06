const AirQualityApiClient = require('../../src/services/AirQualityApiClient');

describe('AirQualityApiClient', () => {
  let airQualityClient;

  beforeEach(() => {
    airQualityClient = new AirQualityApiClient();
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(airQualityClient.baseURL).toBeDefined();
      expect(airQualityClient.timeout).toBe(30000);
      expect(airQualityClient.stationName).toBe('유성구');
      expect(airQualityClient.sidoName).toBe('대전');
    });

    test('should use environment variables when available', () => {
      const originalApiKey = process.env.AIR_QUALITY_API_KEY;
      const originalApiUrl = process.env.AIR_QUALITY_API_URL;
      
      process.env.AIR_QUALITY_API_KEY = 'test-air-key';
      process.env.AIR_QUALITY_API_URL = 'http://test-air-url.com';
      
      const client = new AirQualityApiClient();
      expect(client.apiKey).toBe('test-air-key');
      expect(client.baseURL).toBe('http://test-air-url.com');
      
      // 환경 변수 복원
      process.env.AIR_QUALITY_API_KEY = originalApiKey;
      process.env.AIR_QUALITY_API_URL = originalApiUrl;
    });
  });

  describe('parseValue', () => {
    test('should parse valid numeric values', () => {
      expect(airQualityClient.parseValue('25')).toBe(25);
      expect(airQualityClient.parseValue('12.5')).toBe(12.5);
      expect(airQualityClient.parseValue('0')).toBe(0);
    });

    test('should return null for invalid values', () => {
      expect(airQualityClient.parseValue('-')).toBeNull();
      expect(airQualityClient.parseValue('')).toBeNull();
      expect(airQualityClient.parseValue(null)).toBeNull();
      expect(airQualityClient.parseValue(undefined)).toBeNull();
      expect(airQualityClient.parseValue('invalid')).toBeNull();
    });
  });

  describe('getGradeText', () => {
    test('should return correct grade text', () => {
      expect(airQualityClient.getGradeText('1')).toBe('좋음');
      expect(airQualityClient.getGradeText('2')).toBe('보통');
      expect(airQualityClient.getGradeText('3')).toBe('나쁨');
      expect(airQualityClient.getGradeText('4')).toBe('매우나쁨');
      expect(airQualityClient.getGradeText('9')).toBe('알 수 없음');
    });
  });

  describe('formatDate', () => {
    test('should format date correctly', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      const formatted = airQualityClient.formatDate(testDate);
      expect(formatted).toBe('2024-01-15');
    });

    test('should handle single digit months and days', () => {
      const testDate = new Date('2024-03-05T10:30:00');
      const formatted = airQualityClient.formatDate(testDate);
      expect(formatted).toBe('2024-03-05');
    });
  });

  describe('parseAirQualityData', () => {
    test('should parse air quality data correctly', () => {
      const mockItem = {
        stationName: '유성구',
        dataTime: '2024-01-15 14:00',
        pm10Value: '25',
        pm10Grade1h: '2',
        pm25Value: '15',
        pm25Grade1h: '1',
        o3Value: '0.05',
        o3Grade: '1',
        no2Value: '0.03',
        no2Grade: '1',
        coValue: '0.5',
        coGrade: '1',
        so2Value: '0.002',
        so2Grade: '1',
        khaiValue: '65',
        khaiGrade: '2'
      };

      const result = airQualityClient.parseAirQualityData(mockItem);

      expect(result.stationName).toBe('유성구');
      expect(result.dataTime).toBe('2024-01-15 14:00');
      expect(result.pm10Value).toBe(25);
      expect(result.pm10Grade).toBe('보통');
      expect(result.pm25Value).toBe(15);
      expect(result.pm25Grade).toBe('좋음');
      expect(result.o3Value).toBe(0.05);
      expect(result.o3Grade).toBe('좋음');
      expect(result.khaiValue).toBe(65);
      expect(result.khaiGrade).toBe('보통');
      expect(result.fetchedAt).toBeInstanceOf(Date);
    });

    test('should handle missing or invalid values', () => {
      const mockItem = {
        stationName: '유성구',
        dataTime: '2024-01-15 14:00',
        pm10Value: '-',
        pm10Grade1h: null,
        pm25Value: '',
        pm25Grade1h: undefined
      };

      const result = airQualityClient.parseAirQualityData(mockItem);

      expect(result.pm10Value).toBeNull();
      expect(result.pm10Grade).toBe('알 수 없음');
      expect(result.pm25Value).toBeNull();
      expect(result.pm25Grade).toBe('알 수 없음');
    });
  });

  describe('getCurrentAirQuality', () => {
    test('should throw error when API key is not configured', async () => {
      const clientWithoutKey = new AirQualityApiClient();
      clientWithoutKey.apiKey = null;

      await expect(clientWithoutKey.getCurrentAirQuality()).rejects.toThrow();
    });

    // 실제 API 호출 테스트는 환경에 따라 스킵할 수 있음
    test.skip('should fetch air quality data from API', async () => {
      // 이 테스트는 실제 API 키가 있을 때만 실행
      if (!process.env.AIR_QUALITY_API_KEY) {
        return;
      }

      const result = await airQualityClient.getCurrentAirQuality();
      
      expect(result).toBeDefined();
      expect(result.fetchedAt).toBeInstanceOf(Date);
      expect(result.stationName).toBeDefined();
    });
  });

  describe('getNearbyStation', () => {
    test('should return null when API call fails', async () => {
      const clientWithoutKey = new AirQualityApiClient();
      clientWithoutKey.apiKey = null;

      const result = await clientWithoutKey.getNearbyStation();
      expect(result).toBeNull();
    });
  });

  describe('getAirQualityForecast', () => {
    test('should throw error when API key is not configured', async () => {
      const clientWithoutKey = new AirQualityApiClient();
      clientWithoutKey.apiKey = null;

      await expect(clientWithoutKey.getAirQualityForecast()).rejects.toThrow();
    });
  });

  describe('getSidoAirQuality', () => {
    test('should throw error when API key is not configured', async () => {
      const clientWithoutKey = new AirQualityApiClient();
      clientWithoutKey.apiKey = null;

      await expect(clientWithoutKey.getSidoAirQuality()).rejects.toThrow();
    });
  });

  describe('checkConnection', () => {
    test('should return false when connection fails', async () => {
      const clientWithoutKey = new AirQualityApiClient();
      clientWithoutKey.apiKey = null;

      const result = await clientWithoutKey.checkConnection();
      expect(result).toBe(false);
    });
  });
});