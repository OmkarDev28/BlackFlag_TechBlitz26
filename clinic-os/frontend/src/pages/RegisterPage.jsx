import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '', role: 'receptionist' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm_password) return setError('Passwords do not match');

    setLoading(true);
    try {
      await api.register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      setSuccess('Account created! You can now sign in.');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message || 'Registration failed');
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
          <p>Create a staff account to start managing your clinic's appointments and patients.</p>
        </div>

        <div className="login-features">
          {[
            { icon: '👨‍⚕️', text: 'Doctor — view your schedule & manage appointments' },
            { icon: '🗂️', text: 'Receptionist — full booking & patient management' },
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
          <h2>Create account</h2>
          <p>Register a new staff member</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">⚠ {error}</div>}
          {success && <div className="alert alert-success">✓ {success}</div>}

          <div className="form-group">
            <label className="form-label">Full Name <span>*</span></label>
            <input
              className="form-input"
              placeholder="Dr. Jane Smith"
              value={form.full_name}
              onChange={set('full_name')}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email address <span>*</span></label>
            <input
              type="email"
              className="form-input"
              placeholder="staff@clinic.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role <span>*</span></label>
            <select className="form-select" value={form.role} onChange={set('role')}>
              <option value="receptionist">Receptionist</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Password <span>*</span></label>
            <input
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password <span>*</span></label>
            <input
              type="password"
              className="form-input"
              placeholder="Re-enter password"
              value={form.confirm_password}
              onChange={set('confirm_password')}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: 4 }}
          >
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
