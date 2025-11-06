const axios = require('axios');
const logger = require('../utils/logger');

/**
 * 환경부 미세먼지 API 클라이언트
 * 한국환경공단 에어코리아 API를 통해 미세먼지 정보를 가져옵니다.
 */
class AirQualityApiClient {
  constructor() {
    this.baseURL = process.env.AIR_QUALITY_API_URL || 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc';
    this.apiKey = process.env.AIR_QUALITY_API_KEY;
    this.timeout = 30000; // 30초 타임아웃
    
    // 유성구 측정소명 (대전 지역 측정소)
    this.stationName = '유성구';
    this.sidoName = '대전';
    
    if (!this.apiKey) {
      logger.warn('Air Quality API key not configured');
    }
  }

  /**
   * 현재 미세먼지 정보를 가져옵니다
   * @returns {Promise<Object>} 미세먼지 정보 객체
   */
  async getCurrentAirQuality() {
    try {
      logger.info('Fetching air quality data from Korea Environment Corporation API');

      // 먼저 측정소 정보를 가져와서 유성구 근처 측정소 확인
      const stationInfo = await this.getNearbyStation();
      const stationName = stationInfo || this.stationName;

      const params = {
        serviceKey: this.apiKey,
        returnType: 'json',
        numOfRows: 1,
        pageNo: 1,
        stationName: stationName,
        dataTerm: 'DAILY',
        ver: '1.0'
      };

      const response = await axios.get(`${this.baseURL}/getMsrstnAcctoRltmMesureDnsty`, {
        params,
        timeout: this.timeout
      });

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(`Air Quality API Error: ${response.data.response.header.resultMsg}`);
      }

      const items = response.data.response.body.items;
      if (!items || items.length === 0) {
        throw new Error('No air quality data available');
      }

      const airQualityData = this.parseAirQualityData(items[0]);
      
      logger.info('Successfully fetched air quality data', { 
        pm10Grade: airQualityData.pm10Grade,
        pm25Grade: airQualityData.pm25Grade,
        station: stationName
      });

      return airQualityData;

    } catch (error) {
      logger.error('Failed to fetch air quality data', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * 유성구 근처 측정소 정보를 가져옵니다
   * @returns {Promise<string|null>} 측정소명
   */
  async getNearbyStation() {
    try {
      const params = {
        serviceKey: this.apiKey,
        returnType: 'json',
        numOfRows: 100,
        pageNo: 1,
        sidoName: this.sidoName
      };

      const response = await axios.get(`${this.baseURL}/getMsrstnAcctoRltmMesureDnsty`, {
        params,
        timeout: this.timeout
      });

      if (response.data.response.header.resultCode !== '00') {
        return null;
      }

      const items = response.data.response.body.items;
      if (!items || items.length === 0) {
        return null;
      }

      // 유성구 또는 대전 지역 측정소 찾기
      const preferredStations = ['유성구', '대전', '둔산동', '정림동'];
      
      for (const preferred of preferredStations) {
        const station = items.find(item => 
          item.stationName && item.stationName.includes(preferred)
        );
        if (station) {
          return station.stationName;
        }
      }

      // 첫 번째 유효한 측정소 반환
      return items[0].stationName;

    } catch (error) {
      logger.warn('Failed to get nearby station info', { error: error.message });
      return null;
    }
  }

  /**
   * 미세먼지 데이터를 파싱합니다
   * @param {Object} item - API 응답 아이템
   * @returns {Object} 파싱된 미세먼지 정보
   */
  parseAirQualityData(item) {
    return {
      stationName: item.stationName,
      dataTime: item.dataTime,
      pm10Value: this.parseValue(item.pm10Value),
      pm10Grade: this.getGradeText(item.pm10Grade1h),
      pm25Value: this.parseValue(item.pm25Value),
      pm25Grade: this.getGradeText(item.pm25Grade1h),
      o3Value: this.parseValue(item.o3Value),
      o3Grade: this.getGradeText(item.o3Grade),
      no2Value: this.parseValue(item.no2Value),
      no2Grade: this.getGradeText(item.no2Grade),
      coValue: this.parseValue(item.coValue),
      coGrade: this.getGradeText(item.coGrade),
      so2Value: this.parseValue(item.so2Value),
      so2Grade: this.getGradeText(item.so2Grade),
      khaiValue: this.parseValue(item.khaiValue),
      khaiGrade: this.getGradeText(item.khaiGrade),
      fetchedAt: new Date()
    };
  }

  /**
   * 문자열 값을 숫자로 파싱 (유효하지 않은 값은 null 반환)
   * @param {string} value - 파싱할 값
   * @returns {number|null} 파싱된 숫자 또는 null
   */
  parseValue(value) {
    if (!value || value === '-' || value === '') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * 등급 코드를 문자열로 변환
   * @param {string} grade - 등급 코드
   * @returns {string} 등급 문자열
   */
  getGradeText(grade) {
    const grades = {
      '1': '좋음',
      '2': '보통',
      '3': '나쁨',
      '4': '매우나쁨'
    };
    return grades[grade] || '알 수 없음';
  }

  /**
   * 시도별 실시간 측정정보 조회 (전체 지역)
   * @returns {Promise<Array>} 시도별 미세먼지 정보 배열
   */
  async getSidoAirQuality() {
    try {
      const params = {
        serviceKey: this.apiKey,
        returnType: 'json',
        numOfRows: 100,
        pageNo: 1,
        sidoName: this.sidoName
      };

      const response = await axios.get(`${this.baseURL}/getCtprvnRltmMesureDnsty`, {
        params,
        timeout: this.timeout
      });

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(`Air Quality API Error: ${response.data.response.header.resultMsg}`);
      }

      const items = response.data.response.body.items;
      return items.map(item => this.parseAirQualityData(item));

    } catch (error) {
      logger.error('Failed to fetch sido air quality data', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 미세먼지 예보 정보를 가져옵니다
   * @returns {Promise<Object>} 미세먼지 예보 정보
   */
  async getAirQualityForecast() {
    try {
      const params = {
        serviceKey: this.apiKey,
        returnType: 'json',
        numOfRows: 10,
        pageNo: 1,
        searchDate: this.formatDate(new Date())
      };

      const response = await axios.get(`${this.baseURL}/getMinuDustFrcstDspth`, {
        params,
        timeout: this.timeout
      });

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(`Air Quality Forecast API Error: ${response.data.response.header.resultMsg}`);
      }

      const items = response.data.response.body.items;
      if (!items || items.length === 0) {
        return null;
      }

      return {
        informCode: items[0].informCode,
        informGrade: items[0].informGrade,
        informCause: items[0].informCause,
        informOverall: items[0].informOverall,
        dataTime: items[0].dataTime,
        fetchedAt: new Date()
      };

    } catch (error) {
      logger.error('Failed to fetch air quality forecast', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 날짜를 YYYY-MM-DD 형식으로 포맷
   * @param {Date} date - 날짜 객체
   * @returns {string} 포맷된 날짜 문자열
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * API 연결 상태를 확인합니다
   * @returns {Promise<boolean>} 연결 상태
   */
  async checkConnection() {
    try {
      await this.getCurrentAirQuality();
      return true;
    } catch (error) {
      logger.error('Air Quality API connection check failed', { error: error.message });
      return false;
    }
  }
}

module.exports = AirQualityApiClient;