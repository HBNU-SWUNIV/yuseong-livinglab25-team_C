import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Bell, Monitor, Settings, HelpCircle, UserCircle } from 'lucide-react';
import styled from 'styled-components';
import logoColor from '../../assets/login-color.svg';

const SidebarContainer = styled.aside`
  position: fixed;
  left: 0;
  top: 0;
  width: 240px;
  height: 100vh;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  z-index: 100;
`;

const LogoSection = styled.div`
  padding: 24px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoImage = styled.img`
  width: 32px;
  height: 32px;
`;

const LogoText = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
`;

const MenuList = styled.nav`
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const BottomMenuList = styled.nav`
  padding: 16px 0;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
`;

const MenuItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #6b7280;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
    color: #2563eb;
  }
  
  &.active {
    background-color: #eff6ff;
    color: #2563eb;
    border-right: 3px solid #2563eb;
    font-weight: 600;
  }
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  width: 20px;
  height: 20px;
`;

const mainMenuItems = [
  { path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { path: '/recipients', label: '수신자 관리', icon: Users },
  { path: '/messages', label: '메시지 관리', icon: MessageSquare },
  { path: '/custom-reminders', label: '맞춤 알림', icon: Bell },
  { path: '/api', label: 'API 관리', icon: Monitor },
];

const bottomMenuItems = [
  { path: '/settings', label: '설정', icon: Settings },
  { path: '/help', label: '도움말', icon: HelpCircle },
  { path: '/profile', label: '나관리', icon: UserCircle },
];

function Sidebar() {
  return (
    <SidebarContainer>
      <LogoSection>
        <LogoImage src={logoColor} alt="유성 안심 문자 서비스" />
        <LogoText>유성 안심 문자 서비스</LogoText>
      </LogoSection>
      <MenuList>
        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <MenuItem
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <IconWrapper>
                <Icon size={20} />
              </IconWrapper>
              <span>{item.label}</span>
            </MenuItem>
          );
        })}
      </MenuList>
      <BottomMenuList>
        {bottomMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <MenuItem
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <IconWrapper>
                <Icon size={20} />
              </IconWrapper>
              <span>{item.label}</span>
            </MenuItem>
          );
        })}
      </BottomMenuList>
    </SidebarContainer>
  );
}

export default Sidebar;

