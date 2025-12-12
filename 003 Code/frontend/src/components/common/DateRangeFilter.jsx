import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

const FilterContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const ButtonGroup = styled.div`
  display: inline-flex;
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
`;

const PeriodButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background-color: ${props => props.active ? '#ffffff' : 'transparent'};
  color: ${props => props.active ? '#2563eb' : '#6b7280'};
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: ${props => props.active ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'};
  
  &:hover {
    background-color: ${props => props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'};
    color: ${props => props.active ? '#2563eb' : '#374151'};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 24px;
  min-width: 700px;
  z-index: 1001;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
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

const CalendarContainer = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
`;

const CalendarMonth = styled.div`
  flex: 1;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const MonthYear = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
    color: #1a1a1a;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const WeekdayHeader = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 8px 4px;
`;

const CalendarDay = styled.button`
  width: 100%;
  aspect-ratio: 1;
  border: none;
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
  border-radius: 6px;
  font-size: 14px;
  font-weight: ${props => props.isSelected || props.isToday ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => {
      if (props.isSelected) return '#1d4ed8';
      if (props.isInRange) return '#dbeafe';
      return '#f3f4f6';
    }};
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const TimeInputSection = styled.div`
  display: flex;
  gap: 24px;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const DateInputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DateLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const DateInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DateInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TimeSelect = styled.select`
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const ButtonGroupBottom = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.primary ? '#2563eb' : props.secondary ? '#e5e7eb' : 'transparent'};
  background-color: ${props => {
    if (props.primary) return '#2563eb';
    if (props.secondary) return '#ffffff';
    return 'transparent';
  }};
  color: ${props => {
    if (props.primary) return '#ffffff';
    if (props.secondary) return '#374151';
    return '#6b7280';
  }};
  
  &:hover {
    background-color: ${props => {
      if (props.primary) return '#1d4ed8';
      if (props.secondary) return '#f9fafb';
      return '#f3f4f6';
    }};
    border-color: ${props => {
      if (props.primary) return '#1d4ed8';
      if (props.secondary) return '#d1d5db';
      return '#e5e7eb';
    }};
  }
`;

function DateRangeFilter({ value = { startDate: null, endDate: null }, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    return value?.startDate && value?.endDate ? 'custom' : 'all';
  });
  const [localStartDate, setLocalStartDate] = useState(null);
  const [localEndDate, setLocalEndDate] = useState(null);
  const [startHour, setStartHour] = useState(0);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [endMinute, setEndMinute] = useState(59);
  const [currentMonth1, setCurrentMonth1] = useState(new Date());
  const [currentMonth2, setCurrentMonth2] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
  const [selectingStart, setSelectingStart] = useState(true);
  const containerRef = useRef(null);

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  useEffect(() => {
    if (value?.startDate && value?.endDate) {
      setLocalStartDate(new Date(value.startDate));
      setLocalEndDate(new Date(value.endDate));
      setStartHour(value.startDate.getHours());
      setStartMinute(value.startDate.getMinutes());
      setEndHour(value.endDate.getHours());
      setEndMinute(value.endDate.getMinutes());
      setSelectedPeriod('custom');
    } else {
      setLocalStartDate(null);
      setLocalEndDate(null);
      setSelectedPeriod('all');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
    return dateStr >= startStr && dateStr <= endStr;
  };

  const isDateSelected = (date) => {
    if (!localStartDate && !localEndDate) return false;
    const dateStr = date.toDateString();
    if (localStartDate && dateStr === localStartDate.toDateString()) return true;
    if (localEndDate && dateStr === localEndDate.toDateString()) return true;
    return false;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDayClick = (day) => {
    if (day.isOtherMonth) return;
    
    const clickedDate = new Date(day.date);
    clickedDate.setHours(selectingStart ? startHour : endHour);
    clickedDate.setMinutes(selectingStart ? startMinute : endMinute);
    
    if (selectingStart || !localStartDate || clickedDate < localStartDate) {
      setLocalStartDate(clickedDate);
      setLocalEndDate(null);
      setSelectingStart(false);
    } else {
      setLocalEndDate(clickedDate);
      setSelectingStart(true);
    }
  };

  const handlePeriodClick = (period) => {
    setSelectedPeriod(period);
    
    if (period === 'custom') {
      setIsOpen(true);
      return;
    }
    
    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    let startDate = new Date(today);
    
    switch (period) {
      case '1month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case '6months':
        startDate.setMonth(today.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        onChange({ startDate: null, endDate: null });
        return;
    }
    
    startDate.setHours(0, 0, 0, 0);
    onChange({ startDate, endDate });
  };

  const handleApply = () => {
    if (localStartDate && localEndDate) {
      const start = new Date(localStartDate);
      start.setHours(startHour, startMinute, 0, 0);
      
      const end = new Date(localEndDate);
      end.setHours(endHour, endMinute, 0, 0);
      
      onChange({ startDate: start, endDate: end });
      setSelectedPeriod('custom');
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (value?.startDate && value?.endDate) {
      setLocalStartDate(new Date(value.startDate));
      setLocalEndDate(new Date(value.endDate));
    } else {
      setLocalStartDate(null);
      setLocalEndDate(null);
    }
  };

  const handleReset = () => {
    setLocalStartDate(null);
    setLocalEndDate(null);
    setStartHour(0);
    setStartMinute(0);
    setEndHour(23);
    setEndMinute(59);
    setSelectedPeriod('all');
    onChange({ startDate: null, endDate: null });
    setIsOpen(false);
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateInputChange = (type, value) => {
    if (!value) {
      if (type === 'start') {
        setLocalStartDate(null);
      } else {
        setLocalEndDate(null);
      }
      return;
    }
    
    const date = new Date(value);
    if (type === 'start') {
      date.setHours(startHour, startMinute, 0, 0);
      setLocalStartDate(date);
      if (localEndDate && date > localEndDate) {
        setLocalEndDate(null);
      }
    } else {
      date.setHours(endHour, endMinute, 0, 0);
      setLocalEndDate(date);
    }
  };

  const navigateMonth = (monthIndex, direction) => {
    const setter = monthIndex === 1 ? setCurrentMonth1 : setCurrentMonth2;
    setter(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
    
    // 두 달이 연속되도록 유지
    if (monthIndex === 1) {
      setCurrentMonth2(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + direction);
        return newDate;
      });
    }
  };

  const days1 = getDaysInMonth(currentMonth1);
  const days2 = getDaysInMonth(currentMonth2);

  return (
    <FilterContainer ref={containerRef}>
      <ButtonGroup>
        <PeriodButton
          active={selectedPeriod === 'all'}
          onClick={() => handlePeriodClick('all')}
        >
          전체
        </PeriodButton>
        <PeriodButton
          active={selectedPeriod === '1month'}
          onClick={() => handlePeriodClick('1month')}
        >
          1개월
        </PeriodButton>
        <PeriodButton
          active={selectedPeriod === '6months'}
          onClick={() => handlePeriodClick('6months')}
        >
          6개월
        </PeriodButton>
        <PeriodButton
          active={selectedPeriod === '1year'}
          onClick={() => handlePeriodClick('1year')}
        >
          1년
        </PeriodButton>
        <PeriodButton
          active={selectedPeriod === 'custom'}
          onClick={() => handlePeriodClick('custom')}
        >
          <Calendar size={16} />
          구간 설정
        </PeriodButton>
      </ButtonGroup>
      
      {isOpen && (
        <>
          <ModalOverlay onClick={() => setIsOpen(false)} />
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>기간 설정</ModalTitle>
              <CloseButton onClick={() => setIsOpen(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            
            <CalendarContainer>
              <CalendarMonth>
                <CalendarHeader>
                  <NavButton
                    onClick={() => navigateMonth(1, -1)}
                    disabled={false}
                  >
                    <ChevronLeft size={18} />
                  </NavButton>
                  <MonthYear>
                    {currentMonth1.getFullYear()}년 {currentMonth1.getMonth() + 1}월
                  </MonthYear>
                  <NavButton
                    onClick={() => navigateMonth(1, 1)}
                    disabled={false}
                  >
                    <ChevronRight size={18} />
                  </NavButton>
                </CalendarHeader>
                <CalendarGrid>
                  {weekdays.map(day => (
                    <WeekdayHeader key={day}>{day}</WeekdayHeader>
                  ))}
                  {days1.map((day, index) => {
                    const isSelected = isDateSelected(day.date);
                    const isInRange = isDateInRange(day.date) && !isSelected;
                    const isTodayDate = isToday(day.date);
                    
                    return (
                      <CalendarDay
                        key={`month1-${index}`}
                        isSelected={isSelected}
                        isInRange={isInRange}
                        isToday={isTodayDate}
                        isOtherMonth={day.isOtherMonth}
                        onClick={() => handleDayClick(day)}
                        disabled={day.isOtherMonth}
                      >
                        {day.date.getDate()}
                      </CalendarDay>
                    );
                  })}
                </CalendarGrid>
              </CalendarMonth>
              
              <CalendarMonth>
                <CalendarHeader>
                  <NavButton
                    onClick={() => navigateMonth(2, -1)}
                    disabled={false}
                  >
                    <ChevronLeft size={18} />
                  </NavButton>
                  <MonthYear>
                    {currentMonth2.getFullYear()}년 {currentMonth2.getMonth() + 1}월
                  </MonthYear>
                  <NavButton
                    onClick={() => navigateMonth(2, 1)}
                    disabled={false}
                  >
                    <ChevronRight size={18} />
                  </NavButton>
                </CalendarHeader>
                <CalendarGrid>
                  {weekdays.map(day => (
                    <WeekdayHeader key={day}>{day}</WeekdayHeader>
                  ))}
                  {days2.map((day, index) => {
                    const isSelected = isDateSelected(day.date);
                    const isInRange = isDateInRange(day.date) && !isSelected;
                    const isTodayDate = isToday(day.date);
                    
                    return (
                      <CalendarDay
                        key={`month2-${index}`}
                        isSelected={isSelected}
                        isInRange={isInRange}
                        isToday={isTodayDate}
                        isOtherMonth={day.isOtherMonth}
                        onClick={() => handleDayClick(day)}
                        disabled={day.isOtherMonth}
                      >
                        {day.date.getDate()}
                      </CalendarDay>
                    );
                  })}
                </CalendarGrid>
              </CalendarMonth>
            </CalendarContainer>
            
            <TimeInputSection>
              <DateInputGroup>
                <DateLabel>시작일</DateLabel>
                <DateInputRow>
                  <DateInput
                    type="date"
                    value={formatDateForInput(localStartDate)}
                    onChange={(e) => handleDateInputChange('start', e.target.value)}
                  />
                  <TimeSelect
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}시</option>
                    ))}
                  </TimeSelect>
                  <TimeSelect
                    value={startMinute}
                    onChange={(e) => setStartMinute(Number(e.target.value))}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}분</option>
                    ))}
                  </TimeSelect>
                </DateInputRow>
              </DateInputGroup>
              
              <DateInputGroup>
                <DateLabel>종료일</DateLabel>
                <DateInputRow>
                  <DateInput
                    type="date"
                    value={formatDateForInput(localEndDate)}
                    onChange={(e) => handleDateInputChange('end', e.target.value)}
                    min={localStartDate ? formatDateForInput(localStartDate) : ''}
                  />
                  <TimeSelect
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}시</option>
                    ))}
                  </TimeSelect>
                  <TimeSelect
                    value={endMinute}
                    onChange={(e) => setEndMinute(Number(e.target.value))}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}분</option>
                    ))}
                  </TimeSelect>
                </DateInputRow>
              </DateInputGroup>
            </TimeInputSection>
            
            <ButtonGroupBottom>
              <Button onClick={handleReset}>초기화</Button>
              <Button secondary onClick={handleCancel}>취소</Button>
              <Button primary onClick={handleApply}>적용</Button>
            </ButtonGroupBottom>
          </ModalContainer>
        </>
      )}
    </FilterContainer>
  );
}

export default DateRangeFilter;

