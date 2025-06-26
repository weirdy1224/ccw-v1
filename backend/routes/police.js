const express = require('express');
const auth = require('../middleware/auth');
const sendMail = require('../mailer'); // ✅ Add this line

module.exports = (db) => {
  const router = express.Router();

  router.use(auth, (req, res, next) => {
    if (req.user.role !== 'police') {
      return res.status(403).json({ message: 'Police only' });
    }
    next();
  });

  // ✅ Fetch assigned requests
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
  router.get('/stations', async (req, res) => {
    try {
      const [results] = await db.query('SELECT id, username FROM users WHERE role = "police"');
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch stations' });
    }
  });
  // ✅ Update status + send email if Completed/Rejected
  router.post('/status', async (req, res) => {
    const { requestId, status, reason } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({ message: 'Missing status info' });
    }

    try {
      // Fetch the request
      const [rows] = await db.query(
        'SELECT * FROM requests WHERE id = ? AND assigned_to = ?',
        [requestId, req.user.id]
      );

      if (!rows.length) {
        return res.status(403).json({ message: 'Unauthorized or invalid request' });
      }

      const request = rows[0];

      // Update the status
      const [result] = await db.query(
        'UPDATE requests SET status = ?, status_reason = ? WHERE id = ?',
        [status, reason, requestId]
      );

      console.log(`🔁 Updated request ${request.reference_number} to ${status}`);

      // ✅ Send email based on status
      if (status === 'Completed') {
        await sendMail(
          request.email,
          'Request Completed',
          `<p>Dear ${request.name},</p>
           <p>Your unfreeze request (Ref: <strong>${request.reference_number}</strong>) has been <strong>Completed</strong> by the police station.</p>
           <p><strong>Remarks:</strong> ${reason || 'N/A'}</p>`
        );
        console.log(`✅ Completion mail sent to ${request.email}`);
      } else if (status === 'Rejected') {
        await sendMail(
          request.email,
          'Request Rejected',
          `<p>Dear ${request.name},</p>
           <p>Your unfreeze request (Ref: <strong>${request.reference_number}</strong>) has been <strong>Rejected</strong>.</p>
           <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>`
        );
        console.log(`✅ Rejection mail sent to ${request.email}`);
      }

      res.json({ message: `Status updated to '${status}' and email sent.` });
    } catch (err) {
      console.error('❌ Status update failed:', err.message);
      res.status(500).json({ message: 'Status update failed', error: err.message });
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
