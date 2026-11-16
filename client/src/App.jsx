import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/explore" element={<ExploreProviders />} />
        <Route path="/book/:providerId" element={<BookAppointment />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/provider-dashboard" element={<ProviderDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;