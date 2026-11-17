import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ExploreProviders from './pages/ExploreProviders';
import BookAppointment from './pages/BookAppointment';
import MyBookings from './pages/MyBookings';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('smartbook_user') || 'null');
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  return getStoredUser()
    ? <Navigate to="/home" replace />
    : children;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={getStoredUser() ? '/home' : '/login'} replace />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route
          path="/explore"
          element={<ProtectedRoute roles={['customer']}><ExploreProviders /></ProtectedRoute>}
        />
        <Route
          path="/book/:providerId"
          element={<ProtectedRoute roles={['customer']}><BookAppointment /></ProtectedRoute>}
        />
        <Route
          path="/my-bookings"
          element={<ProtectedRoute roles={['customer']}><MyBookings /></ProtectedRoute>}
        />
        <Route
          path="/provider-dashboard"
          element={<ProtectedRoute roles={['provider']}><ProviderDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute roles={['admin', 'developer']}><AdminDashboard /></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;