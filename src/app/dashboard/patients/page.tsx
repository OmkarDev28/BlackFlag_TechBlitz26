'use client'

import { useState, useEffect } from 'react'
import { User, Phone, Mail, Calendar, Search } from 'lucide-react'
import styles from '../dashboard.module.css'

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      setPatients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.phone.includes(search)
  )

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1>Patient Records</h1>
          <p style={{ color: '#64748b' }}>Complete list of all registered patients</p>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.75rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
          />
        </div>
      </div>

      <div className={`${styles.card} animate-scale`}>
        {loading ? (
          <p>Loading patients...</p>
        ) : filteredPatients.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No patients found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Total Appointments</th>
                <th>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 700, fontSize: '1rem', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)' }}>
                        {patient.name[0].toUpperCase()}
                      </div>
                      <strong style={{ color: '#1e293b' }}>{patient.name}</strong>
                    </div>
                  </td>
                  <td style={{ color: '#64748b', fontWeight: 500 }}>{patient.phone}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '0.25rem 0.75rem', background: '#f1f5f9', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
                      {patient._count.appointments}
                    </span>
                  </td>
                  <td style={{ color: '#64748b' }}>
                    {patient.appointments[0] 
                      ? new Date(patient.appointments[0].startTime).toLocaleDateString(undefined, { dateStyle: 'medium' })
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
