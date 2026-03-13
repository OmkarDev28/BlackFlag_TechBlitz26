import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

export default function PublicHomePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <div style={{
        background: 'var(--bg-sidebar)', borderRadius: 'var(--radius)',
        padding: '56px 48px', marginBottom: 28, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(200,120,58,0.08)', top: -120, right: -80,
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            Welcome to
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', color: '#fff', fontWeight: 400, lineHeight: 1.2, marginBottom: 16 }}>
            Clinic OS<br />Medical Centre
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 28 }}>
            Providing quality healthcare with experienced doctors. Book your appointment online in minutes — no phone calls needed.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/public/book" className="btn btn-primary btn-lg">📅 Book Appointment</Link>
            <Link to="/public/location" className="btn btn-outline btn-lg" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
              📍 Find Us
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '👨‍⚕️', title: 'Expert Doctors', desc: 'Board-certified specialists across multiple disciplines available 6 days a week.' },
          { icon: '📅', title: 'Easy Booking', desc: 'Book, reschedule or cancel appointments online anytime without calling in.' },
          { icon: '⚡', title: 'Quick Appointments', desc: 'Minimal wait times. We respect your schedule as much as our own.' },
        ].map(f => (
          <div className="card" key={f.title} style={{ padding: '24px' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="card" style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: 4 }}>Ready to book your visit?</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Takes less than 2 minutes. No account needed.</div>
        </div>
        <Link to="/public/book" className="btn btn-primary btn-lg" style={{ flexShrink: 0 }}>Book Now →</Link>
      </div>
    </PublicLayout>
  );
}
