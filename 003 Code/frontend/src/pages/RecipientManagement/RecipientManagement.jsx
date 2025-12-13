import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import RecipientHeader from '../../components/recipient/RecipientHeader';
import RecipientFilterBar from '../../components/recipient/RecipientFilterBar';
import RecipientTable from '../../components/recipient/RecipientTable';
import Pagination from '../../components/common/Pagination';
import AddRecipientModal from '../../components/recipient/AddRecipientModal';
import Toast from '../../components/common/Toast';

const PageContainer = styled.div`
  padding: 32px;
  padding-top: 32px;
  min-width: 0;
`;

// 더미 데이터 생성 함수
const generateRecipients = () => {
  const names = ['김유성', '이대전', '박과학', '최연구', '정혁신', '강창업', '윤산업', '임기술', '한유성', '조대전'];
  const addresses = [
    '대전광역시 유성구 대학로 291',
    '대전광역시 유성구 엑스포로 1',
    '대전광역시 유성구 봉명동',
    '대전광역시 유성구 온천동',
    '대전광역시 유성구 노은동',
  ];
  const messageTypes = ['복지 알림', '긴급 알림', '일반 메시지'];
  const sendStatuses = ['success', 'failed', 'pending'];
  
  const today = new Date();
  return Array.from({ length: 50 }, (_, index) => {
    const registeredDate = new Date(today);
    registeredDate.setDate(registeredDate.getDate() - Math.floor(Math.random() * 365));
    
    const lastSentDate = Math.random() > 0.3 
      ? new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      : null;
    
    const birthYear = 1950 + Math.floor(Math.random() * 50);
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    
    const phone1 = String(Math.floor(Math.random() * 9000) + 1000);
    const phone2 = String(Math.floor(Math.random() * 9000) + 1000);
    
    return {
      id: index + 1,
      no: index + 1,
      name: names[index % names.length] + (index >= names.length ? Math.floor(index / names.length) : ''),
      birthDate: `${birthYear}.${birthMonth}.${birthDay}`,
      phone: `010-${phone1}-${phone2}`,
      address: addresses[Math.floor(Math.random() * addresses.length)],
      consent: Math.random() > 0.2,
      messageType: messageTypes[Math.floor(Math.random() * messageTypes.length)],
      sendStatus: sendStatuses[Math.floor(Math.random() * sendStatuses.length)],
      lastSentDate: lastSentDate 
        ? `${lastSentDate.getFullYear()}.${String(lastSentDate.getMonth() + 1).padStart(2, '0')}.${String(lastSentDate.getDate()).padStart(2, '0')}`
        : null,
      registeredDate: `${registeredDate.getFullYear()}.${String(registeredDate.getMonth() + 1).padStart(2, '0')}.${String(registeredDate.getDate()).padStart(2, '0')}`,
    };
  });
};

function RecipientManagement() {
  const [recipients, setRecipients] = useState(generateRecipients());
  const [selectedIds, setSelectedIds] = useState([]);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const itemsPerPage = 10;

  // 필터링 및 검색 적용
  const filteredRecipients = useMemo(() => {
    let filtered = [...recipients];

    // 기간 필터 적용
    if (periodFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (periodFilter) {
        case '1month':
          filterDate.setMonth(today.getMonth() - 1);
          break;
        case '6months':
          filterDate.setMonth(today.getMonth() - 6);
          break;
        case '1year':
          filterDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            const startDate = new Date(customStartDate);
            const endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999); // 종료일의 끝까지 포함
            
            filtered = filtered.filter(recipient => {
              const registeredDate = new Date(recipient.registeredDate.replace(/\./g, '-'));
              return registeredDate >= startDate && registeredDate <= endDate;
            });
          }
          break;
        default:
          break;
      }
      
      if (periodFilter !== 'custom') {
        filtered = filtered.filter(recipient => {
          const registeredDate = new Date(recipient.registeredDate.replace(/\./g, '-'));
          return registeredDate >= filterDate;
        });
      }
    }

    // 검색 필터 적용
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(recipient => 
        recipient.name.toLowerCase().includes(query) ||
        recipient.phone.replace(/-/g, '').includes(query.replace(/-/g, ''))
      );
    }

    return filtered;
  }, [recipients, periodFilter, searchQuery, customStartDate, customEndDate]);

  // 페이지네이션 적용
  const paginatedRecipients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRecipients.slice(startIndex, endIndex).map((recipient, index) => ({
      ...recipient,
      no: startIndex + index + 1,
    }));
  }, [filteredRecipients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecipients.length / itemsPerPage);

  // 통계 계산
  const stats = useMemo(() => {
    const available = filteredRecipients.filter(r => r.consent && (r.sendStatus === 'success' || r.sendStatus === 'pending')).length;
    const optOut = filteredRecipients.filter(r => !r.consent || r.sendStatus === 'failed').length;
    return { available, optOut };
  }, [filteredRecipients]);

  // 전체 선택/해제
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(paginatedRecipients.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 개별 선택/해제
  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const isAllSelected = paginatedRecipients.length > 0 && 
    paginatedRecipients.every(r => selectedIds.includes(r.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  // CSV 업로드 핸들러
  const handleCSVUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('CSV 파일 업로드:', file.name);
        // TODO: CSV 파일 처리 로직 구현
      }
    };
    input.click();
  };

  // 수신자 추가 모달 열기
  const handleAddRecipient = () => {
    setIsAddModalOpen(true);
  };

  // 수신자 저장 핸들러
  const handleSaveRecipient = (formData) => {
    const today = new Date();
    const newRecipient = {
      id: recipients.length + 1,
      no: recipients.length + 1,
      name: formData.name,
      birthDate: formData.birthDate ? formData.birthDate.replace(/-/g, '.') : '',
      phone: formData.phone,
      address: formData.address,
      consent: formData.consent,
      messageType: formData.messageTypes.length > 0 ? formData.messageTypes.join(', ') : '일반 메시지',
      sendStatus: 'pending',
      lastSentDate: null,
      registeredDate: `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`,
    };

    setRecipients(prev => [newRecipient, ...prev]);
    setToast({
      type: 'success',
      title: '수신자 추가 완료',
      message: '수신자가 성공적으로 추가되었습니다.',
    });

    // 첫 페이지로 이동
    setCurrentPage(1);
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    setSelectedIds([]);
    setCurrentPage(1);
    // TODO: 실제 데이터 새로고침 로직 구현
    console.log('데이터 새로고침');
  };

  // 전체 새로고침 (페이지 새로고침)
  const handleFullRefresh = () => {
    window.location.reload();
  };

  // 커스텀 기간 설정 핸들러
  const handleCustomPeriodConfirm = (startDate, endDate) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setCurrentPage(1);
  };

  // 페이지 변경 시 선택 해제
  React.useEffect(() => {
    setSelectedIds([]);
  }, [currentPage]);

  // 기간 필터 변경 시 페이지 리셋
  React.useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter, customStartDate, customEndDate]);

  // 기존 전화번호 목록
  const existingPhones = useMemo(() => {
    return recipients.map(r => r.phone);
  }, [recipients]);

  return (
    <PageContainer>
      <RecipientHeader 
        totalCount={filteredRecipients.length}
        selectedCount={selectedIds.length}
        availableCount={stats.available}
        optOutCount={stats.optOut}
      />
      
      <RecipientFilterBar
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterClick={() => console.log('필터 클릭')}
        onCSVUpload={handleCSVUpload}
        onAddRecipient={handleAddRecipient}
        onRefresh={handleRefresh}
        onFullRefresh={handleFullRefresh}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomPeriodConfirm={handleCustomPeriodConfirm}
      />
      
      <RecipientTable
        recipients={paginatedRecipients}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        totalCount={filteredRecipients.length}
        selectedCount={selectedIds.length}
        onRefresh={handleFullRefresh}
      />
      
      {totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <AddRecipientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveRecipient}
        existingPhones={existingPhones}
      />

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </PageContainer>
  );
}

export default RecipientManagement;

