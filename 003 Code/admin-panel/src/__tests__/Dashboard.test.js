import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard/Dashboard';
import { AuthProvider } from '../contexts/AuthContext';

// Mock API
jest.mock('../services/api', () => ({
  dashboardApi: {
    getStats: jest.fn(),
    getRecentMessages: jest.fn()
  },
  authApi: {
    verifyToken: jest.fn().mockResolvedValue({ id: 1, username: 'admin' }),
    login: jest.fn(),
    logout: jest.fn()
  }
}));

const MockedDashboard = () => (
  <BrowserRouter>
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  </BrowserRouter>
);

describe('Dashboard 컴포넌트', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('대시보드가 올바르게 렌더링된다', async () => {
    const { dashboardApi } = require('../services/api');
    
    const mockStats = {
      totalRecipients: 150,
      activeRecipients: 145,
      todayMessages: 12,
      monthlyMessages: 340,
      successRate: 98.5
    };

    const mockRecentMessages = [
      {
        id: 1,
        type: 'daily',
        title: '일일 날씨 정보',
        sent_at: '2024-01-15T07:00:00Z',
        recipient_count: 145,
        success_count: 143
      }
    ];

    dashboardApi.getStats.mockResolvedValue(mockStats);
    dashboardApi.getRecentMessages.mockResolvedValue(mockRecentMessages);

    render(<MockedDashboard />);

    await waitFor(() => {
      expect(screen.getByText('대시보드')).toBeInTheDocument();
      expect(screen.getByText('전체 수신자')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('활성 수신자')).toBeInTheDocument();
      expect(screen.getByText('145')).toBeInTheDocument();
    });
  });

  test('통계 정보가 올바르게 표시된다', async () => {
    const { dashboardApi } = require('../services/api');
    
    const mockStats = {
      totalRecipients: 200,
      activeRecipients: 195,
      todayMessages: 5,
      monthlyMessages: 150,
      successRate: 99.2
    };

    dashboardApi.getStats.mockResolvedValue(mockStats);
    dashboardApi.getRecentMessages.mockResolvedValue([]);

    render(<MockedDashboard />);

    await waitFor(() => {
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('195')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('99.2%')).toBeInTheDocument();
    });
  });

  test('최근 메시지 목록이 표시된다', async () => {
    const { dashboardApi } = require('../services/api');
    
    const mockRecentMessages = [
      {
        id: 1,
        type: 'daily',
        title: '일일 날씨 정보',
        sent_at: '2024-01-15T07:00:00Z',
        recipient_count: 145,
        success_count: 143
      },
      {
        id: 2,
        type: 'emergency',
        title: '폭염 주의보',
        sent_at: '2024-01-15T14:30:00Z',
        recipient_count: 145,
        success_count: 145
      }
    ];

    dashboardApi.getStats.mockResolvedValue({
      totalRecipients: 150,
      activeRecipients: 145,
      todayMessages: 2,
      monthlyMessages: 50,
      successRate: 98.5
    });
    dashboardApi.getRecentMessages.mockResolvedValue(mockRecentMessages);

    render(<MockedDashboard />);

    await waitFor(() => {
      expect(screen.getByText('최근 발송 메시지')).toBeInTheDocument();
      expect(screen.getByText('일일 날씨 정보')).toBeInTheDocument();
      expect(screen.getByText('폭염 주의보')).toBeInTheDocument();
    });
  });

  test('API 오류 시 적절한 처리가 된다', async () => {
    const { dashboardApi } = require('../services/api');
    
    dashboardApi.getStats.mockRejectedValue(new Error('API Error'));
    dashboardApi.getRecentMessages.mockRejectedValue(new Error('API Error'));

    // console.error 모킹
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<MockedDashboard />);

    await waitFor(() => {
      expect(screen.getByText('대시보드')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});