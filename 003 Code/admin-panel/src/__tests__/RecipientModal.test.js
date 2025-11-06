import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecipientModal from '../pages/Recipients/RecipientModal';

// Mock API
jest.mock('../services/api', () => ({
  recipientApi: {
    create: jest.fn(),
    update: jest.fn()
  }
}));

describe('RecipientModal 컴포넌트', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('새 수신자 등록 모달이 올바르게 렌더링된다', () => {
    render(
      <RecipientModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        recipient={null}
      />
    );

    expect(screen.getByText('수신자 등록')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('이름을 입력하세요')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('010-0000-0000')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('주소를 입력하세요')).toBeInTheDocument();
  });

  test('수신자 수정 모달이 기존 데이터로 렌더링된다', () => {
    const existingRecipient = {
      id: 1,
      name: '김철수',
      phone_number: '010-1234-5678',
      address: '유성구 대덕대로 123',
      birth_date: '1950-01-01',
      emergency_contact: '010-9876-5432'
    };

    render(
      <RecipientModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        recipient={existingRecipient}
      />
    );

    expect(screen.getByText('수신자 정보 수정')).toBeInTheDocument();
    expect(screen.getByDisplayValue('김철수')).toBeInTheDocument();
    expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument();
    expect(screen.getByDisplayValue('유성구 대덕대로 123')).toBeInTheDocument();
  });

  test('필수 필드 유효성 검사가 동작한다', async () => {
    render(
      <RecipientModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        recipient={null}
      />
    );

    const submitButton = screen.getByText('등록');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('이름을 입력해주세요.')).toBeInTheDocument();
      expect(screen.getByText('전화번호를 입력해주세요.')).toBeInTheDocument();
    });
  });

  test('전화번호 형식 유효성 검사가 동작한다', async () => {
    render(
      <RecipientModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        recipient={null}
      />
    );

    const nameInput = screen.getByPlaceholderText('이름을 입력하세요');
    const phoneInput = screen.getByPlaceholderText('010-0000-0000');
    const submitButton = screen.getByText('등록');

    fireEvent.change(nameInput, { target: { value: '김철수' } });
    fireEvent.change(phoneInput, { target: { value: '잘못된번호' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('올바른 휴대폰 번호 형식이 아닙니다.')).toBeInTheDocument();
    });
  });

  test('올바른 데이터로 수신자 등록이 성공한다', async () => {
    const { recipientApi } = require('../services/api');
    recipientApi.create.mockResolvedValue({ id: 1, name: '김철수' });

    render(
      <RecipientModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        recipient={null}
      />
    );

    const nameInput = screen.getByPlaceholderText('이름을 입력하세요');
    const phoneInput = screen.getByPlaceholderText('010-0000-0000');
    const addressInput = screen.getByPlaceholderText('주소를 입력하세요');
    const submitButton = screen.getByText('등록');

    fireEvent.change(nameInput, { target: { value: '김철수' } });
    fireEvent.change(phoneInput, { target: { value: '010-1234-5678' } });
    fireEvent.change(addressInput, { target: { value: '유성구 대덕대로 123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(recipientApi.create).toHaveBeenCalledWith({
        name: '김철수',
        phone_number: '010-1234-5678',
        address: '유성구 대덕대로 123',
        birth_date: '',
        emergency_contact: ''
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('취소 버튼이 모달을 닫는다', () => {
    render(
      <RecipientModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        recipient={null}
      />
    );

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('생년월일 형식 유효성 검사가 동작한다', async () => {
    render(
      <RecipientModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        recipient={null}
      />
    );

    const nameInput = screen.getByPlaceholderText('이름을 입력하세요');
    const phoneInput = screen.getByPlaceholderText('010-0000-0000');
    const birthInput = screen.getByPlaceholderText('YYYY-MM-DD');
    const submitButton = screen.getByText('등록');

    fireEvent.change(nameInput, { target: { value: '김철수' } });
    fireEvent.change(phoneInput, { target: { value: '010-1234-5678' } });
    fireEvent.change(birthInput, { target: { value: '잘못된날짜' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('생년월일은 YYYY-MM-DD 형식으로 입력해주세요.')).toBeInTheDocument();
    });
  });
});