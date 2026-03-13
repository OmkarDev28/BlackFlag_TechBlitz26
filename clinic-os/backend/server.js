import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Clinic OS API is running' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  🏥 Clinic OS API running on port ${PORT}
  📋 Auth:         http://localhost:${PORT}/api/auth
  📅 Appointments: http://localhost:${PORT}/api/appointments
  👤 Patients:     http://localhost:${PORT}/api/patients
  👨‍⚕️ Doctors:      http://localhost:${PORT}/api/doctors
  `);
});
