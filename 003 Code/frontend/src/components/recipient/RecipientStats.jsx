import React from 'react';
import styled from 'styled-components';

const StatsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 0;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const StatValue = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.color || '#1a1a1a'};
`;

const Divider = styled.div`
  width: 1px;
  height: 40px;
  background-color: #e5e7eb;
`;

function RecipientStats({ availableCount, optOutCount }) {
  return (
    <StatsContainer>
      <StatItem>
        <StatLabel>발송 가능한 수신자</StatLabel>
        <StatValue color="#2563eb">{availableCount.toLocaleString()}명</StatValue>
      </StatItem>
      <Divider />
      <StatItem>
        <StatLabel>수신거부/휴면 수신자</StatLabel>
        <StatValue color="#ef4444">{optOutCount.toLocaleString()}명</StatValue>
      </StatItem>
    </StatsContainer>
  );
}

export default RecipientStats;



