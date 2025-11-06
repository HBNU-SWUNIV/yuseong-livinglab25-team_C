import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Recipients from '../pages/Recipients/Recipients';
import { AuthProvider } from '../contexts/AuthContext';

// Mock API
jest.mock('../services/api', () => ({
  recipientApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bulkUpload: jest.fn()
  },
  authApi: {
    verifyToken: jest.fn().mockResolvedValue({ id: 1, username: 'admin' }),
    login: jest.fn(),
    logout: jest.fn()
  }
}));

const MockedRecipients = () => (
  <BrowserRouter>
    <AuthProvider>
      <Recipients />
    </AuthProvider>
  </BrowserRouter>
);

describe('Recipients 컴포넌트', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('수신자 목록이 올바르게 렌더링된다', async () => {
    const { recipientApi } = require('../services/api');
    const mockRecipients = [
      {
        id: 1,
        name: '김철수',
        phone_number: '010-1234-5678',
        address: '유성구 대덕대로 123',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: '이영희',
        phone_number: '010-9876-5432',
        address: '유성구 봉명동 456',
        is_active: true,
        created_at: '2024-01-02T00:00:00Z'
      }
    ];
    
    recipientApi.getAll.mockResolvedValue(mockRecipients);

    render(<MockedRecipients />);

    await waitFor(() => {
      expect(screen.getByText('수신자 관리')).toBeInTheDocument();
      expect(screen.getByText('김철수')).toBeInTheDocument();
      expect(screen.getByText('이영희')).toBeInTheDocument();
      expect(screen.getByText('010-1234-5678')).toBeInTheDocument();
    });
  });

  test('수신자 추가 버튼이 모달을 연다', async () => {
    const { recipientApi } = require('../services/api');
    recipientApi.getAll.mockResolvedValue([]);

    render(<MockedRecipients />);

    await waitFor(() => {
      expect(screen.getByText('수신자 관리')).toBeInTheDocument();
    });

    const addButton = screen.getByText('수신자 추가');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('수신자 등록')).toBeInTheDocument();
    });
  });

  test('검색 기능이 동작한다', async () => {
    const { recipientApi } = require('../services/api');
    const mockRecipients = [
      {
        id: 1,
        name: '김철수',
        phone_number: '010-1234-5678',
        address: '유성구 대덕대로 123',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];
    
    recipientApi.getAll.mockResolvedValue(mockRecipients);

    render(<MockedRecipients />);

    await waitFor(() => {
      expect(screen.getByText('김철수')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('이름 또는 전화번호로 검색');
    fireEvent.change(searchInput, { target: { value: '김철수' } });

    expect(searchInput.value).toBe('김철수');
  });

  test('CSV 업로드 버튼이 동작한다', async () => {
    const { recipientApi } = require('../services/api');
    recipientApi.getAll.mockResolvedValue([]);

    render(<MockedRecipients />);

    await waitFor(() => {
      expect(screen.getByText('수신자 관리')).toBeInTheDocument();
    });

    const csvButton = screen.getByText('CSV 업로드');
    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(screen.getByText('CSV 파일 업로드')).toBeInTheDocument();
    });
  });

  test('활성/비활성 필터가 동작한다', async () => {
    const { recipientApi } = require('../services/api');
    recipientApi.getAll.mockResolvedValue([]);

    render(<MockedRecipients />);

    await waitFor(() => {
      expect(screen.getByText('수신자 관리')).toBeInTheDocument();
    });

    const statusFilter = screen.getByDisplayValue('전체');
    fireEvent.change(statusFilter, { target: { value: 'active' } });

    expect(statusFilter.value).toBe('active');
  });
});