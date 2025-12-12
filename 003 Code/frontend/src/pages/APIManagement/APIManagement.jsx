import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { RefreshCw, CloudRain, Wind, AlertCircle } from 'lucide-react';

const PageContainer = styled.div`
  padding: 32px;
  padding-top: 16px;
  min-width: 0;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const LastUpdate = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`;

const RefreshButton = styled.button`
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    width: 18px;
    height: 18px;
    transition: transform 0.3s ease;
  }
  
  &:active:not(:disabled) svg {
    transform: rotate(180deg);
  }
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-top: 0;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 0;
    right: -16px;
    width: 1px;
    height: 100%;
    background-color: #e5e7eb;
  }
`;

const ColumnTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #f3f4f6;
  margin-bottom: 16px;
  
  svg {
    width: 32px;
    height: 32px;
    color: #9ca3af;
  }
`;

const EmptyMessage = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
`;

const EmptyState = ({ icon: Icon, message }) => {
  return (
    <EmptyStateContainer>
      <IconWrapper>
        <Icon />
      </IconWrapper>
      <EmptyMessage>{message}</EmptyMessage>
    </EmptyStateContainer>
  );
};

function APIManagement() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 페이지 로드 시 현재 시간으로 초기화
  useEffect(() => {
    setLastUpdate(new Date());
  }, []);

  // 날짜 포맷팅 함수
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekday = weekdays[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day}. ${weekday} ${hours}:${minutes}`;
  };

  // 전체 새로고침 핸들러
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // 실제 API 호출 시뮬레이션
    setTimeout(() => {
      setLastUpdate(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <PageContainer>
      <HeaderSection>
        <LastUpdate>
          마지막 업데이트: {formatDateTime(lastUpdate)}
        </LastUpdate>
        <RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw size={18} />
          전체 새로고침
        </RefreshButton>
      </HeaderSection>

      <ContentContainer>
        {/* 날씨 정보 */}
        <Column>
          <ColumnTitle>날씨 정보</ColumnTitle>
          <EmptyState 
            icon={CloudRain} 
            message="날씨 데이터를 불러올 수 없습니다"
          />
        </Column>

        {/* 대기질 정보 */}
        <Column>
          <ColumnTitle>대기질 정보</ColumnTitle>
          <EmptyState 
            icon={Wind} 
            message="대기질 데이터를 불러올 수 없습니다"
          />
        </Column>

        {/* 재난 문자 현황 */}
        <Column>
          <ColumnTitle>재난 문자 현황</ColumnTitle>
          <EmptyState 
            icon={AlertCircle} 
            message="최근 재난 문자가 없습니다"
          />
        </Column>
      </ContentContainer>
    </PageContainer>
  );
}

export default APIManagement;

