const express = require('express');
const auth = require('../middleware/auth');

module.exports = (db) => {
  const router = express.Router();

  router.use(auth, (req, res, next) => {
    if (req.user.role !== 'police') {
      return res.status(403).json({ message: 'Police only' });
    }
    next();
  });

  // ✅ Only fetch requests assigned to the logged-in police user
  router.get('/requests', async (req, res) => {
    try {
      const [results] = await db.query(
        'SELECT * FROM requests WHERE assigned_to = ? ORDER BY created_at DESC',
        [req.user.id]
      );
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch requests' });
    }
  });

  router.post('/status', async (req, res) => {
    const { requestId, status, reason } = req.body;
    if (!requestId || !status) {
      return res.status(400).json({ message: 'Missing status info' });
    }

    try {
      const [result] = await db.query(
        'UPDATE requests SET status = ?, status_reason = ? WHERE id = ? AND assigned_to = ?',
        [status, reason, requestId, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(403).json({ message: 'Unauthorized to update this request' });
      }

      res.json({ message: 'Status updated' });
    } catch (err) {
      res.status(500).json({ message: 'Status update failed', error: err.message });
    }
  });

  return router;
};
