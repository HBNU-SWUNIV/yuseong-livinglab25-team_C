const WeatherApiClient = require('./WeatherApiClient');
const AirQualityApiClient = require('./AirQualityApiClient');
const DisasterApiClient = require('./DisasterApiClient');
const PublicDataCache = require('../models/PublicDataCache');
const logger = require('../utils/logger');

/**
 * 공공 데이터 통합 서비스
 * API 클라이언트와 캐싱을 통합하여 데이터 처리 및 관리를 담당합니다.
 */
class PublicDataService {
  constructor() {
    this.weatherClient = new WeatherApiClient();
    this.airQualityClient = new AirQualityApiClient();
    this.disasterClient = new DisasterApiClient();
    this.cache = new PublicDataCache();
    
    // 재시도 설정
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 10 * 60 * 1000, // 10분
      backoffMultiplier: 1.5
    };
  }

  /**
   * 날씨 데이터를 가져오고 캐싱합니다
   * @param {boolean} forceRefresh - 캐시 무시하고 새로 가져올지 여부
   * @returns {Promise<Object>} 날씨 데이터
   */
  async getWeatherData(forceRefresh = false) {
    const region = '유성구';
    
    try {
      // 캐시된 데이터 확인 (강제 새로고침이 아닌 경우)
      if (!forceRefresh) {
        const cachedData = await this.cache.getWeatherData(region);
        if (cachedData) {
          await this.cache.recordCacheHit('weather', region);
          logger.info('Weather data served from cache');
          return this.normalizeWeatherData(cachedData.data);
        }
      }

      // API에서 새 데이터 가져오기
      await this.cache.recordCacheMiss('weather', region);
      const weatherData = await this.fetchWithRetry(
        () => this.weatherClient.getCurrentWeather(),
        'weather'
      );

      // 데이터 정규화 및 검증
      const normalizedData = this.normalizeWeatherData(weatherData);
      this.validateWeatherData(normalizedData);

      // 캐시에 저장 (1시간)
      await this.cache.cacheWeatherData(normalizedData, region);
      
      logger.info('Weather data fetched and cached successfully');
      return normalizedData;

    } catch (error) {
      logger.error('Failed to get weather data', { error: error.message });
      
      // 오류 시 캐시된 데이터라도 반환 시도
      const fallbackData = await this.getFallbackWeatherData(region);
      if (fallbackData) {
        logger.warn('Returning fallback weather data due to API error');
        return fallbackData;
      }
      
      throw error;
    }
  }

  /**
   * 미세먼지 데이터를 가져오고 캐싱합니다
   * @param {boolean} forceRefresh - 캐시 무시하고 새로 가져올지 여부
   * @returns {Promise<Object>} 미세먼지 데이터
   */
  async getAirQualityData(forceRefresh = false) {
    const region = '유성구';
    
    try {
      // 캐시된 데이터 확인
      if (!forceRefresh) {
        const cachedData = await this.cache.getAirQualityData(region);
        if (cachedData) {
          await this.cache.recordCacheHit('air_quality', region);
          logger.info('Air quality data served from cache');
          return this.normalizeAirQualityData(cachedData.data);
        }
      }

      // API에서 새 데이터 가져오기
      await this.cache.recordCacheMiss('air_quality', region);
      const airQualityData = await this.fetchWithRetry(
        () => this.airQualityClient.getCurrentAirQuality(),
        'air_quality'
      );

      // 데이터 정규화 및 검증
      const normalizedData = this.normalizeAirQualityData(airQualityData);
      this.validateAirQualityData(normalizedData);

      // 캐시에 저장 (2시간)
      await this.cache.cacheAirQualityData(normalizedData, region);
      
      logger.info('Air quality data fetched and cached successfully');
      return normalizedData;

    } catch (error) {
      logger.error('Failed to get air quality data', { error: error.message });
      
      // 오류 시 캐시된 데이터라도 반환 시도
      const fallbackData = await this.getFallbackAirQualityData(region);
      if (fallbackData) {
        logger.warn('Returning fallback air quality data due to API error');
        return fallbackData;
      }
      
      throw error;
    }
  }

  /**
   * 재난 알림 데이터를 가져오고 캐싱합니다
   * @param {boolean} forceRefresh - 캐시 무시하고 새로 가져올지 여부
   * @returns {Promise<Array>} 재난 알림 데이터 배열
   */
  async getDisasterData(forceRefresh = false) {
    const region = '유성구';
    
    try {
      // 캐시된 데이터 확인 (재난 알림은 실시간성이 중요하므로 짧은 캐시)
      if (!forceRefresh) {
        const cachedData = await this.cache.getDisasterData(region);
        if (cachedData) {
          await this.cache.recordCacheHit('disaster', region);
          logger.info('Disaster data served from cache');
          return this.normalizeDisasterData(cachedData.data);
        }
      }

      // API에서 새 데이터 가져오기
      await this.cache.recordCacheMiss('disaster', region);
      const disasterData = await this.fetchWithRetry(
        () => this.disasterClient.getRecentDisasters(24),
        'disaster'
      );

      // 데이터 정규화 및 검증
      const normalizedData = this.normalizeDisasterData(disasterData);
      this.validateDisasterData(normalizedData);

      // 캐시에 저장 (10분)
      await this.cache.cacheDisasterData(normalizedData, region);
      
      logger.info('Disaster data fetched and cached successfully', { 
        count: normalizedData.length 
      });
      return normalizedData;

    } catch (error) {
      logger.error('Failed to get disaster data', { error: error.message });
      
      // 오류 시 캐시된 데이터라도 반환 시도
      const fallbackData = await this.getFallbackDisasterData(region);
      if (fallbackData) {
        logger.warn('Returning fallback disaster data due to API error');
        return fallbackData;
      }
      
      throw error;
    }
  }

  /**
   * 긴급 재난 알림을 실시간으로 확인합니다
   * @returns {Promise<Array>} 긴급 재난 알림 배열
   */
  async getEmergencyAlerts() {
    try {
      logger.info('Checking for emergency alerts');
      
      const emergencyAlerts = await this.fetchWithRetry(
        () => this.disasterClient.getEmergencyAlerts(),
        'emergency_alerts'
      );

      const normalizedAlerts = this.normalizeDisasterData(emergencyAlerts);
      
      if (normalizedAlerts.length > 0) {
        logger.warn('Emergency alerts detected', { 
          count: normalizedAlerts.length,
          types: normalizedAlerts.map(alert => alert.disasterType)
        });
      }

      return normalizedAlerts;

    } catch (error) {
      logger.error('Failed to get emergency alerts', { error: error.message });
      throw error;
    }
  }

  /**
   * 재시도 로직을 포함한 API 호출
   * @param {Function} apiCall - API 호출 함수
   * @param {string} dataType - 데이터 유형
   * @returns {Promise<any>} API 응답 데이터
   */
  async fetchWithRetry(apiCall, dataType) {
    let lastError;
    let delay = this.retryConfig.retryDelay;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        logger.info(`Fetching ${dataType} data (attempt ${attempt}/${this.retryConfig.maxRetries})`);
        
        const data = await apiCall();
        
        if (attempt > 1) {
          logger.info(`${dataType} data fetch succeeded on retry attempt ${attempt}`);
        }
        
        return data;

      } catch (error) {
        lastError = error;
        logger.warn(`${dataType} data fetch failed (attempt ${attempt}/${this.retryConfig.maxRetries})`, {
          error: error.message
        });

        // 마지막 시도가 아니면 재시도 대기
        if (attempt < this.retryConfig.maxRetries) {
          logger.info(`Retrying ${dataType} fetch in ${delay / 1000} seconds`);
          await this.sleep(delay);
          delay *= this.retryConfig.backoffMultiplier;
        }
      }
    }

    // 모든 재시도 실패
    logger.error(`All retry attempts failed for ${dataType}`, { 
      error: lastError.message,
      attempts: this.retryConfig.maxRetries
    });
    throw lastError;
  }

  /**
   * 날씨 데이터 정규화
   * @param {Object} data - 원본 날씨 데이터
   * @returns {Object} 정규화된 날씨 데이터
   */
  normalizeWeatherData(data) {
    return {
      temperature: data.temperature || null,
      minTemperature: data.minTemperature || null,
      maxTemperature: data.maxTemperature || null,
      condition: data.condition || '알 수 없음',
      precipitationProbability: data.precipitationProbability || 0,
      humidity: data.humidity || null,
      windSpeed: data.windSpeed || null,
      fetchedAt: data.fetchedAt || new Date(),
      region: '유성구'
    };
  }

  /**
   * 미세먼지 데이터 정규화
   * @param {Object} data - 원본 미세먼지 데이터
   * @returns {Object} 정규화된 미세먼지 데이터
   */
  normalizeAirQualityData(data) {
    return {
      stationName: data.stationName || '유성구',
      pm10Value: data.pm10Value || null,
      pm10Grade: data.pm10Grade || '알 수 없음',
      pm25Value: data.pm25Value || null,
      pm25Grade: data.pm25Grade || '알 수 없음',
      o3Value: data.o3Value || null,
      o3Grade: data.o3Grade || '알 수 없음',
      khaiValue: data.khaiValue || null,
      khaiGrade: data.khaiGrade || '알 수 없음',
      dataTime: data.dataTime || new Date().toISOString(),
      fetchedAt: data.fetchedAt || new Date(),
      region: '유성구'
    };
  }

  /**
   * 재난 데이터 정규화
   * @param {Array} data - 원본 재난 데이터 배열
   * @returns {Array} 정규화된 재난 데이터 배열
   */
  normalizeDisasterData(data) {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(item => ({
      serialNumber: item.serialNumber || null,
      locationName: item.locationName || '유성구',
      disasterType: item.disasterType || '기타',
      msg: item.msg || '',
      createDate: item.createDate || new Date().toISOString(),
      emergencyLevel: item.emergencyLevel || '일반',
      isEmergency: Boolean(item.isEmergency),
      fetchedAt: item.fetchedAt || new Date(),
      region: '유성구'
    }));
  }

  /**
   * 날씨 데이터 유효성 검증
   * @param {Object} data - 날씨 데이터
   */
  validateWeatherData(data) {
    if (data.temperature !== null && (data.temperature < -50 || data.temperature > 60)) {
      logger.warn('Suspicious temperature value', { temperature: data.temperature });
    }
    
    if (data.precipitationProbability !== null && 
        (data.precipitationProbability < 0 || data.precipitationProbability > 100)) {
      logger.warn('Invalid precipitation probability', { 
        precipitationProbability: data.precipitationProbability 
      });
    }
  }

  /**
   * 미세먼지 데이터 유효성 검증
   * @param {Object} data - 미세먼지 데이터
   */
  validateAirQualityData(data) {
    if (data.pm10Value !== null && (data.pm10Value < 0 || data.pm10Value > 1000)) {
      logger.warn('Suspicious PM10 value', { pm10Value: data.pm10Value });
    }
    
    if (data.pm25Value !== null && (data.pm25Value < 0 || data.pm25Value > 500)) {
      logger.warn('Suspicious PM2.5 value', { pm25Value: data.pm25Value });
    }
  }

  /**
   * 재난 데이터 유효성 검증
   * @param {Array} data - 재난 데이터 배열
   */
  validateDisasterData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Disaster data must be an array');
    }
    
    data.forEach((item, index) => {
      if (!item.msg || item.msg.trim() === '') {
        logger.warn(`Empty disaster message at index ${index}`);
      }
    });
  }

  /**
   * 폴백 날씨 데이터 조회 (만료된 캐시라도 반환)
   * @param {string} region - 지역
   * @returns {Promise<Object|null>} 폴백 날씨 데이터
   */
  async getFallbackWeatherData(region) {
    try {
      const query = `
        SELECT * FROM public_data_cache 
        WHERE data_type = 'weather' AND region = ? 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      const results = await this.cache.executeQuery(query, [region]);
      
      if (results.length > 0) {
        const cached = results[0];
        cached.data = JSON.parse(cached.data);
        return this.normalizeWeatherData(cached.data);
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get fallback weather data', { error: error.message });
      return null;
    }
  }

  /**
   * 폴백 미세먼지 데이터 조회
   * @param {string} region - 지역
   * @returns {Promise<Object|null>} 폴백 미세먼지 데이터
   */
  async getFallbackAirQualityData(region) {
    try {
      const query = `
        SELECT * FROM public_data_cache 
        WHERE data_type = 'air_quality' AND region = ? 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      const results = await this.cache.executeQuery(query, [region]);
      
      if (results.length > 0) {
        const cached = results[0];
        cached.data = JSON.parse(cached.data);
        return this.normalizeAirQualityData(cached.data);
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get fallback air quality data', { error: error.message });
      return null;
    }
  }

  /**
   * 폴백 재난 데이터 조회
   * @param {string} region - 지역
   * @returns {Promise<Array|null>} 폴백 재난 데이터
   */
  async getFallbackDisasterData(region) {
    try {
      const query = `
        SELECT * FROM public_data_cache 
        WHERE data_type = 'disaster' AND region = ? 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      const results = await this.cache.executeQuery(query, [region]);
      
      if (results.length > 0) {
        const cached = results[0];
        cached.data = JSON.parse(cached.data);
        return this.normalizeDisasterData(cached.data);
      }
      
      return [];
    } catch (error) {
      logger.error('Failed to get fallback disaster data', { error: error.message });
      return [];
    }
  }

  /**
   * 모든 공공 데이터를 한 번에 업데이트
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateAllData() {
    const results = {
      weather: { success: false, error: null },
      airQuality: { success: false, error: null },
      disaster: { success: false, error: null }
    };

    // 날씨 데이터 업데이트
    try {
      await this.getWeatherData(true);
      results.weather.success = true;
    } catch (error) {
      results.weather.error = error.message;
    }

    // 미세먼지 데이터 업데이트
    try {
      await this.getAirQualityData(true);
      results.airQuality.success = true;
    } catch (error) {
      results.airQuality.error = error.message;
    }

    // 재난 데이터 업데이트
    try {
      await this.getDisasterData(true);
      results.disaster.success = true;
    } catch (error) {
      results.disaster.error = error.message;
    }

    logger.info('Public data update completed', { results });
    return results;
  }

  /**
   * API 연결 상태 확인
   * @returns {Promise<Object>} 각 API의 연결 상태
   */
  async checkApiConnections() {
    const status = {
      weather: false,
      airQuality: false,
      disaster: false
    };

    try {
      status.weather = await this.weatherClient.checkConnection();
    } catch (error) {
      logger.error('Weather API connection check failed', { error: error.message });
    }

    try {
      status.airQuality = await this.airQualityClient.checkConnection();
    } catch (error) {
      logger.error('Air Quality API connection check failed', { error: error.message });
    }

    try {
      status.disaster = await this.disasterClient.checkConnection();
    } catch (error) {
      logger.error('Disaster API connection check failed', { error: error.message });
    }

    return status;
  }

  /**
   * 캐시 통계 조회
   * @returns {Promise<Object>} 캐시 통계
   */
  async getCacheStatistics() {
    return await this.cache.getCacheStats();
  }

  /**
   * 만료된 캐시 정리
   * @returns {Promise<number>} 삭제된 캐시 수
   */
  async cleanupExpiredCache() {
    return await this.cache.cleanupExpiredCache();
  }

  /**
   * 지연 함수
   * @param {number} ms - 지연 시간 (밀리초)
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = PublicDataService;