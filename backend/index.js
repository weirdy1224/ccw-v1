const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db'); // db.init() and db.getConnection()

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Wait for DB to initialize
db.init().then(() => {
  const connection = db.getConnection();

  // Route handlers (inject db connection)
  const authRoutes = require('./routes/auth')(connection);
  const requestRoutes = require('./routes/requests')(connection);
  const adminRoutes = require('./routes/admin')(connection);
  const controllerRoutes = require('./routes/controller')(connection);
  const policeRoutes = require('./routes/police')(connection);

  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/controller', controllerRoutes);
  app.use('/api/police', policeRoutes);

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ DB initialization failed:', err.message);
});
