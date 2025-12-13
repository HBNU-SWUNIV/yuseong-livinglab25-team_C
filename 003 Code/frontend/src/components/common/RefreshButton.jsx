import React from 'react';
import styled, { keyframes } from 'styled-components';
import { RefreshCw } from 'lucide-react';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Button = styled.button`
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
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
  
  &:active:not(:disabled) {
    background-color: #f3f4f6;
  }
  
  &:disabled {
    opacity: 0.6;
  }
  
  svg {
    width: 18px;
    height: 18px;
    animation: ${props => props.loading ? `${rotate} 1s linear infinite` : 'none'};
  }
`;

function RefreshButton({ onRefresh, loading = false, ...props }) {
  return (
    <Button
      onClick={onRefresh}
      disabled={loading}
      loading={loading}
      {...props}
    >
      <RefreshCw size={18} />
      <span>전체 새로고침</span>
    </Button>
  );
}

export default RefreshButton;



