import React from 'react';
import styled from 'styled-components';
import { Users, Mail, CheckCircle, Cpu, RefreshCw } from 'lucide-react';

// 컴포넌트 경로 (본인 프로젝트 폴더 구조에 맞는지 꼭 확인하세요!)
import StatCard from '../../components/StatCard/StatCard';
import MessageChart from '../../components/MessageChart/MessageChart';
import RecentSendTable from '../../components/RecentSendTable/RecentSendTable';
import SystemAlertTable from '../../components/SystemAlertTable/SystemAlertTable';


const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const UpdateSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const LastUpdate = styled.div`
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
  flex-shrink: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
`;


const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  border-radius: 6px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  min-width: 0;
`;

const ChartSection = styled.div`
  margin-top: 8px;
`;

const TableSection = styled.div`
  margin-top: 8px;
`;

const TablesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 8px;
`;

// 더미 데이터 생성 함수
const getDashboardStats = () => {
  return {
    totalRecipients: 2430,
    todayEmails: 3,
    successRate: 100,
    systemStatus: '양호',
  };
};

const getLastUpdateDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 2); // 2일 전으로 설정
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const weekday = weekdays[date.getDay()];
  return `${year}.${month}.${day}. ${weekday} 16:23`;
};

// 최근 발송 이력 더미 데이터 생성
const generateRecentSendData = () => {
  const titles = [
    '겨울철 독감 예방접종 안내',
    '도룡동 정전 안내 및 복구 예정',
    '유성구청 민원실 운영시간 변경 안내',
    '저소득층 난방비 지원 신청 안내',
    '호우경보 발효 및 하천 접근 자제',
    '유성구청 주차장 임시 폐쇄 안내',
  ];
  const messageTypes = ['복지 알림', '긴급 알림', '일반 메시지', '날씨 알림', '재난 알림'];
  const sendMethods = ['즉시 발송', '예약 발송'];
  const statuses = ['성공', '실패'];
  const senders = ['유성구 보건소', '재난안전과', '민원여권과', '복지정책과', '총무과'];
  
  const today = new Date();
  return Array.from({ length: 15 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - index);
    const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    
    return {
      id: index + 1,
      no: index + 1,
      sendDate: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${hours}:${minutes}`,
      messageType: messageTypes[Math.floor(Math.random() * messageTypes.length)],
      title: titles[index % titles.length],
      recipientCount: Math.floor(Math.random() * 500) + 100,
      sendMethod: sendMethods[Math.floor(Math.random() * sendMethods.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      sender: senders[Math.floor(Math.random() * senders.length)],
    };
  });
};

// 시스템 알림 이력 더미 데이터 생성
const generateSystemAlertData = () => {
  const systemAlerts = [
    {
      title: '"겨울철 독감 예방접종 안내" 메세지 발송이 완료되었습니다.',
      alertType: '발송 성공',
      severity: '정보',
    },
    {
      title: '수신자 목록 동기화 중 일시적인 API 오류가 발생했습니다.',
      alertType: 'API 오류',
      severity: '경고',
    },
    {
      title: '"도룡동 정전 안내 및 복구 예정" 메세지 발송이 완료되었습니다.',
      alertType: '발송 성공',
      severity: '정보',
    },
    {
      title: '일부 수신자에게 메세지 발송에 실패했습니다.',
      alertType: '발송 실패',
      severity: '경고',
    },
    {
      title: '"호우경보 발효 및 하천 접근 자제" 메세지 예약 발송이 완료되었습니다.',
      alertType: '발송 성공',
      severity: '정보',
    },
    {
      title: '자정 00:00~01:00 사이 시스템 점검이 예정되어 있습니다.',
      alertType: '시스템 점검',
      severity: '공지',
    },
  ];
  
  const today = new Date();
  return Array.from({ length: 10 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - index);
    const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const alert = systemAlerts[index % systemAlerts.length];
    
    return {
      id: index + 1,
      no: index + 1,
      occurredDate: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${hours}:${minutes}`,
      alertType: alert.alertType,
      title: alert.title,
      alertId: `ALERT-${String(index + 1).padStart(5, '0')}`,
      severity: alert.severity,
    };
  });
};

function Dashboard() {
  const stats = getDashboardStats();
  const lastUpdate = getLastUpdateDate();
  const recentSendData = generateRecentSendData();
  const systemAlertData = generateSystemAlertData();

  const handleRefresh = () => {
    // 새로고침 로직
    window.location.reload();
  };

  return (
    <DashboardContainer>
      <UpdateSection>
        <LastUpdate>마지막 업데이트 {lastUpdate}</LastUpdate>
        <ActionButtons>
          <RefreshButton onClick={handleRefresh}>
            <RefreshCw size={14} />
            <span>전체 새로고침</span>
          </RefreshButton>
        </ActionButtons>
      </UpdateSection>

      <StatsGrid>
        <StatCard
          title="총 수신자"
          value={stats.totalRecipients}
          valueSuffix="명"
          icon={Users}
          iconColor="#3b82f6"
          bgColor="#eff6ff"
        />
        <StatCard
          title="오늘 발송된 메일"
          value={stats.todayEmails}
          valueSuffix="건"
          icon={Mail}
          iconColor="#3b82f6"
          bgColor="#eff6ff"
        />
        <StatCard
          title="오늘 발송 성공률"
          value={stats.successRate}
          valueSuffix="%"
          icon={CheckCircle}
          iconColor="#3b82f6"
          bgColor="#eff6ff"
        />
        <StatCard
          title="현재 시스템 상태"
          value={stats.systemStatus}
          icon={Cpu}
          iconColor="#3b82f6"
          bgColor="#eff6ff"
          isStatus={true}
        />
      </StatsGrid>

      <ChartSection>
        <MessageChart />
      </ChartSection>

      <TablesSection>
        <RecentSendTable data={recentSendData} />
        <SystemAlertTable data={systemAlertData} />
      </TablesSection>
    </DashboardContainer>
  );
}

export default Dashboard;

