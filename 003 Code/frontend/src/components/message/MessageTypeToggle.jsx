import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const ToggleContainer = styled.div`
  display: flex;
  gap: 12px;
`;

const ToggleButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid ${props => props.$active ? '#3b82f6' : '#d1d5db'};
  background-color: ${props => props.$active ? '#3b82f6' : '#ffffff'};
  color: ${props => props.$active ? '#ffffff' : '#6b7280'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background-color: ${props => props.$active ? '#2563eb' : '#eff6ff'};
  }
`;

function MessageTypeToggle({ value, onChange }) {
  const messageTypes = ['일반 메시지', '긴급 메시지'];

  return (
    <Container>
      <Label>메시지 유형</Label>
      <ToggleContainer>
        {messageTypes.map((type) => (
          <ToggleButton
            key={type}
            $active={value === type}
            onClick={() => onChange(type)}
          >
            {type}
          </ToggleButton>
        ))}
      </ToggleContainer>
    </Container>
  );
}

export default MessageTypeToggle;



