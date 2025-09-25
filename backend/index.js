const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const ccpsAuth = require('./routes/ccpsAuth');
app.use('/api/auth', ccpsAuth);

db.init().then(() => {
  const connection = db.getConnection();

  const authRoutes = require('./routes/auth')(connection);
  const requestRoutes = require('./routes/requests')(connection);
  const adminRoutes = require('./routes/admin')(connection);
  const controllerRoutes = require('./routes/controller')(connection);
  const CCPSRoutes = require('./routes/CCPS')(connection);

  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/controller', controllerRoutes);
  app.use('/api/ccps', CCPSRoutes);

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ DB initialization failed:', err.message);
});
