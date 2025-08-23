const express = require('express');
const auth = require('../middleware/auth.js');
const {
  sendDefreezeApprovedEmail,
  sendDefreezeRejectedEmail
} = require('../services/emailService.js'); // ✅ Updated import

module.exports = (db) => {
  const router = express.Router();

  router.use(auth, (req, res, next) => {
    if (req.user.role !== 'CCPS') {
      return res.status(403).json({ message: 'CCPS only' });
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

  // ✅ Get CCPS stations
  router.get('/stations', async (req, res) => {
    try {
      const [results] = await db.query('SELECT id, username FROM users WHERE role = "CCPS"');
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch stations' });
    }
  });

  // ✅ Update request status and trigger mail
router.post('/status', async (req, res) => {
  const { requestId, status, status_reason, detailed_report } = req.body;

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
    const now = new Date();

    let updateQuery = 'UPDATE requests SET status = ?, status_reason = ?, detailed_report = ?';
    let updateParams = [status, status_reason, detailed_report];

    if (status === 'Completed') {
      updateQuery += ', completed_at = ?';
      updateParams.push(now);
    } else if (status === 'Rejected') {
      updateQuery += ', rejected_at = ?';
      updateParams.push(now);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(requestId);

    await db.query(updateQuery, updateParams);

    console.log(`🔁 Updated request ${request.reference_number} → ${status}`);

    // ✅ Emails
    if (status === 'Completed') {
      await sendDefreezeApprovedEmail({
        toEmail: request.email,
        userName: request.name,
        requestId: request.reference_number,
        accountLast4: request.account_number?.slice(-4) || 'XXXX',
        date: new Date().toLocaleDateString('en-IN')
      });
    } else if (status === 'Rejected') {
      await sendDefreezeRejectedEmail({
        toEmail: request.email,
        userName: request.name,
        requestId: request.reference_number,
        accountLast4: request.account_number?.slice(-4) || 'XXXX',
        reason: status_reason || 'Not specified',
        portalLink: 'https://unfree.portal.com',
        ioContact: 'cybercell@example.com / +91-9999999999',
        authorityName: 'SP Cyber Cell'
      });
    }

    res.json({ message: `Status updated to '${status}'` });
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
