import React from 'react';
import styled from 'styled-components';

const SelectGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  
  .required {
    color: #ef4444;
    margin-left: 4px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

function ReceiverSelect({ value, onChange }) {
  return (
    <SelectGroup>
      <Label>
        수신 대상
        <span className="required">*</span>
      </Label>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">전체</option>
        <option value="selected">선택된 수신자</option>
        <option value="group">특정 그룹</option>
      </Select>
    </SelectGroup>
  );
}

export default ReceiverSelect;



