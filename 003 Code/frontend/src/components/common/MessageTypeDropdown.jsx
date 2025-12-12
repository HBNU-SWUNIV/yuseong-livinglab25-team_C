import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronDown, Check } from 'lucide-react';

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 140px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
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
  
  svg {
    width: 16px;
    height: 16px;
    color: #6b7280;
    transition: transform 0.2s ease;
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const DropdownList = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  overflow: hidden;
  min-width: 100%;
`;

const DropdownOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: ${props => props.isSelected ? '#eff6ff' : '#ffffff'};
  
  &:hover {
    background-color: ${props => props.isSelected ? '#dbeafe' : '#f9fafb'};
  }
  
  &:first-child {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  
  &:last-child {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`;

const OptionText = styled.span`
  flex: 1;
  font-weight: ${props => props.isSelected ? '600' : '500'};
  color: ${props => props.isSelected ? '#2563eb' : '#374151'};
`;

const CheckIcon = styled(Check)`
  width: 16px;
  height: 16px;
  color: #2563eb;
  opacity: ${props => props.isSelected ? 1 : 0};
  transition: opacity 0.2s ease;
`;

function MessageTypeDropdown({ value = 'ALL', onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const defaultOptions = [
    { value: 'ALL', label: '전체' },
    { value: 'DAILY_WEATHER', label: '일일 날씨' },
    { value: 'EMERGENCY', label: '긴급 알림' },
    { value: 'WELFARE', label: '복지 알림' },
    { value: 'CUSTOM', label: '맞춤 알림' },
  ];

  const dropdownOptions = options || defaultOptions;
  const selectedOption = dropdownOptions.find(opt => opt.value === value) || dropdownOptions[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton
        type="button"
        onClick={handleToggle}
        isOpen={isOpen}
      >
        <span>{selectedOption.label}</span>
        <ChevronDown size={16} />
      </DropdownButton>
      
      {isOpen && (
        <DropdownList>
          {dropdownOptions.map((option) => (
            <DropdownOption
              key={option.value}
              isSelected={value === option.value}
              onClick={() => handleSelect(option.value)}
            >
              <OptionText isSelected={value === option.value}>
                {option.label}
              </OptionText>
              <CheckIcon isSelected={value === option.value} size={16} />
            </DropdownOption>
          ))}
        </DropdownList>
      )}
    </DropdownContainer>
  );
}

export default MessageTypeDropdown;

