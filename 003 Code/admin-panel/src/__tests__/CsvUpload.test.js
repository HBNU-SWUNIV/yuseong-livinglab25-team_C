import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CsvUpload from '../pages/Recipients/CsvUpload';

// Mock API
jest.mock('../services/api', () => ({
  recipientApi: {
    bulkUpload: jest.fn()
  }
}));

describe('CsvUpload 컴포넌트', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('CSV 업로드 모달이 올바르게 렌더링된다', () => {
    render(
      <CsvUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('CSV 파일 업로드')).toBeInTheDocument();
    expect(screen.getByText('파일 선택')).toBeInTheDocument();
    expect(screen.getByText('업로드')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  test('파일 선택이 동작한다', () => {
    render(
      <CsvUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const fileInput = screen.getByLabelText('파일 선택');
    const file = new File(['name,phone\n김철수,010-1234-5678'], 'test.csv', {
      type: 'text/csv'
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });

  test('CSV가 아닌 파일 선택 시 오류 메시지가 표시된다', async () => {
    render(
      <CsvUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const fileInput = screen.getByLabelText('파일 선택');
    const file = new File(['test content'], 'test.txt', {
      type: 'text/plain'
    });

    fireEvent.change(fileInput, { target: { files: [file] } });
    
    const uploadButton = screen.getByText('업로드');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('CSV 파일만 업로드 가능합니다.')).toBeInTheDocument();
    });
  });

  test('파일 없이 업로드 시도 시 오류 메시지가 표시된다', async () => {
    render(
      <CsvUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const uploadButton = screen.getByText('업로드');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('파일을 선택해주세요.')).toBeInTheDocument();
    });
  });

  test('올바른 CSV 파일 업로드가 성공한다', async () => {
    const { recipientApi } = require('../services/api');
    recipientApi.bulkUpload.mockResolvedValue({
      success: 2,
      failed: 0,
      errors: []
    });

    render(
      <CsvUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const fileInput = screen.getByLabelText('파일 선택');
    const file = new File(['name,phone_number\n김철수,010-1234-5678\n이영희,010-9876-5432'], 'test.csv', {
      type: 'text/csv'
    });

    fireEvent.change(fileInput, { target: { files: [file] } });
    
    const uploadButton = screen.getByText('업로드');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(recipientApi.bulkUpload).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('취소 버튼이 모달을 닫는다', () => {
    render(
      <CsvUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('업로드 진행 중 상태가 표시된다', async () => {
    const { recipientApi } = require('../services/api');
    // 업로드가 오래 걸리도록 Promise를 지연시킴
    recipientApi.bulkUpload.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: 1, failed: 0, errors: [] }), 100))
    );

    render(
      <CsvUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const fileInput = screen.getByLabelText('파일 선택');
    const file = new File(['name,phone_number\n김철수,010-1234-5678'], 'test.csv', {
      type: 'text/csv'
    });

    fireEvent.change(fileInput, { target: { files: [file] } });
    
    const uploadButton = screen.getByText('업로드');
    fireEvent.click(uploadButton);

    // 업로드 중 상태 확인
    expect(screen.getByText('업로드 중...')).toBeInTheDocument();

    // 업로드 완료 대기
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});