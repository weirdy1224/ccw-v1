const express = require('express');
const auth = require('../middleware/auth.js');
const {
  sendDefreezeApprovedEmail,
  sendDefreezeRejectedEmail
} = require('../services/emailService.js');

module.exports = (db) => {
  const router = express.Router();

  // ✅ Only CCPS can access these routes
  router.use(auth, (req, res, next) => {
    if (req.user.role !== 'CCPS') {
      return res.status(403).json({ message: 'CCPS only' });
    }
    next();
  });

  // ✅ Fetch all requests assigned to this CCPS
  router.get('/requests', async (req, res) => {
    try {
      const ccpsId = req.user.id; // ccps_id from token
      const [results] = await db.query(
        'SELECT * FROM requests WHERE assigned_to = ? ORDER BY created_at DESC',
        [ccpsId]
      );
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch requests', error: err.message });
    }
  });

  // ✅ Update request status (Approve / Reject)
  router.post('/status', async (req, res) => {
    const { requestId, status, status_reason, detailed_report } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({ message: 'Missing status info' });
    }

    try {
      // Make sure this request belongs to this CCPS
      const [rows] = await db.query(
        'SELECT * FROM requests WHERE id = ? AND assigned_to = ?',
        [requestId, req.user.id]
      );

      if (!rows.length) {
        return res.status(403).json({ message: 'Unauthorized or invalid request' });
      }

      const request = rows[0];

      await db.query(
        'UPDATE requests SET status = ?, status_reason = ?, detailed_report = ? WHERE id = ?',
        [status, status_reason || null, detailed_report || null, requestId]
      );

      // Send email based on status
      if (status === 'Approved') {
        await sendDefreezeApprovedEmail(request.email, request.reference_number);
      } else if (status === 'Rejected') {
        await sendDefreezeRejectedEmail(request.email, request.reference_number, status_reason);
      }

      res.json({ message: 'Status updated successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to update status', error: err.message });
    }
  });

  return router;
};
