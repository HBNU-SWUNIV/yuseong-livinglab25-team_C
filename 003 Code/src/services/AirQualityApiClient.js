const axios = require("axios");
const logger = require("../utils/logger");

/**
 * 한국환경공단 에어코리아 대기질 API
 * 동네별(측정소별) 미세먼지/오존/아황산가스 등 실시간 정보 조회
 */
class AirQualityApiClient {
  constructor() {
    this.apiUrl = `${process.env.AIR_QUALITY_API_URL}/getCtprvnRltmMesureDnsty`;
    this.serviceKey = process.env.AIR_QUALITY_API_KEY;
  }

  /**
   * 대전광역시 전체 측정소 실시간 정보 조회
   */
  async fetchDaejeonAirQuality() {
    const params = {
      serviceKey: this.serviceKey,
      returnType: "json",
      numOfRows: 200,
      pageNo: 1,
      sidoName: "대전",
      ver: "1.0",
    };

    try {
      logger.info("📡 Fetching Daejeon air quality from AirKorea...", { params });

      const { data } = await axios.get(this.apiUrl, { params });

      if (!data?.response?.body?.items) {
        throw new Error("Invalid API response structure");
      }

      const items = data.response.body.items;

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("No air quality data found");
      }

      // === 동네별 그룹화 ===
      const grouped = {};

      for (const item of items) {
        const name = item.stationName.trim();

        if (!grouped[name]) grouped[name] = [];

        grouped[name].push({
          time: item.dataTime,
          pm10: safeNumber(item.pm10Value),
          pm25: safeNumber(item.pm25Value),
          o3: safeNumber(item.o3Value),
          no2: safeNumber(item.no2Value),
          so2: safeNumber(item.so2Value),
          co: safeNumber(item.coValue),
          pm10Grade: safeNumber(item.pm10Grade),
          pm25Grade: safeNumber(item.pm25Grade),
          khaiValue: safeNumber(item.khaiValue),
          khaiGrade: safeNumber(item.khaiGrade),
        });
      }

      logger.info("✅ Successfully fetched & grouped Daejeon air quality");

      return grouped;

    } catch (error) {
      logger.error("❌ Failed to fetch Daejeon air quality", {
        error: error.message,
      });
      throw error;
    }
  }

}

/** 문자열 숫자를 안전하게 숫자로 변환 */
function safeNumber(v) {
  if (v === null || v === undefined || v === "-" || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

module.exports = AirQualityApiClient;