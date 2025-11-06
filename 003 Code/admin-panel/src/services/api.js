import axios from 'axios';

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 대시보드 API
export const dashboardApi = {
  // 대시보드 통계 조회
  getStats: async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('대시보드 통계 조회 실패:', error);
      throw error;
    }
  },

  // 최근 메시지 이력 조회
  getRecentMessages: async (limit = 5) => {
    try {
      const response = await api.get(`/api/dashboard/recent-messages?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('최근 메시지 조회 실패:', error);
      throw error;
    }
  },

  // 시스템 상태 조회
  getSystemStatus: async () => {
    try {
      const response = await api.get('/api/dashboard/system-status');
      return response.data;
    } catch (error) {
      console.error('시스템 상태 조회 실패:', error);
      throw error;
    }
  }
};

// 인증 API
export const authApi = {
  login: async (username, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/api/auth/verify');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// 수신자 API
export const recipientsApi = {
  // 수신자 목록 조회
  getRecipients: async (page = 1, limit = 10, search = '') => {
    try {
      const response = await api.get('/api/recipients', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      console.error('수신자 목록 조회 실패:', error);
      throw error;
    }
  },

  // 수신자 상세 조회
  getRecipient: async (id) => {
    try {
      const response = await api.get(`/api/recipients/${id}`);
      return response.data;
    } catch (error) {
      console.error('수신자 상세 조회 실패:', error);
      throw error;
    }
  },

  // 수신자 등록
  createRecipient: async (recipientData) => {
    try {
      const response = await api.post('/api/recipients', recipientData);
      return response.data;
    } catch (error) {
      console.error('수신자 등록 실패:', error);
      throw error;
    }
  },

  // 수신자 수정
  updateRecipient: async (id, recipientData) => {
    try {
      const response = await api.put(`/api/recipients/${id}`, recipientData);
      return response.data;
    } catch (error) {
      console.error('수신자 수정 실패:', error);
      throw error;
    }
  },

  // 수신자 삭제
  deleteRecipient: async (id) => {
    try {
      const response = await api.delete(`/api/recipients/${id}`);
      return response.data;
    } catch (error) {
      console.error('수신자 삭제 실패:', error);
      throw error;
    }
  },

  // CSV 일괄 업로드
  uploadCsv: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/api/recipients/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('CSV 업로드 실패:', error);
      throw error;
    }
  }
};

// 메시지 API
export const messagesApi = {
  // 메시지 목록 조회
  getMessages: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = { page, limit, ...filters };
      const response = await api.get('/api/messages', { params });
      return response.data;
    } catch (error) {
      console.error('메시지 목록 조회 실패:', error);
      throw error;
    }
  },

  // 메시지 상세 조회
  getMessage: async (id) => {
    try {
      const response = await api.get(`/api/messages/${id}`);
      return response.data;
    } catch (error) {
      console.error('메시지 상세 조회 실패:', error);
      throw error;
    }
  },

  // 메시지 예약 발송
  scheduleMessage: async (messageData) => {
    try {
      const response = await api.post('/api/messages/schedule', messageData);
      return response.data;
    } catch (error) {
      console.error('메시지 예약 실패:', error);
      throw error;
    }
  },

  // 메시지 즉시 발송
  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/api/messages/send', messageData);
      return response.data;
    } catch (error) {
      console.error('메시지 발송 실패:', error);
      throw error;
    }
  },

  // 메시지 발송 통계
  getMessageStats: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/api/messages/statistics?${params}`);
      return response.data;
    } catch (error) {
      console.error('메시지 통계 조회 실패:', error);
      throw error;
    }
  },

  // 메시지 미리보기
  previewMessage: async (messageData) => {
    try {
      const response = await api.post('/api/messages/preview', messageData);
      return response.data;
    } catch (error) {
      console.error('메시지 미리보기 실패:', error);
      throw error;
    }
  }
};

// 맞춤 알림 API
export const customRemindersApi = {
  // 수신자별 맞춤 알림 목록 조회
  getCustomReminders: async (recipientId) => {
    try {
      const response = await api.get(`/api/custom-reminders/recipient/${recipientId}`);
      // 백엔드에서 { recipient, reminders } 구조로 반환하므로 reminders만 추출
      return {
        ...response.data,
        data: response.data.data?.reminders || []
      };
    } catch (error) {
      console.error('맞춤 알림 목록 조회 실패:', error);
      throw error;
    }
  },

  // 모든 맞춤 알림 목록 조회 (페이지네이션)
  getAllCustomReminders: async (page = 1, limit = 10, search = '') => {
    try {
      const response = await api.get('/api/custom-reminders', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      console.error('전체 맞춤 알림 목록 조회 실패:', error);
      throw error;
    }
  },

  // 맞춤 알림 등록
  createCustomReminder: async (reminderData) => {
    try {
      const response = await api.post('/api/custom-reminders', reminderData);
      return response.data;
    } catch (error) {
      console.error('맞춤 알림 등록 실패:', error);
      throw error;
    }
  },

  // 맞춤 알림 수정
  updateCustomReminder: async (id, reminderData) => {
    try {
      const response = await api.put(`/api/custom-reminders/${id}`, reminderData);
      return response.data;
    } catch (error) {
      console.error('맞춤 알림 수정 실패:', error);
      throw error;
    }
  },

  // 맞춤 알림 삭제
  deleteCustomReminder: async (id) => {
    try {
      const response = await api.delete(`/api/custom-reminders/${id}`);
      return response.data;
    } catch (error) {
      console.error('맞춤 알림 삭제 실패:', error);
      throw error;
    }
  },

  // 맞춤 알림 활성화/비활성화
  toggleCustomReminder: async (id, isActive) => {
    try {
      const response = await api.patch(`/api/custom-reminders/${id}/toggle`, {
        is_active: isActive
      });
      return response.data;
    } catch (error) {
      console.error('맞춤 알림 상태 변경 실패:', error);
      throw error;
    }
  }
};

export default api;