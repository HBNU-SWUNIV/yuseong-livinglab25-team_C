import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

const ApiDashboard = () => {
  const [weather, setWeather] = useState(null);
  const [air, setAir] = useState(null);
  const [disaster, setDisaster] = useState(null);
  const [loading, setLoading] = useState(true);

  // 여러 API 한번에 호출
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weatherRes, airRes, disasterRes] = await Promise.all([
          axios.get("/api/weather"),
          axios.get("/api/dashboard/air-quality"),
          axios.get("/api/dashboard/disaster"),
        ]);

        setWeather(weatherRes.data.data);
        setAir(airRes.data.data);
        setDisaster(disasterRes.data.data);
      } catch (err) {
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loading>⏳ 데이터를 불러오는 중...</Loading>;

  return (
    <Container>
      <Title>📊 유성안심문자 API 현황판</Title>
      <CardContainer>
        <Card>
          <h2>🌤 날씨 정보</h2>
          {weather ? (
            <>
            <p><strong>현재기온:</strong> {weather.temperature}°C</p>
            <p><strong>최저기온:</strong> {weather.minTemperature}°C</p>
            <p><strong>최고기온:</strong> {weather.maxTemperature}°C</p>
            <p><strong>하늘 상태:</strong> {weather.sky}</p>
            <p><strong>강수 형태:</strong> {weather.precipitationType}</p>
            <p><strong>강수 확률:</strong> {weather.precipitationProbability}%</p>
            <p><strong>갱신 시각:</strong> {new Date(weather.fetchedAt).toLocaleString()}</p>
            {weather.note && <p>💡 {weather.note}</p>}
              
            </>
          ) : (
            <p>❌ 날씨 데이터를 불러올 수 없습니다.</p>
          )}
        </Card>

        <Card>
          <h2>💨 대기질 정보</h2>
          {air ? (
            <>
              <p><strong>미세먼지(PM10):</strong> {air.pm10} ㎍/㎥</p>
              <p><strong>초미세먼지(PM2.5):</strong> {air.pm25} ㎍/㎥</p>
              <p><strong>통합지수:</strong> {air.grade}</p>
              <p><strong>갱신 시간:</strong> {air.updatedAt}</p>
            </>
          ) : (
            <p>❌ 대기질 데이터를 불러올 수 없습니다.</p>
          )}
        </Card>

        <Card>
          <h2>🚨 재난 문자 현황</h2>
          {disaster && disaster.length > 0 ? (
            <>
              <p><strong>최근 알림 수:</strong> {disaster.length}건</p>
              <ul>
                {disaster.slice(0, 3).map((d, idx) => (
                  <li key={idx}>
                    [{d.create_date}] {d.msg}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>❌ 최근 재난 문자 없음</p>
          )}
        </Card>
      </CardContainer>
    </Container>
  );
};

export default ApiDashboard;

// 스타일 구성
const Container = styled.div`
  padding: 2rem;
  background-color: #f6f8fa;
  min-height: 100vh;
`;

const Title = styled.h1`
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 2rem;
`;

const CardContainer = styled.div`
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  h2 {
    margin-bottom: 1rem;
  }
  p, li {
    margin: 0.3rem 0;
    font-size: 0.95rem;
  }
  ul {
    padding-left: 1rem;
  }
`;

const Loading = styled.div`
  text-align: center;
  margin-top: 5rem;
  font-size: 1.2rem;
  color: #555;
`;
