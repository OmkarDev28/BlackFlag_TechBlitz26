import express from 'express';
import supabase from '../config/supabase.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Helper: check for appointment clash
async function hasClash(doctor_id, start_time, end_time, excludeId = null) {
  let query = supabase
    .from('appointments')
    .select('id')
    .eq('doctor_id', doctor_id)
    .neq('status', 'cancelled')
    .or(
      `and(start_time.lt.${end_time},end_time.gt.${start_time})`
    );

  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.length > 0;
}

// GET /api/appointments - List appointments (filtered by role)
router.get('/', async (req, res) => {
  try {
    const { date, status, doctor_id } = req.query;

    let query = supabase
      .from('appointments')
      .select('*, doctor:users!appointments_doctor_id_fkey(id, full_name), patient:patients(id, full_name, phone, email)')
      .order('start_time');

    // Doctors only see their own appointments
    if (req.user.role === 'doctor') {
      query = query.eq('doctor_id', req.user.id);
    } else if (doctor_id) {
      query = query.eq('doctor_id', doctor_id);
    }

    if (status) query = query.eq('status', status);
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query = query.gte('start_time', start.toISOString()).lte('start_time', end.toISOString());
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/appointments/today - Today's schedule
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    let query = supabase
      .from('appointments')
      .select('*, doctor:users!appointments_doctor_id_fkey(id, full_name), patient:patients(id, full_name, phone, email)')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .neq('status', 'cancelled')
      .order('start_time');

    if (req.user.role === 'doctor') {
      query = query.eq('doctor_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/appointments/available-slots - Get available time slots for a doctor on a date
router.get('/available-slots', async (req, res) => {
  const { doctor_id, date, duration = 30 } = req.query;

  if (!doctor_id || !date) {
    return res.status(400).json({ error: 'doctor_id and date are required' });
  }

  try {
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(17, 0, 0, 0);

    const { data: existingAppts } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('doctor_id', doctor_id)
      .neq('status', 'cancelled')
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString());

    const slots = [];
    const slotDuration = parseInt(duration);
    let current = new Date(dayStart);

    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60000);
      if (slotEnd > dayEnd) break;

      const isBusy = (existingAppts || []).some((appt) => {
        const apptStart = new Date(appt.start_time);
        const apptEnd = new Date(appt.end_time);
        return current < apptEnd && slotEnd > apptStart;
      });

      if (!isBusy) {
        slots.push({
          start_time: current.toISOString(),
          end_time: slotEnd.toISOString(),
        });
      }

      current = new Date(current.getTime() + slotDuration * 60000);
    }

    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, doctor:users!appointments_doctor_id_fkey(id, full_name, email), patient:patients(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Appointment not found' });

    if (req.user.role === 'doctor' && data.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/appointments - Book appointment (receptionist or doctor)
router.post('/', async (req, res) => {
  const { doctor_id, patient_id, start_time, end_time, notes } = req.body;

  if (!doctor_id || !patient_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'doctor_id, patient_id, start_time, end_time are required' });
  }

  // Validate time range
  const start = new Date(start_time);
  const end = new Date(end_time);
  if (start >= end) return res.status(400).json({ error: 'end_time must be after start_time' });
  if (start < new Date()) return res.status(400).json({ error: 'Cannot book appointments in the past' });

  try {
    // Verify doctor exists and is a doctor
    const { data: doctor } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', doctor_id)
      .eq('role', 'doctor')
      .single();

    if (!doctor) return res.status(400).json({ error: 'Doctor not found' });

    // Check for clash
    const clash = await hasClash(doctor_id, start_time, end_time);
    if (clash) {
      return res.status(409).json({ error: 'Time slot is already booked. Please choose a different time.' });
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([{ doctor_id, patient_id, start_time, end_time, notes, status: 'scheduled' }])
      .select('*, doctor:users!appointments_doctor_id_fkey(id, full_name), patient:patients(id, full_name, phone)')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// PATCH /api/appointments/:id/status - Update status (cancel, complete)
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const { data: appt } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    if (req.user.role === 'doctor' && appt.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', req.params.id)
      .select('*, doctor:users!appointments_doctor_id_fkey(id, full_name), patient:patients(id, full_name)')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/appointments/:id/reschedule - Reschedule appointment
router.put('/:id/reschedule', async (req, res) => {
  const { start_time, end_time } = req.body;

  if (!start_time || !end_time) {
    return res.status(400).json({ error: 'start_time and end_time are required' });
  }

  const start = new Date(start_time);
  const end = new Date(end_time);
  if (start >= end) return res.status(400).json({ error: 'end_time must be after start_time' });
  if (start < new Date()) return res.status(400).json({ error: 'Cannot reschedule to the past' });

  try {
    const { data: appt } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.status === 'cancelled') return res.status(400).json({ error: 'Cannot reschedule a cancelled appointment' });

    if (req.user.role === 'doctor' && appt.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for clash excluding this appointment
    const clash = await hasClash(appt.doctor_id, start_time, end_time, req.params.id);
    if (clash) {
      return res.status(409).json({ error: 'New time slot is already booked. Please choose a different time.' });
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ start_time, end_time, status: 'scheduled' })
      .eq('id', req.params.id)
      .select('*, doctor:users!appointments_doctor_id_fkey(id, full_name), patient:patients(id, full_name, phone)')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// GET /api/appointments/stats/summary - Dashboard stats
router.get('/stats/summary', async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    let doctorFilter = {};
    if (req.user.role === 'doctor') doctorFilter = { doctor_id: req.user.id };

    const [todayAppts, scheduledAppts, completedAppts, cancelledAppts, totalPatients] = await Promise.all([
      supabase.from('appointments').select('id', { count: 'exact' }).gte('start_time', todayStart).lte('start_time', todayEnd).neq('status', 'cancelled').match(doctorFilter),
      supabase.from('appointments').select('id', { count: 'exact' }).eq('status', 'scheduled').match(doctorFilter),
      supabase.from('appointments').select('id', { count: 'exact' }).eq('status', 'completed').match(doctorFilter),
      supabase.from('appointments').select('id', { count: 'exact' }).eq('status', 'cancelled').match(doctorFilter),
      supabase.from('patients').select('id', { count: 'exact' }),
    ]);

    res.json({
      today: todayAppts.count || 0,
      scheduled: scheduledAppts.count || 0,
      completed: completedAppts.count || 0,
      cancelled: cancelledAppts.count || 0,
      total_patients: totalPatients.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
