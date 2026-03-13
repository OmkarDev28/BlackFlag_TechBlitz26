import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9); // 9am–5pm

export default function SchedulePage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedule, setSchedule] = useState({ appointments: [] });
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    api.getDoctors().then(docs => {
      setDoctors(docs);
      if (user?.role === 'doctor') {
        setSelectedDoctor(user.id);
      } else if (docs.length > 0) {
        setSelectedDoctor(docs[0].id);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!selectedDoctor) return;
    setLoading(true);
    api.getDoctorSchedule(selectedDoctor, { week_start: weekStart.toISOString() })
      .then(setSchedule)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedDoctor, weekStart]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const getApptForCell = (day, hour) => {
    return (schedule.appointments || []).filter(appt => {
      const start = new Date(appt.start_time);
      return isSameDay(start, day) && start.getHours() === hour;
    });
  };

  const getApptTop = (appt) => {
    const start = new Date(appt.start_time);
    return (start.getMinutes() / 60) * 48;
  };

  const getApptHeight = (appt) => {
    const start = new Date(appt.start_time);
    const end = new Date(appt.end_time);
    const mins = (end - start) / 60000;
    return Math.max((mins / 60) * 48, 22);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Schedule</h1>
          <p className="page-subtitle">
            {format(weekStart, 'MMMM do')} – {format(addDays(weekStart, 6), 'MMMM do, yyyy')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {user?.role !== 'doctor' && (
            <select className="form-select" style={{ width: 'auto' }} value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
              {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
            </select>
          )}
          <button className="btn btn-outline" onClick={() => setWeekStart(w => addDays(w, -7))}>← Prev</button>
          <button className="btn btn-outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</button>
          <button className="btn btn-outline" onClick={() => setWeekStart(w => addDays(w, 7))}>Next →</button>
        </div>
      </div>

      {loading && <div className="pulse" style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading schedule…</div>}

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Week grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
          <div className="week-header" />
          {weekDays.map((day, i) => (
            <div key={i} className={`week-header ${isSameDay(day, today) ? 'today-col' : ''}`}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{format(day, 'EEE')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 2, color: isSameDay(day, today) ? 'var(--accent)' : 'var(--text)' }}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
          {HOURS.map(hour => (
            <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)' }}>
              <div className="time-label">{hour}:00</div>
              {weekDays.map((day, di) => {
                const appts = getApptForCell(day, hour);
                return (
                  <div key={di} className="day-cell" style={{ position: 'relative' }}>
                    {appts.map(appt => (
                      <div
                        key={appt.id}
                        className={`appt-block ${appt.status === 'completed' ? 'completed' : ''}`}
                        style={{ top: getApptTop(appt), height: getApptHeight(appt) }}
                        onClick={() => setTooltip(tooltip?.id === appt.id ? null : appt)}
                        title={`${appt.patient?.full_name} — ${format(new Date(appt.start_time), 'HH:mm')}`}
                      >
                        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {appt.patient?.full_name}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Appointment detail tooltip/modal */}
      {tooltip && (
        <div className="modal-backdrop" onClick={() => setTooltip(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Appointment</span>
              <button className="modal-close" onClick={() => setTooltip(null)}>✕</button>
            </div>
            <div className="modal-body">
              {[
                ['Patient', tooltip.patient?.full_name],
                ['Phone', tooltip.patient?.phone],
                ['Date', format(new Date(tooltip.start_time), 'EEEE, MMMM do yyyy')],
                ['Time', `${format(new Date(tooltip.start_time), 'HH:mm')} – ${format(new Date(tooltip.end_time), 'HH:mm')}`],
                ['Status', <span className={`badge badge-${tooltip.status}`}>{tooltip.status}</span>],
                tooltip.notes && ['Notes', tooltip.notes],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setTooltip(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
