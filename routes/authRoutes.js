import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_hackathon_secret_key';

// 1. REGISTER
router.post('/register', async (req, res) => {
  const { email, password, full_name, role } = req.body;

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert into our custom users table
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password_hash, full_name, role }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: "Email already exists" });
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "User registered successfully", userId: data.id });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(401).json({ error: "Invalid credentials" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Create JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;