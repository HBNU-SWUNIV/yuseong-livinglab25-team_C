import React, { useState } from 'react';
import styled from 'styled-components';
import { Server, Monitor, Users, Plus, Trash2 } from 'lucide-react';
import Toast from '../../components/common/Toast';

const PageContainer = styled.div`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 24px 0;
`;

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 20px;
    height: 20px;
    color: #2563eb;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || '1fr 1fr'};
  gap: 16px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.noMargin ? '0' : '20px'};
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
  transition: all 0.2s ease;
  box-sizing: border-box;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
  transition: all 0.2s ease;
  box-sizing: border-box;
  background-color: #ffffff;
  cursor: pointer;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.primary ? '#2563eb' : props.danger ? '#ef4444' : '#e5e7eb'};
  background-color: ${props => props.primary ? '#2563eb' : props.danger ? '#ef4444' : '#ffffff'};
  color: ${props => (props.primary || props.danger) ? '#ffffff' : '#374151'};
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background-color: ${props => props.primary ? '#1d4ed8' : props.danger ? '#dc2626' : '#f9fafb'};
    border-color: ${props => props.primary ? '#1d4ed8' : props.danger ? '#dc2626' : '#d1d5db'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const TableHead = styled.thead`
  background-color: #f9fafb;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableCell = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1a1a1a;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.variant === 'super' ? '#eff6ff' : '#f3f4f6'};
  color: ${props => props.variant === 'super' ? '#2563eb' : '#6b7280'};
`;

const StatusBadge = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.success ? '#10b981' : '#ef4444'};
  margin-right: 8px;
`;

function Settings() {
  const [serverConfig, setServerConfig] = useState({
    smtpServer: 'smtp.gmail.com',
    port: '587',
    maxDailyLimit: '10000',
  });

  const [displaySettings, setDisplaySettings] = useState({
    theme: 'light',
  });

  const [admins, setAdmins] = useState([
    { id: 1, name: '나관리', email: 'admin@company.com', role: 'super' },
    { id: 2, name: '김유성', email: 'user@company.com', role: 'viewer' },
  ]);

  const [connectionStatus, setConnectionStatus] = useState(null);
  const [toast, setToast] = useState(null);

  const handleServerConfigChange = (field, value) => {
    setServerConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleDisplayChange = (field, value) => {
    setDisplaySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    setTimeout(() => {
      setConnectionStatus('success');
      setToast({
        type: 'success',
        title: '연결 테스트 성공',
        message: 'SMTP 서버에 성공적으로 연결되었습니다.',
      });
    }, 1500);
  };

  const handleSaveServer = () => {
    setToast({
      type: 'success',
      title: '서버 설정 저장',
      message: '발송 서버 설정이 저장되었습니다.',
    });
  };

  const handleApplyTheme = () => {
    setToast({
      type: 'success',
      title: '테마 적용',
      message: `${displaySettings.theme === 'light' ? '라이트' : '다크'} 테마가 적용되었습니다.`,
    });
  };

  const handleAddAdmin = () => {
    const name = prompt('관리자 이름을 입력하세요:');
    const email = prompt('이메일을 입력하세요:');
    
    if (name && email) {
      const newAdmin = {
        id: admins.length + 1,
        name,
        email,
        role: 'viewer',
      };
      setAdmins(prev => [...prev, newAdmin]);
      setToast({
        type: 'success',
        title: '관리자 추가',
        message: '새 관리자가 추가되었습니다.',
      });
    }
  };

  const handleDeleteAdmin = (id, role) => {
    if (role === 'super') {
      setToast({
        type: 'error',
        title: '삭제 불가',
        message: '슈퍼 관리자는 삭제할 수 없습니다.',
      });
      return;
    }

    if (window.confirm('정말 이 관리자를 삭제하시겠습니까?')) {
      setAdmins(prev => prev.filter(admin => admin.id !== id));
      setToast({
        type: 'success',
        title: '관리자 삭제',
        message: '관리자가 삭제되었습니다.',
      });
    }
  };

  const handleChangeRole = (id, role) => {
    if (role === 'super') {
      setToast({
        type: 'error',
        title: '권한 변경 불가',
        message: '슈퍼 관리자의 권한은 변경할 수 없습니다.',
      });
      return;
    }

    setAdmins(prev => prev.map(admin => 
      admin.id === id ? { ...admin, role: admin.role === 'viewer' ? 'super' : 'viewer' } : admin
    ));
    setToast({
      type: 'success',
      title: '권한 변경',
      message: '관리자 권한이 변경되었습니다.',
    });
  };

  return (
    <PageContainer>
      <PageTitle>설정</PageTitle>

      <Card>
        <SectionTitle>
          <Server />
          발송 서버 설정
        </SectionTitle>
        <FormRow>
          <FormGroup noMargin>
            <Label>SMTP 서버 주소</Label>
            <Input
              type="text"
              value={serverConfig.smtpServer}
              onChange={(e) => handleServerConfigChange('smtpServer', e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </FormGroup>
          <FormGroup noMargin>
            <Label>포트 번호</Label>
            <Select
              value={serverConfig.port}
              onChange={(e) => handleServerConfigChange('port', e.target.value)}
            >
              <option value="587">587 (TLS)</option>
              <option value="465">465 (SSL)</option>
              <option value="25">25 (기본)</option>
            </Select>
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label>1일 최대 발송량</Label>
          <Input
            type="number"
            value={serverConfig.maxDailyLimit}
            onChange={(e) => handleServerConfigChange('maxDailyLimit', e.target.value)}
            placeholder="10000"
          />
        </FormGroup>

        {connectionStatus && (
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: connectionStatus === 'success' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge success={connectionStatus === 'success'} />
            {connectionStatus === 'testing' ? '연결 테스트 중...' : '연결 성공'}
          </div>
        )}

        <ButtonGroup>
          <Button onClick={handleTestConnection} disabled={connectionStatus === 'testing'}>
            연결 테스트
          </Button>
          <Button onClick={handleSaveServer} primary>저장</Button>
        </ButtonGroup>
      </Card>

      <Card>
        <SectionTitle>
          <Monitor />
          화면 설정
        </SectionTitle>
        <FormGroup>
          <Label>테마 선택</Label>
          <Select
            value={displaySettings.theme}
            onChange={(e) => handleDisplayChange('theme', e.target.value)}
          >
            <option value="light">라이트</option>
            <option value="dark">다크</option>
          </Select>
        </FormGroup>

        <ButtonGroup>
          <Button onClick={handleApplyTheme} primary>테마 적용</Button>
        </ButtonGroup>
      </Card>

      <Card>
        <SectionTitle>
          <Users />
          관리자 관리
        </SectionTitle>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>이름</TableHeaderCell>
              <TableHeaderCell>이메일</TableHeaderCell>
              <TableHeaderCell>권한</TableHeaderCell>
              <TableHeaderCell>작업</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {admins.map(admin => (
              <TableRow key={admin.id}>
                <TableCell>{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Badge $variant={admin.role}>
                    {admin.role === 'super' ? '슈퍼 관리자' : '일반 뷰어'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button onClick={() => handleChangeRole(admin.id, admin.role)}>
                      권한 수정
                    </Button>
                    <Button
                      danger
                      onClick={() => handleDeleteAdmin(admin.id, admin.role)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>

        <ButtonGroup>
          <Button onClick={handleAddAdmin} primary>
            <Plus size={16} />
            관리자 추가
          </Button>
        </ButtonGroup>
      </Card>

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </PageContainer>
  );
}

export default Settings;

