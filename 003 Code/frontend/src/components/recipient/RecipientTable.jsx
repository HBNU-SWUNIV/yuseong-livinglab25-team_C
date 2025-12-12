import React from 'react';
import styled from 'styled-components';
import Checkbox from '../common/Checkbox';
import RecipientRow from './RecipientRow';
import RefreshButton from '../common/RefreshButton';

const TableContainer = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #ffffff;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const CountInfo = styled.div`
  font-size: 14px;
  color: #6b7280;
  
  .selected {
    color: #2563eb;
    font-weight: 600;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
`;

const TableHead = styled.thead`
  background-color: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
`;

const TableBody = styled.tbody``;

function RecipientTable({ 
  recipients, 
  selectedIds, 
  onSelectAll, 
  onSelectOne,
  isAllSelected,
  isIndeterminate,
  totalCount,
  selectedCount,
  onRefresh
}) {
  return (
    <TableContainer>
      <TableHeader>
        <HeaderLeft>
          <CountInfo>
            전체 <strong>{totalCount.toLocaleString()}</strong>명
            {selectedCount > 0 && (
              <>
                {' / '}
                <span className="selected">선택됨 {selectedCount.toLocaleString()}명</span>
              </>
            )}
          </CountInfo>
        </HeaderLeft>
        <RefreshButton onRefresh={onRefresh} />
      </TableHeader>
      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </TableHeaderCell>
              <TableHeaderCell>No.</TableHeaderCell>
              <TableHeaderCell>발송 상태</TableHeaderCell>
              <TableHeaderCell>성명</TableHeaderCell>
              <TableHeaderCell>생년월일</TableHeaderCell>
              <TableHeaderCell>휴대폰 번호</TableHeaderCell>
              <TableHeaderCell>주소</TableHeaderCell>
              <TableHeaderCell>메시지 수신 동의</TableHeaderCell>
              <TableHeaderCell>메시지 타입</TableHeaderCell>
              <TableHeaderCell>최근 발송일</TableHeaderCell>
              <TableHeaderCell>등록일</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {recipients.map((recipient) => (
              <RecipientRow
                key={recipient.id}
                recipient={recipient}
                isSelected={selectedIds.includes(recipient.id)}
                onSelect={onSelectOne}
              />
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </TableContainer>
  );
}

export default RecipientTable;

