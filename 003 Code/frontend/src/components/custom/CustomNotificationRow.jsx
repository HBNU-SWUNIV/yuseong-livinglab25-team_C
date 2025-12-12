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
    if (props.status === 'success') return '#d1fae5';
    if (props.status === 'failed') return '#fee2e2';
    if (props.status === 'pending') return '#fef3c7';
    return '#e5e7eb';
  }};
  color: ${props => {
    if (props.status === 'success') return '#065f46';
    if (props.status === 'failed') return '#991b1b';
    if (props.status === 'pending') return '#92400e';
    return '#374151';
  }};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    if (props.status === 'success') return '#10b981';
    if (props.status === 'failed') return '#ef4444';
    if (props.status === 'pending') return '#f59e0b';
    return '#6b7280';
  }};
  flex-shrink: 0;
`;

const getStatusLabel = (status) => {
  switch (status) {
    case 'success':
      return '발송 완료';
    case 'failed':
      return '발송 실패';
    case 'pending':
      return '대기중';
    default:
      return '알 수 없음';
  }
};

const getMessageTypeVariant = (type) => {
  switch (type) {
    case '복지 알림':
      return 'info';
    case '긴급 알림':
      return 'error';
    case '일반 메시지':
      return 'success';
    case '맞춤 알림':
      return 'info';
    default:
      return 'info';
  }
};

function CustomNotificationRow({ recipient, isSelected, onSelect }) {
  return (
    <TableRow selected={isSelected}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(recipient.id, e.target.checked)}
        />
      </TableCell>
      <TableCell>{recipient.no}</TableCell>
      <TableCell>
        <StatusBadge status={recipient.sendStatus}>
          <StatusDot status={recipient.sendStatus} />
          {getStatusLabel(recipient.sendStatus)}
        </StatusBadge>
      </TableCell>
      <TableCell>{recipient.name}</TableCell>
      <TableCell>{recipient.birthDate}</TableCell>
      <TableCell>{recipient.phone}</TableCell>
      <TableCell>{recipient.address}</TableCell>
      <TableCell>{recipient.consent ? '동의' : '비동의'}</TableCell>
      <TableCell>
        <Badge variant={getMessageTypeVariant(recipient.messageType)}>
          {recipient.messageType}
        </Badge>
      </TableCell>
      <TableCell>{recipient.lastSentDate || '-'}</TableCell>
      <TableCell>{recipient.registeredDate}</TableCell>
    </TableRow>
  );
}

export default CustomNotificationRow;

