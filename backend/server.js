const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); 
const { init } = require('./db');
const requestRoutes = require('./requests');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

(async () => {
  try {
    const db = await init();
    app.use('/api/requests', requestRoutes(db));
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server start failed:', err.message);
  }
})();

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

