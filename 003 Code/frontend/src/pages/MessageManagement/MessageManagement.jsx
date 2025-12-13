import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import MessageTabs from '../../components/message/MessageTabs';
import MessageFilterBar from '../../components/message/MessageFilterBar';
import MessageHistoryTable from '../../components/message/MessageHistoryTable';
import MessageSendForm from '../../components/message/MessageSendForm';
import Pagination from '../../components/common/Pagination';

const PageContainer = styled.div`
  padding: 32px;
  padding-top: 32px;
  min-width: 0;
`;

const TabContent = styled.div`
  margin-top: 0;
  padding-top: 0;
`;

// 더미 데이터 생성 함수
const generateMessages = () => {
  const messageTypes = ['일일 날씨', '긴급 알림', '복지 알림', '맞춤 알림'];
  const statuses = ['대기중', '발송 완료', '발송 실패'];
  const titles = [
    '겨울철 독감 예방접종 안내',
    '도룡동 정전 안내 및 복구 예정',
    '유성구청 민원실 운영시간 변경 안내',
    '저소득층 난방비 지원 신청 안내',
    '호우경보 발효 및 하천 접근 자제',
    '유성구청 주차장 임시 폐쇄 안내',
    '복지정책 안내',
    '긴급 재난 알림',
  ];

  const today = new Date();
  return Array.from({ length: 50 }, (_, index) => {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90));
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 30));

    return {
      id: index + 1,
      no: index + 1,
      messageType: messageTypes[Math.floor(Math.random() * messageTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      title: titles[Math.floor(Math.random() * titles.length)],
      startDate: `${startDate.getFullYear()}.${String(startDate.getMonth() + 1).padStart(2, '0')}.${String(startDate.getDate()).padStart(2, '0')}`,
      endDate: `${endDate.getFullYear()}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${String(endDate.getDate()).padStart(2, '0')}`,
      registeredDate: new Date(startDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    };
  });
};

function MessageManagement() {
  const [activeTab, setActiveTab] = useState('history');
  const [messages] = useState(generateMessages());
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageType, setMessageType] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // value를 label로 변환하는 매핑
  const messageTypeValueToLabel = {
    'DAILY_WEATHER': '일일 날씨',
    'EMERGENCY': '긴급 알림',
    'WELFARE': '복지 알림',
    'CUSTOM': '맞춤 알림',
  };

  // 필터링 및 검색 적용
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    // 메시지 타입 필터
    if (messageType !== 'all') {
      const label = messageTypeValueToLabel[messageType];
      if (label) {
        filtered = filtered.filter(msg => msg.messageType === label);
      }
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(msg =>
        msg.title.toLowerCase().includes(query)
      );
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
            
            filtered = filtered.filter(msg => {
              const registeredDate = new Date(msg.registeredDate);
              return registeredDate >= startDate && registeredDate <= endDate;
            });
          }
          break;
        default:
          break;
      }
      
      if (periodFilter !== 'custom') {
        filtered = filtered.filter(msg => {
          const registeredDate = new Date(msg.registeredDate);
          return registeredDate >= filterDate;
        });
      }
    }

    return filtered;
  }, [messages, messageType, searchQuery, periodFilter, customStartDate, customEndDate]);

  // 페이지네이션 적용
  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMessages.slice(startIndex, endIndex).map((message, index) => ({
      ...message,
      no: startIndex + index + 1,
    }));
  }, [filteredMessages, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);

  // 전체 선택/해제
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(paginatedMessages.map(m => m.id));
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

  const isAllSelected = paginatedMessages.length > 0 &&
    paginatedMessages.every(m => selectedIds.includes(m.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  // 검색 핸들러
  const handleSearch = () => {
    setCurrentPage(1);
    // 검색은 이미 filteredMessages에서 처리됨
  };

  // 필터 초기화
  const handleReset = () => {
    setSearchQuery('');
    setMessageType('all');
    setPeriodFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedIds([]);
    setCurrentPage(1);
  };

  // 커스텀 기간 설정
  const handleCustomPeriodConfirm = (startDate, endDate) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setCurrentPage(1);
  };

  // 새로고침
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

  // 페이지 변경 시 선택 해제 및 스크롤 최상단
  useEffect(() => {
    setSelectedIds([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter, customStartDate, customEndDate, messageType, searchQuery]);

  return (
    <PageContainer>
      <MessageTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'history' && (
        <TabContent>
          <MessageFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            onReset={handleReset}
            onFullRefresh={handleFullRefresh}
            messageType={messageType}
            onMessageTypeChange={setMessageType}
            periodFilter={periodFilter}
            onPeriodChange={setPeriodFilter}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomPeriodConfirm={handleCustomPeriodConfirm}
          />
          
          <MessageHistoryTable
            messages={paginatedMessages}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            totalCount={filteredMessages.length}
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
        </TabContent>
      )}
      
      {activeTab === 'send' && (
        <TabContent>
          <MessageSendForm />
        </TabContent>
      )}
    </PageContainer>
  );
}

export default MessageManagement;

