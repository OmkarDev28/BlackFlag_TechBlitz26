'use client'

import { useState, useEffect } from 'react'
import { Calendar, Search, Building2, Clock, User, CheckCircle, Plus, X } from 'lucide-react'
import styles from '../dashboard.module.css'

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [clinics, setClinics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [step, setStep] = useState<'SEARCH' | 'BOOK'>('SEARCH')
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClinic, setSelectedClinic] = useState<any>(null)
  
  // Booking state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [bookedSlots, setBookedSlots] = useState<any[]>([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [reason, setReason] = useState('')
  const [bookingError, setBookingError] = useState('')

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/appointments')
      const data = await res.json()
      setAppointments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClinics = async () => {
    try {
      const res = await fetch('/api/clinics')
      const data = await res.json()
      setClinics(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchBookedSlots = async (clinicId: string, date: string) => {
    try {
      const res = await fetch(`/api/appointments/available?clinicId=${clinicId}&date=${date}`)
      const data = await res.json()
      setBookedSlots(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchAppointments()
    fetchClinics()
  }, [])

  useEffect(() => {
    if (selectedClinic && selectedDate) {
      fetchBookedSlots(selectedClinic.clinicId, selectedDate)
    }
  }, [selectedClinic, selectedDate])

  const openBooking = () => {
    setStep('SEARCH')
    setSelectedClinic(null)
    setBookingError('')
    setIsBookingModalOpen(true)
  }

  const handleSelectClinic = (clinic: any) => {
    setSelectedClinic(clinic)
    setStep('BOOK')
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError('')

    const startDateTime = new Date(`${selectedDate}T${startTime}`).toISOString()
    const endDateTime = new Date(`${selectedDate}T${endTime}`).toISOString()

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: selectedClinic.clinicId,
          startTime: startDateTime,
          endTime: endDateTime,
          reason,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')

      setIsBookingModalOpen(false)
      fetchAppointments()
      // Reset
      setReason('')
      setStartTime('')
      setEndTime('')
    } catch (err: any) {
      setBookingError(err.message)
    }
  }

  const filteredClinics = clinics.filter(c => 
    c.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="animate-fade">
      <div className={styles.header}>
        <div>
          <h1>My Health Dashboard</h1>
          <p style={{ color: '#64748b' }}>Manage your clinical visits and history</p>
        </div>
        <button onClick={openBooking} className={styles.btnPrimary}>
          <Plus size={20} /> Book Appointment
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} liquid-glass`} style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <span className={styles.statLabel}>Upcoming Visits</span>
          <span className={styles.statValue}>{appointments.filter(a => a.status === 'BOOKED').length}</span>
        </div>
        <div className={`${styles.statCard} liquid-glass`}>
          <span className={styles.statLabel}>Total Consultations</span>
          <span className={styles.statValue}>{appointments.length}</span>
        </div>
      </div>

      <div className={`${styles.card} liquid-glass`}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 900 }}>Appointment History</h2>
        {loading ? (
          <p>Loading your appointments...</p>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Calendar size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>You don't have any appointments yet.</p>
            <button onClick={openBooking} style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Book your first visit now</button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Clinic</th>
                <th>Doctor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>
                      {new Date(app.startTime).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={16} color="#3b82f6" />
                      <strong>{app.clinicName}</strong>
                    </div>
                  </td>
                  <td>{app.doctorName || 'Assigned Staff'}</td>
                  <td>
                    <span className={`${styles.statusTag} ${app.status === 'BOOKED' ? styles.statusBooked : styles.statusCompleted}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isBookingModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{step === 'SEARCH' ? 'Find a Clinic' : 'Select Time Slot'}</h2>
              <button onClick={() => setIsBookingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>

            {step === 'SEARCH' ? (
              <div className="animate-fade">
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                  <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search by clinic name or doctor..."
                    className={styles.input}
                    style={{ width: '100%', paddingLeft: '3.5rem', background: '#f1f5f9' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                  {filteredClinics.length === 0 ? (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b', padding: '2rem' }}>No clinics found matching your search.</p>
                  ) : (
                    filteredClinics.map(clinic => (
                      <button
                        key={clinic.clinicId}
                        onClick={() => handleSelectClinic(clinic)}
                        style={{
                          background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.5rem',
                          textAlign: 'left', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex', flexDirection: 'column', gap: '0.75rem'
                        }}
                        className="clinic-card"
                      >
                        <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{clinic.clinicName}</div>
                          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Dr. {clinic.name}</div>
                        </div>
                        <div style={{ marginTop: 'auto', color: '#3b82f6', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Check Availability <CheckCircle size={14} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-fade">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#eff6ff', padding: '1rem', borderRadius: '16px', marginBottom: '2rem' }}>
                  <Building2 size={24} color="#3b82f6" />
                  <div>
                    <div style={{ fontWeight: 800, color: '#1e293b' }}>{selectedClinic.clinicName}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Booking with Dr. {selectedClinic.name}</div>
                  </div>
                  <button onClick={() => setStep('SEARCH')} style={{ marginLeft: 'auto', background: 'white', border: '1px solid #dbeafe', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', cursor: 'pointer' }}>Change Clinic</button>
                </div>

                {bookingError && <p className={styles.error}>{bookingError}</p>}

                <form onSubmit={handleBooking}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className={styles.label}>Choose Date</label>
                    <input 
                      type="date" 
                      className={styles.input} 
                      style={{ width: '100%' }} 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label className={styles.label}>Start Time</label>
                      <input type="time" className={styles.input} style={{ width: '100%' }} value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                    </div>
                    <div>
                      <label className={styles.label}>End Time</label>
                      <input type="time" className={styles.input} style={{ width: '100%' }} value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                    </div>
                  </div>

                  {bookedSlots.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9a3412', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} /> Already Booked Slots:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {bookedSlots.map((slot, i) => (
                          <span key={i} style={{ padding: '0.25rem 0.6rem', background: 'white', border: '1px solid #fed7aa', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#ea580c' }}>
                            {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '2rem' }}>
                    <label className={styles.label}>Reason for Visit</label>
                    <textarea 
                      className={styles.input} 
                      style={{ width: '100%', height: '100px', resize: 'none' }} 
                      placeholder="Tell us briefly about your concern..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className={styles.button} style={{ width: '100%' }}>Confirm Appointment</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
