import React, { useState, useEffect } from 'react';
import { recipientsApi, customRemindersApi } from '../../services/api';
import ReminderModal from './ReminderModal';
import './CustomReminders.css';

const CustomReminders = () => {
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recipientsLoading, setRecipientsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  // 수신자 목록 조회
  const fetchRecipients = async (search = '') => {
    try {
      setRecipientsLoading(true);
      setError('');
      const response = await recipientsApi.getRecipients(1, 100, search);
      setRecipients(response.data || []);
    } catch (err) {
      setError('수신자 목록을 불러오는데 실패했습니다.');
      console.error('수신자 목록 조회 오류:', err);
    } finally {
      setRecipientsLoading(false);
    }
  };

  // 선택된 수신자의 맞춤 알림 조회
  const fetchReminders = async (recipientId) => {
    try {
      setLoading(true);
      setError('');
      const response = await customRemindersApi.getCustomReminders(recipientId);
      setReminders(response.data || []);
    } catch (err) {
      setError('맞춤 알림 목록을 불러오는데 실패했습니다.');
      console.error('맞춤 알림 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 수신자 목록 로드
  useEffect(() => {
    fetchRecipients();
  }, []);

  // 수신자 선택 시 해당 수신자의 알림 조회
  useEffect(() => {
    if (selectedRecipient) {
      fetchReminders(selectedRecipient.id);
    }
  }, [selectedRecipient]);

  // 수신자 검색
  const handleRecipientSearch = (e) => {
    e.preventDefault();
    fetchRecipients(searchTerm);
  };

  // 수신자 선택
  const handleRecipientSelect = (recipient) => {
    setSelectedRecipient(recipient);
    setReminders([]);
  };

  // 새 알림 추가
  const handleAddReminder = () => {
    if (!selectedRecipient) {
      setError('먼저 수신자를 선택해주세요.');
      return;
    }

    // 최대 5개 제한 확인
    if (reminders.length >= 5) {
      setError('수신자당 최대 5개의 맞춤 알림만 설정할 수 있습니다.');
      return;
    }

    setEditingReminder(null);
    setShowModal(true);
  };

  // 알림 수정
  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setShowModal(true);
  };

  // 알림 삭제
  const handleDeleteReminder = async (id, title) => {
    if (!window.confirm(`'${title}' 알림을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await customRemindersApi.deleteCustomReminder(id);
      setSuccess('맞춤 알림이 성공적으로 삭제되었습니다.');
      fetchReminders(selectedRecipient.id);
      
      // 성공 메시지 자동 제거
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('알림 삭제에 실패했습니다.');
      console.error('알림 삭제 오류:', err);
    }
  };

  // 알림 활성화/비활성화 토글
  const handleToggleReminder = async (id, currentStatus) => {
    try {
      await customRemindersApi.toggleCustomReminder(id, !currentStatus);
      setSuccess(`알림이 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
      fetchReminders(selectedRecipient.id);
      
      // 성공 메시지 자동 제거
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('알림 상태 변경에 실패했습니다.');
      console.error('알림 토글 오류:', err);
    }
  };

  // 모달 저장 처리
  const handleModalSave = async (reminderData) => {
    try {
      if (editingReminder) {
        await customRemindersApi.updateCustomReminder(editingReminder.id, reminderData);
        setSuccess('맞춤 알림이 성공적으로 수정되었습니다.');
      } else {
        await customRemindersApi.createCustomReminder(reminderData);
        setSuccess('새 맞춤 알림이 성공적으로 등록되었습니다.');
      }
      
      setShowModal(false);
      fetchReminders(selectedRecipient.id);
      
      // 성공 메시지 자동 제거
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(editingReminder ? '알림 수정에 실패했습니다.' : '알림 등록에 실패했습니다.');
      console.error('알림 저장 오류:', err);
    }
  };

  // 스케줄 표시 텍스트 생성
  const getScheduleText = (reminder) => {
    const time = reminder.schedule_time;
    let scheduleText = '';

    switch (reminder.schedule_type) {
      case 'daily':
        scheduleText = '매일';
        break;
      case 'weekly':
        const weekDays = ['', '월', '화', '수', '목', '금', '토', '일'];
        scheduleText = `매주 ${weekDays[reminder.schedule_day]}요일`;
        break;
      case 'monthly':
        scheduleText = `매월 ${reminder.schedule_day}일`;
        break;
      default:
        scheduleText = '알 수 없음';
    }

    return `${scheduleText} ${time}`;
  };

  // 에러/성공 메시지 제거
  const clearError = () => setError('');
  const clearSuccess = () => setSuccess('');

  return (
    <div className="custom-reminders">
      <div className="page-header">
        <h1 className="page-title">맞춤 알림 설정</h1>
        <p className="page-subtitle">수신자별 개인 맞춤 알림을 설정하고 관리합니다</p>
      </div>

      {/* 에러/성공 메시지 */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={clearError} style={{ float: 'right', background: 'none', border: 'none' }}>×</button>
        </div>
      )}
      {success && (
        <div className="success-message">
          {success}
          <button onClick={clearSuccess} style={{ float: 'right', background: 'none', border: 'none' }}>×</button>
        </div>
      )}

      {/* 수신자 선택 섹션 */}
      <div className="recipient-selector">
        <h3>수신자 선택</h3>
        
        <form onSubmit={handleRecipientSearch} className="recipient-search">
          <input
            type="text"
            placeholder="수신자 이름 또는 전화번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">검색</button>
        </form>

        <div className="recipient-list">
          {recipientsLoading ? (
            <div className="loading">수신자 목록을 불러오는 중...</div>
          ) : recipients.length === 0 ? (
            <div className="empty-state">
              <p>검색된 수신자가 없습니다.</p>
            </div>
          ) : (
            recipients.map((recipient) => (
              <div
                key={recipient.id}
                className={`recipient-item ${selectedRecipient?.id === recipient.id ? 'selected' : ''}`}
                onClick={() => handleRecipientSelect(recipient)}
              >
                <div className="recipient-info">
                  <div className="recipient-name">{recipient.name}</div>
                  <div className="recipient-phone">{recipient.phone_number}</div>
                </div>
                <div className="reminder-count">
                  {/* 여기에 실제 알림 개수를 표시할 수 있습니다 */}
                  알림
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 맞춤 알림 목록 섹션 */}
      {selectedRecipient && (
        <div className="reminders-section">
          <div className="reminders-header">
            <h3>{selectedRecipient.name}님의 맞춤 알림 ({reminders.length}/5)</h3>
            <button 
              onClick={handleAddReminder} 
              className="btn btn-primary"
              disabled={reminders.length >= 5}
            >
              알림 추가
            </button>
          </div>

          {loading ? (
            <div className="loading">맞춤 알림을 불러오는 중...</div>
          ) : reminders.length === 0 ? (
            <div className="empty-state">
              <h4>설정된 맞춤 알림이 없습니다</h4>
              <p>새 알림을 추가하여 개인 맞춤 서비스를 시작해보세요.</p>
            </div>
          ) : (
            <div className="reminder-cards">
              {reminders.map((reminder) => (
                <div 
                  key={reminder.id} 
                  className={`reminder-card ${!reminder.is_active ? 'inactive' : ''}`}
                >
                  <div className="reminder-header">
                    <h4 className="reminder-title">{reminder.title}</h4>
                    <div className="reminder-actions">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={reminder.is_active}
                          onChange={() => handleToggleReminder(reminder.id, reminder.is_active)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <button
                        onClick={() => handleEditReminder(reminder)}
                        className="btn btn-sm btn-secondary"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(reminder.id, reminder.title)}
                        className="btn btn-sm btn-danger"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  
                  <div className="reminder-message">{reminder.message}</div>
                  
                  <div className="reminder-schedule">
                    <div className="schedule-item">
                      <span>📅</span>
                      <span>{getScheduleText(reminder)}</span>
                    </div>
                    <div className="schedule-item">
                      <span>👤</span>
                      <span>설정자: {reminder.created_by}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 알림 추가/수정 모달 */}
      {showModal && selectedRecipient && (
        <ReminderModal
          reminder={editingReminder}
          recipient={selectedRecipient}
          onSave={handleModalSave}
          onCancel={() => setShowModal(false)}
          onError={setError}
        />
      )}
    </div>
  );
};

export default CustomReminders;