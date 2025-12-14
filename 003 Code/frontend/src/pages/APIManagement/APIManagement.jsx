import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { RefreshCw, CloudRain, Wind, AlertCircle } from 'lucide-react';
import axios from 'axios';

/* ===================== 스타일 ===================== */

const PageContainer = styled.div`
  padding: 32px;
  padding-top: 16px;
  min-width: 0;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const LastUpdate = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
`;

const ColumnTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const DataCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
`;

const DataRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const DataLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const DataValue = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const EmptyStateContainer = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
`;

const EmptyState = ({ icon: Icon, message }) => (
  <EmptyStateContainer>
    <Icon size={32} />
    <p style={{ marginTop: 12 }}>{message}</p>
  </EmptyStateContainer>
);

/* ===================== 컴포넌트 ===================== */

function APIManagement() {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 데이터 상태
  const [weatherData, setWeatherData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [disasterData, setDisasterData] = useState(null);

  // 🔥 로딩 상태 분리 (핵심)
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingAir, setLoadingAir] = useState(true);
  const [loadingDisaster, setLoadingDisaster] = useState(true);

  /* ===================== API 호출 ===================== */

  const fetchWeather = async () => {
    try {
      const res = await axios.get('/api/weather', { timeout: 3000 });
      if (res.data?.success) {
        setWeatherData(res.data.data);
      }
    } catch (e) {
      console.warn('Weather fetch failed');
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchAirQuality = async () => {
    try {
      const res = await axios.get('/api/weather/air-quality');
      if (res.data?.success) {
        setAirQualityData(res.data.data);
      }
    } catch (e) {
      console.warn('Air quality fetch failed');
    } finally {
      setLoadingAir(false);
    }
  };

  const fetchDisaster = async () => {
    try {
      const res = await axios.get('/api/weather/disaster', { timeout: 3000 });
      if (res.data?.success) {
        setDisasterData(res.data.data);
      }
    } catch (e) {
      console.warn('Disaster fetch failed');
    } finally {
      setLoadingDisaster(false);
    }
  };

  const fetchAll = () => {
    setLoadingWeather(true);
    setLoadingAir(true);
    setLoadingDisaster(true);

    fetchWeather();
    fetchAirQuality();
    fetchDisaster();

    setLastUpdate(new Date());
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ===================== 렌더 ===================== */

  return (
    <PageContainer>
      <HeaderSection>
        <LastUpdate>
          마지막 업데이트: {lastUpdate.toLocaleString()}
        </LastUpdate>
        <RefreshButton onClick={fetchAll}>
          <RefreshCw size={16} />
          전체 새로고침
        </RefreshButton>
      </HeaderSection>

      <ContentContainer>
        {/* 🌤 날씨 */}
        <Column>
          <ColumnTitle>날씨 정보</ColumnTitle>
          {loadingWeather ? (
            <EmptyState icon={CloudRain} message="날씨 데이터를 불러오는 중..." />
          ) : weatherData ? (
            <DataCard>
              <DataRow><DataLabel>현재 기온</DataLabel><DataValue>{weatherData.temperature}°C</DataValue></DataRow>
              <DataRow><DataLabel>최저 / 최고</DataLabel><DataValue>{weatherData.minTemperature}°C / {weatherData.maxTemperature}°C</DataValue></DataRow>
              <DataRow><DataLabel>날씨</DataLabel><DataValue>{weatherData.condition}</DataValue></DataRow>
              <DataRow><DataLabel>강수 확률</DataLabel><DataValue>{weatherData.precipitationProbability}%</DataValue></DataRow>
            </DataCard>
          ) : (
            <EmptyState icon={CloudRain} message="날씨 데이터를 불러올 수 없습니다" />
          )}
        </Column>

{/* 💨 미세먼지 */}
<Column>
  <ColumnTitle>대기질 정보</ColumnTitle>

  {loadingAir ? (
    <EmptyState icon={Wind} message="대기질 데이터를 불러오는 중..." />
  ) : airQualityData && Object.keys(airQualityData).length > 0 ? (() => {
      // ✅ 첫 번째 측정소 선택
      const firstStation = Object.values(airQualityData)[0];
      const data = firstStation?.[0];

      if (!data) {
        return <EmptyState icon={Wind} message="대기질 데이터 없음" />;
      }

      return (
        <DataCard>
          <DataRow>
            <DataLabel>측정소</DataLabel>
            <DataValue>{data.stationName}</DataValue>
          </DataRow>

          <DataRow>
            <DataLabel>통합지수</DataLabel>
            <DataValue>
              {data.khaiValue ?? '-'} ({data.khaiGrade ?? '-'})
            </DataValue>
          </DataRow>

          <DataRow>
            <DataLabel>PM10</DataLabel>
            <DataValue>{data.pm10Value ?? '-'}</DataValue>
          </DataRow>

          <DataRow>
            <DataLabel>PM2.5</DataLabel>
            <DataValue>{data.pm25Value ?? '-'}</DataValue>
          </DataRow>
        </DataCard>
      );
    })()
  : (
    <EmptyState icon={Wind} message="대기질 데이터를 불러올 수 없습니다" />
  )}
</Column>


        {/* 🚨 재난 */}
        <Column>
          <ColumnTitle>재난 문자 현황</ColumnTitle>
          {loadingDisaster ? (
            <EmptyState icon={AlertCircle} message="재난 문자를 불러오는 중..." />
          ) : disasterData?.length > 0 ? (
            <DataCard>
              {disasterData.slice(0, 5).map((d, i) => (
                <DataRow key={i}>
                  <DataValue>{d.msg}</DataValue>
                </DataRow>
              ))}
            </DataCard>
          ) : (
            <EmptyState icon={AlertCircle} message="최근 재난 문자가 없습니다" />
          )}
        </Column>
      </ContentContainer>
    </PageContainer>
  );
}

export default APIManagement;
