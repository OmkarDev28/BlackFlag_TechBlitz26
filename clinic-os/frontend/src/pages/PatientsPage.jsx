import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function PatientModal({ patient, onClose, onSave }) {
  const isEdit = !!patient?.id;
  const [form, setForm] = useState({
    full_name: patient?.full_name || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    medical_history: patient?.medical_history || '',
    address: patient?.address || '',
    city: patient?.city || '',
    state: patient?.state || '',
    pincode: patient?.pincode || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.full_name || !form.phone) return setError('Name and phone are required');
    setSaving(true);
    setError('');
    try {
      if (isEdit) await api.updatePatient(patient.id, form);
      else await api.createPatient(form);
      onSave();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Patient' : 'New Patient'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Full Name <span>*</span></label>
            <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Phone <span>*</span></label>
            <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Medical History / Notes</label>
            <textarea className="form-textarea" value={form.medical_history} onChange={e => setForm(f => ({ ...f, medical_history: e.target.value }))} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 2 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📍 Location</p>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Street Address</label>
              <input className="form-input" placeholder="123 Main Street" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" placeholder="Mumbai" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" placeholder="Maharashtra" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input className="form-input" placeholder="400001" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : isEdit ? 'Save Changes' : 'Create Patient'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | patientObj
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPatients(await api.getPatients(search));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this patient and all their appointments?')) return;
    setDeleting(id);
    try { await api.deletePatient(id); await load(); }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">{patients.length} patient{patients.length !== 1 ? 's' : ''} registered</p>
        </div>
        {user?.role === 'receptionist' && (
          <button className="btn btn-primary" onClick={() => setModal('new')}>＋ New Patient</button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state"><p className="pulse">Loading…</p></div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>{search ? 'No patients match your search' : 'No patients registered yet'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Medical Notes</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/patients/${p.id}`} style={{ fontWeight: 500, color: 'var(--accent)', textDecoration: 'none' }}>
                        {p.full_name}
                      </Link>
                    </td>
                    <td>{p.phone}</td>
                    <td className="td-muted">{p.email || '—'}</td>
                    <td className="td-muted">
                      {[p.city, p.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="td-muted" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.medical_history || '—'}
                    </td>
                    <td className="td-muted">{format(new Date(p.created_at), 'dd MMM yyyy')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/patients/${p.id}`} className="btn btn-ghost btn-sm">View</Link>
                        {user?.role === 'receptionist' && (
                          <>
                            <button className="btn btn-outline btn-sm" onClick={() => setModal(p)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}>
                              {deleting === p.id ? '…' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <PatientModal
          patient={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </>
  );
}