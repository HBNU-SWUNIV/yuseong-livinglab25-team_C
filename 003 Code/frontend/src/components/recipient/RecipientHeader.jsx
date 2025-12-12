import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 0;
  margin-bottom: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
`;

const StatItem = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const StatLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
`;

const StatValue = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.color || '#374151'};
  white-space: nowrap;
`;

const StatUnit = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.color || '#6b7280'};
  margin-left: 2px;
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
  flex-shrink: 0;
`;

const SelectedInfo = styled.span`
  font-size: 14px;
  color: #2563eb;
  font-weight: 600;
  margin-left: 8px;
`;

function RecipientHeader({ totalCount, selectedCount, availableCount, optOutCount }) {
  return (
    <HeaderContainer>
      <StatItem>
        <StatLabel>전체</StatLabel>
        <StatValue>{totalCount.toLocaleString()}</StatValue>
        <StatUnit>명</StatUnit>
        {selectedCount > 0 && (
          <SelectedInfo>선택됨 {selectedCount.toLocaleString()}명</SelectedInfo>
        )}
      </StatItem>
      
      <Divider />
      
      <StatItem>
        <StatLabel>발송 가능한 수신자</StatLabel>
        <StatValue color="#2563eb">{availableCount.toLocaleString()}</StatValue>
        <StatUnit color="#2563eb">명</StatUnit>
      </StatItem>
      
      <Divider />
      
      <StatItem>
        <StatLabel>수신거부/휴면 수신자</StatLabel>
        <StatValue color="#ef4444">{optOutCount.toLocaleString()}</StatValue>
        <StatUnit color="#ef4444">명</StatUnit>
      </StatItem>
    </HeaderContainer>
  );
}

export default RecipientHeader;

