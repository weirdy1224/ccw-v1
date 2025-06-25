const express = require('express');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  // Middleware: only allow admin
  router.use(auth, (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }
    next();
  });

  // GET /api/admin/requests
  router.get('/requests', async (req, res) => {
    try {
      const [results] = await db.query('SELECT * FROM requests ORDER BY created_at DESC');
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch requests' });
    }
  });

  // GET /api/admin/stations
  router.get('/stations', async (req, res) => {
    try {
      const [results] = await db.query('SELECT id, username FROM users WHERE role = "police"');
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch stations' });
    }
  });

  // POST /api/admin/assign
  router.post('/assign', async (req, res) => {
    const { requestId, stationId } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const finalStationId = stationId || null;

    try {
      await db.query(
        'UPDATE requests SET assigned_to = ? WHERE id = ?',
        [finalStationId, requestId]
      );
      res.json({ message: 'Assignment successful' });
    } catch (err) {
      res.status(500).json({ message: 'Assignment failed' });
    }
  });

  // POST /api/admin/create-controller
  router.post('/create-controller', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, "controller")',
        [username, hashedPassword]
      );
      res.json({ message: 'Controller account created successfully' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Username already exists' });
      }
      res.status(500).json({ message: 'Failed to create controller', error: err.message });
    }
  });

  return router;
};
