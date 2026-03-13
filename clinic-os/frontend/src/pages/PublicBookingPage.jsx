import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import PublicLayout from '../components/PublicLayout';
import { api } from '../utils/api';

export default function PublicBookingPage() {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [patient, setPatient] = useState({
    full_name: '', phone: '', email: '',
    address: '', city: '', state: '', pincode: '',
  });

  const [booking, setBooking] = useState({
    doctor_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    duration: '30',
    selected_slot: null,
    notes: '',
  });

  useEffect(() => {
    api.getDoctors().then(setDoctors).catch(console.error);
  }, []);

  const loadSlots = useCallback(async () => {
    if (!booking.doctor_id || !booking.date) return;
    setLoadingSlots(true);
    setBooking(b => ({ ...b, selected_slot: null }));
    try {
      const s = await api.getAvailableSlots({ doctor_id: booking.doctor_id, date: booking.date, duration: booking.duration });
      setSlots(s);
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  }, [booking.doctor_id, booking.date, booking.duration]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const setP = k => e => setPatient(p => ({ ...p, [k]: e.target.value }));
  const setB = k => e => setBooking(b => ({ ...b, [k]: e.target.value }));

  const handleBook = async () => {
    setSaving(true);
    setError('');
    try {
      // 1. Create or find patient
      let patientId;
      try {
        const created = await api.createPatient(patient);
        patientId = created.id;
      } catch (e) {
        // If email already exists, search for them
        if (e.message.includes('already exists') && patient.email) {
          const existing = await api.getPatients(patient.email);
          if (existing.length > 0) patientId = existing[0].id;
          else throw e;
        } else throw e;
      }

      // 2. Book appointment
      await api.createAppointment({
        patient_id: patientId,
        doctor_id: booking.doctor_id,
        start_time: booking.selected_slot.start_time,
        end_time: booking.selected_slot.end_time,
        notes: booking.notes,
      });

      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === booking.doctor_id);

  if (done) {
    return (
      <PublicLayout>
        <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 12 }}>Appointment Booked!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.7 }}>
            Your appointment with <strong>Dr. {selectedDoctor?.full_name}</strong> on{' '}
            <strong>{format(new Date(booking.selected_slot.start_time), 'EEEE, MMMM do')}</strong> at{' '}
            <strong>{format(new Date(booking.selected_slot.start_time), 'HH:mm')}</strong> has been confirmed.
          </p>
          <div style={{ background: 'var(--accent-light)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
            {[
              ['Patient', patient.full_name],
              ['Doctor', `Dr. ${selectedDoctor?.full_name}`],
              ['Date', format(new Date(booking.selected_slot.start_time), 'EEEE, MMMM do yyyy')],
              ['Time', `${format(new Date(booking.selected_slot.start_time), 'HH:mm')} – ${format(new Date(booking.selected_slot.end_time), 'HH:mm')}`],
              booking.notes && ['Notes', booking.notes],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(200,120,58,0.15)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Please arrive 10 minutes before your appointment time. Bring a valid ID and any previous medical records.
          </p>
          <button className="btn btn-primary" onClick={() => { setDone(false); setStep(1); setPatient({ full_name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' }); setBooking({ doctor_id: '', date: format(new Date(), 'yyyy-MM-dd'), duration: '30', selected_slot: null, notes: '' }); }}>
            Book Another Appointment
          </button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Book an Appointment</h1>
          <p className="page-subtitle">No account needed — fill in your details and pick a slot</p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, maxWidth: 600 }}>
        {['Your Details', 'Choose Slot', 'Confirm'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--accent)' : 'var(--border)',
              color: step >= i + 1 ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 600,
            }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.85rem', color: step === i + 1 ? 'var(--text)' : 'var(--text-muted)', fontWeight: step === i + 1 ? 500 : 400 }}>{label}</span>
            {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      {/* Step 1 — Patient details */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header"><span className="card-title">Your Details</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name <span>*</span></label>
                <input className="form-input" placeholder="Jane Doe" value={patient.full_name} onChange={setP('full_name')} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Phone <span>*</span></label>
                <input className="form-input" placeholder="+91 98765 43210" value={patient.phone} onChange={setP('phone')} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="you@email.com" value={patient.email} onChange={setP('email')} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📍 Your Address (optional)</p>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Street Address</label>
                <input className="form-input" placeholder="123 Main Street" value={patient.address} onChange={setP('address')} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" placeholder="Mumbai" value={patient.city} onChange={setP('city')} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="form-input" placeholder="Maharashtra" value={patient.state} onChange={setP('state')} />
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input className="form-input" placeholder="400001" value={patient.pincode} onChange={setP('pincode')} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!patient.full_name || !patient.phone) return setError('Name and phone are required');
                  setError('');
                  setStep(2);
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Slot */}
      {step === 2 && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header">
            <span className="card-title">Choose Doctor & Time</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{patient.full_name}</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Doctor <span>*</span></label>
                <select className="form-select" value={booking.doctor_id} onChange={setB('doctor_id')}>
                  <option value="">Select a doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date <span>*</span></label>
                <input type="date" className="form-input" value={booking.date} min={format(new Date(), 'yyyy-MM-dd')} onChange={setB('date')} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select className="form-select" value={booking.duration} onChange={setB('duration')}>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for visit (optional)</label>
                <input className="form-input" placeholder="e.g. Follow-up, Checkup…" value={booking.notes} onChange={setB('notes')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Available Slots {loadingSlots && '(loading…)'}</label>
              {!booking.doctor_id && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Select a doctor first.</p>}
              {booking.doctor_id && !loadingSlots && slots.length === 0 && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No slots available on this date. Try another date.</p>
              )}
              <div className="slots-grid">
                {slots.map(s => (
                  <button key={s.start_time} className={`slot ${booking.selected_slot?.start_time === s.start_time ? 'selected' : ''}`} onClick={() => setBooking(b => ({ ...b, selected_slot: s }))}>
                    {format(new Date(s.start_time), 'HH:mm')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => { if (!booking.selected_slot || !booking.doctor_id) return setError('Select a doctor and time slot'); setError(''); setStep(3); }} disabled={!booking.selected_slot}>
                Review →
              </button>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="card-header"><span className="card-title">Confirm Your Appointment</span></div>
          <div className="card-body">
            <div style={{ background: 'var(--accent-light)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 20, borderLeft: '4px solid var(--accent)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '0.9rem' }}>
                {[
                  ['Patient', patient.full_name],
                  ['Phone', patient.phone],
                  ['Doctor', `Dr. ${selectedDoctor?.full_name}`],
                  ['Date', format(new Date(booking.date), 'EEEE, MMMM do yyyy')],
                  ['Time', `${format(new Date(booking.selected_slot.start_time), 'HH:mm')} – ${format(new Date(booking.selected_slot.end_time), 'HH:mm')}`],
                  ['Duration', `${booking.duration} minutes`],
                  booking.notes && ['Notes', booking.notes],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontWeight: 500 }}>{v}</div>
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
    </PublicLayout>
  );
}
