import React from 'react';
import styled from 'styled-components';

const TabsContainer = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 12px;
`;

const TabButton = styled.button`
  padding: 12px 24px;
  border: none;
  background-color: transparent;
  color: ${props => props.active ? '#2563eb' : '#6b7280'};
  font-size: 16px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#2563eb' : 'transparent'};
  margin-bottom: -2px;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    color: ${props => props.active ? '#2563eb' : '#374151'};
    background-color: ${props => props.active ? 'transparent' : '#f9fafb'};
  }
`;

function MessageTabs({ activeTab, onTabChange }) {
  return (
    <TabsContainer>
      <TabButton
        active={activeTab === 'history'}
        onClick={() => onTabChange('history')}
      >
        발송 이력
      </TabButton>
      <TabButton
        active={activeTab === 'send'}
        onClick={() => onTabChange('send')}
      >
        메시지 발송
      </TabButton>
    </TabsContainer>
  );
}

export default MessageTabs;

