import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '../utils/api';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPatient(id)
      .then(setPatient)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="pulse" style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div>;
  if (!patient) return <div className="alert alert-error">Patient not found</div>;

  const upcoming = (patient.appointments || []).filter(a => a.status === 'scheduled');
  const past = (patient.appointments || []).filter(a => a.status !== 'scheduled');

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/patients" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'block', marginBottom: 4 }}>
            ← Back to Patients
          </Link>
          <h1 className="page-title">{patient.full_name}</h1>
          <p className="page-subtitle">Patient record · Registered {format(new Date(patient.created_at), 'dd MMM yyyy')}</p>
        </div>
        <Link to="/appointments/new" className="btn btn-primary">Book Appointment</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-body">
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--accent-light)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', fontWeight: 600, margin: '0 auto 12px'
                }}>
                  {patient.full_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{patient.full_name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.88rem' }}>
                {[
                  ['📞', 'Phone', patient.phone],
                  ['✉️', 'Email', patient.email || '—'],
                  ['📍', 'Address', [patient.address, patient.city, patient.state, patient.pincode].filter(Boolean).join(', ') || '—'],
                ].map(([icon, label, val]) => (
                  <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span>{icon}</span>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                      <div style={{ color: 'var(--text)' }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {patient.medical_history && (
            <div className="card">
              <div className="card-header"><span className="card-title">Medical Notes</span></div>
              <div className="card-body">
                <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6 }}>{patient.medical_history}</p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Total Visits', patient.appointments?.length ?? 0],
                ['Upcoming', upcoming.length],
                ['Completed', patient.appointments?.filter(a => a.status === 'completed').length ?? 0],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Appointment History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {upcoming.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Upcoming Appointments</span></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date & Time</th><th>Doctor</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {upcoming.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div>{format(new Date(a.start_time), 'dd MMM yyyy')}</div>
                          <div className="td-muted">{format(new Date(a.start_time), 'HH:mm')} – {format(new Date(a.end_time), 'HH:mm')}</div>
                        </td>
                        <td>Dr. {a.doctor?.full_name}</td>
                        <td><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><span className="card-title">Appointment History</span></div>
            {past.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 24px' }}>
                <div className="empty-icon">📋</div>
                <p>No past appointments</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date & Time</th><th>Doctor</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {past.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div>{format(new Date(a.start_time), 'dd MMM yyyy')}</div>
                          <div className="td-muted">{format(new Date(a.start_time), 'HH:mm')} – {format(new Date(a.end_time), 'HH:mm')}</div>
                        </td>
                        <td>Dr. {a.doctor?.full_name}</td>
                        <td><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}