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
    const [results] = await db.query(`
      SELECT r.*, u.username AS assigned_username
      FROM requests r
      LEFT JOIN users u ON r.assigned_to = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});


  // GET /api/admin/stations
  router.get('/stations', async (req, res) => {
    try {
      const [results] = await db.query('SELECT id, username FROM users WHERE role = "CCPS"');
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch stations' });
    }
  });
  // GET /api/admin/CCPS-assignments
  router.get('/CCPS-assignments', async (req, res) => {
    try {
      const [results] = await db.query(`
      SELECT u.username AS CCPS_username, r.reference_number, r.status
      FROM users u
      LEFT JOIN requests r ON u.id = r.assigned_to
      WHERE u.role = 'CCPS'
      ORDER BY u.username
    `);
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch CCPS assignments', error: err.message });
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
  // GET /documents/:requestId
  router.get('/documents/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
      const [results] = await db.query(
        'SELECT document_paths FROM requests WHERE id = ?',
        [requestId]
      );

      if (!results.length) return res.status(404).json({ message: 'Request not found' });

      const paths = results[0].document_paths?.split(',') || [];
      const urls = paths.map(path => `${req.protocol}://${req.get('host')}/${path}`);
      res.json({ urls });
    } catch (err) {
      res.status(500).json({ message: 'Failed to retrieve documents', error: err.message });
    }
  });

  return router;
};
