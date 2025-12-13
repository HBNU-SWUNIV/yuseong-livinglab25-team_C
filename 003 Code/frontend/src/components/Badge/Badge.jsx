import styled from 'styled-components';

const BadgeContainer = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
`;

const Badge = styled(BadgeContainer)`
  background-color: ${props => {
    if (props.variant === 'success') return '#d1fae5';
    if (props.variant === 'error') return '#fee2e2';
    if (props.variant === 'info') return '#dbeafe';
    if (props.variant === 'warning') return '#fed7aa';
    if (props.variant === 'notice') return '#f3f4f6';
    return '#eff6ff';
  }};
  color: ${props => {
    if (props.variant === 'success') return '#065f46';
    if (props.variant === 'error') return '#991b1b';
    if (props.variant === 'info') return '#1e40af';
    if (props.variant === 'warning') return '#9a3412';
    if (props.variant === 'notice') return '#374151';
    return '#2563eb';
  }};
`;

export default Badge;





