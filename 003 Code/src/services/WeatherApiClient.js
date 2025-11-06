const axios = require('axios');
const logger = require('../utils/logger');

/**
 * 기상청 날씨 API 클라이언트
 * 기상청 단기예보 API를 통해 날씨 정보를 가져옵니다.
 */
class WeatherApiClient {
  constructor() {
    this.baseURL = process.env.WEATHER_API_URL || 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
    this.apiKey = process.env.WEATHER_API_KEY;
    this.timeout = 30000; // 30초 타임아웃
    
    // 유성구 좌표 (기상청 격자 좌표)
    this.nx = 67; // 유성구 X 좌표
    this.ny = 100; // 유성구 Y 좌표
    
    if (!this.apiKey) {
      logger.warn('Weather API key not configured');
    }
  }

  /**
   * 현재 날씨 정보를 가져옵니다
   * @returns {Promise<Object>} 날씨 정보 객체
   */
  async getCurrentWeather() {
    try {
      const now = new Date();
      const baseDate = this.formatDate(now);
      const baseTime = this.getBaseTime(now);

      const params = {
        serviceKey: this.apiKey,
        pageNo: 1,
        numOfRows: 1000,
        dataType: 'JSON',
        base_date: baseDate,
        base_time: baseTime,
        nx: this.nx,
        ny: this.ny
      };

      logger.info('Fetching weather data from KMA API', { params });

      const response = await axios.get(`${this.baseURL}/getVilageFcst`, {
        params,
        timeout: this.timeout
      });

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(`Weather API Error: ${response.data.response.header.resultMsg}`);
      }

      const items = response.data.response.body.items.item;
      const weatherData = this.parseWeatherData(items);
      
      logger.info('Successfully fetched weather data', { 
        temperature: weatherData.temperature,
        condition: weatherData.condition 
      });

      return weatherData;

    } catch (error) {
      logger.error('Failed to fetch weather data', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * 날씨 데이터를 파싱합니다
   * @param {Array} items - API 응답 아이템 배열
   * @returns {Object} 파싱된 날씨 정보
   */
  parseWeatherData(items) {
    const weatherInfo = {
      temperature: null,
      minTemperature: null,
      maxTemperature: null,
      condition: null,
      precipitationProbability: null,
      humidity: null,
      windSpeed: null,
      fetchedAt: new Date()
    };

    // 현재 시간에 가장 가까운 예보 데이터 찾기
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0') + '00';
    
    items.forEach(item => {
      if (item.fcstTime === currentHour) {
        switch (item.category) {
          case 'TMP': // 1시간 기온
            weatherInfo.temperature = parseFloat(item.fcstValue);
            break;
          case 'TMN': // 일 최저기온
            weatherInfo.minTemperature = parseFloat(item.fcstValue);
            break;
          case 'TMX': // 일 최고기온
            weatherInfo.maxTemperature = parseFloat(item.fcstValue);
            break;
          case 'SKY': // 하늘상태
            weatherInfo.condition = this.getSkyCondition(item.fcstValue);
            break;
          case 'POP': // 강수확률
            weatherInfo.precipitationProbability = parseInt(item.fcstValue);
            break;
          case 'REH': // 습도
            weatherInfo.humidity = parseInt(item.fcstValue);
            break;
          case 'WSD': // 풍속
            weatherInfo.windSpeed = parseFloat(item.fcstValue);
            break;
        }
      }
    });

    return weatherInfo;
  }

  /**
   * 하늘상태 코드를 문자열로 변환
   * @param {string} skyCode - 하늘상태 코드
   * @returns {string} 하늘상태 문자열
   */
  getSkyCondition(skyCode) {
    const conditions = {
      '1': '맑음',
      '3': '구름많음',
      '4': '흐림'
    };
    return conditions[skyCode] || '알 수 없음';
  }

  /**
   * 날짜를 YYYYMMDD 형식으로 포맷
   * @param {Date} date - 날짜 객체
   * @returns {string} 포맷된 날짜 문자열
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * 기상청 API 발표시간에 맞는 base_time 계산
   * @param {Date} date - 현재 날짜
   * @returns {string} base_time (HHMM 형식)
   */
  getBaseTime(date) {
    const hour = date.getHours();
    const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
    
    // 현재 시간보다 이전의 가장 최근 발표시간 찾기
    for (let i = baseTimes.length - 1; i >= 0; i--) {
      const baseHour = parseInt(baseTimes[i].substring(0, 2));
      if (hour >= baseHour) {
        return baseTimes[i];
      }
    }
    
    // 현재 시간이 02시 이전이면 전날 23시 발표 데이터 사용
    return '2300';
  }

  /**
   * API 연결 상태를 확인합니다
   * @returns {Promise<boolean>} 연결 상태
   */
  async checkConnection() {
    try {
      await this.getCurrentWeather();
      return true;
    } catch (error) {
      logger.error('Weather API connection check failed', { error: error.message });
      return false;
    }
  }
}

module.exports = WeatherApiClient;