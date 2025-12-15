const axios = require("axios");
const logger = require("../utils/logger");

/**
 * 행정안전부 재난 알림 API 클라이언트
 */
class DisasterApiClient {
  constructor() {
    this.baseURL =
      process.env.DISASTER_API_URL ||
      "http://apis.data.go.kr/1741000/DisasterMsg3";
    this.apiKey = process.env.DISASTER_API_KEY;
    this.timeout = 30000;

    this.regionCodes = ["대전", "유성구", "유성"];
    this.emergencyKeywords = [
      "폭염",
      "한파",
      "지진",
      "호우",
      "대설",
      "강풍",
      "태풍",
      "화재",
      "가스누출",
    ];

    if (!this.apiKey) {
      logger.warn("Disaster API key not configured");
    }
  }

  /**
   * 최신 재난 알림 정보를 가져옵니다 (500 에러 예외 처리 추가)
   */
  async getRecentDisasters(hours = 24) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);

      const params = {
        serviceKey: this.apiKey,
        pageNo: 1,
        numOfRows: 100,
        type: "json",
        crtDt: this.formatDateTime(startDate),
        endDt: this.formatDateTime(endDate),
      };

      logger.info("Fetching disaster alerts from MOIS API");

      const response = await axios.get(`${this.baseURL}/getDisasterMsg3List`, {
        params,
        timeout: this.timeout,
      });

      if (response.data.header.resultCode !== "00") {
        throw new Error(
          `Disaster API Error: ${response.data.header.resultMsg}`
        );
      }

      const items = response.data.body || [];
      const filteredDisasters = this.filterRelevantDisasters(items);

      logger.info("Successfully fetched disaster alerts", {
        total: items.length,
        relevant: filteredDisasters.length,
      });

      return filteredDisasters.map((item) => this.parseDisasterData(item));
    } catch (error) {
      // [수정됨] 500 에러 등 API 호출 실패 시 빈 배열 반환하여 시스템 안정성 확보
      if (error.response && error.response.status >= 500) {
        logger.warn(
          `재난문자 API 서버 응답 없음 (${error.response.status}). 빈 목록을 반환합니다.`
        );
        return [];
      }

      logger.error("Failed to fetch disaster alerts", {
        error: error.message,
      });
      return []; // 에러 발생 시에도 빈 배열 반환
    }
  }

  // ... (나머지 메서드는 그대로 유지하세요. 아래는 복사 편의를 위해 포함)

  async getEmergencyAlerts() {
    try {
      const disasters = await this.getRecentDisasters(1);

      const emergencyAlerts = disasters.filter((disaster) =>
        this.isEmergencyAlert(disaster)
      );

      if (emergencyAlerts.length > 0) {
        logger.warn("Emergency alerts detected", {
          count: emergencyAlerts.length,
        });
      }

      return emergencyAlerts;
    } catch (error) {
      logger.error("Failed to get emergency alerts", { error: error.message });
      return [];
    }
  }

  filterRelevantDisasters(disasters) {
    return disasters.filter((disaster) => {
      const locationName = disaster.locationName || "";
      const msg = disaster.msg || "";

      const isRelevantRegion = this.regionCodes.some(
        (region) => locationName.includes(region) || msg.includes(region)
      );

      const isNationalEmergency =
        locationName.includes("전국") &&
        this.emergencyKeywords.some((keyword) => msg.includes(keyword));

      return isRelevantRegion || isNationalEmergency;
    });
  }

  isEmergencyAlert(disaster) {
    const msg = disaster.msg || "";
    const disasterType = disaster.disasterType || "";

    const hasEmergencyKeyword = this.emergencyKeywords.some(
      (keyword) => msg.includes(keyword) || disasterType.includes(keyword)
    );

    const hasEmergencyLevel = ["경보", "주의보", "특보", "긴급"].some((level) =>
      msg.includes(level)
    );

    return hasEmergencyKeyword || hasEmergencyLevel;
  }

  parseDisasterData(item) {
    return {
      serialNumber: item.sn,
      locationName: item.locationName,
      locationId: item.locationId,
      disasterType: this.getDisasterType(item.msg),
      msg: item.msg,
      createDate: item.crtDt,
      modifyDate: item.mdfcnDt,
      emergencyLevel: this.getEmergencyLevel(item.msg),
      isEmergency: this.isEmergencyAlert(item),
      fetchedAt: new Date(),
    };
  }

  getDisasterType(msg) {
    for (const keyword of this.emergencyKeywords) {
      if (msg.includes(keyword)) return keyword;
    }
    if (msg.includes("미세먼지")) return "미세먼지";
    if (msg.includes("오존")) return "오존";
    if (msg.includes("황사")) return "황사";
    if (msg.includes("산불")) return "산불";
    if (msg.includes("정전")) return "정전";
    return "기타";
  }

  getEmergencyLevel(msg) {
    if (msg.includes("경보")) return "경보";
    if (msg.includes("주의보")) return "주의보";
    if (msg.includes("특보")) return "특보";
    if (msg.includes("긴급")) return "긴급";
    if (msg.includes("심각")) return "심각";
    if (msg.includes("경계")) return "경계";
    if (msg.includes("관심")) return "관심";
    return "일반";
  }

  formatDateTime(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}

module.exports = DisasterApiClient;
