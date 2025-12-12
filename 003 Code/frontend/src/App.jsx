import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import RecipientManagement from './pages/RecipientManagement/RecipientManagement';
import MessageManagement from './pages/MessageManagement/MessageManagement';
import CustomNotification from './pages/CustomNotification/CustomNotification';
import APIManagement from './pages/APIManagement/APIManagement';
import Settings from './pages/Settings/Settings';
import Help from './pages/Help/Help';
import Profile from './pages/Profile/Profile';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="recipients" element={<RecipientManagement />} />
          <Route path="messages" element={<MessageManagement />} />
          <Route path="custom-reminders" element={<CustomNotification />} />
          <Route path="api" element={<APIManagement />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
