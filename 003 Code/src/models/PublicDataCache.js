const BaseModel = require('./BaseModel');
const logger = require('../utils/logger');

/**
 * 공공 데이터 캐시 모델
 * Public data cache model for storing API responses
 */
class PublicDataCache extends BaseModel {
  constructor() {
    super('public_data_cache');
  }

  /**
   * 캐시 데이터 유효성 검증
   */
  validateCacheData(data) {
    const errors = [];

    // 필수 필드 검증
    if (!data.data_type) {
      errors.push('데이터 유형은 필수 입력 항목입니다.');
    }

    if (!data.data) {
      errors.push('캐시 데이터는 필수 입력 항목입니다.');
    }

    if (!data.expires_at) {
      errors.push('만료 시간은 필수 입력 항목입니다.');
    }

    // 데이터 유형 검증
    const validDataTypes = ['weather', 'air_quality', 'disaster'];
    if (data.data_type && !validDataTypes.includes(data.data_type)) {
      errors.push('올바른 데이터 유형이 아닙니다.');
    }

    // 지역 길이 검증
    if (data.region && data.region.length > 50) {
      errors.push('지역명은 50자를 초과할 수 없습니다.');
    }

    // 만료 시간 검증
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        errors.push('만료 시간은 현재 시간보다 이후여야 합니다.');
      }
    }

    return errors;
  }

  /**
   * 캐시 데이터 저장/업데이트
   */
  async setCache(dataType, data, expiresInMinutes = 60, region = '유성구') {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const cacheData = {
      data_type: dataType,
      region: region,
      data: JSON.stringify(data),
      expires_at: expiresAt
    };

    // 데이터 유효성 검증
    const validationErrors = this.validateCacheData(cacheData);
    if (validationErrors.length > 0) {
      throw new Error(`유효성 검증 실패: ${validationErrors.join(', ')}`);
    }

    try {
      // 기존 캐시 확인
      const existing = await this.findByTypeAndRegion(dataType, region);
      
      if (existing) {
        // 업데이트
        const success = await this.update(existing.id, cacheData);
        if (success) {
          logger.info(`캐시 데이터 업데이트: ${dataType} - ${region}`);
        }
        return existing.id;
      } else {
        // 새로 생성
        const cacheId = await this.create(cacheData);
        logger.info(`새 캐시 데이터 생성: ${dataType} - ${region}`);
        return cacheId;
      }
    } catch (error) {
      logger.error('캐시 데이터 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 캐시 데이터 조회
   */
  async getCache(dataType, region = '유성구') {
    try {
      const cached = await this.findByTypeAndRegion(dataType, region);
      
      if (!cached) {
        return null;
      }

      // 만료 시간 확인
      const now = new Date();
      const expiresAt = new Date(cached.expires_at);
      
      if (expiresAt <= now) {
        // 만료된 캐시 삭제
        await this.delete(cached.id);
        logger.info(`만료된 캐시 삭제: ${dataType} - ${region}`);
        return null;
      }

      // JSON 데이터 파싱
      try {
        cached.data = JSON.parse(cached.data);
      } catch (parseError) {
        logger.error('캐시 데이터 파싱 실패:', parseError);
        return null;
      }

      return cached;
    } catch (error) {
      logger.error('캐시 데이터 조회 실패:', error);
      return null;
    }
  }

  /**
   * 데이터 유형과 지역으로 캐시 조회
   */
  async findByTypeAndRegion(dataType, region = '유성구') {
    const query = 'SELECT * FROM public_data_cache WHERE data_type = ? AND region = ?';
    const results = await this.executeQuery(query, [dataType, region]);
    return results[0] || null;
  }

  /**
   * 유효한 캐시 데이터 조회
   */
  async findValidCache(dataType, region = '유성구') {
    const query = `
      SELECT * FROM public_data_cache 
      WHERE data_type = ? AND region = ? AND expires_at > NOW()
    `;
    const results = await this.executeQuery(query, [dataType, region]);
    
    if (results.length > 0) {
      const cached = results[0];
      try {
        cached.data = JSON.parse(cached.data);
        return cached;
      } catch (parseError) {
        logger.error('캐시 데이터 파싱 실패:', parseError);
        return null;
      }
    }
    
    return null;
  }

  /**
   * 만료된 캐시 정리
   */
  async cleanupExpiredCache() {
    const query = 'DELETE FROM public_data_cache WHERE expires_at <= NOW()';
    
    try {
      const result = await this.executeQuery(query);
      logger.info(`만료된 캐시 정리 완료: ${result.affectedRows}건 삭제`);
      return result.affectedRows;
    } catch (error) {
      logger.error('캐시 정리 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 유형의 모든 캐시 삭제
   */
  async clearCacheByType(dataType) {
    const query = 'DELETE FROM public_data_cache WHERE data_type = ?';
    
    try {
      const result = await this.executeQuery(query, [dataType]);
      logger.info(`${dataType} 캐시 삭제 완료: ${result.affectedRows}건`);
      return result.affectedRows;
    } catch (error) {
      logger.error('캐시 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 캐시 삭제
   */
  async clearAllCache() {
    const query = 'DELETE FROM public_data_cache';
    
    try {
      const result = await this.executeQuery(query);
      logger.info(`전체 캐시 삭제 완료: ${result.affectedRows}건`);
      return result.affectedRows;
    } catch (error) {
      logger.error('전체 캐시 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 캐시 통계 조회
   */
  async getCacheStats() {
    const queries = [
      {
        key: 'total',
        query: 'SELECT COUNT(*) as count FROM public_data_cache'
      },
      {
        key: 'valid',
        query: 'SELECT COUNT(*) as count FROM public_data_cache WHERE expires_at > NOW()'
      },
      {
        key: 'expired',
        query: 'SELECT COUNT(*) as count FROM public_data_cache WHERE expires_at <= NOW()'
      },
      {
        key: 'weather',
        query: 'SELECT COUNT(*) as count FROM public_data_cache WHERE data_type = "weather" AND expires_at > NOW()'
      },
      {
        key: 'air_quality',
        query: 'SELECT COUNT(*) as count FROM public_data_cache WHERE data_type = "air_quality" AND expires_at > NOW()'
      },
      {
        key: 'disaster',
        query: 'SELECT COUNT(*) as count FROM public_data_cache WHERE data_type = "disaster" AND expires_at > NOW()'
      }
    ];

    const stats = {};
    for (const { key, query } of queries) {
      const result = await this.executeQuery(query);
      stats[key] = result[0].count;
    }

    return stats;
  }

  /**
   * 최근 업데이트된 캐시 조회
   */
  async findRecentlyUpdated(limit = 10) {
    const query = `
      SELECT data_type, region, updated_at, expires_at,
             CASE WHEN expires_at > NOW() THEN 'valid' ELSE 'expired' END as status
      FROM public_data_cache 
      ORDER BY updated_at DESC 
      LIMIT ?
    `;
    
    return await this.executeQuery(query, [limit]);
  }

  /**
   * 캐시 히트율 계산을 위한 메서드
   */
  async recordCacheHit(dataType, region = '유성구') {
    // 실제 구현에서는 별도의 통계 테이블을 사용할 수 있음
    logger.info(`캐시 히트: ${dataType} - ${region}`);
  }

  /**
   * 캐시 미스 기록
   */
  async recordCacheMiss(dataType, region = '유성구') {
    // 실제 구현에서는 별도의 통계 테이블을 사용할 수 있음
    logger.info(`캐시 미스: ${dataType} - ${region}`);
  }

  /**
   * 날씨 데이터 캐시 (1시간)
   */
  async cacheWeatherData(weatherData, region = '유성구') {
    return await this.setCache('weather', weatherData, 60, region);
  }

  /**
   * 미세먼지 데이터 캐시 (2시간)
   */
  async cacheAirQualityData(airQualityData, region = '유성구') {
    return await this.setCache('air_quality', airQualityData, 120, region);
  }

  /**
   * 재난 데이터 캐시 (10분)
   */
  async cacheDisasterData(disasterData, region = '유성구') {
    return await this.setCache('disaster', disasterData, 10, region);
  }

  /**
   * 날씨 데이터 조회
   */
  async getWeatherData(region = '유성구') {
    return await this.getCache('weather', region);
  }

  /**
   * 미세먼지 데이터 조회
   */
  async getAirQualityData(region = '유성구') {
    return await this.getCache('air_quality', region);
  }

  /**
   * 재난 데이터 조회
   */
  async getDisasterData(region = '유성구') {
    return await this.getCache('disaster', region);
  }
}

module.exports = PublicDataCache;