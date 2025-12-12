import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Search, ChevronRight, Home } from 'lucide-react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: #ffffff;
  border-bottom: 3px solid #2563eb;
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
  min-width: 0;
  flex-shrink: 0;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex-shrink: 0;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: #1a1a1a;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  padding: 0;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  svg {
    width: 20px;
    height: 20px;
    stroke-width: 2.5;
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PageTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
`;

const Breadcrumb = styled.div`
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const BreadcrumbSeparator = styled.span`
  display: flex;
  align-items: center;
  color: #9ca3af;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
  flex-shrink: 0;
  white-space: nowrap;
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  border-radius: 6px;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
`;

const DateInfo = styled.div`
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
`;

const AdminStatus = styled.div`
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
  flex-shrink: 0;
`;

const LogoutButton = styled.button`
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e5e7eb;
    color: #1a1a1a;
  }
`;

const pageTitles = {
  '/dashboard': '대시보드',
  '/recipients': '수신자 관리',
  '/messages': '메시지 관리',
  '/custom-reminders': '맞춤 알림',
  '/api': 'API 관리',
  '/settings': '설정',
  '/help': '도움말',
  '/profile': '나관리',
};

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTitle = pageTitles[location.pathname] || '대시보드';

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[today.getDay()];
    return `${year}.${month}.${day}. (${weekday})`;
  };

  const handleLogout = () => {
    // 로그아웃 로직 (추후 구현)
    console.log('로그아웃');
    navigate('/login');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSearch = () => {
    // 검색 기능 (추후 구현)
    console.log('검색');
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <BackButton onClick={handleBack}>
          <ArrowLeft size={20} />
        </BackButton>
        <TitleSection>
          <PageTitle>{currentTitle}</PageTitle>
          <Breadcrumb>
            <Home size={14} />
            <BreadcrumbSeparator>
              <ChevronRight size={14} />
            </BreadcrumbSeparator>
            <span>{currentTitle}</span>
          </Breadcrumb>
        </TitleSection>
      </LeftSection>
      <RightSection>
        <DateInfo>{getCurrentDate()}</DateInfo>
        <AdminStatus>관리자 나관리 접속중</AdminStatus>
        <LogoutButton onClick={handleLogout}>
          로그아웃
        </LogoutButton>
      </RightSection>
    </HeaderContainer>
  );
}

export default Header;

