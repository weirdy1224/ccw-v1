// routes/controller.js
const express = require('express');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
module.exports = (db) => {
  const router = express.Router();
  router.post('/create-police', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, 'police']
    );
    res.json({ message: '✅ Police user created successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: '❌ Failed to create police user', error: err.message });
  }
});
  router.use(auth, (req, res, next) => {
    if (req.user.role !== 'controller') {
      return res.status(403).json({ message: 'Controllers only' });
    }
    next();
  });

  router.get('/requests', async (req, res) => {
    try {
      const [results] = await db.query('SELECT * FROM requests ORDER BY created_at DESC');
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch requests' });
    }
  });

  router.get('/stations', async (req, res) => {
    try {
      const [results] = await db.query('SELECT id, username FROM users WHERE role = ?', ['police']);
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch stations' });
    }
  });

  router.post('/assign', async (req, res) => {
    const { requestId, stationId } = req.body;

    if (!requestId || !stationId || stationId === '') {
      return res.status(400).json({ message: 'Missing or invalid requestId/stationId' });
    }

    try {
      await db.query('UPDATE requests SET assigned_to = ? WHERE id = ?', [stationId, requestId]);
      res.json({ message: 'Assigned successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Assignment failed', error: err.message });
    }
  });

  return router;
};
