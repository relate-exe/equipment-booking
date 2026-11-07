require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Copy server/.env.example to server/.env');
    process.exit(1);
  }
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
