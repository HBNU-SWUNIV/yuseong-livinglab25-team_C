import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';

// Mock API
jest.mock('../services/api', () => ({
  authApi: {
    verifyToken: jest.fn(),
    login: jest.fn(),
    logout: jest.fn()
  }
}));

const TestComponent = () => <div>Protected Content</div>;

const MockedProtectedRoute = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </AuthProvider>
  </BrowserRouter>
);

describe('ProtectedRoute 컴포넌트', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('인증된 사용자에게 보호된 콘텐츠를 표시한다', async () => {
    const { authApi } = require('../services/api');
    localStorage.setItem('token', 'valid-token');
    authApi.verifyToken.mockResolvedValue({ id: 1, username: 'admin' });

    render(
      <MockedProtectedRoute>
        <TestComponent />
      </MockedProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  test('인증되지 않은 사용자를 로그인 페이지로 리다이렉트한다', async () => {
    const { authApi } = require('../services/api');
    authApi.verifyToken.mockRejectedValue(new Error('No token'));

    render(
      <MockedProtectedRoute>
        <TestComponent />
      </MockedProtectedRoute>
    );

    await waitFor(() => {
      // 로그인 페이지로 리다이렉트되므로 Protected Content가 보이지 않아야 함
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  test('로딩 중에는 로딩 상태를 표시한다', () => {
    const { authApi } = require('../services/api');
    // 토큰 검증이 완료되지 않은 상태로 설정
    authApi.verifyToken.mockImplementation(() => new Promise(() => {}));

    render(
      <MockedProtectedRoute>
        <TestComponent />
      </MockedProtectedRoute>
    );

    // 로딩 중에는 Protected Content가 보이지 않아야 함
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});