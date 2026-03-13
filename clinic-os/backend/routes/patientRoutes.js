import express from 'express';
import supabase from '../config/supabase.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All patient routes require authentication
router.use(protect);

// GET /api/patients - List all patients
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase.from('patients').select('*').order('full_name');

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/patients/:id - Get single patient with appointment history
router.get('/:id', async (req, res) => {
  try {
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (patientError || !patient) return res.status(404).json({ error: 'Patient not found' });

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, doctor:users(full_name)')
      .eq('patient_id', req.params.id)
      .order('start_time', { ascending: false });

    res.json({ ...patient, appointments: appointments || [] });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/patients - Create patient
router.post('/', async (req, res) => {
  const { full_name, email, phone, medical_history, address, city, state, pincode } = req.body;

  if (!full_name || !phone) {
    return res.status(400).json({ error: 'full_name and phone are required' });
  }

  try {
    const { data, error } = await supabase
      .from('patients')
      .insert([{ full_name, email, phone, medical_history, address, city, state, pincode }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/patients/:id - Update patient
router.put('/:id', async (req, res) => {
  const { full_name, email, phone, medical_history, address, city, state, pincode } = req.body;

  try {
    const { data, error } = await supabase
      .from('patients')
      .update({ full_name, email, phone, medical_history, address, city, state, pincode })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Patient not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('patients').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;