const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const tripRoutes = require('./routes/tripRoutes');
const userRoutes = require('./routes/userRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowedLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):517\d+$/.test(origin);
      const isExplicitOrigin = allowedOrigins.includes(origin);

      if (isAllowedLocalhost || isExplicitOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SpendWise API is running securely.',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/user', userRoutes);
app.use('/api/invitations', invitationRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET must be configured before starting the server.');
    process.exit(1);
  }
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`SpendWise server running on http://localhost:${PORT}`);
      });
    })
    .catch(() => process.exit(1));
}

module.exports = app;
