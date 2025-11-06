const DisasterApiClient = require('../../src/services/DisasterApiClient');

describe('DisasterApiClient', () => {
  let disasterClient;

  beforeEach(() => {
    disasterClient = new DisasterApiClient();
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(disasterClient.baseURL).toBeDefined();
      expect(disasterClient.timeout).toBe(30000);
      expect(disasterClient.regionCodes).toEqual(['대전', '유성구', '유성']);
      expect(disasterClient.emergencyKeywords).toContain('폭염');
      expect(disasterClient.emergencyKeywords).toContain('한파');
      expect(disasterClient.emergencyKeywords).toContain('지진');
    });

    test('should use environment variables when available', () => {
      const originalApiKey = process.env.DISASTER_API_KEY;
      const originalApiUrl = process.env.DISASTER_API_URL;
      
      process.env.DISASTER_API_KEY = 'test-disaster-key';
      process.env.DISASTER_API_URL = 'http://test-disaster-url.com';
      
      const client = new DisasterApiClient();
      expect(client.apiKey).toBe('test-disaster-key');
      expect(client.baseURL).toBe('http://test-disaster-url.com');
      
      // 환경 변수 복원
      process.env.DISASTER_API_KEY = originalApiKey;
      process.env.DISASTER_API_URL = originalApiUrl;
    });
  });

  describe('formatDateTime', () => {
    test('should format datetime correctly', () => {
      const testDate = new Date('2024-01-15T14:30:25');
      const formatted = disasterClient.formatDateTime(testDate);
      expect(formatted).toBe('20240115143025');
    });

    test('should handle single digit values', () => {
      const testDate = new Date('2024-03-05T09:05:03');
      const formatted = disasterClient.formatDateTime(testDate);
      expect(formatted).toBe('20240305090503');
    });
  });

  describe('getDisasterType', () => {
    test('should identify disaster types from messages', () => {
      expect(disasterClient.getDisasterType('폭염주의보 발령')).toBe('폭염');
      expect(disasterClient.getDisasterType('한파경보 발령')).toBe('한파');
      expect(disasterClient.getDisasterType('지진 발생')).toBe('지진');
      expect(disasterClient.getDisasterType('미세먼지 농도 높음')).toBe('미세먼지');
      expect(disasterClient.getDisasterType('일반 공지사항')).toBe('기타');
    });
  });

  describe('getEmergencyLevel', () => {
    test('should identify emergency levels from messages', () => {
      expect(disasterClient.getEmergencyLevel('폭염경보 발령')).toBe('경보');
      expect(disasterClient.getEmergencyLevel('한파주의보 발령')).toBe('주의보');
      expect(disasterClient.getEmergencyLevel('긴급상황 발생')).toBe('긴급');
      expect(disasterClient.getEmergencyLevel('일반 알림')).toBe('일반');
    });
  });

  describe('isEmergencyAlert', () => {
    test('should identify emergency alerts correctly', () => {
      const emergencyDisaster = {
        msg: '폭염경보 발령',
        disasterType: '폭염'
      };
      expect(disasterClient.isEmergencyAlert(emergencyDisaster)).toBe(true);

      const normalDisaster = {
        msg: '일반 공지사항',
        disasterType: '기타'
      };
      expect(disasterClient.isEmergencyAlert(normalDisaster)).toBe(false);

      const warningDisaster = {
        msg: '한파주의보 발령',
        disasterType: '한파'
      };
      expect(disasterClient.isEmergencyAlert(warningDisaster)).toBe(true);
    });
  });

  describe('filterRelevantDisasters', () => {
    test('should filter disasters relevant to Yuseong region', () => {
      const disasters = [
        { locationName: '대전광역시 유성구', msg: '폭염주의보 발령' },
        { locationName: '서울특별시', msg: '한파경보 발령' },
        { locationName: '대전광역시', msg: '미세먼지 농도 높음' },
        { locationName: '전국', msg: '지진 발생' }
      ];

      const filtered = disasterClient.filterRelevantDisasters(disasters);
      
      expect(filtered).toHaveLength(3); // 유성구, 대전, 전국 지진
      expect(filtered[0].locationName).toContain('유성구');
      expect(filtered[1].locationName).toContain('대전');
      expect(filtered[2].locationName).toBe('전국');
    });

    test('should include national emergencies', () => {
      const disasters = [
        { locationName: '전국', msg: '폭염특보 발령' },
        { locationName: '전국', msg: '일반 공지사항' }
      ];

      const filtered = disasterClient.filterRelevantDisasters(disasters);
      
      expect(filtered).toHaveLength(1); // 폭염특보만 포함
      expect(filtered[0].msg).toContain('폭염특보');
    });
  });

  describe('parseDisasterData', () => {
    test('should parse disaster data correctly', () => {
      const mockItem = {
        sn: '12345',
        locationName: '대전광역시 유성구',
        locationId: '4817000000',
        msg: '폭염주의보 발령됨',
        crtDt: '20240715143000',
        mdfcnDt: '20240715143000'
      };

      const result = disasterClient.parseDisasterData(mockItem);

      expect(result.serialNumber).toBe('12345');
      expect(result.locationName).toBe('대전광역시 유성구');
      expect(result.locationId).toBe('4817000000');
      expect(result.msg).toBe('폭염주의보 발령됨');
      expect(result.disasterType).toBe('폭염');
      expect(result.emergencyLevel).toBe('주의보');
      expect(result.isEmergency).toBe(true);
      expect(result.fetchedAt).toBeInstanceOf(Date);
    });
  });

  describe('getRecentDisasters', () => {
    test('should throw error when API key is not configured', async () => {
      const clientWithoutKey = new DisasterApiClient();
      clientWithoutKey.apiKey = null;

      await expect(clientWithoutKey.getRecentDisasters()).rejects.toThrow();
    });

    // 실제 API 호출 테스트는 환경에 따라 스킵할 수 있음
    test.skip('should fetch recent disasters from API', async () => {
      // 이 테스트는 실제 API 키가 있을 때만 실행
      if (!process.env.DISASTER_API_KEY) {
        return;
      }

      const result = await disasterClient.getRecentDisasters(24);
      
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].fetchedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('getEmergencyAlerts', () => {
    test('should throw error when API key is not configured', async () => {
      const clientWithoutKey = new DisasterApiClient();
      clientWithoutKey.apiKey = null;

      await expect(clientWithoutKey.getEmergencyAlerts()).rejects.toThrow();
    });
  });

  describe('getDisastersByLocation', () => {
    test('should throw error when API key is not configured', async () => {
      const clientWithoutKey = new DisasterApiClient();
      clientWithoutKey.apiKey = null;

      await expect(clientWithoutKey.getDisastersByLocation('4817000000')).rejects.toThrow();
    });
  });

  describe('getDisasterStatistics', () => {
    test('should throw error when API key is not configured', async () => {
      const clientWithoutKey = new DisasterApiClient();
      clientWithoutKey.apiKey = null;

      await expect(clientWithoutKey.getDisasterStatistics()).rejects.toThrow();
    });
  });

  describe('checkConnection', () => {
    test('should return false when connection fails', async () => {
      const clientWithoutKey = new DisasterApiClient();
      clientWithoutKey.apiKey = null;

      const result = await clientWithoutKey.checkConnection();
      expect(result).toBe(false);
    });
  });
});