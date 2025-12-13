import React, { useState } from 'react';
import styled from 'styled-components';
import { User, Mail, Phone, Shield, Monitor, LogOut } from 'lucide-react';
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  margin-bottom: 24px;
`;

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const ProfileCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const ProfileImageWrapper = styled.div`
  position: relative;
`;

const ProfileImage = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  svg {
    width: 48px;
    height: 48px;
    color: #2563eb;
  }
`;

const ChangePhotoButton = styled.button`
  margin-top: 12px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const ProfileName = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const ProfileRole = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const ProfileEmail = styled.div`
  font-size: 14px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 20px 0;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
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
  
  &:read-only {
    background-color: #f9fafb;
    color: #6b7280;
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
  border: 1px solid ${props => props.primary ? '#2563eb' : '#e5e7eb'};
  background-color: ${props => props.primary ? '#2563eb' : '#ffffff'};
  color: ${props => props.primary ? '#ffffff' : '#374151'};
  
  &:hover {
    background-color: ${props => props.primary ? '#1d4ed8' : '#f9fafb'};
    border-color: ${props => props.primary ? '#1d4ed8' : '#d1d5db'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #d1d5db;
    transition: 0.3s;
    border-radius: 24px;
    
    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: #2563eb;
  }
  
  input:checked + span:before {
    transform: translateX(24px);
  }
`;

const SecurityRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SecurityLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SecurityTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
`;

const SecurityDesc = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
`;

const HistoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HistoryIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
    color: #2563eb;
  }
`;

const HistoryDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const HistoryDevice = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
`;

const HistoryMeta = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const LogoutButton = styled(Button)`
  border-color: #ef4444;
  color: #ef4444;
  
  &:hover {
    background-color: #fef2f2;
    border-color: #dc2626;
  }
`;

function Profile() {
  const [profileData, setProfileData] = useState({
    name: '나관리',
    role: '시스템 관리팀 / 수석',
    email: 'admin@company.com',
    phone: '010-1234-5678',
    profileImage: null,
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });

  const [toast, setToast] = useState(null);

  const loginHistory = [
    {
      id: 1,
      device: 'Chrome / Windows',
      ip: '192.168.0.1',
      time: '2025.12.13 15:30',
      isCurrent: true,
    },
    {
      id: 2,
      device: 'Safari / macOS',
      ip: '192.168.0.5',
      time: '2025.12.12 09:15',
      isCurrent: false,
    },
  ];

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field, value) => {
    setSecurityData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, profileImage: reader.result }));
        setToast({
          type: 'success',
          title: '프로필 사진 변경',
          message: '프로필 사진이 변경되었습니다.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setToast({
      type: 'success',
      title: '정보 저장 완료',
      message: '프로필 정보가 저장되었습니다.',
    });
  };

  const handleChangePassword = () => {
    if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
      setToast({
        type: 'error',
        title: '입력 오류',
        message: '모든 필드를 입력해주세요.',
      });
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setToast({
        type: 'error',
        title: '비밀번호 불일치',
        message: '새 비밀번호가 일치하지 않습니다.',
      });
      return;
    }

    setSecurityData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));

    setToast({
      type: 'success',
      title: '비밀번호 변경 완료',
      message: '비밀번호가 성공적으로 변경되었습니다.',
    });
  };

  const handleToggle2FA = () => {
    setSecurityData(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
    setToast({
      type: 'success',
      title: '2단계 인증',
      message: `2단계 인증이 ${!securityData.twoFactorEnabled ? '활성화' : '비활성화'}되었습니다.`,
    });
  };

  const handleLogoutAll = () => {
    if (window.confirm('모든 기기에서 로그아웃하시겠습니까?')) {
      setToast({
        type: 'success',
        title: '로그아웃 완료',
        message: '모든 기기에서 로그아웃되었습니다.',
      });
    }
  };

  return (
    <PageContainer>
      <PageTitle>나관리</PageTitle>

      <Grid>
        <ProfileCard>
          <ProfileImageWrapper>
            <ProfileImage>
              {profileData.profileImage ? (
                <img src={profileData.profileImage} alt="프로필" />
              ) : (
                <User />
              )}
            </ProfileImage>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
              id="profile-photo"
            />
            <ChangePhotoButton as="label" htmlFor="profile-photo">
              사진 변경
            </ChangePhotoButton>
          </ProfileImageWrapper>

          <ProfileInfo>
            <ProfileName>{profileData.name}</ProfileName>
            <ProfileRole>{profileData.role}</ProfileRole>
            <ProfileEmail>
              <Mail size={14} />
              {profileData.email}
            </ProfileEmail>
          </ProfileInfo>
        </ProfileCard>

        <Card>
          <SectionTitle>기본 정보</SectionTitle>
          <FormGroup>
            <Label>이름</Label>
            <Input
              type="text"
              value={profileData.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>이메일</Label>
            <Input
              type="email"
              value={profileData.email}
              readOnly
            />
          </FormGroup>

          <FormGroup>
            <Label>연락처</Label>
            <Input
              type="tel"
              value={profileData.phone}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
            />
          </FormGroup>

          <ButtonGroup>
            <Button onClick={handleSaveProfile} primary>저장</Button>
          </ButtonGroup>
        </Card>
      </Grid>

      <Card style={{ marginBottom: '24px' }}>
        <SectionTitle>보안 설정</SectionTitle>
        
        <FormGroup>
          <Label>현재 비밀번호</Label>
          <Input
            type="password"
            value={securityData.currentPassword}
            onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
            placeholder="현재 비밀번호를 입력하세요"
          />
        </FormGroup>

        <FormGroup>
          <Label>새 비밀번호</Label>
          <Input
            type="password"
            value={securityData.newPassword}
            onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
            placeholder="새 비밀번호를 입력하세요"
          />
        </FormGroup>

        <FormGroup>
          <Label>새 비밀번호 확인</Label>
          <Input
            type="password"
            value={securityData.confirmPassword}
            onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
            placeholder="새 비밀번호를 다시 입력하세요"
          />
        </FormGroup>

        <ButtonGroup>
          <Button onClick={handleChangePassword} primary>비밀번호 변경</Button>
        </ButtonGroup>

        <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
          <SecurityRow>
            <SecurityLabel>
              <SecurityTitle>2단계 인증</SecurityTitle>
              <SecurityDesc>추가 보안 계층을 활성화합니다</SecurityDesc>
            </SecurityLabel>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={securityData.twoFactorEnabled}
                onChange={handleToggle2FA}
              />
              <span></span>
            </ToggleSwitch>
          </SecurityRow>
        </div>
      </Card>

      <Card>
        <SectionTitle>접속 이력</SectionTitle>
        <HistoryList>
          {loginHistory.map(item => (
            <HistoryItem key={item.id}>
              <HistoryInfo>
                <HistoryIcon>
                  <Monitor />
                </HistoryIcon>
                <HistoryDetails>
                  <HistoryDevice>
                    {item.device} {item.isCurrent && <span style={{ color: '#10b981' }}>(현재)</span>}
                  </HistoryDevice>
                  <HistoryMeta>{item.ip} • {item.time}</HistoryMeta>
                </HistoryDetails>
              </HistoryInfo>
              {item.isCurrent && (
                <LogoutButton onClick={() => window.location.href = '/login'}>
                  <LogOut size={16} />
                </LogoutButton>
              )}
            </HistoryItem>
          ))}
        </HistoryList>

        <ButtonGroup>
          <LogoutButton onClick={handleLogoutAll}>
            모든 기기에서 로그아웃
          </LogoutButton>
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

export default Profile;





