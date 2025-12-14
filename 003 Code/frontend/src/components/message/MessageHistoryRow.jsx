import React from 'react';
import styled from 'styled-components';
import Checkbox from '../common/Checkbox';
import Badge from '../Badge/Badge';

const TableRow = styled.tr`
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
  background-color: ${props => props.selected ? '#eff6ff' : '#ffffff'};
  
  &:hover {
    background-color: ${props => props.selected ? '#dbeafe' : '#f9fafb'};
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  background-color: ${props => {
    if (props.status === '발송 완료') return '#d1fae5';
    if (props.status === '발송 실패') return '#fee2e2';
    if (props.status === '대기중') return '#fef3c7';
    return '#e5e7eb';
  }};
  color: ${props => {
    if (props.status === '발송 완료') return '#065f46';
    if (props.status === '발송 실패') return '#991b1b';
    if (props.status === '대기중') return '#92400e';
    return '#374151';
  }};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    if (props.status === '발송 완료') return '#10b981';
    if (props.status === '발송 실패') return '#ef4444';
    if (props.status === '대기중') return '#f59e0b';
    return '#6b7280';
  }};
  flex-shrink: 0;
`;

const getMessageTypeVariant = (type) => {
  switch (type) {
    case '일일 날씨':
      return 'info';
    case '긴급 알림':
      return 'error';
    case '복지 알림':
      return 'info';
    case '맞춤 알림':
      return 'warning';
    case '일반 메시지':
      return 'success';
    default:
      return 'info';
  }
};

function MessageHistoryRow({ message, isSelected, onSelect }) {
  return (
    <TableRow selected={isSelected}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(message.id, e.target.checked)}
        />
      </TableCell>
      <TableCell>{message.no}</TableCell>
      <TableCell>
        <Badge $variant={getMessageTypeVariant(message.messageType)}>
          {message.messageType}
        </Badge>
      </TableCell>
      <TableCell>
        <StatusBadge status={message.status}>
          <StatusDot status={message.status} />
          {message.status}
        </StatusBadge>
      </TableCell>
      <TableCell>{message.title}</TableCell>
      <TableCell>{message.startDate}</TableCell>
      <TableCell>{message.endDate}</TableCell>
    </TableRow>
  );
}

export default MessageHistoryRow;

