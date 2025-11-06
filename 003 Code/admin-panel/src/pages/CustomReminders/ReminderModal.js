import React, { useState, useEffect } from 'react';
import './ReminderModal.css';

const ReminderModal = ({ reminder, recipient, onSave, onCancel, onError }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    schedule_type: 'daily',
    schedule_time: '09:00',
    schedule_day: null,
    is_active: true,
    created_by: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 컴포넌트 마운트 시 데이터 초기화
  useEffect(() => {
    if (reminder) {
      // 수정 모드
      setFormData({
        title: reminder.title || '',
        message: reminder.message || '',
        schedule_type: reminder.schedule_type || 'daily',
        schedule_time: reminder.schedule_time || '09:00',
        schedule_day: reminder.schedule_day || null,
        is_active: reminder.is_active !== undefined ? reminder.is_active : true,
        created_by: reminder.created_by || ''
      });
    } else {
      // 새 알림 모드
      setFormData({
        title: '',
        message: '',
        schedule_type: 'daily',
        schedule_time: '09:00',
        schedule_day: null,
        is_active: true,
        created_by: ''
      });
    }
  }, [reminder]);

  // 입력값 변경 처리
  const handleInputChange = (e) => {
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

  // 스케줄 타입 변경 시 처리
  const handleScheduleTypeChange = (e) => {
    const scheduleType = e.target.value;
    setFormData(prev => ({
      ...prev,
      schedule_type: scheduleType,
      schedule_day: scheduleType === 'daily' ? null : (scheduleType === 'weekly' ? 1 : 1)
    }));
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '알림 제목을 입력해주세요.';
    }

    if (!formData.message.trim()) {
      newErrors.message = '알림 메시지를 입력해주세요.';
    } else if (formData.message.length > 90) {
      newErrors.message = '메시지는 90자 이하로 입력해주세요.';
    }

    if (!formData.schedule_time) {
      newErrors.schedule_time = '알림 시간을 선택해주세요.';
    }

    if (formData.schedule_type === 'weekly' && (!formData.schedule_day || formData.schedule_day < 1 || formData.schedule_day > 7)) {
      newErrors.schedule_day = '요일을 선택해주세요.';
    }

    if (formData.schedule_type === 'monthly' && (!formData.schedule_day || formData.schedule_day < 1 || formData.schedule_day > 31)) {
      newErrors.schedule_day = '날짜를 선택해주세요.';
    }

    if (!formData.created_by.trim()) {
      newErrors.created_by = '설정자 정보를 입력해주세요.';
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
      const reminderData = {
        ...formData,
        recipient_id: recipient.id,
        schedule_day: formData.schedule_type === 'daily' ? null : formData.schedule_day
      };

      await onSave(reminderData);
    } catch (error) {
      onError('알림 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 요일 옵션
  const weekDayOptions = [
    { value: 1, label: '월요일' },
    { value: 2, label: '화요일' },
    { value: 3, label: '수요일' },
    { value: 4, label: '목요일' },
    { value: 5, label: '금요일' },
    { value: 6, label: '토요일' },
    { value: 7, label: '일요일' }
  ];

  // 월 날짜 옵션 (1-31일)
  const monthDayOptions = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}일`
  }));

  return (
    <div className="modal-overlay">
      <div className="modal-content reminder-modal">
        <div className="modal-header">
          <h2>{reminder ? '맞춤 알림 수정' : '새 맞춤 알림 등록'}</h2>
          <button type="button" className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* 수신자 정보 */}
          <div className="form-group">
            <label>수신자</label>
            <div className="recipient-info-display">
              <strong>{recipient.name}</strong> ({recipient.phone_number})
            </div>
          </div>

          {/* 알림 제목 */}
          <div className="form-group">
            <label htmlFor="title">알림 제목 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="예: 복용약 알림"
              maxLength="100"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          {/* 알림 메시지 */}
          <div className="form-group">
            <label htmlFor="message">알림 메시지 *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="예: 혈압약 복용 시간입니다. 물과 함께 드세요."
              maxLength="90"
              rows="3"
              className={errors.message ? 'error' : ''}
            />
            <div className="char-count">
              {formData.message.length}/90자
            </div>
            {errors.message && <span className="error-text">{errors.message}</span>}
          </div>

          {/* 반복 설정 */}
          <div className="form-group">
            <label htmlFor="schedule_type">반복 설정 *</label>
            <select
              id="schedule_type"
              name="schedule_type"
              value={formData.schedule_type}
              onChange={handleScheduleTypeChange}
            >
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="monthly">매월</option>
            </select>
          </div>

          {/* 요일/날짜 선택 */}
          {formData.schedule_type === 'weekly' && (
            <div className="form-group">
              <label htmlFor="schedule_day">요일 선택 *</label>
              <select
                id="schedule_day"
                name="schedule_day"
                value={formData.schedule_day || ''}
                onChange={handleInputChange}
                className={errors.schedule_day ? 'error' : ''}
              >
                <option value="">요일을 선택하세요</option>
                {weekDayOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.schedule_day && <span className="error-text">{errors.schedule_day}</span>}
            </div>
          )}

          {formData.schedule_type === 'monthly' && (
            <div className="form-group">
              <label htmlFor="schedule_day">날짜 선택 *</label>
              <select
                id="schedule_day"
                name="schedule_day"
                value={formData.schedule_day || ''}
                onChange={handleInputChange}
                className={errors.schedule_day ? 'error' : ''}
              >
                <option value="">날짜를 선택하세요</option>
                {monthDayOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.schedule_day && <span className="error-text">{errors.schedule_day}</span>}
            </div>
          )}

          {/* 알림 시간 */}
          <div className="form-group">
            <label htmlFor="schedule_time">알림 시간 *</label>
            <input
              type="time"
              id="schedule_time"
              name="schedule_time"
              value={formData.schedule_time}
              onChange={handleInputChange}
              className={errors.schedule_time ? 'error' : ''}
            />
            {errors.schedule_time && <span className="error-text">{errors.schedule_time}</span>}
          </div>

          {/* 설정자 */}
          <div className="form-group">
            <label htmlFor="created_by">설정자 (가족 관계) *</label>
            <input
              type="text"
              id="created_by"
              name="created_by"
              value={formData.created_by}
              onChange={handleInputChange}
              placeholder="예: 아들, 딸, 며느리 등"
              maxLength="50"
              className={errors.created_by ? 'error' : ''}
            />
            {errors.created_by && <span className="error-text">{errors.created_by}</span>}
          </div>

          {/* 활성화 상태 */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              알림 활성화
            </label>
          </div>
        </form>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '저장 중...' : (reminder ? '수정' : '등록')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;