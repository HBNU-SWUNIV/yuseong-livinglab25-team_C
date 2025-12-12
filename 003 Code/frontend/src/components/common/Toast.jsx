import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid ${props => props.type === 'error' ? '#ef4444' : '#10b981'};
  border-radius: 8px;
  padding: 16px;
  min-width: 320px;
  max-width: 400px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  animation: ${props => props.isClosing ? slideOut : slideIn} 0.3s ease-out;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: ${props => props.type === 'error' ? '#ef4444' : '#10b981'};
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
`;

const Message = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background-color: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
    color: #6b7280;
  }
`;

function Toast({ type = 'success', title, message, duration = 3000, onClose }) {
  const [isClosing, setIsClosing] = React.useState(false);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <ToastContainer type={type} isClosing={isClosing}>
      <IconWrapper type={type}>
        {type === 'error' ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
      </IconWrapper>
      <Content>
        {title && <Title>{title}</Title>}
        {message && <Message>{message}</Message>}
      </Content>
      <CloseButton onClick={handleClose}>
        <X size={16} />
      </CloseButton>
    </ToastContainer>
  );
}

export default Toast;

