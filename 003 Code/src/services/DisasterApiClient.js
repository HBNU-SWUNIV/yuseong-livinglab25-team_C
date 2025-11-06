const axios = require('axios');
const logger = require('../utils/logger');

/**
 * 행정안전부 재난 알림 API 클라이언트
 * 행정안전부 재난문자방송 발령현황 API를 통해 재난 알림 정보를 가져옵니다.
 */
class DisasterApiClient {
  constructor() {
    this.baseURL = process.env.DISASTER_API_URL || 'http://apis.data.go.kr/1741000/DisasterMsg3';
    this.apiKey = process.env.DISASTER_API_KEY;
    this.timeout = 30000; // 30초 타임아웃
    
    // 유성구 지역 코드 및 키워드
    this.regionCodes = ['대전', '유성구', '유성'];
    this.emergencyKeywords = ['폭염', '한파', '지진', '호우', '대설', '강풍', '태풍', '화재', '가스누출'];
    
    if (!this.apiKey) {
      logger.warn('Disaster API key not configured');
    }
  }

  /**
   * 최신 재난 알림 정보를 가져옵니다
   * @param {number} hours - 몇 시간 전까지의 데이터를 가져올지 (기본: 24시간)
   * @returns {Promise<Array>} 재난 알림 정보 배열
   */
  async getRecentDisasters(hours = 24) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (hours * 60 * 60 * 1000));

      const params = {
        serviceKey: this.apiKey,
        pageNo: 1,
        numOfRows: 100,
        type: 'json',
        crtDt: this.formatDateTime(startDate),
        endDt: this.formatDateTime(endDate)
      };

      logger.info('Fetching disaster alerts from MOIS API', { 
        startDate: this.formatDateTime(startDate),
        endDate: this.formatDateTime(endDate)
      });

      const response = await axios.get(`${this.baseURL}/getDisasterMsg3List`, {
        params,
        timeout: this.timeout
      });

      if (response.data.header.resultCode !== '00') {
        throw new Error(`Disaster API Error: ${response.data.header.resultMsg}`);
      }

      const items = response.data.body || [];
      const filteredDisasters = this.filterRelevantDisasters(items);
      
      logger.info('Successfully fetched disaster alerts', { 
        total: items.length,
        relevant: filteredDisasters.length 
      });

      return filteredDisasters.map(item => this.parseDisasterData(item));

    } catch (error) {
      logger.error('Failed to fetch disaster alerts', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * 실시간 긴급 재난 알림을 모니터링합니다
   * @returns {Promise<Array>} 최근 1시간 내 긴급 재난 알림 배열
   */
  async getEmergencyAlerts() {
    try {
      // 최근 1시간 내 재난 알림 확인
      const disasters = await this.getRecentDisasters(1);
      
      // 긴급 상황만 필터링
      const emergencyAlerts = disasters.filter(disaster => 
        this.isEmergencyAlert(disaster)
      );

      if (emergencyAlerts.length > 0) {
        logger.warn('Emergency alerts detected', { 
          count: emergencyAlerts.length,
          alerts: emergencyAlerts.map(alert => ({
            type: alert.disasterType,
            region: alert.locationName,
            time: alert.createDate
          }))
        });
      }

      return emergencyAlerts;

    } catch (error) {
      logger.error('Failed to get emergency alerts', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 유성구와 관련된 재난 알림만 필터링합니다
   * @param {Array} disasters - 전체 재난 알림 배열
   * @returns {Array} 필터링된 재난 알림 배열
   */
  filterRelevantDisasters(disasters) {
    return disasters.filter(disaster => {
      const locationName = disaster.locationName || '';
      const msg = disaster.msg || '';
      
      // 지역 코드로 필터링
      const isRelevantRegion = this.regionCodes.some(region => 
        locationName.includes(region) || msg.includes(region)
      );

      // 전국 단위 긴급 재난은 포함
      const isNationalEmergency = locationName.includes('전국') && 
        this.emergencyKeywords.some(keyword => msg.includes(keyword));

      return isRelevantRegion || isNationalEmergency;
    });
  }

  /**
   * 긴급 알림인지 판단합니다
   * @param {Object} disaster - 재난 알림 객체
   * @returns {boolean} 긴급 알림 여부
   */
  isEmergencyAlert(disaster) {
    const msg = disaster.msg || '';
    const disasterType = disaster.disasterType || '';
    
    // 긴급 키워드 포함 여부 확인
    const hasEmergencyKeyword = this.emergencyKeywords.some(keyword => 
      msg.includes(keyword) || disasterType.includes(keyword)
    );

    // 경보, 주의보 등 긴급 단계 확인
    const hasEmergencyLevel = ['경보', '주의보', '특보', '긴급'].some(level => 
      msg.includes(level)
    );

    return hasEmergencyKeyword || hasEmergencyLevel;
  }

  /**
   * 재난 데이터를 파싱합니다
   * @param {Object} item - API 응답 아이템
   * @returns {Object} 파싱된 재난 정보
   */
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
      fetchedAt: new Date()
    };
  }

  /**
   * 메시지에서 재난 유형을 추출합니다
   * @param {string} msg - 재난 메시지
   * @returns {string} 재난 유형
   */
  getDisasterType(msg) {
    for (const keyword of this.emergencyKeywords) {
      if (msg.includes(keyword)) {
        return keyword;
      }
    }
    
    // 기타 재난 유형 확인
    if (msg.includes('미세먼지')) return '미세먼지';
    if (msg.includes('오존')) return '오존';
    if (msg.includes('황사')) return '황사';
    if (msg.includes('산불')) return '산불';
    if (msg.includes('정전')) return '정전';
    
    return '기타';
  }

  /**
   * 메시지에서 긴급 단계를 추출합니다
   * @param {string} msg - 재난 메시지
   * @returns {string} 긴급 단계
   */
  getEmergencyLevel(msg) {
    if (msg.includes('경보')) return '경보';
    if (msg.includes('주의보')) return '주의보';
    if (msg.includes('특보')) return '특보';
    if (msg.includes('긴급')) return '긴급';
    if (msg.includes('심각')) return '심각';
    if (msg.includes('경계')) return '경계';
    if (msg.includes('관심')) return '관심';
    
    return '일반';
  }

  /**
   * 특정 지역의 재난 알림을 가져옵니다
   * @param {string} locationId - 지역 코드
   * @param {number} hours - 조회 시간 범위
   * @returns {Promise<Array>} 지역별 재난 알림 배열
   */
  async getDisastersByLocation(locationId, hours = 24) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (hours * 60 * 60 * 1000));

      const params = {
        serviceKey: this.apiKey,
        pageNo: 1,
        numOfRows: 100,
        type: 'json',
        crtDt: this.formatDateTime(startDate),
        endDt: this.formatDateTime(endDate),
        locationId: locationId
      };

      const response = await axios.get(`${this.baseURL}/getDisasterMsg3List`, {
        params,
        timeout: this.timeout
      });

      if (response.data.header.resultCode !== '00') {
        throw new Error(`Disaster API Error: ${response.data.header.resultMsg}`);
      }

      const items = response.data.body || [];
      return items.map(item => this.parseDisasterData(item));

    } catch (error) {
      logger.error('Failed to fetch disasters by location', { 
        locationId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 날짜를 YYYYMMDDHHMISS 형식으로 포맷
   * @param {Date} date - 날짜 객체
   * @returns {string} 포맷된 날짜시간 문자열
   */
  formatDateTime(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * API 연결 상태를 확인합니다
   * @returns {Promise<boolean>} 연결 상태
   */
  async checkConnection() {
    try {
      await this.getRecentDisasters(1);
      return true;
    } catch (error) {
      logger.error('Disaster API connection check failed', { error: error.message });
      return false;
    }
  }

  /**
   * 재난 알림 통계를 가져옵니다
   * @param {number} days - 조회 일수
   * @returns {Promise<Object>} 재난 알림 통계
   */
  async getDisasterStatistics(days = 7) {
    try {
      const disasters = await this.getRecentDisasters(days * 24);
      
      const stats = {
        total: disasters.length,
        emergency: disasters.filter(d => d.isEmergency).length,
        byType: {},
        byLevel: {},
        recentEmergency: disasters
          .filter(d => d.isEmergency)
          .sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
          .slice(0, 5)
      };

      // 유형별 통계
      disasters.forEach(disaster => {
        const type = disaster.disasterType;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      // 단계별 통계
      disasters.forEach(disaster => {
        const level = disaster.emergencyLevel;
        stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
      });

      return stats;

    } catch (error) {
      logger.error('Failed to get disaster statistics', { 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = DisasterApiClient;