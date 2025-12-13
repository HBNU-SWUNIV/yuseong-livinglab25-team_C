import styled from 'styled-components';
import { CheckCircle, XCircle } from 'lucide-react';

const TableContainer = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const TableTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  padding: 24px 24px 0 24px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const TableHeaderCell = styled.th`
  padding: 12px 24px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 16px 24px;
  font-size: 14px;
  color: #1a1a1a;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background-color: ${props => props.status === 'success' ? '#d1fae5' : '#fee2e2'};
  color: ${props => props.status === 'success' ? '#065f46' : '#991b1b'};
`;

const ContentPreview = styled.span`
  color: #6b7280;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
`;

// 최근 발송 내역 더미 데이터
const generateTableData = () => {
  const recipients = ['김유성', '이대전', '박과학', '최연구', '정혁신', '강창업', '윤산업', '임기술'];
  const messages = [
    '오늘 날씨가 맑습니다. 외출 시 마스크 착용 부탁드립니다.',
    '유성구 재난안전 알림: 강풍주의보가 발령되었습니다.',
    '미세먼지 농도가 높습니다. 외출을 자제해주세요.',
    '유성구청 공지사항: 행사 안내입니다.',
    '긴급재난문자: 지진 안전 수칙을 확인해주세요.',
  ];
  const statuses = ['success', 'failed'];
  
  const today = new Date();
  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - index);
    return {
      id: index + 1,
      date: date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
      recipient: recipients[Math.floor(Math.random() * recipients.length)],
      content: messages[Math.floor(Math.random() * messages.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
    };
  });
};

function MessageTable() {
  const data = generateTableData();

  return (
    <TableContainer>
      <TableTitle>최근 발송 내역</TableTitle>
      <Table>
        <TableHeader>
          <tr>
            <TableHeaderCell>날짜</TableHeaderCell>
            <TableHeaderCell>수신자</TableHeaderCell>
            <TableHeaderCell>내용</TableHeaderCell>
            <TableHeaderCell>상태</TableHeaderCell>
          </tr>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.date}</TableCell>
              <TableCell>{row.recipient}</TableCell>
              <TableCell>
                <ContentPreview>{row.content}</ContentPreview>
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status}>
                  {row.status === 'success' ? (
                    <>
                      <CheckCircle size={14} />
                      성공
                    </>
                  ) : (
                    <>
                      <XCircle size={14} />
                      실패
                    </>
                  )}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default MessageTable;





