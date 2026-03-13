'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar as CalendarIcon, Phone, User, Clock, Trash2, XCircle, Edit, Search, UserCheck } from 'lucide-react'
import styles from '../dashboard.module.css'

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExistingPatientMode, setIsExistingPatientMode] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Form State
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const fetchAppointments = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const res = await fetch(`/api/appointments?date=${selectedDate}`)
      const data = await res.json()
      setAppointments(data)
    } catch (err) {
      console.error(err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      setPatients(data)
    } catch (err) {
      console.error('Failed to fetch patients:', err)
    }
  }

  useEffect(() => {
    fetchAppointments()
    fetchPatients()

    const interval = setInterval(() => {
      fetchAppointments(false)
    }, 10000)

    return () => clearInterval(interval)
  }, [selectedDate])

  const openBookModal = () => {
    setEditingAppointmentId(null)
    setPatientName('')
    setPatientPhone('')
    setStartTime('')
    setEndTime('')
    setReason('')
    setError('')
    setIsExistingPatientMode(false)
    setPatientSearch('')
    setIsModalOpen(true)
  }

  const selectExistingPatient = (patient: any) => {
    setPatientName(patient.name)
    setPatientPhone(patient.phone)
    setIsExistingPatientMode(false)
  }

  const openRescheduleModal = (app: any) => {
    setEditingAppointmentId(app.id)
    setPatientName(app.patient.name)
    setPatientPhone(app.patient.phone)
    
    const startDt = new Date(app.startTime)
    const endDt = new Date(app.endTime)
    setStartTime(startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
    setEndTime(endDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
    
    setReason(app.reason || '')
    setError('')
    setIsExistingPatientMode(false)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const startDateTime = new Date(`${selectedDate}T${startTime}`).toISOString()
    const endDateTime = new Date(`${selectedDate}T${endTime}`).toISOString()

    try {
      let res;
      if (editingAppointmentId) {
        res = await fetch(`/api/appointments/${editingAppointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: startDateTime,
            endTime: endDateTime,
            reason,
            status: 'BOOKED'
          }),
        })
      } else {
        res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientName,
            patientPhone,
            startTime: startDateTime,
            endTime: endDateTime,
            reason,
          }),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to process request')

      setIsModalOpen(false)
      fetchAppointments()
      fetchPatients() // Refresh patient list in case a new one was added
      
      setEditingAppointmentId(null)
      setPatientName('')
      setPatientPhone('')
      setStartTime('')
      setEndTime('')
      setReason('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const cancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELED' }),
    })
    fetchAppointments()
  }

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
    p.phone.includes(patientSearch)
  )

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1>Receptionist Dashboard</h1>
          <p style={{ color: '#64748b' }}>Manage daily clinic operations</p>
        </div>
        <button onClick={openBookModal} className={styles.btnPrimary}>
          <Plus size={20} /> New Appointment
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} animate-fade`} style={{ animationDelay: '0.1s' }}>
          <span className={styles.statLabel}>Today's Appointments</span>
          <span className={styles.statValue}>{appointments.length}</span>
        </div>
        <div className={`${styles.statCard} animate-fade`} style={{ animationDelay: '0.2s' }}>
          <span className={styles.statLabel}>Date Selection</span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', marginTop: '0.5rem', cursor: 'pointer', outline: 'none', background: 'rgba(255,255,255,0.5)' }}
          />
        </div>
      </div>

      <div className={`${styles.card} animate-scale`}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 800 }}>Schedule</h2>
        {loading ? (
          <p>Loading schedule...</p>
        ) : appointments.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No appointments scheduled for this day.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>Phone</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>
                      {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {Math.round((new Date(app.endTime).getTime() - new Date(app.startTime).getTime()) / 60000)} min
                    </div>
                  </td>
                  <td><strong>{app.patient.name}</strong></td>
                  <td style={{ color: '#64748b' }}>{app.patient.phone}</td>
                  <td>{app.reason}</td>
                  <td>
                    <span className={`${styles.statusTag} ${app.status === 'BOOKED' ? styles.statusBooked : styles.statusCompleted}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={() => openRescheduleModal(app)}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
                        title="Reschedule Appointment"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => cancelAppointment(app.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Cancel Appointment"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{editingAppointmentId ? 'Reschedule Appointment' : 'Book New Appointment'}</h2>
              {!editingAppointmentId && (
                <button 
                  onClick={() => setIsExistingPatientMode(!isExistingPatientMode)}
                  className={styles.btnPrimary}
                  style={{ background: isExistingPatientMode ? '#64748b' : '#3b82f6', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                >
                  {isExistingPatientMode ? 'Back to Form' : 'Add Existing Patient'}
                </button>
              )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {isExistingPatientMode ? (
              <div className="animate-fade">
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.75rem', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                    autoFocus
                  />
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredPatients.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>No patients found.</p>
                  ) : (
                    filteredPatients.map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectExistingPatient(p)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                        }}
                        className="patient-item"
                      >
                        <div style={{ width: '32px', height: '32px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                          <User size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.phone}</div>
                        </div>
                        <UserCheck size={18} color="#10b981" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Patient Name</label>
                    <input required disabled={!!editingAppointmentId} value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Full Name" style={{ width: '100%', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: editingAppointmentId ? '#f1f5f9' : 'white', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Phone Number</label>
                    <input 
                      required 
                      disabled={!!editingAppointmentId} 
                      value={patientPhone} 
                      onChange={e => setPatientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                      placeholder="10-digit number"
                      maxLength={10}
                      pattern="\d{10}"
                      style={{ width: '100%', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: editingAppointmentId ? '#f1f5f9' : 'white', outline: 'none' }} 
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Start Time</label>
                    <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>End Time</label>
                    <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#475569' }}>Reason for Visit</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Regular Checkup" style={{ width: '100%', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '12px', height: '80px', outline: 'none', resize: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '1rem', background: '#f1f5f9', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, color: '#64748b' }}>Cancel</button>
                  <button type="submit" className={styles.btnPrimary} style={{ flex: 1, justifyContent: 'center' }}>
                    {editingAppointmentId ? 'Update Timings' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
