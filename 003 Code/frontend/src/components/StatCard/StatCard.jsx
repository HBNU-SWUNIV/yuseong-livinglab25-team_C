import styled from 'styled-components';

const CardContainer = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const CardContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background-color: ${props => props.$bgColor || '#eff6ff'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$iconColor || '#2563eb'};
  flex-shrink: 0;
`;

const TextSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const CardTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
`;

const CardValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${props => props.$isStatus ? '#10b981' : '#1a1a1a'};
  line-height: 1.2;
  white-space: nowrap;
  flex-shrink: 0;
`;

const CardChange = styled.div`
  font-size: 13px;
  color: ${props => props.$isPositive ? '#10b981' : '#ef4444'};
  font-weight: 500;
`;

function StatCard({ title, value, valueSuffix, change, icon: Icon, iconColor, bgColor, isPositive, isStatus }) {
  const displayValue = isStatus 
    ? value 
    : typeof value === 'number' 
      ? value.toLocaleString() 
      : value;
  
  return (
    <CardContainer>
      <CardContent>
        {Icon && (
          <IconWrapper $bgColor={bgColor} $iconColor={iconColor}>
            <Icon size={24} />
          </IconWrapper>
        )}
        <TextSection>
          <CardTitle>{title}</CardTitle>
          <CardValue $isStatus={isStatus}>
            {displayValue}{valueSuffix || ''}
          </CardValue>
          {change && (
            <CardChange $isPositive={isPositive}>
              {isPositive ? '↑' : '↓'} {change}
            </CardChange>
          )}
        </TextSection>
      </CardContent>
    </CardContainer>
  );
}

export default StatCard;

