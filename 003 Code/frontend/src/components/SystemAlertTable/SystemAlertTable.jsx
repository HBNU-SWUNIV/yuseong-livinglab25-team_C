import styled from 'styled-components';
import Badge from '../Badge/Badge';

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
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #ffffff;
`;

const TableTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;


const TableWrapper = styled.div`
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  position: sticky;
  top: 0;
  background-color: #f9fafb;
  z-index: 10;
`;

const TableHeaderCell = styled.th`
  padding: 12px 24px;
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
  padding: 12px 24px;
  font-size: 14px;
  color: #1a1a1a;
  white-space: nowrap;
`;

function SystemAlertTable({ data = [] }) {
  const getSeverityVariant = (severity) => {
    if (severity === '정보') return 'info';
    if (severity === '경고') return 'warning';
    if (severity === '공지') return 'notice';
    return 'info';
  };

  return (
    <TableContainer>
      <TableHeader>
        <TableTitle>시스템 알림 이력</TableTitle>
      </TableHeader>
      <TableWrapper>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>No.</TableHeaderCell>
              <TableHeaderCell>발생 일시</TableHeaderCell>
              <TableHeaderCell>알림 유형</TableHeaderCell>
              <TableHeaderCell>제목</TableHeaderCell>
              <TableHeaderCell>알림 ID</TableHeaderCell>
              <TableHeaderCell>심각도</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={row.id || index}>
                <TableCell>{row.no || index + 1}</TableCell>
                <TableCell>{row.occurredDate}</TableCell>
                <TableCell>{row.alertType}</TableCell>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.alertId}</TableCell>
                <TableCell>
                  <Badge $variant={getSeverityVariant(row.severity)}>
                    {row.severity}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </TableContainer>
  );
}

export default SystemAlertTable;

