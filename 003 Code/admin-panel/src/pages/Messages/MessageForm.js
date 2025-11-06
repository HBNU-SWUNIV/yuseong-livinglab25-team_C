import React, { useState } from 'react';

const MessageForm = ({ onSend, onPreview, loading }) => {
  const [formData, setFormData] = useState({
    type: 'welfare',
    title: '',
    content: '',
    scheduleType: 'now',
    scheduledDate: '',
    scheduledTime: '',
    recipientType: 'all'
  });

  const [errors, setErrors] = useState({});

  // 메시지 타입 옵션
  const messageTypes = [
    {
      value: 'welfare',
      label: '복지 알림',
      description: '보건소 및 복지 관련 공지사항'
    },
    {
      value: 'emergency',
      label: '긴급 알림',
      description: '긴급 상황 및 재난 알림'
    },
    {
      value: 'custom',
      label: '일반 메시지',
      description: '기타 일반적인 안내 메시지'
    }
  ];

  // 입력값 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 메시지 타입 선택
  const handleTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      type
    }));
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }

    if (!formData.content.trim()) {
      newErrors.content = '메시지 내용을 입력해주세요.';
    } else if (formData.content.length > 90) {
      newErrors.content = '메시지는 90자 이하로 입력해주세요.';
    }

    if (formData.scheduleType === 'scheduled') {
      if (!formData.scheduledDate) {
        newErrors.scheduledDate = '발송 날짜를 선택해주세요.';
      }
      if (!formData.scheduledTime) {
        newErrors.scheduledTime = '발송 시간을 선택해주세요.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 미리보기
  const handlePreview = () => {
    if (validateForm()) {
      onPreview(formData);
    }
  };

  // 발송
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSend(formData);
    }
  };

  // 폼 초기화
  const handleReset = () => {
    setFormData({
      type: 'welfare',
      title: '',
      content: '',
      scheduleType: 'now',
      scheduledDate: '',
      scheduledTime: '',
      recipientType: 'all'
    });
    setErrors({});
  };

  // 문자 수 계산
  const getCharacterCount = () => {
    return formData.content.length;
  };

  // 문자 수 스타일
  const getCharacterCountClass = () => {
    const count = getCharacterCount();
    if (count > 90) return 'character-count error';
    if (count > 80) return 'character-count warning';
    return 'character-count';
  };

  return (
    <div className="message-form">
      <h2>메시지 발송</h2>
      
      <form onSubmit={handleSubmit}>
        {/* 메시지 타입 선택 */}
        <div className="form-group">
          <label className="form-label">메시지 타입</label>
          <div className="message-type-selector">
            {messageTypes.map(type => (
              <div
                key={type.value}
                className={`type-option ${formData.type === type.value ? 'selected' : ''}`}
                onClick={() => handleTypeSelect(type.value)}
              >
                <h4>{type.label}</h4>
                <p>{type.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div className="form-group">
          <label className="form-label">제목</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="메시지 제목을 입력하세요"
            maxLength={50}
          />
          {errors.title && <div className="error-text">{errors.title}</div>}
        </div>

        {/* 메시지 내용 */}
        <div className="form-group">
          <label className="form-label">메시지 내용</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            className={`form-textarea ${errors.content ? 'error' : ''}`}
            placeholder="메시지 내용을 입력하세요 (90자 이하)"
            rows={4}
            maxLength={100}
          />
          <div className={getCharacterCountClass()}>
            {getCharacterCount()}/90자
          </div>
          {errors.content && <div className="error-text">{errors.content}</div>}
        </div>

        {/* 발송 시점 선택 */}
        <div className="form-group">
          <label className="form-label">발송 시점</label>
          <div className="schedule-options">
            <div className="schedule-option">
              <input
                type="radio"
                id="now"
                name="scheduleType"
                value="now"
                checked={formData.scheduleType === 'now'}
                onChange={handleInputChange}
              />
              <label htmlFor="now">즉시 발송</label>
            </div>
            <div className="schedule-option">
              <input
                type="radio"
                id="scheduled"
                name="scheduleType"
                value="scheduled"
                checked={formData.scheduleType === 'scheduled'}
                onChange={handleInputChange}
              />
              <label htmlFor="scheduled">예약 발송</label>
            </div>
          </div>
        </div>

        {/* 예약 발송 시간 */}
        {formData.scheduleType === 'scheduled' && (
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">발송 날짜</label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                className={`form-input ${errors.scheduledDate ? 'error' : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.scheduledDate && <div className="error-text">{errors.scheduledDate}</div>}
            </div>
            <div className="form-col">
              <label className="form-label">발송 시간</label>
              <input
                type="time"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                className={`form-input ${errors.scheduledTime ? 'error' : ''}`}
              />
              {errors.scheduledTime && <div className="error-text">{errors.scheduledTime}</div>}
            </div>
          </div>
        )}

        {/* 수신자 선택 */}
        <div className="form-group">
          <label className="form-label">수신자</label>
          <select
            name="recipientType"
            value={formData.recipientType}
            onChange={handleInputChange}
            className="form-select"
          >
            <option value="all">전체 수신자</option>
            <option value="active">활성 수신자만</option>
          </select>
        </div>

        {/* 버튼 그룹 */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={loading}
          >
            초기화
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="btn btn-warning"
            disabled={loading}
          >
            미리보기
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '발송 중...' : 
             formData.scheduleType === 'now' ? '즉시 발송' : '예약 등록'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageForm;