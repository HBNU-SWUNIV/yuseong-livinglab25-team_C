import React from "react";
import styled from "styled-components";

const CardContainer = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

// ★★★ [수정] props 이름 앞에 $를 붙였습니다 (Transient Props) ★★★
const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* $bgColor로 받아서 사용 */
  background-color: ${(props) => props.$bgColor || "#eff6ff"};
  /* $iconColor로 받아서 사용 */
  color: ${(props) => props.$iconColor || "#3b82f6"};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Value = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;

  span {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    margin-left: 4px;
  }
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
`;

const ChangeBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  background-color: ${(props) => (props.$isPositive ? "#dcfce7" : "#fee2e2")};
  color: ${(props) => (props.$isPositive ? "#166534" : "#991b1b")};
`;

function StatCard({
  title,
  value,
  valueSuffix,
  icon: Icon,
  iconColor,
  bgColor,
  change,
  isPositive,
  isStatus = true,
}) {
  return (
    <CardContainer>
      <Header>
        {/* ★★★ [수정] HTML에 넘어가지 않도록 $를 붙여서 전달합니다 ★★★ */}
        <IconWrapper $bgColor={bgColor} $iconColor={iconColor}>
          {Icon && <Icon size={20} />}
        </IconWrapper>
        {isStatus && change && (
          <ChangeBadge $isPositive={isPositive}>
            {isPositive ? "+" : ""}
            {change}%
          </ChangeBadge>
        )}
      </Header>
      <Content>
        <Value>
          {value}
          {valueSuffix && <span>{valueSuffix}</span>}
        </Value>
        <Title>{title}</Title>
      </Content>
    </CardContainer>
  );
}

export default StatCard;
