import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import CustomNotificationSearchBar from '../../components/custom/CustomNotificationSearchBar';
import CustomNotificationTable from '../../components/custom/CustomNotificationTable';
import EmptyState from '../../components/custom/EmptyState';

const PageContainer = styled.div`
  padding: 32px;
  padding-top: 32px;
  min-width: 0;
`;

// 더미 데이터 생성 함수
const generateRecipients = () => {
  const today = new Date();
  
  // 고정 데이터 (검색 테스트용)
  const fixedRecipients = [
    {
      id: 1,
      no: 1,
      name: '홍길동',
      birthDate: '2000.01.15',
      phone: '010-1234-5678',
      address: '대전광역시 유성구 봉명동',
      consent: true,
      messageType: '복지 알림',
      sendStatus: 'success',
      lastSentDate: '2025.12.01',
      registeredDate: '2025.11.28',
    },
    {
      id: 2,
      no: 2,
      name: '홍길순',
      birthDate: '1999.05.20',
      phone: '010-3244-3244',
      address: '대전광역시 유성구 궁동',
      consent: true,
      messageType: '복지 알림',
      sendStatus: 'success',
      lastSentDate: '2025.11.01',
      registeredDate: '2025.11.28',
    },
  ];
  
  // 추가 랜덤 데이터
  const names = ['김유성', '이대전', '박과학', '최연구', '정혁신', '강창업', '윤산업', '임기술', '한유성', '조대전'];
  const addresses = [
    '대전광역시 유성구 대학로 291',
    '대전광역시 유성구 엑스포로 1',
    '대전광역시 유성구 봉명동',
    '대전광역시 유성구 온천동',
    '대전광역시 유성구 노은동',
  ];
  const messageTypes = ['일일 날씨', '긴급 알림', '복지 알림', '맞춤 알림'];
  const sendStatuses = ['success', 'failed', 'pending'];
  
  const randomRecipients = Array.from({ length: 28 }, (_, index) => {
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
      id: index + 3,
      no: index + 3,
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
  
  return [...fixedRecipients, ...randomRecipients];
};

function CustomNotification() {
  const [searchQuery, setSearchQuery] = useState('');
  const [messageType, setMessageType] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // value를 label로 변환하는 매핑
  const messageTypeValueToLabel = {
    'DAILY_WEATHER': '일일 날씨',
    'EMERGENCY': '긴급 알림',
    'WELFARE': '복지 알림',
    'CUSTOM': '맞춤 알림',
  };

  // 검색 실행
  const handleSearch = () => {
    setHasSearched(true);
    
    // 더미 데이터 생성
    const allRecipients = generateRecipients();
    
    // 필터링 적용
    let filtered = [...allRecipients];
    
    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(recipient => 
        recipient.name.toLowerCase().includes(query) ||
        recipient.phone.replace(/-/g, '').includes(query.replace(/-/g, ''))
      );
    }
    
    // 메시지 타입 필터
    if (messageType !== 'ALL' && messageType !== '전체') {
      const label = messageTypeValueToLabel[messageType];
      if (label) {
        filtered = filtered.filter(recipient => recipient.messageType === label);
      }
    }
    
    // 등록일 필터
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
            endDate.setHours(23, 59, 59, 999);
            
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
    
    // 번호 재할당
    const numberedResults = filtered.map((recipient, index) => ({
      ...recipient,
      no: index + 1,
    }));
    
    setSearchResults(numberedResults);
    setSelectedIds([]);
  };

  // 필터 초기화
  const handleReset = () => {
    setSearchQuery('');
    setMessageType('ALL');
    setPeriodFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setHasSearched(false);
    setSearchResults([]);
    setSelectedIds([]);
  };

  // 커스텀 기간 설정
  const handleCustomPeriodConfirm = (startDate, endDate) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setPeriodFilter('custom');
  };

  // 전체 선택/해제
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(searchResults.map(r => r.id));
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

  const isAllSelected = searchResults.length > 0 && 
    searchResults.every(r => selectedIds.includes(r.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  return (
    <PageContainer>
      <CustomNotificationSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        onReset={handleReset}
        messageType={messageType}
        onMessageTypeChange={setMessageType}
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomPeriodConfirm={handleCustomPeriodConfirm}
      />
      
      {hasSearched && (
        <>
          <ResultSummary>
            검색 결과 <strong>{searchResults.length}</strong>건
            {' | '}
            <SelectedCount>{selectedIds.length}건 선택</SelectedCount>
          </ResultSummary>
          
          {searchResults.length > 0 ? (
            <CustomNotificationTable
              recipients={searchResults}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
            />
          ) : (
            <EmptyState message="검색된 수신자가 없습니다" />
          )}
        </>
      )}
      
      {!hasSearched && (
        <EmptyState message="검색된 수신자가 없습니다" />
      )}
    </PageContainer>
  );
}

const ResultSummary = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
  padding: 12px 0;
  
  strong {
    color: #1a1a1a;
    font-weight: 600;
  }
`;

const SelectedCount = styled.span`
  color: #2563eb;
  font-weight: 600;
`;

export default CustomNotification;

