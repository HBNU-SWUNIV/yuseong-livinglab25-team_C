import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

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
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
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

const DateInputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
`;

const DateInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DateLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
`;

const DateInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const DateInput = styled.input`
  width: 100%;
  padding: 10px 48px 10px 14px;
  border: 1px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 13px;
  color: #1a1a1a;
  background-color: #ffffff;
  transition: all 0.2s ease;
  cursor: text;
  
  &:hover {
    border-color: ${props => props.hasError ? '#ef4444' : '#d1d5db'};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#2563eb'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)'};
  }
  
  &::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }
`;

const CalendarIconButton = styled.button`
  position: absolute;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  color: #374151;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  z-index: 1;
  
  &:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
    color: #2563eb;
  }
  
  &:active {
    background-color: #e5e7eb;
  }
  
  svg {
    width: 20px;
    height: 20px;
    stroke-width: 2;
    display: block;
    flex-shrink: 0;
  }
`;

const ErrorMessage = styled.div`
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
`;

const CalendarPopup = styled.div`
  position: absolute;
  top: 0;
  left: calc(100% + 8px);
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 12px;
  z-index: 1000;
  width: 240px;
  max-width: 240px;
  overflow: hidden;
  box-sizing: border-box;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  width: 100%;
  box-sizing: border-box;
`;

const MonthYear = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  border-radius: 4px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
    color: #1a1a1a;
  }
  
  &:active {
    background-color: #f3f4f6;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 14px;
    height: 14px;
    display: block;
    flex-shrink: 0;
    stroke-width: 2.5;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  width: 100%;
  box-sizing: border-box;
`;

const WeekdayHeader = styled.div`
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  padding: 4px 2px;
  box-sizing: border-box;
  min-width: 0;
`;

const CalendarDay = styled.button`
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid ${props => {
    if (props.isSelected) return '#2563eb';
    if (props.isInRange) return '#eff6ff';
    return 'transparent';
  }};
  background-color: ${props => {
    if (props.isSelected) return '#2563eb';
    if (props.isInRange) return '#eff6ff';
    if (props.isToday) return '#f3f4f6';
    return 'transparent';
  }};
  color: ${props => {
    if (props.isSelected) return '#ffffff';
    if (props.isInRange) return '#2563eb';
    if (props.isOtherMonth) return '#d1d5db';
    return '#374151';
  }};
  border-radius: 3px;
  font-size: 11px;
  font-weight: ${props => props.isSelected || props.isToday ? '600' : '500'};
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  box-sizing: border-box;
  padding: 0;
  min-width: 0;
  min-height: 0;
  
  &:hover {
    background-color: ${props => {
      if (props.isSelected) return '#1d4ed8';
      if (props.isInRange) return '#dbeafe';
      return '#f3f4f6';
    }};
    border-color: ${props => {
      if (props.isSelected) return '#1d4ed8';
      return '#d1d5db';
    }};
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  border: 1px solid ${props => props.primary ? '#2563eb' : '#e5e7eb'};
  background-color: ${props => props.primary ? '#2563eb' : '#ffffff'};
  color: ${props => props.primary ? '#ffffff' : '#374151'};
  min-width: 70px;
  box-sizing: border-box;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.primary ? '#1d4ed8' : '#f9fafb'};
    border-color: ${props => props.primary ? '#1d4ed8' : '#d1d5db'};
  }

  &:active:not(:disabled) {
    background-color: ${props => props.primary ? '#1e40af' : '#f3f4f6'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

// 날짜 형식 검증
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateString;
};

// 날짜를 YYYY-MM-DD 형식으로 변환
const formatDate = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// YYYY-MM-DD 문자열을 Date 객체로 변환
const parseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date;
};

function DateRangePicker({ startDate, endDate, onChange, onClose }) {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [startDateInput, setStartDateInput] = useState(formatDate(startDate));
  const [endDateInput, setEndDateInput] = useState(formatDate(endDate));
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(startDate || new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const startCalendarRef = useRef(null);
  const endCalendarRef = useRef(null);

  useEffect(() => {
    if (startDate) {
      setLocalStartDate(startDate);
      setStartDateInput(formatDate(startDate));
    }
    if (endDate) {
      setLocalEndDate(endDate);
      setEndDateInput(formatDate(endDate));
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // 달력 아이콘 클릭은 제외
      if (event.target.closest('button[title="달력 열기"]')) {
        return;
      }
      
      // 시작일 달력 외부 클릭 시 닫기
      if (showStartCalendar && 
          startCalendarRef.current && 
          !startCalendarRef.current.contains(event.target) && 
          !startInputRef.current?.contains(event.target)) {
        setShowStartCalendar(false);
      }
      
      // 종료일 달력 외부 클릭 시 닫기
      if (showEndCalendar && 
          endCalendarRef.current && 
          !endCalendarRef.current.contains(event.target) && 
          !endInputRef.current?.contains(event.target)) {
        setShowEndCalendar(false);
      }
    };

    const handleScroll = () => {
      // 스크롤 시 달력 닫기
      if (showStartCalendar) {
        setShowStartCalendar(false);
      }
      if (showEndCalendar) {
        setShowEndCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showStartCalendar, showEndCalendar]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // 이전 달의 마지막 날들
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isOtherMonth: true,
      });
    }
    
    // 현재 달의 날들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isOtherMonth: false,
      });
    }
    
    // 다음 달의 첫 날들 (42개 셀 채우기)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isOtherMonth: true,
      });
    }
    
    return days;
  };

  const isDateInRange = (date) => {
    if (!localStartDate || !localEndDate) return false;
    const dateStr = date.toDateString();
    const startStr = localStartDate.toDateString();
    const endStr = localEndDate.toDateString();
    return dateStr > startStr && dateStr < endStr;
  };

  const isDateSelected = (date, type) => {
    const dateStr = date.toDateString();
    if (type === 'start' && localStartDate) {
      return dateStr === localStartDate.toDateString();
    }
    if (type === 'end' && localEndDate) {
      return dateStr === localEndDate.toDateString();
    }
    return false;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDayClick = (day, type) => {
    if (day.isOtherMonth) return;
    
    const clickedDate = new Date(day.date);
    
    if (type === 'start') {
      setLocalStartDate(clickedDate);
      setStartDateInput(formatDate(clickedDate));
      setStartDateError('');
      setShowStartCalendar(false);
      
      // 시작일이 종료일보다 늦으면 종료일 초기화
      if (localEndDate && clickedDate > localEndDate) {
        setLocalEndDate(null);
        setEndDateInput('');
      }
      setSelectingStart(false);
    } else {
      // 종료일 선택 시 시작일보다 이전이면 안됨
      if (localStartDate && clickedDate < localStartDate) {
        setEndDateError('종료일은 시작일보다 이후여야 합니다.');
        return;
      }
      setLocalEndDate(clickedDate);
      setEndDateInput(formatDate(clickedDate));
      setEndDateError('');
      setShowEndCalendar(false);
      setSelectingStart(true);
    }
  };

  const handleInputChange = (type, value) => {
    if (type === 'start') {
      setStartDateInput(value);
      if (value === '') {
        setLocalStartDate(null);
        setStartDateError('');
        return;
      }
      
      if (isValidDate(value)) {
        const date = parseDate(value);
        if (date) {
          setLocalStartDate(date);
          setStartDateError('');
          // 시작일이 종료일보다 늦으면 종료일 초기화
          if (localEndDate && date > localEndDate) {
            setLocalEndDate(null);
            setEndDateInput('');
          }
        } else {
          setStartDateError('유효하지 않은 날짜입니다.');
        }
      } else if (value.length > 0) {
        setStartDateError('YYYY-MM-DD 형식으로 입력해주세요.');
      } else {
        setStartDateError('');
      }
    } else {
      setEndDateInput(value);
      if (value === '') {
        setLocalEndDate(null);
        setEndDateError('');
        return;
      }
      
      if (isValidDate(value)) {
        const date = parseDate(value);
        if (date) {
          if (localStartDate && date < localStartDate) {
            setEndDateError('종료일은 시작일보다 이후여야 합니다.');
            return;
          }
          setLocalEndDate(date);
          setEndDateError('');
        } else {
          setEndDateError('유효하지 않은 날짜입니다.');
        }
      } else if (value.length > 0) {
        setEndDateError('YYYY-MM-DD 형식으로 입력해주세요.');
      } else {
        setEndDateError('');
      }
    }
  };

  // 달력 아이콘 클릭 시에만 달력 열기/닫기 토글
  const handleCalendarIconClick = (type) => {
    if (type === 'start') {
      const isCurrentlyOpen = showStartCalendar;
      setShowStartCalendar(!isCurrentlyOpen);
      setShowEndCalendar(false);
      
      // 달력을 열 때 해당 날짜의 월로 이동
      if (!isCurrentlyOpen && localStartDate) {
        setCurrentMonth(new Date(localStartDate));
      } else if (!isCurrentlyOpen) {
        setCurrentMonth(new Date());
      }
    } else {
      const isCurrentlyOpen = showEndCalendar;
      setShowEndCalendar(!isCurrentlyOpen);
      setShowStartCalendar(false);
      
      // 달력을 열 때 해당 날짜의 월로 이동
      if (!isCurrentlyOpen && localEndDate) {
        setCurrentMonth(new Date(localEndDate));
      } else if (!isCurrentlyOpen && localStartDate) {
        setCurrentMonth(new Date(localStartDate));
      } else if (!isCurrentlyOpen) {
        setCurrentMonth(new Date());
      }
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleApply = () => {
    if (!localStartDate || !localEndDate) {
      alert('시작일과 종료일을 모두 선택해주세요.');
      return;
    }
    if (localStartDate > localEndDate) {
      alert('시작일은 종료일보다 이전이어야 합니다.');
      return;
    }
    // 달력 닫기
    setShowStartCalendar(false);
    setShowEndCalendar(false);
    onChange(localStartDate, localEndDate);
    onClose();
  };

  const handleCancel = () => {
    // 달력 닫기
    setShowStartCalendar(false);
    setShowEndCalendar(false);
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    setStartDateInput(formatDate(startDate));
    setEndDateInput(formatDate(endDate));
    setStartDateError('');
    setEndDateError('');
    onClose();
  };

  const days = getDaysInMonth(currentMonth);
  const isApplyDisabled = !localStartDate || !localEndDate || localStartDate > localEndDate || 
                          startDateError || endDateError;

  return (
    <ModalOverlay onClick={handleCancel}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>기간 설정</ModalTitle>
          <CloseButton onClick={handleCancel}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>
        
        <DateInputSection>
          <DateInputGroup>
            <DateLabel>시작일</DateLabel>
            <DateInputWrapper ref={startInputRef}>
              <DateInput
                type="text"
                value={startDateInput}
                onChange={(e) => handleInputChange('start', e.target.value)}
                placeholder="년-월-일"
                hasError={!!startDateError}
              />
              <CalendarIconButton
                type="button"
                onClick={() => handleCalendarIconClick('start')}
                title="달력 열기"
              >
                <Calendar size={20} strokeWidth={2} />
              </CalendarIconButton>
              {showStartCalendar && (
                <CalendarPopup ref={startCalendarRef}>
                  <CalendarHeader>
                    <NavButton onClick={() => navigateMonth(-1)}>
                      <ChevronLeft size={14} />
                    </NavButton>
                    <MonthYear>
                      {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                    </MonthYear>
                    <NavButton onClick={() => navigateMonth(1)}>
                      <ChevronRight size={14} />
                    </NavButton>
                  </CalendarHeader>
                  <CalendarGrid>
                    {weekdays.map(day => (
                      <WeekdayHeader key={day}>{day}</WeekdayHeader>
                    ))}
                    {days.map((day, index) => {
                      const isSelected = isDateSelected(day.date, 'start');
                      const isInRange = isDateInRange(day.date);
                      const isTodayDate = isToday(day.date);
                      
                      return (
                        <CalendarDay
                          key={`start-${index}`}
                          isSelected={isSelected}
                          isInRange={isInRange}
                          isToday={isTodayDate}
                          isOtherMonth={day.isOtherMonth}
                          onClick={() => handleDayClick(day, 'start')}
                          disabled={day.isOtherMonth}
                        >
                          {day.date.getDate()}
                        </CalendarDay>
                      );
                    })}
                  </CalendarGrid>
                </CalendarPopup>
              )}
            </DateInputWrapper>
            {startDateError && <ErrorMessage>{startDateError}</ErrorMessage>}
          </DateInputGroup>
          
          <DateInputGroup>
            <DateLabel>종료일</DateLabel>
            <DateInputWrapper ref={endInputRef}>
              <DateInput
                type="text"
                value={endDateInput}
                onChange={(e) => handleInputChange('end', e.target.value)}
                placeholder="년-월-일"
                hasError={!!endDateError}
              />
              <CalendarIconButton
                type="button"
                onClick={() => handleCalendarIconClick('end')}
                title="달력 열기"
              >
                <Calendar size={20} strokeWidth={2} />
              </CalendarIconButton>
              {showEndCalendar && (
                <CalendarPopup ref={endCalendarRef}>
                  <CalendarHeader>
                    <NavButton onClick={() => navigateMonth(-1)}>
                      <ChevronLeft size={14} />
                    </NavButton>
                    <MonthYear>
                      {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                    </MonthYear>
                    <NavButton onClick={() => navigateMonth(1)}>
                      <ChevronRight size={14} />
                    </NavButton>
                  </CalendarHeader>
                  <CalendarGrid>
                    {weekdays.map(day => (
                      <WeekdayHeader key={day}>{day}</WeekdayHeader>
                    ))}
                    {days.map((day, index) => {
                      const isSelected = isDateSelected(day.date, 'end');
                      const isInRange = isDateInRange(day.date);
                      const isTodayDate = isToday(day.date);
                      const isDisabled = day.isOtherMonth || (localStartDate && day.date < localStartDate);
                      
                      return (
                        <CalendarDay
                          key={`end-${index}`}
                          isSelected={isSelected}
                          isInRange={isInRange}
                          isToday={isTodayDate}
                          isOtherMonth={day.isOtherMonth}
                          onClick={() => handleDayClick(day, 'end')}
                          disabled={isDisabled}
                        >
                          {day.date.getDate()}
                        </CalendarDay>
                      );
                    })}
                  </CalendarGrid>
                </CalendarPopup>
              )}
            </DateInputWrapper>
            {endDateError && <ErrorMessage>{endDateError}</ErrorMessage>}
          </DateInputGroup>
        </DateInputSection>
        
        <ButtonGroup>
          <Button onClick={handleCancel}>취소</Button>
          <Button primary onClick={handleApply} disabled={isApplyDisabled}>
            적용
          </Button>
        </ButtonGroup>
      </ModalContainer>
    </ModalOverlay>
  );
}

export default DateRangePicker;

