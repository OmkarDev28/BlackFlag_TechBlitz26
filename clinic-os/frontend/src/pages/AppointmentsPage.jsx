import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function RescheduleModal({ appt, doctors, onClose, onDone }) {
  const [doctorId, setDoctorId] = useState(appt.doctor_id);
  const [date, setDate] = useState(format(new Date(appt.start_time), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSlots = useCallback(async () => {
    if (!doctorId || !date) return;
    setLoadingSlots(true);
    setSelected(null);
    try {
      const data = await api.getAvailableSlots({ doctor_id: doctorId, date, duration: 30 });
      setSlots(data);
    } catch (e) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId, date]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const handleSave = async () => {
    if (!selected) return setError('Please select a time slot');
    setSaving(true);
    setError('');
    try {
      await api.reschedule(appt.id, { start_time: selected.start_time, end_time: selected.end_time });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Reschedule Appointment</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Patient: <strong>{appt.patient?.full_name}</strong>
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Doctor</label>
            <select className="form-select" value={doctorId} onChange={e => setDoctorId(e.target.value)}>
              {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} />
          </div>
          <div className="form-group">
            <label className="form-label">Available Slots {loadingSlots && '(loading…)'}</label>
            {slots.length === 0 && !loadingSlots && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No slots available for this date.</p>}
            <div className="slots-grid">
              {slots.map(s => (
                <button
                  key={s.start_time}
                  className={`slot ${selected?.start_time === s.start_time ? 'selected' : ''}`}
                  onClick={() => setSelected(s)}
                >
                  {format(new Date(s.start_time), 'HH:mm')}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !selected}>
            {saving ? <><span className="spinner" /> Saving…</> : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', status: '', doctor_id: '' });
  const [rescheduling, setRescheduling] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.status) params.status = filters.status;
      if (filters.doctor_id) params.doctor_id = filters.doctor_id;
      const [appts, docs] = await Promise.all([api.getAppointments(params), api.getDoctors()]);
      setAppointments(appts);
      setDoctors(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    setActionLoading(id);
    try {
      await api.updateStatus(id, 'cancelled');
      await load();
    } catch (e) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const handleComplete = async (id) => {
    setActionLoading(id);
    try {
      await api.updateStatus(id, 'completed');
      await load();
    } catch (e) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Manage all clinic appointments</p>
        </div>
        {user?.role === 'receptionist' && (
          <Link to="/appointments/new" className="btn btn-primary">＋ New Appointment</Link>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              value={filters.date}
              onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
            />
            <select className="form-select" style={{ width: 'auto' }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No-show</option>
            </select>
            {user?.role !== 'doctor' && (
              <select className="form-select" style={{ width: 'auto' }} value={filters.doctor_id} onChange={e => setFilters(f => ({ ...f, doctor_id: e.target.value }))}>
                <option value="">All Doctors</option>
                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
              </select>
            )}
            {(filters.date || filters.status || filters.doctor_id) && (
              <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ date: '', status: '', doctor_id: '' })}>✕ Clear</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state"><p className="pulse">Loading…</p></div>
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <p>No appointments found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => {
                  const start = new Date(appt.start_time);
                  const end = new Date(appt.end_time);
                  const mins = Math.round((end - start) / 60000);
                  return (
                    <tr key={appt.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{appt.patient?.full_name}</div>
                        <div className="td-muted">{appt.patient?.phone}</div>
                      </td>
                      <td>Dr. {appt.doctor?.full_name}</td>
                      <td>
                        <div>{format(start, 'dd MMM yyyy')}</div>
                        <div className="td-muted">{format(start, 'HH:mm')} – {format(end, 'HH:mm')}</div>
                      </td>
                      <td className="td-muted">{mins} min</td>
                      <td><StatusBadge status={appt.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {appt.status === 'scheduled' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => handleComplete(appt.id)} disabled={!!actionLoading}>✓</button>
                              <button className="btn btn-outline btn-sm" onClick={() => setRescheduling(appt)} disabled={!!actionLoading}>↺</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleCancel(appt.id)} disabled={!!actionLoading}>✕</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {rescheduling && (
        <RescheduleModal
          appt={rescheduling}
          doctors={doctors}
          onClose={() => setRescheduling(null)}
          onDone={() => { setRescheduling(null); load(); }}
        />
      )}
    </>
  );
}
