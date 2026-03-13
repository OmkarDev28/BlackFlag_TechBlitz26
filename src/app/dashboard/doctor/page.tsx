'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Clock, User, MessageSquare } from 'lucide-react'
import styles from '../dashboard.module.css'

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  const fetchAppointments = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const res = await fetch(`/api/appointments?date=${today}`)
      const data = await res.json()
      setAppointments(data)
    } catch (err) {
      console.error(err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()

    // Background polling: Refresh queue every 10 seconds to catch new bookings
    const interval = setInterval(() => {
      fetchAppointments(false)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const markCompleted = async (id: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    fetchAppointments()
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1>Doctor's Daily Queue</h1>
          <p style={{ color: '#64748b' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} animate-fade`} style={{ animationDelay: '0.1s' }}>
          <span className={styles.statLabel}>Patients Remaining</span>
          <span className={styles.statValue}>{appointments.filter(a => a.status === 'BOOKED').length}</span>
        </div>
        <div className={`${styles.statCard} animate-fade`} style={{ animationDelay: '0.2s' }}>
          <span className={styles.statLabel}>Completed Today</span>
          <span className={styles.statValue}>{appointments.filter(a => a.status === 'COMPLETED').length}</span>
        </div>
      </div>

      <div className={styles.card}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Upcoming Patients</h2>
        {loading ? (
          <p>Loading queue...</p>
        ) : appointments.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No more patients for today.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {appointments.map((app) => (
              <div key={app.id} className={styles.statCard} style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem',
                backgroundColor: app.status === 'COMPLETED' ? '#f8fafc' : 'white',
                opacity: app.status === 'COMPLETED' ? 0.7 : 1,
                gap: '1.5rem'
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1 }}>
                  <div style={{ textAlign: 'center', minWidth: '80px', padding: '0.5rem', background: '#f1f5f9', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>
                      {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      {Math.round((new Date(app.endTime).getTime() - new Date(app.startTime).getTime()) / 60000)} min
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <User size={18} color="#3b82f6" />
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{app.patient.name}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                      <MessageSquare size={14} />
                      {app.reason || 'General Checkup'}
                    </div>
                  </div>
                </div>
                <div>
                  {app.status === 'BOOKED' ? (
                    <button 
                      onClick={() => markCompleted(app.id)}
                      className={styles.btnPrimary}
                      style={{ background: '#10b981', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                    >
                      <CheckCircle size={18} /> Mark Done
                    </button>
                  ) : (
                    <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                      <CheckCircle size={20} /> Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
