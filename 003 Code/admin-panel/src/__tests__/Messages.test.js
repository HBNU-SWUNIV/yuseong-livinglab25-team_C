import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Messages from '../pages/Messages/Messages';
import { AuthProvider } from '../contexts/AuthContext';

// Mock API
jest.mock('../services/api', () => ({
  messageApi: {
    getAll: jest.fn(),
    schedule: jest.fn(),
    send: jest.fn(),
    getStats: jest.fn()
  },
  authApi: {
    verifyToken: jest.fn().mockResolvedValue({ id: 1, username: 'admin' }),
    login: jest.fn(),
    logout: jest.fn()
  }
}));

const MockedMessages = () => (
  <BrowserRouter>
    <AuthProvider>
      <Messages />
    </AuthProvider>
  </BrowserRouter>
);

describe('Messages 컴포넌트', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('메시지 관리 페이지가 올바르게 렌더링된다', async () => {
    const { messageApi } = require('../services/api');
    messageApi.getAll.mockResolvedValue([]);
    messageApi.getStats.mockResolvedValue({
      totalMessages: 0,
      todayMessages: 0,
      successRate: 0
    });

    render(<MockedMessages />);

    await waitFor(() => {
      expect(screen.getByText('메시지 관리')).toBeInTheDocument();
      expect(screen.getByText('메시지 예약')).toBeInTheDocument();
      expect(screen.getByText('발송 이력')).toBeInTheDocument();
    });
  });

  test('메시지 예약 탭이 동작한다', async () => {
    const { messageApi } = require('../services/api');
    messageApi.getAll.mockResolvedValue([]);
    messageApi.getStats.mockResolvedValue({
      totalMessages: 0,
      todayMessages: 0,
      successRate: 0
    });

    render(<MockedMessages />);

    await waitFor(() => {
      expect(screen.getByText('메시지 관리')).toBeInTheDocument();
    });

    const scheduleTab = screen.getByText('메시지 예약');
    fireEvent.click(scheduleTab);

    expect(screen.getByText('메시지 내용')).toBeInTheDocument();
    expect(screen.getByText('발송 일시')).toBeInTheDocument();
  });

  test('발송 이력 탭이 동작한다', async () => {
    const { messageApi } = require('../services/api');
    const mockMessages = [
      {
        id: 1,
        type: 'daily',
        title: '일일 날씨 정보',
        content: '오늘 날씨는 맑습니다.',
        sent_at: '2024-01-15T07:00:00Z',
        recipient_count: 100,
        success_count: 98,
        status: 'sent'
      }
    ];
    
    messageApi.getAll.mockResolvedValue(mockMessages);
    messageApi.getStats.mockResolvedValue({
      totalMessages: 1,
      todayMessages: 1,
      successRate: 98
    });

    render(<MockedMessages />);

    await waitFor(() => {
      expect(screen.getByText('메시지 관리')).toBeInTheDocument();
    });

    const historyTab = screen.getByText('발송 이력');
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText('일일 날씨 정보')).toBeInTheDocument();
      expect(screen.getByText('98/100')).toBeInTheDocument();
    });
  });

  test('메시지 미리보기가 동작한다', async () => {
    const { messageApi } = require('../services/api');
    messageApi.getAll.mockResolvedValue([]);
    messageApi.getStats.mockResolvedValue({
      totalMessages: 0,
      todayMessages: 0,
      successRate: 0
    });

    render(<MockedMessages />);

    await waitFor(() => {
      expect(screen.getByText('메시지 관리')).toBeInTheDocument();
    });

    const scheduleTab = screen.getByText('메시지 예약');
    fireEvent.click(scheduleTab);

    const contentTextarea = screen.getByPlaceholderText('메시지 내용을 입력하세요 (최대 90자)');
    fireEvent.change(contentTextarea, { 
      target: { value: '테스트 메시지입니다.' } 
    });

    const previewButton = screen.getByText('미리보기');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('메시지 미리보기')).toBeInTheDocument();
      expect(screen.getByText('테스트 메시지입니다.')).toBeInTheDocument();
    });
  });

  test('메시지 글자 수 제한이 동작한다', async () => {
    const { messageApi } = require('../services/api');
    messageApi.getAll.mockResolvedValue([]);
    messageApi.getStats.mockResolvedValue({
      totalMessages: 0,
      todayMessages: 0,
      successRate: 0
    });

    render(<MockedMessages />);

    await waitFor(() => {
      expect(screen.getByText('메시지 관리')).toBeInTheDocument();
    });

    const scheduleTab = screen.getByText('메시지 예약');
    fireEvent.click(scheduleTab);

    const contentTextarea = screen.getByPlaceholderText('메시지 내용을 입력하세요 (최대 90자)');
    const longMessage = 'a'.repeat(100); // 90자를 초과하는 메시지
    
    fireEvent.change(contentTextarea, { 
      target: { value: longMessage } 
    });

    expect(screen.getByText('90/90')).toBeInTheDocument();
  });

  test('메시지 예약 폼 제출이 동작한다', async () => {
    const { messageApi } = require('../services/api');
    messageApi.getAll.mockResolvedValue([]);
    messageApi.getStats.mockResolvedValue({
      totalMessages: 0,
      todayMessages: 0,
      successRate: 0
    });
    messageApi.schedule.mockResolvedValue({ id: 1, status: 'scheduled' });

    render(<MockedMessages />);

    await waitFor(() => {
      expect(screen.getByText('메시지 관리')).toBeInTheDocument();
    });

    const scheduleTab = screen.getByText('메시지 예약');
    fireEvent.click(scheduleTab);

    const titleInput = screen.getByPlaceholderText('메시지 제목을 입력하세요');
    const contentTextarea = screen.getByPlaceholderText('메시지 내용을 입력하세요 (최대 90자)');
    const scheduleButton = screen.getByText('예약 발송');

    fireEvent.change(titleInput, { target: { value: '테스트 제목' } });
    fireEvent.change(contentTextarea, { target: { value: '테스트 내용' } });
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(messageApi.schedule).toHaveBeenCalled();
    });
  });
});