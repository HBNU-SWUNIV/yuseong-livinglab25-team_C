import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 32px;
  width: 90%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
    color: #1a1a1a;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Required = styled.span`
  color: #ef4444;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
  transition: all 0.2s ease;
  box-sizing: border-box;
  
  &:hover {
    border-color: ${props => props.hasError ? '#ef4444' : '#d1d5db'};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#2563eb'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)'};
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ErrorMessage = styled.div`
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const MessageTypeGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.primary ? '#2563eb' : '#e5e7eb'};
  background-color: ${props => props.primary ? '#2563eb' : '#ffffff'};
  color: ${props => props.primary ? '#ffffff' : '#374151'};
  min-width: 80px;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.primary ? '#1d4ed8' : '#f9fafb'};
    border-color: ${props => props.primary ? '#1d4ed8' : '#d1d5db'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// 전화번호 자동 포맷 함수
const formatPhoneNumber = (value) => {
  const numbers = value.replace(/[^\d]/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};

// 전화번호 유효성 검사
const isValidPhoneNumber = (phone) => {
  const numbers = phone.replace(/[^\d]/g, '');
  return numbers.length === 11 && numbers.startsWith('010');
};

function AddRecipientModal({ isOpen, onClose, onSave, existingPhones = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthDate: '',
    address: '',
    consent: false,
    messageTypes: [],
  });

  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleChange = (field, value) => {
    if (field === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // 입력 시 해당 필드 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMessageTypeChange = (type, checked) => {
    setFormData(prev => ({
      ...prev,
      messageTypes: checked
        ? [...prev.messageTypes, type]
        : prev.messageTypes.filter(t => t !== type)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // 성명 검증
    if (!formData.name.trim()) {
      newErrors.name = '성명을 입력해주세요.';
    }

    // 휴대폰 번호 검증
    if (!formData.phone.trim()) {
      newErrors.phone = '휴대폰 번호를 입력해주세요.';
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = '올바른 휴대폰 번호를 입력해주세요. (010-xxxx-xxxx)';
    } else if (existingPhones.includes(formData.phone)) {
      newErrors.phone = '이미 등록된 수신자입니다.';
    }

    // 수신 동의 검증
    if (!formData.consent) {
      newErrors.consent = '메시지 수신 동의가 필요합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      handleReset();
      onClose();
    }
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      birthDate: '',
      address: '',
      consent: false,
      messageTypes: [],
    });
    setErrors({});
  };

  const isSaveDisabled = !formData.name.trim() || !formData.phone.trim() || !formData.consent;

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer ref={modalRef}>
        <ModalHeader>
          <ModalTitle>수신자 추가</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <FormGroup>
          <Label>
            성명 <Required>*</Required>
          </Label>
          <Input
            type="text"
            placeholder="이름을 입력하세요"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            hasError={!!errors.name}
          />
          {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>
            휴대폰 번호 <Required>*</Required>
          </Label>
          <Input
            type="text"
            placeholder="010-0000-0000"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            hasError={!!errors.phone}
            maxLength={13}
          />
          {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>생년월일</Label>
          <Input
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <Label>주소</Label>
          <Input
            type="text"
            placeholder="주소를 입력하세요"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <Label>
            메시지 수신 동의 <Required>*</Required>
          </Label>
          <CheckboxGroup>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={formData.consent}
                onChange={(e) => handleChange('consent', e.target.checked)}
              />
              메시지 수신에 동의합니다
            </CheckboxLabel>
          </CheckboxGroup>
          {errors.consent && <ErrorMessage>{errors.consent}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>수신 유형 (복수 선택 가능)</Label>
          <MessageTypeGroup>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={formData.messageTypes.includes('복지 알림')}
                onChange={(e) => handleMessageTypeChange('복지 알림', e.target.checked)}
              />
              복지 알림
            </CheckboxLabel>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={formData.messageTypes.includes('긴급 알림')}
                onChange={(e) => handleMessageTypeChange('긴급 알림', e.target.checked)}
              />
              긴급 알림
            </CheckboxLabel>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={formData.messageTypes.includes('맞춤 알림')}
                onChange={(e) => handleMessageTypeChange('맞춤 알림', e.target.checked)}
              />
              맞춤 알림
            </CheckboxLabel>
          </MessageTypeGroup>
        </FormGroup>

        <ButtonGroup>
          <Button onClick={handleCancel}>취소</Button>
          <Button primary onClick={handleSave} disabled={isSaveDisabled}>
            저장
          </Button>
        </ButtonGroup>
      </ModalContainer>
    </ModalOverlay>
  );
}

export default AddRecipientModal;



