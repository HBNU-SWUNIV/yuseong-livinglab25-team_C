import React from 'react';
import styled from 'styled-components';
import { SearchX } from 'lucide-react';

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  min-height: 400px;
`;

const EmptyIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #f3f4f6;
  color: #9ca3af;
  margin-bottom: 16px;
  
  svg {
    width: 32px;
    height: 32px;
  }
`;

const EmptyMessage = styled.p`
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
  margin: 0;
`;

function EmptyState({ message = '검색된 수신자가 없습니다' }) {
  return (
    <EmptyStateContainer>
      <EmptyIcon>
        <SearchX size={32} />
      </EmptyIcon>
      <EmptyMessage>{message}</EmptyMessage>
    </EmptyStateContainer>
  );
}

export default EmptyState;



