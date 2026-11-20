import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Overview from './pages/Overview';
import CreateCampaign from './pages/CreateCampaign';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import PinLibrary from './pages/PinLibrary';
import PublishingQueue from './pages/PublishingQueue';
import ScheduledPins from './pages/ScheduledPins';
import PublishedPins from './pages/PublishedPins';
import Boards from './pages/Boards';
import Analytics from './pages/Analytics';
import ApiSettings from './pages/ApiSettings';
import PinterestRss from './pages/PinterestRss';
import MakeAutomation from './pages/MakeAutomation';
import Notifications from './pages/Notifications';
import ActivityLog from './pages/ActivityLog';
import AccountSettings from './pages/AccountSettings';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="create" element={<CreateCampaign />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="pins" element={<PinLibrary />} />
        <Route path="queue" element={<PublishingQueue />} />
        <Route path="pinterest-rss" element={<PinterestRss />} />
        <Route path="make-automation" element={<MakeAutomation />} />
        <Route path="auto-publish" element={<Navigate to="/pinterest-rss" replace />} />
        <Route path="scheduled" element={<ScheduledPins />} />
        <Route path="published" element={<PublishedPins />} />
        <Route path="boards" element={<Boards />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings/api" element={<ApiSettings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="activity" element={<ActivityLog />} />
        <Route path="settings/account" element={<AccountSettings />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
