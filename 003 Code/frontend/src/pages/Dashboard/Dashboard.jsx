import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Users,
  Mail,
  CheckCircle,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

// 컴포넌트 경로
import StatCard from "../../components/StatCard/StatCard";
import MessageChart from "../../components/MessageChart/MessageChart";
import RecentSendTable from "../../components/RecentSendTable/RecentSendTable";
import SystemAlertTable from "../../components/SystemAlertTable/SystemAlertTable";

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

const TablesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 8px;
`;

const getWeatherIcon = (condition) => {
  if (!condition) return Sun;
  if (condition.includes("비")) return CloudRain;
  if (condition.includes("눈")) return CloudSnow;
  if (condition.includes("구름") || condition.includes("흐림")) return Cloud;
  return Sun;
};

function Dashboard() {
  const [weather, setWeather] = useState({ temp: "-", condition: "로딩중" });

  // ★★★ [수정] 상태값에 테이블용 데이터 배열 추가 ★★★
  const [stats, setStats] = useState({
    totalRecipients: 0,
    todayEmails: 0,
    successRate: 0,
    chartData: [],
    recentSends: [], // 최근 발송 이력 데이터
    systemAlerts: [], // 시스템 알림 데이터
  });

  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = async () => {
    // 1. 날씨 데이터
    try {
      const weatherRes = await axios.get("/api/weather");
      if (weatherRes.data.success) {
        const { temperature, condition } = weatherRes.data.data;
        setWeather({
          temp: temperature,
          condition: condition,
        });
      }
    } catch (error) {
      console.error("날씨 데이터 로드 실패:", error);
      setWeather({ temp: "-", condition: "정보 없음" });
    }

    // 2. 통합 통계 데이터 (숫자 + 차트 + 테이블 데이터 모두 포함)
    try {
      const statsRes = await axios.get("/api/messages/stats/dashboard");
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error("통계 데이터 로드 실패:", error);
    }

    setLastUpdate(new Date().toLocaleString("ko-KR"));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardContainer>
      <UpdateSection>
        <LastUpdate>마지막 업데이트: {lastUpdate}</LastUpdate>
        <ActionButtons>
          <RefreshButton onClick={fetchData}>
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
          title="오늘 발송된 메시지"
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
          title={`현재 날씨 (${weather.condition})`}
          value={weather.temp}
          valueSuffix="°C"
          icon={getWeatherIcon(weather.condition)}
          iconColor="#f59e0b"
          bgColor="#fffbeb"
          isStatus={false}
        />
      </StatsGrid>

      <ChartSection>
        <MessageChart data={stats.chartData} />
      </ChartSection>

      <TablesSection>
        {/* ★★★ [수정] 백엔드에서 받은 실제 데이터를 전달합니다 ★★★ */}
        <RecentSendTable data={stats.recentSends} />
        <SystemAlertTable data={stats.systemAlerts} />
      </TablesSection>
    </DashboardContainer>
  );
}

export default Dashboard;
