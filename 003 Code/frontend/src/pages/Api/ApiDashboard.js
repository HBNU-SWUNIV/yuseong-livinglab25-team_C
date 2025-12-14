import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

// Empty State 컴포넌트
const EmptyState = ({ icon, message }) => (
  <EmptyStateContainer>
    <EmptyIcon>{icon}</EmptyIcon>
    <EmptyMessage>{message}</EmptyMessage>
  </EmptyStateContainer>
);

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
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
`;

const ApiDashboard = () => {
  // 데이터 상태
  const [weather, setWeather] = useState(null);
  const [air, setAir] = useState(null);
  const [disaster, setDisaster] = useState(null);

  // 개별 로딩 상태
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingAir, setLoadingAir] = useState(true);
  const [loadingDisaster, setLoadingDisaster] = useState(true);

  // 개별 에러 상태
  const [errorWeather, setErrorWeather] = useState(false);
  const [errorAir, setErrorAir] = useState(false);
  const [errorDisaster, setErrorDisaster] = useState(false);

  useEffect(() => {

    // 날씨 API
    axios.get("/api/weather")
      .then(res => setWeather(res.data.data))
      .catch(() => setErrorWeather(true))
      .finally(() => setLoadingWeather(false));

    // 미세먼지 API
    axios.get("/api/weather/air-quality")
      .then(res => setAir(res.data.data))
      .catch(() => setErrorAir(true))
      .finally(() => setLoadingAir(false));

    // 재난 API
    axios.get("/api/weather/disaster")
      .then(res => setDisaster(res.data.data))
      .catch(() => setErrorDisaster(true))
      .finally(() => setLoadingDisaster(false));

  }, []);

  return (
    <Container>
      <Title>📊 유성안심문자 API 현황판</Title>

      <CardContainer>

        {/* 날씨 */}
        <Card>
          <h2>🌤 날씨 정보</h2>

          {loadingWeather && <EmptyState icon="⏳" message="불러오는 중..." />}

          {!loadingWeather && errorWeather && <EmptyState icon="☁️" message="날씨 데이터를 불러올 수 없습니다" />}

          {!loadingWeather && !errorWeather && weather && (
            <DataContainer>
              <DataItem>
                <DataLabel>현재기온</DataLabel>
                <DataValue>{weather.temperature}°C</DataValue>
              </DataItem>
              <DataItem>
                <DataLabel>최저기온</DataLabel>
                <DataValue>{weather.minTemperature}°C</DataValue>
              </DataItem>
              <DataItem>
                <DataLabel>최고기온</DataLabel>
                <DataValue>{weather.maxTemperature}°C</DataValue>
              </DataItem>
              <DataItem>
                <DataLabel>하늘 상태</DataLabel>
                <DataValue>{weather.condition}</DataValue>
              </DataItem>
              <DataItem>
                <DataLabel>강수 확률</DataLabel>
                <DataValue>{weather.precipitationProbability}%</DataValue>
              </DataItem>
            </DataContainer>
          )}
        </Card>

        {/* 대기질 */}
        <Card>
          <h2>💨 대기질 정보</h2>

          {loadingAir && <EmptyState icon="⏳" message="불러오는 중..." />}

          {!loadingAir && errorAir && <EmptyState icon="💨" message="대기질 데이터를 불러올 수 없습니다" />}

          {!loadingAir && !errorAir && air && (
            <>
              {Object.keys(air).length === 0 ? (
                <EmptyState icon="💨" message="데이터 없음" />
              ) : (
                Object.entries(air).map(([station, list], idx) => {
                  if (!Array.isArray(list) || list.length === 0) {
                    return (
                      <StationSection key={idx}>
                        <h3>📍 {station}</h3>
                        <EmptyMessage>측정 데이터 없음</EmptyMessage>
                      </StationSection>
                    );
                  }

                  const data = list?.[0];

                  return (
                    <StationSection key={idx}>
                      <h3>📍 {station}</h3>
                      <DataContainer>
                        <DataItem>
                          <DataLabel>PM10</DataLabel>
                          <DataValue>{data.pm10 ?? "N/A"}</DataValue>
                        </DataItem>
                        <DataItem>
                          <DataLabel>PM2.5</DataLabel>
                          <DataValue>{data.pm25 ?? "N/A"}</DataValue>
                        </DataItem>
                        <DataItem>
                          <DataLabel>오존(O₃)</DataLabel>
                          <DataValue>{data.o3 ?? "N/A"}</DataValue>
                        </DataItem>
                        <DataItem>
                          <DataLabel>통합지수</DataLabel>
                          <DataValue>{data.khaiValue ?? "N/A"}</DataValue>
                        </DataItem>
                        <DataItem>
                          <DataLabel>지수 등급</DataLabel>
                          <DataValue>{data.khaiGrade ?? "N/A"}</DataValue>
                        </DataItem>
                      </DataContainer>
                      {data.time && <TimeStamp>{data.time}</TimeStamp>}
                    </StationSection>
                  );
                })
              )}
            </>
          )}
        </Card>


        {/* 재난 */}
        <Card>
          <h2>🚨 재난 문자 현황</h2>

          {loadingDisaster && <EmptyState icon="⏳" message="불러오는 중..." />}

          {!loadingDisaster && errorDisaster && <EmptyState icon="🚨" message="재난 정보를 불러올 수 없습니다" />}

          {!loadingDisaster && !errorDisaster && disaster && disaster.length > 0 && (
            <>
              <DisasterCount>최근 알림 수: <strong>{disaster.length}건</strong></DisasterCount>
              <DisasterList>
                {disaster.slice(0, 5).map((d, i) => (
                  <DisasterItem key={i}>
                    <DisasterDate>[{d.create_date}]</DisasterDate>
                    <DisasterMessage>{d.msg}</DisasterMessage>
                  </DisasterItem>
                ))}
              </DisasterList>
            </>
          )}

          {!loadingDisaster && !errorDisaster && disaster?.length === 0 && (
            <EmptyState icon="✅" message="현재 발생한 재난 정보가 없습니다" />
          )}
        </Card>

      </CardContainer>
    </Container>
  );
};

export default ApiDashboard;

// 스타일
const Container = styled.div`
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 1.5rem;
  margin: 0;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
`;

const CardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  flex: 1;
  height: calc(100vh - 80px);
  
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
  
  h2 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 1.5rem 0;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e5e7eb;
    color: #1a1a1a;
  }
  
  p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
    line-height: 1.6;
  }
  
  h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-top: 1rem;
    color: #374151;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
  }
  
  li {
    padding: 0.75rem;
    margin: 0.5rem 0;
    background: #f9fafb;
    border-radius: 6px;
    font-size: 0.85rem;
    line-height: 1.5;
  }
`;

// 데이터 표시 컴포넌트
const DataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const DataItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: background 0.2s;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const DataLabel = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
`;

const DataValue = styled.span`
  color: #1a1a1a;
  font-size: 1rem;
  font-weight: 700;
`;

// 대기질 섹션
const StationSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TimeStamp = styled.div`
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: right;
`;

// 재난 문자
const DisasterCount = styled.div`
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: #991b1b;
  font-size: 0.95rem;
  
  strong {
    font-weight: 700;
  }
`;

const DisasterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DisasterItem = styled.div`
  padding: 1rem;
  background: #fef2f2;
  border-left: 3px solid #ef4444;
  border-radius: 6px;
`;

const DisasterDate = styled.div`
  font-size: 0.75rem;
  color: #991b1b;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const DisasterMessage = styled.div`
  font-size: 0.875rem;
  color: #1a1a1a;
  line-height: 1.5;
`;
