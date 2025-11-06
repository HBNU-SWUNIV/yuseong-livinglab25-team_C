import React, { useState, useEffect } from 'react';
import { messagesApi } from '../../services/api';
import MessageForm from './MessageForm';
import MessageHistory from './MessageHistory';
import MessagePreview from './MessagePreview';
import './Messages.css';

const Messages = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // 메시지 목록 조회
  const fetchMessages = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await messagesApi.getMessages(1, 20, filters);
      setMessages(response.data || []);
    } catch (error) {
      console.error('메시지 목록 조회 실패:', error);
      setError('메시지 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 메시지 발송
  const handleSendMessage = async (messageData) => {
    try {
      setLoading(true);
      setError('');
      
      if (messageData.scheduleType === 'now') {
        await messagesApi.sendMessage(messageData);
        setSuccess('메시지가 성공적으로 발송되었습니다.');
      } else {
        await messagesApi.scheduleMessage(messageData);
        setSuccess('메시지가 성공적으로 예약되었습니다.');
      }
      
      // 메시지 목록 새로고침
      if (activeTab === 'history') {
        fetchMessages();
      }
    } catch (error) {
      console.error('메시지 발송 실패:', error);
      setError(error.response?.data?.message || '메시지 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 메시지 미리보기
  const handlePreviewMessage = async (messageData) => {
    try {
      const response = await messagesApi.previewMessage(messageData);
      setPreviewData(response);
      setShowPreview(true);
    } catch (error) {
      console.error('미리보기 실패:', error);
      setError('미리보기를 생성하는데 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시 메시지 목록 조회
  useEffect(() => {
    if (activeTab === 'history') {
      fetchMessages();
    }
  }, [activeTab]);

  // 성공/에러 메시지 자동 숨김
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="messages">
      <div className="messages-header">
        <div>
          <h1>메시지 관리</h1>
          <p>메시지 발송 및 이력을 관리합니다</p>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="messages-tabs">
        <button
          className={`tab-button ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          메시지 발송
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          발송 이력
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'send' && (
        <MessageForm
          onSend={handleSendMessage}
          onPreview={handlePreviewMessage}
          loading={loading}
        />
      )}

      {activeTab === 'history' && (
        <MessageHistory
          messages={messages}
          loading={loading}
          onRefresh={fetchMessages}
        />
      )}

      {/* 미리보기 모달 */}
      {showPreview && (
        <MessagePreview
          data={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default Messages;