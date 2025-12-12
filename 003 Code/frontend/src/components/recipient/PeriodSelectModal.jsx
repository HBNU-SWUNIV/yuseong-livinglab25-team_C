import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { X, Calendar } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 32px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
    color: #1a1a1a;
  }
`;

const DateRangeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const DateInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DateLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const DateInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const DateInput = styled.input`
  width: 100%;
  padding: 12px 52px 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
  background-color: #ffffff;
  transition: all 0.2s ease;
  cursor: text;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }
`;

const HiddenDateInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
`;

const CalendarIconButton = styled.button`
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  z-index: 1;
  
  &:hover {
    background-color: #f3f4f6;
    color: #2563eb;
  }
  
  &:active {
    background-color: #e5e7eb;
  }
  
  svg {
    width: 22px;
    height: 22px;
    stroke-width: 2;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f3f4f6;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.primary ? '#2563eb' : '#e5e7eb'};
  background-color: ${props => props.primary ? '#2563eb' : '#ffffff'};
  color: ${props => props.primary ? '#ffffff' : '#374151'};
  min-width: 80px;
  
  &:hover {
    background-color: ${props => props.primary ? '#1d4ed8' : '#f9fafb'};
    border-color: ${props => props.primary ? '#1d4ed8' : '#d1d5db'};
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

function PeriodSelectModal({ isOpen, onClose, onConfirm, startDate, endDate }) {
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');
  const [startDateDisplay, setStartDateDisplay] = useState('');
  const [endDateDisplay, setEndDateDisplay] = useState('');
  const startDateInputRef = useRef(null);
  const endDateInputRef = useRef(null);
  const startDateHiddenRef = useRef(null);
  const endDateHiddenRef = useRef(null);

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 표시용 날짜를 YYYY-MM-DD로 변환
  const parseDisplayDate = (displayStr) => {
    if (!displayStr) return '';
    // YYYY-MM-DD 형식인지 확인
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(displayStr)) {
      return displayStr;
    }
    // YYYY.MM.DD 형식도 허용
    const dotRegex = /^\d{4}\.\d{2}\.\d{2}$/;
    if (dotRegex.test(displayStr)) {
      return displayStr.replace(/\./g, '-');
    }
    return '';
  };

  React.useEffect(() => {
    if (isOpen) {
      const start = startDate || '';
      const end = endDate || '';
      setLocalStartDate(start);
      setLocalEndDate(end);
      setStartDateDisplay(formatDateForDisplay(start));
      setEndDateDisplay(formatDateForDisplay(end));
    }
  }, [isOpen, startDate, endDate]);

  const handleCalendarClick = (hiddenInputRef, displayInputRef) => {
    // 숨겨진 date input의 달력 열기
    if (hiddenInputRef.current) {
      if (hiddenInputRef.current.showPicker) {
        try {
          hiddenInputRef.current.showPicker();
        } catch (error) {
          // showPicker가 지원되지 않거나 에러가 발생하면 다른 방법 시도
          hiddenInputRef.current.focus();
          hiddenInputRef.current.click();
        }
      } else {
        hiddenInputRef.current.focus();
        hiddenInputRef.current.click();
      }
    }
  };

  const handleInputClick = (hiddenInputRef) => {
    // 입력 필드 클릭 시에도 달력 열기
    handleCalendarClick(hiddenInputRef, null);
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setStartDateDisplay(value);
    const parsed = parseDisplayDate(value);
    if (parsed) {
      setLocalStartDate(parsed);
      if (endDateHiddenRef.current) {
        endDateHiddenRef.current.min = parsed;
      }
    } else {
      setLocalStartDate('');
    }
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setEndDateDisplay(value);
    const parsed = parseDisplayDate(value);
    if (parsed) {
      setLocalEndDate(parsed);
    } else {
      setLocalEndDate('');
    }
  };

  const handleHiddenDateChange = (type, e) => {
    const value = e.target.value;
    if (type === 'start') {
      setLocalStartDate(value);
      setStartDateDisplay(formatDateForDisplay(value));
      if (endDateHiddenRef.current) {
        endDateHiddenRef.current.min = value;
      }
    } else {
      setLocalEndDate(value);
      setEndDateDisplay(formatDateForDisplay(value));
    }
  };

  const handleConfirm = () => {
    if (localStartDate && localEndDate) {
      if (new Date(localStartDate) > new Date(localEndDate)) {
        alert('시작일은 종료일보다 이전이어야 합니다.');
        return;
      }
      onConfirm(localStartDate, localEndDate);
      onClose();
    } else {
      alert('시작일과 종료일을 모두 선택해주세요.');
    }
  };

  const handleCancel = () => {
    setLocalStartDate(startDate || '');
    setLocalEndDate(endDate || '');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleCancel}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>기간 설정</ModalTitle>
          <CloseButton onClick={handleCancel}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>
        
        <DateRangeContainer>
          <DateInputGroup>
            <DateLabel>시작일</DateLabel>
            <DateInputWrapper>
              <DateInput
                ref={startDateInputRef}
                type="text"
                value={startDateDisplay}
                onChange={handleStartDateChange}
                onClick={() => handleInputClick(startDateHiddenRef)}
                onFocus={() => handleInputClick(startDateHiddenRef)}
                placeholder="년-월-일"
                pattern="\d{4}-\d{2}-\d{2}"
              />
              <HiddenDateInput
                ref={startDateHiddenRef}
                type="date"
                value={localStartDate}
                onChange={(e) => handleHiddenDateChange('start', e)}
              />
              <CalendarIconButton
                type="button"
                onClick={() => handleCalendarClick(startDateHiddenRef, startDateInputRef)}
                title="달력 열기"
              >
                <Calendar size={22} strokeWidth={2} />
              </CalendarIconButton>
            </DateInputWrapper>
          </DateInputGroup>
          
          <DateInputGroup>
            <DateLabel>종료일</DateLabel>
            <DateInputWrapper>
              <DateInput
                ref={endDateInputRef}
                type="text"
                value={endDateDisplay}
                onChange={handleEndDateChange}
                onClick={() => handleInputClick(endDateHiddenRef)}
                onFocus={() => handleInputClick(endDateHiddenRef)}
                placeholder="년-월-일"
                pattern="\d{4}-\d{2}-\d{2}"
              />
              <HiddenDateInput
                ref={endDateHiddenRef}
                type="date"
                value={localEndDate}
                onChange={(e) => handleHiddenDateChange('end', e)}
                min={localStartDate}
              />
              <CalendarIconButton
                type="button"
                onClick={() => handleCalendarClick(endDateHiddenRef, endDateInputRef)}
                title="달력 열기"
              >
                <Calendar size={22} strokeWidth={2} />
              </CalendarIconButton>
            </DateInputWrapper>
          </DateInputGroup>
        </DateRangeContainer>
        
        <ButtonGroup>
          <Button onClick={handleCancel}>취소</Button>
          <Button primary onClick={handleConfirm}>적용</Button>
        </ButtonGroup>
      </ModalContainer>
    </ModalOverlay>
  );
}

export default PeriodSelectModal;

