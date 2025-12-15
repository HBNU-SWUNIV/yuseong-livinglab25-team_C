const BaseModel = require("./BaseModel");
const logger = require("../utils/logger");

/**
 * 공공 데이터 캐시 모델
 * Public data cache model for storing API responses
 */
class PublicDataCache extends BaseModel {
  constructor() {
    super("public_data_cache");
  }

  /**
   * 캐시 데이터 유효성 검증
   */
  validateCacheData(data) {
    const errors = [];

    if (!data.data_type) errors.push("데이터 유형은 필수 입력 항목입니다.");
    if (!data.data) errors.push("캐시 데이터는 필수 입력 항목입니다.");
    if (!data.expires_at) errors.push("만료 시간은 필수 입력 항목입니다.");

    const validDataTypes = ["weather", "air_quality", "disaster"];
    if (data.data_type && !validDataTypes.includes(data.data_type)) {
      errors.push("올바른 데이터 유형이 아닙니다.");
    }

    if (data.region && data.region.length > 50) {
      errors.push("지역명은 50자를 초과할 수 없습니다.");
    }

    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        errors.push("만료 시간은 현재 시간보다 이후여야 합니다.");
      }
    }

    return errors;
  }

  /**
   * 캐시 데이터 저장/업데이트 (안전장치 추가)
   */
  async setCache(dataType, data, expiresInMinutes = 60, region = "유성구") {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // [안전장치] 데이터가 이미 문자열인 경우와 객체인 경우를 구분하여 처리
    let stringifiedData;
    try {
      stringifiedData = typeof data === "string" ? data : JSON.stringify(data);

      // 만약 결과가 "[object Object]"라면 뭔가 잘못된 것이므로 로깅
      if (
        stringifiedData === '"[object Object]"' ||
        stringifiedData === "[object Object]"
      ) {
        logger.error(
          `[CRITICAL] 잘못된 데이터 저장 시도 감지: ${dataType}`,
          data
        );
      }
    } catch (e) {
      logger.error("데이터 변환 중 오류:", e);
      stringifiedData = "{}";
    }

    const cacheData = {
      data_type: dataType,
      region: region,
      data: stringifiedData,
      expires_at: expiresAt,
    };

    const validationErrors = this.validateCacheData(cacheData);
    if (validationErrors.length > 0) {
      throw new Error(`유효성 검증 실패: ${validationErrors.join(", ")}`);
    }

    try {
      const existing = await this.findByTypeAndRegion(dataType, region);

      if (existing) {
        const success = await this.update(existing.id, cacheData);
        if (success) {
          logger.info(`캐시 데이터 업데이트: ${dataType} - ${region}`);
        }
        return existing.id;
      } else {
        const cacheId = await this.create(cacheData);
        logger.info(`새 캐시 데이터 생성: ${dataType} - ${region}`);
        return cacheId;
      }
    } catch (error) {
      logger.error("캐시 데이터 저장 실패:", error);
      throw error;
    }
  }

  /**
   * 캐시 데이터 조회 (자동 복구 기능 포함)
   */
  async getCache(dataType, region = "유성구") {
    try {
      const cached = await this.findByTypeAndRegion(dataType, region);

      if (!cached) {
        return null;
      }

      const now = new Date();
      const expiresAt = new Date(cached.expires_at);

      if (expiresAt <= now) {
        await this.delete(cached.id);
        logger.info(`만료된 캐시 삭제: ${dataType} - ${region}`);
        return null;
      }

      // [자동 복구] JSON 파싱 실패 시 해당 캐시 삭제
      try {
        cached.data = JSON.parse(cached.data);
        return cached;
      } catch (parseError) {
        logger.error(
          `[CORRUPTION] 손상된 캐시 데이터 감지 (ID: ${cached.id}). 삭제 후 재생성합니다.`
        );
        await this.delete(cached.id); // 손상된 데이터 삭제
        return null; // 캐시 미스로 처리하여 새로 받아오게 함
      }
    } catch (error) {
      logger.error("캐시 데이터 조회 실패:", error);
      return null;
    }
  }

  async findByTypeAndRegion(dataType, region = "유성구") {
    const query =
      "SELECT * FROM public_data_cache WHERE data_type = ? AND region = ?";
    const results = await this.executeQuery(query, [dataType, region]);
    return results[0] || null;
  }

  async cleanupExpiredCache() {
    const query = "DELETE FROM public_data_cache WHERE expires_at <= NOW()";
    try {
      const result = await this.executeQuery(query);
      logger.info(`만료된 캐시 정리 완료: ${result.affectedRows}건 삭제`);
      return result.affectedRows;
    } catch (error) {
      logger.error("캐시 정리 실패:", error);
      throw error;
    }
  }

  async getCacheStats() {
    const queries = [
      {
        key: "total",
        query: "SELECT COUNT(*) as count FROM public_data_cache",
      },
      {
        key: "valid",
        query:
          "SELECT COUNT(*) as count FROM public_data_cache WHERE expires_at > NOW()",
      },
      {
        key: "expired",
        query:
          "SELECT COUNT(*) as count FROM public_data_cache WHERE expires_at <= NOW()",
      },
    ];

    const stats = {};
    for (const { key, query } of queries) {
      const result = await this.executeQuery(query);
      stats[key] = result[0].count;
    }
    return stats;
  }

  // ★★★ [누락되었던 함수들 복구 완료] ★★★

  /**
   * 캐시 히트 기록
   */
  async recordCacheHit(dataType, region = "유성구") {
    logger.info(`캐시 히트: ${dataType} - ${region}`);
  }

  /**
   * 캐시 미스 기록
   */
  async recordCacheMiss(dataType, region = "유성구") {
    logger.info(`캐시 미스: ${dataType} - ${region}`);
  }

  /**
   * 날씨 데이터 캐시 (1시간)
   */
  async cacheWeatherData(weatherData, region = "유성구") {
    return await this.setCache("weather", weatherData, 60, region);
  }

  /**
   * 미세먼지 데이터 캐시 (2시간)
   */
  async cacheAirQualityData(airQualityData, region = "유성구") {
    return await this.setCache("air_quality", airQualityData, 120, region);
  }

  /**
   * 재난 데이터 캐시 (10분)
   */
  async cacheDisasterData(disasterData, region = "유성구") {
    return await this.setCache("disaster", disasterData, 10, region);
  }

  /**
   * 날씨 데이터 조회 (편의 메서드)
   */
  async getWeatherData(region = "유성구") {
    return await this.getCache("weather", region);
  }

  /**
   * 미세먼지 데이터 조회 (편의 메서드)
   */
  async getAirQualityData(region = "유성구") {
    return await this.getCache("air_quality", region);
  }

  /**
   * 재난 데이터 조회 (편의 메서드)
   */
  async getDisasterData(region = "유성구") {
    return await this.getCache("disaster", region);
  }
}

module.exports = PublicDataCache;
