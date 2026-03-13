import express from 'express';
import supabase from '../config/supabase.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// GET /api/doctors - List all doctors
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, created_at')
      .eq('role', 'doctor')
      .order('full_name');

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/doctors/:id/schedule - Doctor's weekly schedule
router.get('/:id/schedule', async (req, res) => {
  const { week_start } = req.query; // ISO date string for start of week

  try {
    const startDate = week_start ? new Date(week_start) : new Date();
    startDate.setHours(0, 0, 0, 0);

    // Go to Monday of the week
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(id, full_name, phone)')
      .eq('doctor_id', req.params.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .neq('status', 'cancelled')
      .order('start_time');

    if (error) return res.status(400).json({ error: error.message });
    res.json({ week_start: startDate.toISOString(), week_end: endDate.toISOString(), appointments: data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
