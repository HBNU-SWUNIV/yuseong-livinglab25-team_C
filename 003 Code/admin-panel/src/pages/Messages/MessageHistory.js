import React, { useState } from 'react';

const MessageHistory = ({ messages, loading, onRefresh }) => {
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 필터 변경 처리
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };

  // 필터 적용
  const handleApplyFilters = () => {
    onRefresh(filters);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    const resetFilters = {
      type: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    };
    setFilters(resetFilters);
    onRefresh(resetFilters);
  };

  // 메시지 타입 표시
  const getTypeLabel = (type) => {
    const types = {
      daily: '일일 날씨',
      emergency: '긴급 알림',
      welfare: '복지 알림',
      custom: '맞춤 알림'
    };
    return types[type] || type;
  };

  // 메시지 타입 배지 클래스
  const getTypeBadgeClass = (type) => {
    return `message-type-badge type-${type}`;
  };

  // 상태 표시
  const getStatusLabel = (status) => {
    const statuses = {
      pending: '대기중',
      sent: '발송완료',
      failed: '발송실패'
    };
    return statuses[status] || status;
  };

  // 상태 배지 클래스
  const getStatusBadgeClass = (status) => {
    return `status-badge status-${status}`;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 성공률 계산
  const getSuccessRate = (recipientCount, successCount) => {
    if (!recipientCount || recipientCount === 0) return '0%';
    return `${Math.round((successCount / recipientCount) * 100)}%`;
  };

  // 페이지네이션
  const totalPages = Math.ceil(messages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMessages = messages.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <div className="loading">메시지 이력을 불러오는 중...</div>;
  }

  return (
    <div className="message-history">
      <div className="messages-header">
        <h2>발송 이력</h2>
        <button onClick={() => onRefresh(filters)} className="btn btn-primary">
          새로고침
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label className="form-label">메시지 타입</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">전체</option>
              <option value="daily">일일 날씨</option>
              <option value="emergency">긴급 알림</option>
              <option value="welfare">복지 알림</option>
              <option value="custom">맞춤 알림</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="form-label">발송 상태</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">전체</option>
              <option value="pending">대기중</option>
              <option value="sent">발송완료</option>
              <option value="failed">발송실패</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="form-label">시작 날짜</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <label className="form-label">종료 날짜</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <label className="form-label">검색</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="제목 또는 내용 검색"
              className="form-input"
            />
          </div>

          <div className="filter-actions">
            <button
              onClick={handleApplyFilters}
              className="btn btn-primary"
            >
              적용
            </button>
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 테이블 */}
      {currentMessages.length > 0 ? (
        <>
          <table className="messages-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>타입</th>
                <th>제목</th>
                <th>내용</th>
                <th>예약시간</th>
                <th>발송시간</th>
                <th>수신자수</th>
                <th>성공률</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {currentMessages.map(message => (
                <tr key={message.id}>
                  <td>{message.id}</td>
                  <td>
                    <span className={getTypeBadgeClass(message.type)}>
                      {getTypeLabel(message.type)}
                    </span>
                  </td>
                  <td>{message.title || '-'}</td>
                  <td>
                    <div style={{ 
                      maxWidth: '200px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {message.content}
                    </div>
                  </td>
                  <td>{formatDate(message.scheduled_at)}</td>
                  <td>{formatDate(message.sent_at)}</td>
                  <td>{message.recipient_count || 0}</td>
                  <td>{getSuccessRate(message.recipient_count, message.success_count)}</td>
                  <td>
                    <span className={getStatusBadgeClass(message.status)}>
                      {getStatusLabel(message.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                이전
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={currentPage === page ? 'active' : ''}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                다음
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <h3>발송된 메시지가 없습니다</h3>
          <p>메시지를 발송하면 여기에 이력이 표시됩니다.</p>
        </div>
      )}
    </div>
  );
};

export default MessageHistory;