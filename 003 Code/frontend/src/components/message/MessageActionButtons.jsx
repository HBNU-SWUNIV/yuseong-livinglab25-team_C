import React from 'react';
import styled from 'styled-components';

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const LeftButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const RightButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => {
    if (props.primary) return '#2563eb';
    if (props.secondary) return '#e5e7eb';
    return '#e5e7eb';
  }};
  background-color: ${props => {
    if (props.primary) return props.disabled ? '#9ca3af' : '#2563eb';
    return '#ffffff';
  }};
  color: ${props => {
    if (props.primary) return '#ffffff';
    if (props.secondary) return '#374151';
    return '#6b7280';
  }};
  min-width: 100px;
  
  &:hover:not(:disabled) {
    background-color: ${props => {
      if (props.primary) return props.disabled ? '#9ca3af' : '#1d4ed8';
      return '#f9fafb';
    }};
    border-color: ${props => {
      if (props.primary) return props.disabled ? '#9ca3af' : '#1d4ed8';
      return '#d1d5db';
    }};
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

function MessageActionButtons({ onReset, onPreview, onSend, isSendDisabled }) {
  return (
    <ButtonGroup>
      <LeftButtons>
        <Button onClick={onReset}>
          초기화
        </Button>
      </LeftButtons>
      <RightButtons>
        <Button secondary onClick={onPreview}>
          미리보기
        </Button>
        <Button primary onClick={onSend} disabled={isSendDisabled}>
          발송
        </Button>
      </RightButtons>
    </ButtonGroup>
  );
}

export default MessageActionButtons;



