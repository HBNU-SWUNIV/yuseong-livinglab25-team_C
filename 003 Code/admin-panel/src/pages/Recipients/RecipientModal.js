import React, { useState, useEffect } from 'react';

const RecipientModal = ({ recipient, onSave, onCancel, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    address: '',
    birth_date: '',
    emergency_contact: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (recipient) {
      setFormData({
        name: recipient.name || '',
        phone_number: recipient.phone_number || '',
        address: recipient.address || '',
        birth_date: recipient.birth_date || '',
        emergency_contact: recipient.emergency_contact || '',
        is_active: recipient.is_active !== undefined ? recipient.is_active : true
      });
    }
  }, [recipient]);

  // 입력값 변경 처리
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = '전화번호를 입력해주세요.';
    } else if (!/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(formData.phone_number.replace(/-/g, ''))) {
      newErrors.phone_number = '올바른 휴대폰 번호 형식이 아닙니다.';
    }

    if (formData.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.birth_date)) {
      newErrors.birth_date = '생년월일은 YYYY-MM-DD 형식으로 입력해주세요.';
    }

    if (formData.emergency_contact && !/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(formData.emergency_contact.replace(/-/g, ''))) {
      newErrors.emergency_contact = '올바른 휴대폰 번호 형식이 아닙니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // 전화번호 정규화 (하이픈 제거)
      const normalizedData = {
        ...formData,
        phone_number: formData.phone_number.replace(/-/g, ''),
        emergency_contact: formData.emergency_contact ? formData.emergency_contact.replace(/-/g, '') : ''
      };

      await onSave(normalizedData);
    } catch (err) {
      onError(recipient ? '수신자 수정에 실패했습니다.' : '수신자 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 전화번호 입력 처리
  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({
      ...prev,
      [name]: formatted
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {recipient ? '수신자 정보 수정' : '새 수신자 등록'}
          </h2>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">이름 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="수신자 이름을 입력하세요"
              maxLength="50"
            />
            {errors.name && <div className="error-text">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">전화번호 *</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handlePhoneChange}
              className={`form-input ${errors.phone_number ? 'error' : ''}`}
              placeholder="010-1234-5678"
              maxLength="13"
            />
            {errors.phone_number && <div className="error-text">{errors.phone_number}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">주소</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
              placeholder="주소를 입력하세요 (선택사항)"
              maxLength="200"
            />
          </div>

          <div className="form-group">
            <label className="form-label">생년월일</label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              className={`form-input ${errors.birth_date ? 'error' : ''}`}
            />
            {errors.birth_date && <div className="error-text">{errors.birth_date}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">비상연락처</label>
            <input
              type="tel"
              name="emergency_contact"
              value={formData.emergency_contact}
              onChange={handlePhoneChange}
              className={`form-input ${errors.emergency_contact ? 'error' : ''}`}
              placeholder="010-1234-5678 (선택사항)"
              maxLength="13"
            />
            {errors.emergency_contact && <div className="error-text">{errors.emergency_contact}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                style={{ marginRight: '8px' }}
              />
              활성 상태 (체크 해제 시 문자 발송 중단)
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              취소
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? '저장 중...' : (recipient ? '수정' : '등록')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipientModal;