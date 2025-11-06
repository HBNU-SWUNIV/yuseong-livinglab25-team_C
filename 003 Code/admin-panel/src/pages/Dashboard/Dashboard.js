import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalRecipients: 0,
    todayMessages: 0,
    successRate: 0,
    systemStatus: 'loading'
  });
  const [recentMessages, setRecentMessages] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    
    // 30초마다 데이터 새로고침
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // 병렬로 데이터 로드
      const [statsData, messagesData, statusData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentMessages(),
        dashboardApi.getSystemStatus()
      ]);

      setStats({
        totalRecipients: statsData.totalRecipients || 0,
        todayMessages: statsData.todayMessages || 0,
        successRate: statsData.successRate || 0,
        systemStatus: statusData.status || 'unknown'
      });

      setRecentMessages(messagesData.messages || []);
      setSystemAlerts(statusData.alerts || []);
      
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      
      // API 연결 실패 시 기본값 설정
      setStats({
        totalRecipients: '-',
        todayMessages: '-',
        successRate: '-',
        systemStatus: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'loading': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy': return '정상';
      case 'warning': return '주의';
      case 'error': return '오류';
      case 'loading': return '확인중';
      default: return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">대시보드</h1>
          <p className="page-subtitle">시스템 현황을 한눈에 확인하세요</p>
        </div>
        <div className="dashboard-actions">
          <span className="welcome-text">안녕하세요, {user?.username || '관리자'}님</span>
          <button className="btn btn-outline" onClick={logout}>
            로그아웃
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button className="btn btn-sm" onClick={loadDashboardData}>
            다시 시도
          </button>
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3 className="stat-number">{stats.totalRecipients.toLocaleString()}</h3>
              <p className="stat-label">총 수신자</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📨</div>
            <div className="stat-info">
              <h3 className="stat-number">{stats.todayMessages.toLocaleString()}</h3>
              <p className="stat-label">오늘 발송</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3 className="stat-number">
                {typeof stats.successRate === 'number' ? `${stats.successRate}%` : stats.successRate}
              </h3>
              <p className="stat-label">발송 성공률</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <h3 className="stat-number" style={{ color: getStatusColor(stats.systemStatus) }}>
                {getStatusText(stats.systemStatus)}
              </h3>
              <p className="stat-label">시스템 상태</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">최근 발송 이력</h2>
              <button className="btn btn-sm btn-outline" onClick={loadDashboardData}>
                새로고침
              </button>
            </div>
            <div className="card-content">
              {recentMessages.length > 0 ? (
                <div className="message-list">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="message-item">
                      <div className="message-info">
                        <h4 className="message-title">{message.title || message.type}</h4>
                        <p className="message-meta">
                          {formatDate(message.sent_at)} • 수신자 {message.recipient_count}명
                        </p>
                      </div>
                      <div className={`message-status status-${message.status}`}>
                        {message.status === 'sent' ? '발송완료' : 
                         message.status === 'failed' ? '발송실패' : '대기중'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">최근 발송 이력이 없습니다.</p>
              )}
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">시스템 알림</h2>
            </div>
            <div className="card-content">
              {systemAlerts.length > 0 ? (
                <div className="alert-list">
                  {systemAlerts.map((alert, index) => (
                    <div key={index} className={`alert-item alert-${alert.level}`}>
                      <div className="alert-icon">
                        {alert.level === 'error' ? '🚨' : 
                         alert.level === 'warning' ? '⚠️' : 'ℹ️'}
                      </div>
                      <div className="alert-content">
                        <h4 className="alert-title">{alert.title}</h4>
                        <p className="alert-message">{alert.message}</p>
                        <span className="alert-time">{formatDate(alert.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">시스템 알림이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;