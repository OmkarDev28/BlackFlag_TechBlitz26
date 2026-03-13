import { Link, useLocation } from 'react-router-dom';

export default function PublicLayout({ children }) {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top nav */}
      <header style={{
        background: 'var(--bg-sidebar)',
        padding: '0 36px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link to="/public" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🏥</div>
          <span style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.1rem' }}>Clinic OS</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link
            to="/public"
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: '0.88rem', textDecoration: 'none',
              color: location.pathname === '/public' ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
              background: location.pathname === '/public' ? 'rgba(200,120,58,0.15)' : 'transparent',
            }}
          >
            🏥 About
          </Link>
          <Link
            to="/public/location"
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: '0.88rem', textDecoration: 'none',
              color: location.pathname === '/public/location' ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
              background: location.pathname === '/public/location' ? 'rgba(200,120,58,0.15)' : 'transparent',
            }}
          >
            📍 Location
          </Link>
          <Link
            to="/public/book"
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: '0.88rem', textDecoration: 'none',
              color: location.pathname === '/public/book' ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
              background: location.pathname === '/public/book' ? 'rgba(200,120,58,0.15)' : 'transparent',
            }}
          >
            📅 Book Appointment
          </Link>
          <Link to="/login" style={{
            marginLeft: 8, padding: '7px 16px', borderRadius: 8, fontSize: '0.85rem',
            background: 'var(--accent)', color: '#fff', textDecoration: 'none', fontWeight: 500,
          }}>
            Staff Login →
          </Link>
        </nav>
      </header>

      <div style={{ padding: '36px', maxWidth: 1100, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}
