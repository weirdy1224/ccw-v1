const express = require('express');
const auth = require('../middleware/auth');
const {
  sendDefreezeApprovedEmail,
  sendDefreezeRejectedEmail
} = require('../services/emailService.js'); // ✅ Updated import

module.exports = (db) => {
  const router = express.Router();

  router.use(auth, (req, res, next) => {
    if (req.user.role !== 'police') {
      return res.status(403).json({ message: 'Police only' });
    }
    next();
  });

  // ✅ Fetch assigned requests
  router.get('/requests', auth, async (req, res) => {
    try {
      const userId = req.user.id;
      const [results] = await db.query(
        'SELECT * FROM requests WHERE assigned_to = ? ORDER BY created_at DESC',
        [userId]
      );
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch requests' });
    }
  });

  // ✅ Get police stations
  router.get('/stations', async (req, res) => {
    try {
      const [results] = await db.query('SELECT id, username FROM users WHERE role = "police"');
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch stations' });
    }
  });

  // ✅ Update request status and trigger mail
  router.post('/status', async (req, res) => {
    const { requestId, status, reason } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({ message: 'Missing status info' });
    }

    try {
      const [rows] = await db.query(
        'SELECT * FROM requests WHERE id = ? AND assigned_to = ?',
        [requestId, req.user.id]
      );

      if (!rows.length) {
        return res.status(403).json({ message: 'Unauthorized or invalid request' });
      }

      const request = rows[0];

      // Update request status in DB
      await db.query(
        'UPDATE requests SET status = ?, status_reason = ? WHERE id = ?',
        [status, reason, requestId]
      );

      console.log(`🔁 Updated request ${request.reference_number} to ${status}`);

      // ✅ Use mailer functions
      if (status === 'Completed') {
        await sendDefreezeApprovedEmail({
          toEmail: request.email,
          userName: request.name,
          requestId: request.reference_number,
          accountLast4: request.account_number?.slice(-4) || 'XXXX',
          date: new Date().toLocaleDateString('en-IN')
        });
        console.log(`✅ Completion mail sent to ${request.email}`);
      } else if (status === 'Rejected') {
        await sendDefreezeRejectedEmail({
          toEmail: request.email,
          userName: request.name,
          requestId: request.reference_number,
          accountLast4: request.account_number?.slice(-4) || 'XXXX',
          reason: reason || 'Not specified',
          portalLink: 'https://unfree.portal.com', // 🔁 Customize this
          ioContact: 'cybercell@example.com / +91-9999999999', // 🔁 Customize this
          authorityName: 'SP Cyber Cell'
        });
        console.log(`✅ Rejection mail sent to ${request.email}`);
      }

      res.json({ message: `Status updated to '${status}' and email sent.` });
    } catch (err) {
      console.error('❌ Status update failed:', err.message);
      res.status(500).json({ message: 'Status update failed', error: err.message });
    }
  });

  // ✅ Fetch uploaded documents
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
