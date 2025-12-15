import React from "react";
import styled from "styled-components";
import Checkbox from "../common/Checkbox";
import { RefreshCw, Clock, Send } from "lucide-react";

const TableContainer = styled.div`
  background-color: #ffffff;
  border-radius: 8px; /* 둥글기 축소 */
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px; /* 헤더 여백 축소 */
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h2`
  font-size: 14px; /* 폰트 축소 */
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CountBadge = styled.span`
  background-color: #f3f4f6;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px; /* 폰트 축소 */
  font-weight: 500;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background-color: transparent;
  color: #6b7280;
  font-size: 12px; /* 폰트 축소 */
  cursor: pointer;

  &:hover {
    color: #1a1a1a;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`;

// ★★★ [줌아웃 핵심] 패딩과 폰트 사이즈 대폭 축소 ★★★
const Th = styled.th`
  padding: 8px 12px;
  background-color: #f9fafb;
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: 13px; /* 본문 폰트 13px로 축소 */
  vertical-align: middle;
`;

const Tr = styled.tr`
  height: 40px; /* 행 높이 고정 */
  &:hover {
    background-color: #f9fafb;
  }
  &:last-child ${Td} {
    border-bottom: none;
  }
`;

// 배지 크기도 슬림하게 조정
const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;

  ${(props) => {
    switch (props.type) {
      case "긴급 알림":
        return `background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;`;
      case "일일 날씨":
        return `background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;`;
      case "복지 알림":
        return `background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;`;
      default:
        return `background-color: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb;`;
    }
  }}
`;

const MethodBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${(props) => (props.method === "예약 발송" ? "#7e22ce" : "#374151")};
  font-weight: ${(props) => (props.method === "예약 발송" ? "600" : "400")};
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;

  ${(props) => {
    switch (props.status) {
      case "발송 완료":
        return `background-color: #dcfce7; color: #166534;`;
      case "발송 실패":
        return `background-color: #fee2e2; color: #991b1b;`;
      case "발송중":
        return `background-color: #dbeafe; color: #1e40af;`;
      case "대기중":
        return `background-color: #fff7ed; color: #c2410c;`;
      case "취소됨":
        return `background-color: #f1f5f9; color: #64748b; text-decoration: line-through;`;
      default:
        return `background-color: #f3f4f6; color: #374151;`;
    }
  }}
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #9ca3af;
  font-size: 13px;
`;

function MessageHistoryTable({
  messages,
  selectedIds,
  onSelectAll,
  onSelectOne,
  isAllSelected,
  isIndeterminate,
  totalCount,
  selectedCount,
  onRefresh,
}) {
  return (
    <TableContainer>
      <TableHeader>
        <Title>
          발송 이력 <CountBadge>{totalCount}</CountBadge>
          {selectedCount > 0 && (
            <span
              style={{ fontSize: "12px", marginLeft: "8px", color: "#2563eb" }}
            >
              {selectedCount}개 선택됨
            </span>
          )}
        </Title>
        <RefreshButton onClick={onRefresh}>
          <RefreshCw size={12} />
          <span>새로고침</span>
        </RefreshButton>
      </TableHeader>

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th style={{ width: "32px" }}>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </Th>
              <Th>No</Th>
              <Th>메시지 유형</Th>
              <Th>제목</Th>
              <Th>발송 방식</Th>
              <Th>수신 대상</Th>
              <Th>상태</Th>
              <Th>등록일시</Th>
              <Th>발송(예정)일시</Th>
            </tr>
          </thead>
          <tbody>
            {messages.length > 0 ? (
              messages.map((message) => (
                <Tr key={message.id}>
                  <Td>
                    <Checkbox
                      checked={selectedIds.includes(message.id)}
                      onChange={(e) =>
                        onSelectOne(message.id, e.target.checked)
                      }
                    />
                  </Td>
                  <Td>{message.no}</Td>
                  <Td>
                    <TypeBadge type={message.messageType}>
                      {message.messageType}
                    </TypeBadge>
                  </Td>
                  <Td
                    style={{
                      fontWeight: 500,
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {message.title}
                  </Td>
                  <Td>
                    <MethodBadge method={message.sendMethod}>
                      {message.sendMethod === "예약 발송" ? (
                        <Clock size={12} />
                      ) : (
                        <Send size={12} />
                      )}
                      {message.sendMethod}
                    </MethodBadge>
                  </Td>
                  <Td>{message.recipientCount}</Td>
                  <Td>
                    <StatusBadge status={message.status}>
                      {message.status}
                    </StatusBadge>
                  </Td>
                  <Td style={{ color: "#6b7280", fontSize: "12px" }}>
                    {message.startDate}
                  </Td>
                  <Td
                    style={{
                      color:
                        message.status === "대기중" ? "#c2410c" : "#6b7280",
                      fontSize: "12px",
                      fontWeight: message.status === "대기중" ? "600" : "400",
                    }}
                  >
                    {message.endDate}
                  </Td>
                </Tr>
              ))
            ) : (
              <tr>
                <Td colSpan="9">
                  <EmptyState>발송된 메시지가 없습니다.</EmptyState>
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrapper>
    </TableContainer>
  );
}

export default MessageHistoryTable;
