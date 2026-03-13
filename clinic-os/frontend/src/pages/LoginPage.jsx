import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-icon">🏥</div>
          <h1>Clinic OS</h1>
          <p>The complete operating system for your medical practice. Simple, reliable, and always organised.</p>
        </div>

        <div className="login-features">
          {[
            { icon: '📅', text: 'Smart scheduling with clash prevention' },
            { icon: '👥', text: 'Role-based access for doctors & receptionists' },
            { icon: '📋', text: 'Full patient records & appointment history' },
            { icon: '🔔', text: 'Real-time schedule management' },
          ].map(f => (
            <div className="login-feature" key={f.text}>
              <div className="feat-icon">{f.icon}</div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-header">
          <h2>Welcome back</h2>
          <p>Sign in to your clinic account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">⚠ {error}</div>}

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@clinic.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign in →'}
          </button>
        </form>

        <p style={{ marginTop: 28, fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center' }}>
          Contact your administrator to create an account.
        </p>
      </div>
    </div>
  );
}
