import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Recipients from './pages/Recipients/Recipients';
import Messages from './pages/Messages/Messages';
import CustomReminders from './pages/CustomReminders/CustomReminders';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="recipients" element={<Recipients />} />
            <Route path="messages" element={<Messages />} />
            <Route path="custom-reminders" element={<CustomReminders />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;