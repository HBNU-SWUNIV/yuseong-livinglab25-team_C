import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login/Login';
import { AuthProvider } from '../contexts/AuthContext';

// Mock API
jest.mock('../services/api', () => ({
  authApi: {
    login: jest.fn(),
    verifyToken: jest.fn(),
    logout: jest.fn()
  }
}));

const MockedLogin = () => (
  <BrowserRouter>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </BrowserRouter>
);

describe('Login 컴포넌트', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('로그인 폼이 올바르게 렌더링된다', () => {
    render(<MockedLogin />);
    
    expect(screen.getByText('유성안심문자 관리자')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('사용자명')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  test('입력 필드에 값을 입력할 수 있다', () => {
    render(<MockedLogin />);
    
    const usernameInput = screen.getByPlaceholderText('사용자명');
    const passwordInput = screen.getByPlaceholderText('비밀번호');
    
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(usernameInput.value).toBe('admin');
    expect(passwordInput.value).toBe('password123');
  });

  test('빈 필드로 로그인 시도 시 오류 메시지가 표시된다', async () => {
    render(<MockedLogin />);
    
    const loginButton = screen.getByRole('button', { name: '로그인' });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText('사용자명을 입력해주세요.')).toBeInTheDocument();
    });
  });

  test('로그인 폼 제출이 올바르게 동작한다', async () => {
    const { authApi } = require('../services/api');
    authApi.login.mockResolvedValue({
      token: 'fake-token',
      user: { id: 1, username: 'admin' }
    });

    render(<MockedLogin />);
    
    const usernameInput = screen.getByPlaceholderText('사용자명');
    const passwordInput = screen.getByPlaceholderText('비밀번호');
    const loginButton = screen.getByRole('button', { name: '로그인' });
    
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('admin', 'password123');
    });
  });
});