import React from 'react';
import styled from 'styled-components';

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const RadioOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  
  input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #2563eb;
  }
`;

const DateTimeInput = styled.input`
  margin-left: 26px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  background-color: #ffffff;
  transition: all 0.2s ease;
  width: 200px;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

function SendMethodRadio({ value, onChange, scheduledDateTime, onScheduledDateTimeChange }) {
  return (
    <RadioGroup>
      <Label>발송 수단</Label>
      <RadioOptions>
        <RadioOption>
          <input
            type="radio"
            name="sendMethod"
            value="immediate"
            checked={value === 'immediate'}
            onChange={(e) => onChange(e.target.value)}
          />
          <span>즉시 발송</span>
        </RadioOption>
        <RadioOption>
          <input
            type="radio"
            name="sendMethod"
            value="scheduled"
            checked={value === 'scheduled'}
            onChange={(e) => onChange(e.target.value)}
          />
          <span>예약 발송</span>
          {value === 'scheduled' && (
            <DateTimeInput
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => onScheduledDateTimeChange(e.target.value)}
            />
          )}
        </RadioOption>
      </RadioOptions>
    </RadioGroup>
  );
}

export default SendMethodRadio;




