import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  min-width: 1280px;
  overflow-x: auto;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 240px;
  min-width: 0;
  flex-shrink: 0;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 32px;
  overflow-y: auto;
`;

function Layout() {
  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        <Header />
        <ContentArea>
          <Outlet />
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
}

export default Layout;

