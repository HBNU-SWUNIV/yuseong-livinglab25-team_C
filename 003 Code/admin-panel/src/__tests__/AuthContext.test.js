import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock API
jest.mock('../services/api', () => ({
  authApi: {
    login: jest.fn(),
    verifyToken: jest.fn(),
    logout: jest.fn()
  }
}));

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{user ? user.username : 'no user'}</div>
      <button onClick={() => login('test', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('초기 상태가 올바르게 설정된다', async () => {
    const { authApi } = require('../services/api');
    authApi.verifyToken.mockRejectedValue(new Error('No token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 초기 로딩 상태
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    
    // 로딩 완료 후
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });
  });

  test('저장된 토큰으로 자동 로그인이 동작한다', async () => {
    const { authApi } = require('../services/api');
    localStorage.setItem('token', 'existing-token');
    authApi.verifyToken.mockResolvedValue({ id: 1, username: 'admin' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('admin');
      expect(authApi.verifyToken).toHaveBeenCalled();
    });
  });

  test('로그인 함수가 올바르게 동작한다', async () => {
    const { authApi } = require('../services/api');
    authApi.login.mockResolvedValue({
      token: 'new-token',
      user: { id: 1, username: 'testuser' }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // 로그인 버튼 클릭
    const loginButton = screen.getByText('Login');
    loginButton.click();

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('test', 'password');
    });
  });

  test('로그아웃 함수가 올바르게 동작한다', async () => {
    const { authApi } = require('../services/api');
    authApi.logout.mockResolvedValue();
    
    // 초기 사용자 설정
    localStorage.setItem('token', 'test-token');
    authApi.verifyToken.mockResolvedValue({ id: 1, username: 'admin' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 사용자 로그인 상태 확인
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('admin');
    });

    // 로그아웃 버튼 클릭
    const logoutButton = screen.getByText('Logout');
    logoutButton.click();

    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });
  });
});