'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, ShieldCheck, Building2, Phone } from 'lucide-react'
import styles from './login.module.css'

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerType, setRegisterType] = useState<'CLINIC' | 'PATIENT'>('CLINIC')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Login State
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Clinic Registration State
  const [clinicName, setClinicName] = useState('')
  const [doctor, setDoctor] = useState({ name: '', username: '', password: '' })
  const [receptionist, setReceptionist] = useState({ name: '', username: '', password: '' })

  // Patient Registration State
  const [patient, setPatient] = useState({ name: '', phone: '', username: '', password: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      if (data.user.role === 'DOCTOR') {
        router.push('/dashboard/doctor')
      } else if (data.user.role === 'PATIENT') {
        router.push('/dashboard/patient')
      } else {
        router.push('/dashboard/receptionist')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const body = registerType === 'CLINIC' 
      ? { doctor, receptionist, clinicName, role: 'CLINIC' }
      : { ...patient, role: 'PATIENT' }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      // Redirect based on type
      if (registerType === 'CLINIC') {
        router.push('/dashboard/doctor')
      } else {
        router.push('/dashboard/patient')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.loginCard} ${isRegistering ? styles.registerMode : ''}`}>
        <h1 className={styles.title}>MediSync Clinic OS</h1>
        <p className={styles.subtitle}>
          {isRegistering 
            ? 'Join MediSync to manage your clinic or book appointments.' 
            : 'Welcome back! Please login to your account.'}
        </p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        {!isRegistering ? (
          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                placeholder="Enter your username"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.4rem', borderRadius: '16px', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
              <button 
                onClick={() => setRegisterType('CLINIC')}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: registerType === 'CLINIC' ? 'white' : 'transparent', fontWeight: 700, cursor: 'pointer', boxShadow: registerType === 'CLINIC' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none', color: registerType === 'CLINIC' ? '#3b82f6' : '#64748b' }}
              >
                Register Clinic
              </button>
              <button 
                onClick={() => setRegisterType('PATIENT')}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none', background: registerType === 'PATIENT' ? 'white' : 'transparent', fontWeight: 700, cursor: 'pointer', boxShadow: registerType === 'PATIENT' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none', color: registerType === 'PATIENT' ? '#3b82f6' : '#64748b' }}
              >
                Patient Account
              </button>
            </div>

            <form className={styles.form} onSubmit={handleRegister}>
              {registerType === 'CLINIC' ? (
                <div className="animate-fade">
                  <div className={styles.field} style={{ maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                    <label className={styles.label}>Clinic Name</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        className={styles.input}
                        style={{ paddingLeft: '3rem', width: '100%' }}
                        type="text"
                        required
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        placeholder="e.g. City General Hospital"
                      />
                    </div>
                  </div>

                  <div className={styles.registrationGrid}>
                    <div className={styles.column}>
                      <h3 className={styles.sectionTitle}><ShieldCheck size={18} /> Doctor's Credentials</h3>
                      <div className={styles.field}>
                        <label className={styles.label}>Doctor's Full Name</label>
                        <input
                          className={styles.input}
                          type="text"
                          required
                          value={doctor.name}
                          onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
                          placeholder="e.g. Dr. John Doe"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Set Username</label>
                        <input
                          className={styles.input}
                          type="text"
                          required
                          value={doctor.username}
                          onChange={(e) => setDoctor({ ...doctor, username: e.target.value })}
                          placeholder="dr_username"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Set Password</label>
                        <input
                          className={styles.input}
                          type="password"
                          required
                          value={doctor.password}
                          onChange={(e) => setDoctor({ ...doctor, password: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className={styles.column}>
                      <h3 className={styles.sectionTitle}><User size={18} /> Receptionist's Credentials</h3>
                      <div className={styles.field}>
                        <label className={styles.label}>Receptionist's Full Name</label>
                        <input
                          className={styles.input}
                          type="text"
                          required
                          value={receptionist.name}
                          onChange={(e) => setReceptionist({ ...receptionist, name: e.target.value })}
                          placeholder="e.g. Jane Smith"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Set Username</label>
                        <input
                          className={styles.input}
                          type="text"
                          required
                          value={receptionist.username}
                          onChange={(e) => setReceptionist({ ...receptionist, username: e.target.value })}
                          placeholder="rec_username"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Set Password</label>
                        <input
                          className={styles.input}
                          type="password"
                          required
                          value={receptionist.password}
                          onChange={(e) => setReceptionist({ ...receptionist, password: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-fade" style={{ maxWidth: '500px', margin: '0 auto' }}>
                  <h3 className={styles.sectionTitle}><User size={18} /> Create Patient Account</h3>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Name</label>
                    <input
                      className={styles.input}
                      type="text"
                      required
                      value={patient.name}
                      onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                      placeholder="e.g. Piyush Sharma"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        className={styles.input}
                        style={{ paddingLeft: '3rem', width: '100%' }}
                        type="text"
                        required
                        value={patient.phone}
                        onChange={(e) => setPatient({ ...patient, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className={styles.field}>
                      <label className={styles.label}>Username</label>
                      <input
                        className={styles.input}
                        type="text"
                        required
                        value={patient.username}
                        onChange={(e) => setPatient({ ...patient, username: e.target.value })}
                        placeholder="Choose username"
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Password</label>
                      <input
                        className={styles.input}
                        type="password"
                        required
                        value={patient.password}
                        onChange={(e) => setPatient({ ...patient, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              )}
              <button className={styles.button} type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : (registerType === 'CLINIC' ? 'Complete Clinic Registration' : 'Register Patient Account')}
              </button>
            </form>
          </div>
        )}

        <div className={styles.toggleContainer}>
          {isRegistering ? (
            <p>
              Already have an account? 
              <button className={styles.toggleButton} onClick={() => setIsRegistering(false)}>Sign In</button>
            </p>
          ) : (
            <p>
              New to MediSync? 
              <button className={styles.toggleButton} onClick={() => setIsRegistering(true)}>Register</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
