import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '../utils/api';

export default function NewAppointmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=patient, 2=doctor+slot, 3=confirm
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);

  const [form, setForm] = useState({
    patient_id: '',
    patient_name: '',
    doctor_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    duration: '30',
    selected_slot: null,
    notes: '',
  });

  const [newPatient, setNewPatient] = useState({ full_name: '', phone: '', email: '', medical_history: '', address: '', city: '', state: '', pincode: '' });
  const [creatingPatient, setCreatingPatient] = useState(false);

  useEffect(() => {
    api.getDoctors().then(setDoctors).catch(console.error);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (search.length < 2) { setPatients([]); return; }
      try { setPatients(await api.getPatients(search)); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadSlots = useCallback(async () => {
    if (!form.doctor_id || !form.date) return;
    setLoadingSlots(true);
    setForm(f => ({ ...f, selected_slot: null }));
    try {
      const s = await api.getAvailableSlots({ doctor_id: form.doctor_id, date: form.date, duration: form.duration });
      setSlots(s);
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  }, [form.doctor_id, form.date, form.duration]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const handleCreatePatient = async () => {
    if (!newPatient.full_name || !newPatient.phone) return setError('Name and phone are required');
    setCreatingPatient(true);
    setError('');
    try {
      const p = await api.createPatient(newPatient);
      setForm(f => ({ ...f, patient_id: p.id, patient_name: p.full_name }));
      setShowNewPatient(false);
      setSearch('');
      setStep(2);
    } catch (e) { setError(e.message); }
    finally { setCreatingPatient(false); }
  };

  const handleBook = async () => {
    if (!form.patient_id || !form.doctor_id || !form.selected_slot) return setError('Missing required fields');
    setSaving(true);
    setError('');
    try {
      await api.createAppointment({
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        start_time: form.selected_slot.start_time,
        end_time: form.selected_slot.end_time,
        notes: form.notes,
      });
      navigate('/appointments');
    } catch (e) { setError(e.message); setSaving(false); }
  };

  const selectedDoctor = doctors.find(d => d.id === form.doctor_id);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Book Appointment</h1>
          <p className="page-subtitle">Step {step} of 3</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/appointments')}>← Back</button>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {['Select Patient', 'Choose Slot', 'Confirm'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--accent)' : 'var(--border)',
              color: step >= i + 1 ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 600, flexShrink: 0
            }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.85rem', color: step === i + 1 ? 'var(--text)' : 'var(--text-muted)', fontWeight: step === i + 1 ? 500 : 400 }}>{label}</span>
            {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      {/* Step 1 */}
      {step === 1 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Find or Create Patient</span></div>
          <div className="card-body">
            {!showNewPatient ? (
              <>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Search patient by name, email or phone</label>
                  <input className="form-input" placeholder="Start typing…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                </div>
                {patients.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {patients.map(p => (
                      <button key={p.id} className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 12 }}
                        onClick={() => { setForm(f => ({ ...f, patient_id: p.id, patient_name: p.full_name })); setStep(2); }}>
                        <span style={{ fontWeight: 600 }}>👤 {p.full_name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.phone} · {p.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {search.length >= 2 && patients.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 16 }}>No patients found.</p>
                )}
                <button className="btn btn-outline" onClick={() => setShowNewPatient(true)}>＋ Register New Patient</button>
              </>
            ) : (
              <>
                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name <span>*</span></label>
                    <input className="form-input" value={newPatient.full_name} onChange={e => setNewPatient(p => ({ ...p, full_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone <span>*</span></label>
                    <input className="form-input" value={newPatient.phone} onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={newPatient.email} onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medical History</label>
                    <input className="form-input" value={newPatient.medical_history} onChange={e => setNewPatient(p => ({ ...p, medical_history: e.target.value }))} />
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 16 }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📍 Location</p>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Street Address</label>
                    <input className="form-input" placeholder="123 Main Street" value={newPatient.address} onChange={e => setNewPatient(p => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input className="form-input" placeholder="Mumbai" value={newPatient.city} onChange={e => setNewPatient(p => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input className="form-input" placeholder="Maharashtra" value={newPatient.state} onChange={e => setNewPatient(p => ({ ...p, state: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PIN Code</label>
                      <input className="form-input" placeholder="400001" value={newPatient.pincode} onChange={e => setNewPatient(p => ({ ...p, pincode: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={handleCreatePatient} disabled={creatingPatient}>
                    {creatingPatient ? <><span className="spinner" /> Saving…</> : 'Create & Continue →'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setShowNewPatient(false)}>Back</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Choose Doctor & Time</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Patient: <strong>{form.patient_name}</strong></span>
          </div>
          <div className="card-body">
            <div className="form-grid" style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label className="form-label">Doctor <span>*</span></label>
                <select className="form-select" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
                  <option value="">Select a doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date <span>*</span></label>
                <input type="date" className="form-input" value={form.date} min={format(new Date(), 'yyyy-MM-dd')} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select className="form-select" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <input className="form-input" placeholder="Reason for visit…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Available Slots {loadingSlots && '(loading…)'}</label>
              {!form.doctor_id && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Select a doctor to see available slots.</p>}
              {form.doctor_id && slots.length === 0 && !loadingSlots && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No available slots on this date. Try another date.</p>
              )}
              <div className="slots-grid">
                {slots.map(s => (
                  <button key={s.start_time} className={`slot ${form.selected_slot?.start_time === s.start_time ? 'selected' : ''}`} onClick={() => setForm(f => ({ ...f, selected_slot: s }))}>
                    {format(new Date(s.start_time), 'HH:mm')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!form.selected_slot || !form.doctor_id}>
                Review Booking →
              </button>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Confirm Appointment</span></div>
          <div className="card-body">
            <div style={{ background: 'var(--accent-light)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 20, borderLeft: '4px solid var(--accent)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', fontSize: '0.9rem' }}>
                {[
                  ['Patient', form.patient_name],
                  ['Doctor', `Dr. ${selectedDoctor?.full_name}`],
                  ['Date', format(new Date(form.date), 'EEEE, MMMM do yyyy')],
                  ['Time', `${format(new Date(form.selected_slot.start_time), 'HH:mm')} – ${format(new Date(form.selected_slot.end_time), 'HH:mm')}`],
                  ['Duration', `${form.duration} minutes`],
                  form.notes && ['Notes', form.notes],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary btn-lg" onClick={handleBook} disabled={saving}>
                {saving ? <><span className="spinner" /> Booking…</> : '✓ Confirm Appointment'}
              </button>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}