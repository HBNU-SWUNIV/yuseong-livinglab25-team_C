import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock API
jest.mock('../services/api', () => ({
  authApi: {
    verifyToken: jest.fn(),
    login: jest.fn(),
    logout: jest.fn()
  },
  recipientApi: {
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  dashboardApi: {
    getStats: jest.fn().mockResolvedValue({
      totalRecipients: 0,
      activeRecipients: 0,
      todayMessages: 0,
      monthlyMessages: 0,
      successRate: 0
    }),
    getRecentMessages: jest.fn().mockResolvedValue([])
  }
}));

const MockedApp = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('App 컴포넌트', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('토큰이 없을 때 로그인 페이지로 리다이렉트된다', async () => {
    const { authApi } = require('../services/api');
    authApi.verifyToken.mockRejectedValue(new Error('No token'));

    render(<MockedApp />);

    await waitFor(() => {
      expect(screen.getByText('유성안심문자 관리자')).toBeInTheDocument();
    });
  });

  test('유효한 토큰이 있을 때 대시보드가 표시된다', async () => {
    const { authApi } = require('../services/api');
    localStorage.setItem('token', 'valid-token');
    authApi.verifyToken.mockResolvedValue({ id: 1, username: 'admin' });

    render(<MockedApp />);

    await waitFor(() => {
      expect(screen.getByText('대시보드')).toBeInTheDocument();
    });
  });

  test('라우팅이 올바르게 동작한다', async () => {
    const { authApi } = require('../services/api');
    localStorage.setItem('token', 'valid-token');
    authApi.verifyToken.mockResolvedValue({ id: 1, username: 'admin' });

    // URL을 /recipients로 설정
    window.history.pushState({}, 'Recipients', '/recipients');

    render(<MockedApp />);

    await waitFor(() => {
      expect(screen.getByText('수신자 관리')).toBeInTheDocument();
    });
  });
});