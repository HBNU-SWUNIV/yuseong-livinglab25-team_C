const { PublicDataCache } = require('../../src/models');
const { connectDatabase, closeConnection } = require('../../src/config/database');
const { initializeDatabase } = require('../../src/config/initDatabase');

describe('PublicDataCache Model', () => {
  beforeAll(async () => {
    await connectDatabase();
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeConnection();
  });

  beforeEach(async () => {
    // 테스트 전 캐시 데이터 정리
    await PublicDataCache.clearAllCache();
  });

  describe('validateCacheData', () => {
    test('유효한 캐시 데이터는 검증을 통과해야 함', () => {
      const futureTime = new Date();
      futureTime.setMinutes(futureTime.getMinutes() + 60);

      const validData = {
        data_type: 'weather',
        region: '유성구',
        data: JSON.stringify({ temperature: 20, humidity: 60 }),
        expires_at: futureTime
      };

      const errors = PublicDataCache.validateCacheData(validData);
      expect(errors).toHaveLength(0);
    });

    test('필수 필드가 없으면 검증 실패', () => {
      const invalidData = {};
      const errors = PublicDataCache.validateCacheData(invalidData);
      
      expect(errors).toContain('데이터 유형은 필수 입력 항목입니다.');
      expect(errors).toContain('캐시 데이터는 필수 입력 항목입니다.');
      expect(errors).toContain('만료 시간은 필수 입력 항목입니다.');
    });

    test('잘못된 데이터 유형은 검증 실패', () => {
      const futureTime = new Date();
      futureTime.setMinutes(futureTime.getMinutes() + 60);

      const invalidData = {
        data_type: 'invalid_type',
        data: JSON.stringify({}),
        expires_at: futureTime
      };
      
      const errors = PublicDataCache.validateCacheData(invalidData);
      expect(errors).toContain('올바른 데이터 유형이 아닙니다.');
    });
  });

  describe('setCache and getCache', () => {
    test('캐시 데이터를 저장하고 조회할 수 있어야 함', async () => {
      const weatherData = {
        temperature: 22,
        humidity: 65,
        condition: '맑음'
      };

      const cacheId = await PublicDataCache.setCache('weather', weatherData, 60, '유성구');
      expect(cacheId).toBeDefined();

      const cached = await PublicDataCache.getCache('weather', '유성구');
      expect(cached).toBeDefined();
      expect(cached.data.temperature).toBe(22);
      expect(cached.data.condition).toBe('맑음');
    });

    test('기존 캐시가 있으면 업데이트해야 함', async () => {
      const initialData = { temperature: 20 };
      const updatedData = { temperature: 25 };

      await PublicDataCache.setCache('weather', initialData, 60, '유성구');
      await PublicDataCache.setCache('weather', updatedData, 60, '유성구');

      const cached = await PublicDataCache.getCache('weather', '유성구');
      expect(cached.data.temperature).toBe(25);
    });

    test('만료된 캐시는 null을 반환해야 함', async () => {
      const weatherData = { temperature: 20 };
      
      // 이미 만료된 시간으로 캐시 생성
      const pastTime = new Date();
      pastTime.setMinutes(pastTime.getMinutes() - 10);
      
      await PublicDataCache.executeQuery(
        'INSERT INTO public_data_cache (data_type, region, data, expires_at) VALUES (?, ?, ?, ?)',
        ['weather', '유성구', JSON.stringify(weatherData), pastTime]
      );

      const cached = await PublicDataCache.getCache('weather', '유성구');
      expect(cached).toBeNull();
    });
  });

  describe('cacheWeatherData', () => {
    test('날씨 데이터를 캐시할 수 있어야 함', async () => {
      const weatherData = {
        temperature: 18,
        condition: '흐림',
        humidity: 70
      };

      const cacheId = await PublicDataCache.cacheWeatherData(weatherData, '유성구');
      expect(cacheId).toBeDefined();

      const cached = await PublicDataCache.getWeatherData('유성구');
      expect(cached.data.temperature).toBe(18);
      expect(cached.data.condition).toBe('흐림');
    });
  });

  describe('cacheAirQualityData', () => {
    test('미세먼지 데이터를 캐시할 수 있어야 함', async () => {
      const airQualityData = {
        pm10: 30,
        pm25: 15,
        grade: '좋음'
      };

      const cacheId = await PublicDataCache.cacheAirQualityData(airQualityData, '유성구');
      expect(cacheId).toBeDefined();

      const cached = await PublicDataCache.getAirQualityData('유성구');
      expect(cached.data.pm10).toBe(30);
      expect(cached.data.grade).toBe('좋음');
    });
  });

  describe('cacheDisasterData', () => {
    test('재난 데이터를 캐시할 수 있어야 함', async () => {
      const disasterData = {
        type: '폭염주의보',
        message: '폭염주의보가 발령되었습니다.',
        level: 'warning'
      };

      const cacheId = await PublicDataCache.cacheDisasterData(disasterData, '유성구');
      expect(cacheId).toBeDefined();

      const cached = await PublicDataCache.getDisasterData('유성구');
      expect(cached.data.type).toBe('폭염주의보');
      expect(cached.data.level).toBe('warning');
    });
  });

  describe('cleanupExpiredCache', () => {
    test('만료된 캐시를 정리할 수 있어야 함', async () => {
      // 만료된 캐시 생성
      const pastTime = new Date();
      pastTime.setMinutes(pastTime.getMinutes() - 10);
      
      await PublicDataCache.executeQuery(
        'INSERT INTO public_data_cache (data_type, region, data, expires_at) VALUES (?, ?, ?, ?)',
        ['weather', '유성구', JSON.stringify({ temp: 20 }), pastTime]
      );

      // 유효한 캐시 생성
      await PublicDataCache.cacheWeatherData({ temp: 25 }, '유성구');

      const deletedCount = await PublicDataCache.cleanupExpiredCache();
      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // 유효한 캐시는 남아있어야 함
      const validCache = await PublicDataCache.getWeatherData('유성구');
      expect(validCache).toBeDefined();
      expect(validCache.data.temp).toBe(25);
    });
  });

  describe('getCacheStats', () => {
    test('캐시 통계를 조회할 수 있어야 함', async () => {
      await PublicDataCache.cacheWeatherData({ temp: 20 }, '유성구');
      await PublicDataCache.cacheAirQualityData({ pm10: 30 }, '유성구');

      const stats = await PublicDataCache.getCacheStats();
      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.weather).toBeGreaterThanOrEqual(1);
      expect(stats.air_quality).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clearCacheByType', () => {
    test('특정 유형의 캐시를 삭제할 수 있어야 함', async () => {
      await PublicDataCache.cacheWeatherData({ temp: 20 }, '유성구');
      await PublicDataCache.cacheAirQualityData({ pm10: 30 }, '유성구');

      const deletedCount = await PublicDataCache.clearCacheByType('weather');
      expect(deletedCount).toBe(1);

      // 날씨 캐시는 삭제되어야 함
      const weatherCache = await PublicDataCache.getWeatherData('유성구');
      expect(weatherCache).toBeNull();

      // 미세먼지 캐시는 남아있어야 함
      const airCache = await PublicDataCache.getAirQualityData('유성구');
      expect(airCache).toBeDefined();
    });
  });
});