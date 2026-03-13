const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('clinic_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  // Appointments
  getAppointments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/appointments${q ? '?' + q : ''}`);
  },
  getTodayAppointments: () => request('/appointments/today'),
  getAppointment: (id) => request(`/appointments/${id}`),
  createAppointment: (body) => request('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id, status) => request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  reschedule: (id, body) => request(`/appointments/${id}/reschedule`, { method: 'PUT', body: JSON.stringify(body) }),
  getAvailableSlots: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/appointments/available-slots?${q}`);
  },
  getStats: () => request('/appointments/stats/summary'),

  // Patients
  getPatients: (search) => request(`/patients${search ? '?search=' + encodeURIComponent(search) : ''}`),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (body) => request('/patients', { method: 'POST', body: JSON.stringify(body) }),
  updatePatient: (id, body) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  // Doctors
  getDoctors: () => request('/doctors'),
  getDoctorSchedule: (id, params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/doctors/${id}/schedule${q ? '?' + q : ''}`);
  },
};
