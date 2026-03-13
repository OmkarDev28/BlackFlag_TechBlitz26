import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { format } from 'date-fns';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status?.replace('-', '') === 'noshow' ? 'no-show' : status}`}>{status}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [today, setToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      const [s, t] = await Promise.all([api.getStats(), api.getTodayAppointments()]);
      setStats(s);
      setToday(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id + status);
    try {
      await api.updateStatus(id, status);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <div className="pulse" style={{ padding: 40, color: 'var(--text-muted)' }}>Loading dashboard…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM do yyyy')} — here's your clinic at a glance</p>
        </div>
        {user?.role === 'receptionist' && (
          <Link to="/appointments/new" className="btn btn-primary">
            ＋ Book Appointment
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-value">{stats?.today ?? '—'}</div>
          <div className="stat-label">Today's Appointments</div>
        </div>
        <div className="stat-card blue">
          <span className="stat-icon">🕐</span>
          <div className="stat-value">{stats?.scheduled ?? '—'}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card green">
          <span className="stat-icon">✅</span>
          <div className="stat-value">{stats?.completed ?? '—'}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card red">
          <span className="stat-icon">❌</span>
          <div className="stat-value">{stats?.cancelled ?? '—'}</div>
          <div className="stat-label">Cancelled</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-value">{stats?.total_patients ?? '—'}</div>
          <div className="stat-label">Total Patients</div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Today's Schedule</span>
          <Link to="/appointments" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <div className="card-body">
          {today.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="timeline">
              {today.map(appt => (
                <div className="timeline-item" key={appt.id}>
                  <div className="timeline-time">
                    <div className="time-main">{format(new Date(appt.start_time), 'HH:mm')}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{format(new Date(appt.end_time), 'HH:mm')}</div>
                  </div>
                  <div className="timeline-divider" />
                  <div className="timeline-info">
                    <div className="timeline-patient">{appt.patient?.full_name}</div>
                    <div className="timeline-doctor">
                      Dr. {appt.doctor?.full_name}
                      {appt.patient?.phone && <span style={{ marginLeft: 8, color: 'var(--text-light)' }}>· {appt.patient.phone}</span>}
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                  {appt.status === 'scheduled' && (
                    <div className="timeline-actions">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusUpdate(appt.id, 'completed')}
                        disabled={!!actionLoading}
                      >
                        ✓ Done
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleStatusUpdate(appt.id, 'no-show')}
                        disabled={!!actionLoading}
                      >
                        No-show
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
