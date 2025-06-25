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
  router.get('/dashboard-stats', async (req, res) => {
    try {
      const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM requests`);
      const [[{ pendingTransfer }]] = await db.query(`SELECT COUNT(*) as pendingTransfer FROM requests WHERE status = 'Pending Transfer'`);
      const [[{ pendingOpinion }]] = await db.query(`SELECT COUNT(*) as pendingOpinion FROM requests WHERE status = 'Pending Opinion'`);
      res.json({
        total_requests: total,
        pending_transfer: pendingTransfer,
        pending_opinion: pendingOpinion
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
  });

  router.get('/controllers', async (req, res) => {
    const [data] = await db.query(`
    SELECT u.id, u.username, COUNT(r.id) AS total_assigned
    FROM users u
    LEFT JOIN requests r ON r.assigned_to = u.id
    WHERE u.role = 'controller'
    GROUP BY u.id
  `);
    res.json(data);
  });

  router.get('/police-info', async (req, res) => {
    const [data] = await db.query(`
    SELECT u.id, u.username, COUNT(r.id) AS total_assigned
    FROM users u
    LEFT JOIN requests r ON r.assigned_to = u.id
    WHERE u.role = 'police'
    GROUP BY u.id
  `);
    res.json(data);
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
