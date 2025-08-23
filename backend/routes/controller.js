// routes/controller.js
const express = require('express');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
module.exports = (db) => {
  const router = express.Router();
  router.post('/create-CCPS', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, 'CCPS']
      );
      res.json({ message: '✅ CCPS user created successfully.' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Username already exists' });
      }
      res.status(500).json({ message: '❌ Failed to create CCPS user', error: err.message });
    }
  });
  // routes/controller.js
router.get('/documents/:requestId', async (req, res) => {
  const { requestId } = req.params;
  try {
    const [results] = await db.query(
      'SELECT document_paths FROM requests WHERE id = ?',
      [requestId]
    );
    if (!results.length) return res.status(404).json({ message: 'Request not found' });

    let pathsObj;
    try {
      pathsObj = JSON.parse(results[0].document_paths);
    } catch {
      pathsObj = { all: results[0].document_paths?.split(',') || [] };
    }

    // Compose URLs (replace with your hostname logic as needed)
    const urls = Object.entries(pathsObj).map(([key, path]) => ({
      type: key,
      url: `${req.protocol}://${req.get('host')}/${path.replace(/^\/?/, '')}`,
    }));

    res.json({ urls });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve documents', error: err.message });
  }
});

    router.get('/controllers', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT id, username FROM users WHERE role = "controller"'
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch controllers' });
  }
});
  router.use(auth, (req, res, next) => {
    if (req.user.role !== 'controller') {
      return res.status(403).json({ message: 'Controllers only' });
    }
    next();
  });
  // GET /api/controller/requests
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
  // GET /api/controller/CCPS-assignments
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
      const [results] = await db.query('SELECT id, username FROM users WHERE role = ?', ['CCPS']);
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
