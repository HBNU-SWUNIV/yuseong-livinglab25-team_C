import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { RefreshCw, CloudRain, Wind, AlertCircle, Sun, Cloud } from 'lucide-react';
import axios from 'axios';

const PageContainer = styled.div`
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
`;

const LastUpdate = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
    transition: transform 0.5s ease;
  }
  
  &:hover:not(:disabled) svg {
    transform: rotate(180deg);
  }
`;

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  flex: 1;
  height: calc(100vh - 90px);
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  
  &:last-child {
    border-right: none;
  }
  
  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    min-height: 400px;
    
    &:last-child {
      border-bottom: none;
    }
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
`;

const CardIcon = styled.div`
  font-size: 24px;
  line-height: 1;
`;

const CardTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
`;

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 1rem 0;
`;

// 날씨 카드 스타일
const WeatherMainStatus = styled.div`
  text-align: center;
  padding: 16px 0;
  margin-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
`;

const WeatherCondition = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  svg {
    width: 32px;
    height: 32px;
  }
`;

const WeatherGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

const WeatherItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 6px;
`;

const WeatherLabel = styled.span`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`;

const WeatherValue = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
`;

// 대기질 카드 스타일
const DistrictContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DistrictBox = styled.div`
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const DistrictHeader = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
`;

const AirQualityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const AirQualityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid ${props => {
    const grade = props.$grade;
    if (grade === '좋음') return '#10b981';
    if (grade === '보통') return '#3b82f6';
    if (grade === '나쁨') return '#f59e0b';
    if (grade === '매우나쁨') return '#ef4444';
    return '#9ca3af';
  }};
`;

const AirItemLabel = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`;

const AirItemValue = styled.div`
  text-align: right;
`;

const AirValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
`;

const AirGrade = styled.div`
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
  color: ${props => {
    const grade = props.$grade;
    if (grade === '좋음') return '#10b981';
    if (grade === '보통') return '#3b82f6';
    if (grade === '나쁨') return '#f59e0b';
    if (grade === '매우나쁨') return '#ef4444';
    return '#9ca3af';
  }};
`;

// 재난 문자 스타일
const DisasterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DisasterBox = styled.div`
  padding: 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
`;

const DisasterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #fecaca;
`;

const DisasterType = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #991b1b;
`;

const DisasterRegion = styled.div`
  font-size: 12px;
  color: #991b1b;
  font-weight: 600;
`;

const DisasterTime = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const DisasterContent = styled.div`
  font-size: 13px;
  color: #1a1a1a;
  line-height: 1.5;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 3rem 1rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
`;

const EmptyMessage = styled.p`
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
`;

const EmptyState = ({ icon, message }) => {
  return (
    <EmptyStateContainer>
      <EmptyIcon>{icon}</EmptyIcon>
      <EmptyMessage>{message}</EmptyMessage>
    </EmptyStateContainer>
  );
};

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 3rem;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function APIManagement() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [disasterData, setDisasterData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 데이터 가져오기
  const fetchData = async () => {
    setLoading(true);
    try {
      const [weatherRes, airQualityRes, disasterRes] = await Promise.allSettled([
        axios.get('http://localhost:3001/api/weather'),
        axios.get('http://localhost:3001/api/weather/air-quality'),
        axios.get('http://localhost:3001/api/weather/disaster'),
      ]);

      if (weatherRes.status === 'fulfilled' && weatherRes.value.data.success) {
        setWeatherData(weatherRes.value.data.data);
      }
      if (airQualityRes.status === 'fulfilled' && airQualityRes.value.data.success) {
        setAirQualityData(airQualityRes.value.data.data);
      }
      if (disasterRes.status === 'fulfilled' && disasterRes.value.data.success) {
        setDisasterData(disasterRes.value.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch API data:', error);
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 날짜 포맷팅 함수
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekday = weekdays[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day}. ${weekday} ${hours}:${minutes}`;
  };

  // 전체 새로고침 핸들러
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData().finally(() => setIsRefreshing(false));
  };

  return (
    <PageContainer>
      <HeaderSection>
        <LastUpdate>
          마지막 업데이트: {formatDateTime(lastUpdate)}
        </LastUpdate>
        <RefreshButton onClick={handleRefresh} disabled={isRefreshing || loading}>
          <RefreshCw size={18} />
          전체 새로고침
        </RefreshButton>
      </HeaderSection>

      <CardsContainer>
        {/* 날씨 정보 카드 */}
        <Card>
          <CardHeader>
            <CardIcon>☁️</CardIcon>
            <CardTitle>날씨 정보</CardTitle>
          </CardHeader>
          <Divider />
          
          {loading ? (
            <LoadingSpinner />
          ) : weatherData ? (
            <>
              <WeatherMainStatus>
                <WeatherCondition>
                  {weatherData.condition?.includes('맑') ? <Sun /> : <Cloud />}
                  {weatherData.condition || '정보없음'}
                </WeatherCondition>
              </WeatherMainStatus>
              
              <WeatherGrid>
                <WeatherItem>
                  <WeatherLabel>기온</WeatherLabel>
                  <WeatherValue>{weatherData.temperature}℃</WeatherValue>
                </WeatherItem>
                <WeatherItem>
                  <WeatherLabel>체감온도</WeatherLabel>
                  <WeatherValue>{weatherData.feelsLike || weatherData.temperature}℃</WeatherValue>
                </WeatherItem>
                <WeatherItem>
                  <WeatherLabel>습도</WeatherLabel>
                  <WeatherValue>{weatherData.humidity}%</WeatherValue>
                </WeatherItem>
                <WeatherItem>
                  <WeatherLabel>풍속</WeatherLabel>
                  <WeatherValue>{weatherData.windSpeed} m/s</WeatherValue>
                </WeatherItem>
                <WeatherItem>
                  <WeatherLabel>최저 기온</WeatherLabel>
                  <WeatherValue>{weatherData.minTemperature}℃</WeatherValue>
                </WeatherItem>
                <WeatherItem>
                  <WeatherLabel>최고 기온</WeatherLabel>
                  <WeatherValue>{weatherData.maxTemperature}℃</WeatherValue>
                </WeatherItem>
              </WeatherGrid>
            </>
          ) : (
            <EmptyState icon="☁️" message="날씨 데이터를 불러올 수 없습니다" />
          )}
        </Card>

        {/* 대기질 정보 카드 */}
        <Card>
          <CardHeader>
            <CardIcon>🌫</CardIcon>
            <CardTitle>대기질 정보</CardTitle>
          </CardHeader>
          <Divider />
          
          {loading ? (
            <LoadingSpinner />
          ) : airQualityData ? (
            <DistrictContainer>
              <DistrictBox>
                <DistrictHeader>{airQualityData.stationName || '유성구'}</DistrictHeader>
                <AirQualityGrid>
                  <AirQualityItem $grade={airQualityData.pm10Grade}>
                    <AirItemLabel>PM10</AirItemLabel>
                    <AirItemValue>
                      <AirValue>{airQualityData.pm10Value}</AirValue>
                      <AirGrade $grade={airQualityData.pm10Grade}>
                        {airQualityData.pm10Grade || '-'}
                      </AirGrade>
                    </AirItemValue>
                  </AirQualityItem>
                  
                  <AirQualityItem $grade={airQualityData.pm25Grade}>
                    <AirItemLabel>PM2.5</AirItemLabel>
                    <AirItemValue>
                      <AirValue>{airQualityData.pm25Value}</AirValue>
                      <AirGrade $grade={airQualityData.pm25Grade}>
                        {airQualityData.pm25Grade || '-'}
                      </AirGrade>
                    </AirItemValue>
                  </AirQualityItem>
                  
                  <AirQualityItem>
                    <AirItemLabel>통합지수</AirItemLabel>
                    <AirItemValue>
                      <AirValue>{airQualityData.khaiValue}</AirValue>
                      <AirGrade $grade={airQualityData.khaiGrade}>
                        {airQualityData.khaiGrade || '-'}
                      </AirGrade>
                    </AirItemValue>
                  </AirQualityItem>
                  
                  <AirQualityItem>
                    <AirItemLabel>오존(O₃)</AirItemLabel>
                    <AirItemValue>
                      <AirValue>{airQualityData.o3Value}</AirValue>
                      <AirGrade>ppm</AirGrade>
                    </AirItemValue>
                  </AirQualityItem>
                </AirQualityGrid>
              </DistrictBox>
            </DistrictContainer>
          ) : (
            <EmptyState icon="💨" message="대기질 데이터를 불러올 수 없습니다" />
          )}
        </Card>

        {/* 재난 정보 카드 */}
        <Card>
          <CardHeader>
            <CardIcon>🚨</CardIcon>
            <CardTitle>재난 정보</CardTitle>
          </CardHeader>
          <Divider />
          
          {loading ? (
            <LoadingSpinner />
          ) : disasterData && disasterData.length > 0 ? (
            <DisasterContainer>
              {disasterData.slice(0, 3).map((disaster, index) => (
                <DisasterBox key={index}>
                  <DisasterHeader>
                    <DisasterType>{disaster.disaster_type || '재난'}</DisasterType>
                    <DisasterRegion>{disaster.location_name || '대전 유성구'}</DisasterRegion>
                  </DisasterHeader>
                  <DisasterTime>발생 시각: {disaster.create_date}</DisasterTime>
                  <DisasterContent>{disaster.msg}</DisasterContent>
                </DisasterBox>
              ))}
            </DisasterContainer>
          ) : (
            <EmptyState icon="✅" message="현재 발생한 재난 정보가 없습니다" />
          )}
        </Card>
      </CardsContainer>
    </PageContainer>
  );
}

export default APIManagement;
