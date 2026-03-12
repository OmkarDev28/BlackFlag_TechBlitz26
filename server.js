import 'dotenv/config'; // Automatically loads .env variables
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js'; // Extension is required for local files

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('Clinic OS API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  🚀 Server started on port ${PORT}
  🔗 Auth Endpoints: http://localhost:${PORT}/api/auth
  `);
});