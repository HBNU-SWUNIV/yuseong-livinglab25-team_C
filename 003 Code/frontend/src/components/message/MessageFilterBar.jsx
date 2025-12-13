import React, { useState } from 'react';
import styled from 'styled-components';
import { Search, RefreshCw, Calendar } from 'lucide-react';
import MessageTypeDropdown from '../common/MessageTypeDropdown';
import DateRangePicker from '../common/DateRangePicker';

const FilterBarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 0;
  margin-bottom: 16px;
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 40px;
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
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #9ca3af;
  pointer-events: none;
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const ResetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;


const FilterLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
`;

const MessageTypeWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const PeriodFilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PeriodSegmentedControl = styled.div`
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

function MessageFilterBar({
  searchQuery,
  onSearchChange,
  onSearch,
  onReset,
  onFullRefresh,
  messageType,
  onMessageTypeChange,
  periodFilter,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomPeriodConfirm
}) {
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);

  const periodOptions = [
    { value: 'all', label: '전체' },
    { value: '1month', label: '1개월' },
    { value: '6months', label: '6개월' },
    { value: '1year', label: '1년' },
    { value: 'custom', label: '기간 설정', icon: Calendar },
  ];

  const handlePeriodClick = (value) => {
    if (value === 'custom') {
      setIsPeriodModalOpen(true);
    } else {
      onPeriodChange(value);
    }
  };

  const handleCustomPeriodConfirm = (startDate, endDate) => {
    // Date 객체를 YYYY-MM-DD 문자열로 변환
    const formatDate = (date) => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    onCustomPeriodConfirm(formatDate(startDate), formatDate(endDate));
    onPeriodChange('custom');
    setIsPeriodModalOpen(false);
  };

  return (
    <>
      <FilterBarContainer>
        <SearchRow>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="제목 검색"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            />
          </SearchContainer>
          <SearchButton onClick={onSearch}>
            <Search size={18} />
            검색
          </SearchButton>
          <ResetButton onClick={onReset}>
            <RefreshCw size={18} />
            필터 초기화
          </ResetButton>
        </SearchRow>

        <FilterRow>
          <FilterLabel>메시지 타입</FilterLabel>
          <MessageTypeWrapper>
            <MessageTypeDropdown
              value={messageType === 'all' ? 'ALL' : messageType}
              onChange={(value) => {
                const mappedValue = value === 'ALL' ? 'all' : value;
                onMessageTypeChange(mappedValue);
              }}
              options={[
                { value: 'ALL', label: '전체' },
                { value: 'DAILY_WEATHER', label: '일일 날씨' },
                { value: 'EMERGENCY', label: '긴급 알림' },
                { value: 'WELFARE', label: '복지 알림' },
                { value: 'CUSTOM', label: '맞춤 알림' },
              ]}
            />
          </MessageTypeWrapper>

          <FilterLabel>등록일</FilterLabel>
          <PeriodFilterGroup>
            <PeriodSegmentedControl>
              {periodOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <PeriodButton
                    key={option.value}
                    active={periodFilter === option.value}
                    onClick={() => handlePeriodClick(option.value)}
                  >
                    {Icon && <Icon size={16} />}
                    {option.label}
                  </PeriodButton>
                );
              })}
            </PeriodSegmentedControl>
          </PeriodFilterGroup>
          
          <SearchButton onClick={onFullRefresh}>
            <RefreshCw size={18} />
            전체 새로고침
          </SearchButton>
        </FilterRow>
      </FilterBarContainer>

      {isPeriodModalOpen && (
        <DateRangePicker
          startDate={customStartDate ? new Date(customStartDate) : null}
          endDate={customEndDate ? new Date(customEndDate) : null}
          onChange={handleCustomPeriodConfirm}
          onClose={() => setIsPeriodModalOpen(false)}
        />
      )}
    </>
  );
}

export default MessageFilterBar;

