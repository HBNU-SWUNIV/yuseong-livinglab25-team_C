import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const ChartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 16px 0;
`;

// 최근 7일 더미 데이터
const generateChartData = () => {
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const today = new Date();
  
  return days.map((day, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));
    return {
      name: day,
      발송: Math.floor(Math.random() * 500) + 200,
      성공: Math.floor(Math.random() * 450) + 180,
      실패: Math.floor(Math.random() * 50) + 10,
    };
  });
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {payload.map((entry, index) => (
          <p key={index} style={{ 
            margin: '4px 0',
            color: entry.color,
            fontSize: '14px',
            fontWeight: 500
          }}>
            {entry.name}: {entry.value.toLocaleString()}건
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function MessageChart() {
  const data = generateChartData();

  return (
    <ChartContainer>
      <ChartTitle>문자 발송 추이</ChartTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="발송" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={{ fill: '#2563eb', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="성공" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="실패" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export default MessageChart;

