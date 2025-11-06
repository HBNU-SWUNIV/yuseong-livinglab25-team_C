import React, { useState, useEffect } from 'react';
import { recipientsApi } from '../../services/api';
import RecipientModal from './RecipientModal';
import CsvUpload from './CsvUpload';
import './Recipients.css';

const Recipients = () => {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  const itemsPerPage = 10;

  // 수신자 목록 조회
  const fetchRecipients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError('');
      const response = await recipientsApi.getRecipients(page, itemsPerPage, search);
      
      setRecipients(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.totalCount || 0);
      setCurrentPage(page);
    } catch (err) {
      setError('수신자 목록을 불러오는데 실패했습니다.');
      console.error('수신자 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchRecipients(1, searchTerm);
  }, []);

  // 검색 처리
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecipients(1, searchTerm);
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    fetchRecipients(page, searchTerm);
  };

  // 수신자 추가
  const handleAddRecipient = () => {
    setEditingRecipient(null);
    setShowModal(true);
  };

  // 수신자 수정
  const handleEditRecipient = (recipient) => {
    setEditingRecipient(recipient);
    setShowModal(true);
  };

  // 수신자 삭제
  const handleDeleteRecipient = async (id, name) => {
    if (!window.confirm(`'${name}' 수신자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await recipientsApi.deleteRecipient(id);
      setSuccess('수신자가 성공적으로 삭제되었습니다.');
      fetchRecipients(currentPage, searchTerm);
      
      // 성공 메시지 자동 제거
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('수신자 삭제에 실패했습니다.');
      console.error('수신자 삭제 오류:', err);
    }
  };

  // 모달 저장 처리
  const handleModalSave = async (recipientData) => {
    try {
      if (editingRecipient) {
        await recipientsApi.updateRecipient(editingRecipient.id, recipientData);
        setSuccess('수신자 정보가 성공적으로 수정되었습니다.');
      } else {
        await recipientsApi.createRecipient(recipientData);
        setSuccess('새 수신자가 성공적으로 등록되었습니다.');
      }
      
      setShowModal(false);
      fetchRecipients(currentPage, searchTerm);
      
      // 성공 메시지 자동 제거
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(editingRecipient ? '수신자 수정에 실패했습니다.' : '수신자 등록에 실패했습니다.');
      console.error('수신자 저장 오류:', err);
    }
  };

  // CSV 업로드 성공 처리
  const handleCsvUploadSuccess = (result) => {
    setSuccess(`CSV 업로드 완료: ${result.successCount}명 등록, ${result.errorCount}명 실패`);
    setShowCsvUpload(false);
    fetchRecipients(currentPage, searchTerm);
    
    // 성공 메시지 자동 제거
    setTimeout(() => setSuccess(''), 5000);
  };

  // 에러 메시지 제거
  const clearError = () => setError('');
  const clearSuccess = () => setSuccess('');

  return (
    <div className="recipients">
      <div className="page-header">
        <h1 className="page-title">수신자 관리</h1>
        <p className="page-subtitle">문자를 받을 수신자를 관리합니다 (총 {totalCount}명)</p>
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

      {/* 액션 버튼들 */}
      <div className="recipients-header">
        <div className="search-section">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="이름 또는 전화번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-secondary" style={{ marginLeft: '10px' }}>
              검색
            </button>
          </form>
        </div>
        
        <div className="recipients-actions">
          <button 
            onClick={() => setShowCsvUpload(true)} 
            className="btn btn-secondary"
          >
            CSV 업로드
          </button>
          <button 
            onClick={handleAddRecipient} 
            className="btn btn-primary"
          >
            수신자 추가
          </button>
        </div>
      </div>

      {/* CSV 업로드 섹션 */}
      {showCsvUpload && (
        <CsvUpload
          onSuccess={handleCsvUploadSuccess}
          onCancel={() => setShowCsvUpload(false)}
          onError={setError}
        />
      )}

      {/* 수신자 목록 테이블 */}
      <div className="card">
        {loading ? (
          <div className="loading">수신자 목록을 불러오는 중...</div>
        ) : recipients.length === 0 ? (
          <div className="empty-state">
            <h3>등록된 수신자가 없습니다</h3>
            <p>새 수신자를 추가하거나 CSV 파일로 일괄 등록해보세요.</p>
          </div>
        ) : (
          <>
            <table className="recipients-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>전화번호</th>
                  <th>주소</th>
                  <th>생년월일</th>
                  <th>상태</th>
                  <th>등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => (
                  <tr key={recipient.id}>
                    <td data-label="이름">{recipient.name}</td>
                    <td data-label="전화번호">{recipient.phone_number}</td>
                    <td data-label="주소">{recipient.address || '-'}</td>
                    <td data-label="생년월일">{recipient.birth_date || '-'}</td>
                    <td data-label="상태">
                      <span className={`status-badge ${recipient.is_active ? 'status-active' : 'status-inactive'}`}>
                        {recipient.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td data-label="등록일">{new Date(recipient.created_at).toLocaleDateString()}</td>
                    <td data-label="작업">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditRecipient(recipient)}
                          className="btn btn-sm btn-primary"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteRecipient(recipient.id, recipient.name)}
                          className="btn btn-sm btn-danger"
                        >
                          삭제
                        </button>
                      </div>
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
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
        )}
      </div>

      {/* 수신자 추가/수정 모달 */}
      {showModal && (
        <RecipientModal
          recipient={editingRecipient}
          onSave={handleModalSave}
          onCancel={() => setShowModal(false)}
          onError={setError}
        />
      )}
    </div>
  );
};

export default Recipients;