import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isReceptionist = user?.role === 'receptionist';
  const isDoctor = user?.role === 'doctor';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🏥</div>
          <h1>Clinic OS</h1>
          <p>Management System</p>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Overview</span>
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>

          <span className="sidebar-section-label">Scheduling</span>
          <NavLink to="/appointments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📅</span> Appointments
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🗓️</span> Weekly Schedule
          </NavLink>
          <NavLink to="/location" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📍</span> Clinic Location
          </NavLink>

          {(isReceptionist || isDoctor) && (
            <>
              <span className="sidebar-section-label">Records</span>
              <NavLink to="/patients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">👤</span> Patients
              </NavLink>
            </>
          )}

          {isReceptionist && (
            <NavLink to="/appointments/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">➕</span> New Appointment
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{getInitials(user?.full_name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sign out">⏻</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}