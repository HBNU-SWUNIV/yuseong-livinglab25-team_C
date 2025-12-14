import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

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

          {loadingWeather && <p>⏳ 불러오는 중...</p>}

          {!loadingWeather && errorWeather && <p> 날씨 데이터를 불러올 수 없습니다.</p>}

          {!loadingWeather && !errorWeather && weather && (
            <>
              <p><strong>현재기온:</strong> {weather.temperature}°C</p>
              <p><strong>최저기온:</strong> {weather.minTemperature}°C</p>
              <p><strong>최고기온:</strong> {weather.maxTemperature}°C</p>
              <p><strong>하늘 상태:</strong> {weather.condition}</p>
              <p><strong>강수 확률:</strong> {weather.precipitationProbability}%</p>
            </>
          )}
        </Card>

        {/* 대기질 */}
<Card>
  <h2>💨 대기질 정보</h2>

  {loadingAir && <p>⏳ 불러오는 중...</p>}

  {!loadingAir && errorAir && <p> 대기질 데이터를 불러올 수 없습니다.</p>}

  {!loadingAir && !errorAir && air && (
    <>
      {Object.keys(air).length === 0 ? (
        <p>데이터 없음</p>
      ) : (
        Object.entries(air).map(([station, list], idx) => {

          // 🛡 안전 처리
          if (!Array.isArray(list) || list.length === 0) {
            return (
              <div key={idx} style={{ marginBottom: "1rem" }}>
                <h3>📍 {station}</h3>
                <p>측정 데이터 없음</p>
              </div>
            );
          }

          const data = list?.[0]; // 가장 최근 데이터 1개 (null-safe)

          return (
            <div key={idx} style={{ marginBottom: "1rem" }}>
              <h3>📍 {station}</h3>

              <p><strong>PM10:</strong> {data.pm10 ?? "N/A"}</p>
              <p><strong>PM2.5:</strong> {data.pm25 ?? "N/A"}</p>
              <p><strong>오존(O₃):</strong> {data.o3 ?? "N/A"}</p>
              <p><strong>이산화질소(NO₂):</strong> {data.no2 ?? "N/A"}</p>
              <p><strong>아황산가스(SO₂):</strong> {data.so2 ?? "N/A"}</p>
              <p><strong>일산화탄소(CO):</strong> {data.co ?? "N/A"}</p>

              <p><strong>통합지수:</strong> {data.khaiValue ?? "N/A"}</p>
              <p><strong>지수 등급:</strong> {data.khaiGrade ?? "N/A"}</p>

              <p><small>{data.time}</small></p>
            </div>
          );
        })
      )}
    </>
  )}
</Card>


        {/* 재난 */}
        <Card>
          <h2>🚨 재난 문자</h2>

          {loadingDisaster && <p>⏳ 불러오는 중...</p>}

          {!loadingDisaster && errorDisaster && <p>❌ 재난 정보를 불러올 수 없습니다.</p>}

          {!loadingDisaster && !errorDisaster && disaster && disaster.length > 0 && (
            <>
              <p><strong>최근 알림 수:</strong> {disaster.length}</p>
              <ul>
                {disaster.slice(0, 3).map((d, i) => (
                  <li key={i}>[{d.create_date}] {d.msg}</li>
                ))}
              </ul>
            </>
          )}

          {!loadingDisaster && !errorDisaster && disaster?.length === 0 && (
            <p>최근 재난 문자 없음</p>
          )}
        </Card>

      </CardContainer>
    </Container>
  );
};

export default ApiDashboard;

// 스타일
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
`;
